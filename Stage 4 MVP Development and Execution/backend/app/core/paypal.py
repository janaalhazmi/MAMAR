import base64
import json
import os
import time
import urllib.error
import urllib.request
from decimal import ROUND_HALF_UP, Decimal

# PayPal in sandbox mode: real PayPal pages and test buyer accounts, no real money.
# The two keys come from developer.paypal.com > Apps & Credentials (Sandbox) and are set on
# Render as PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET. Without them, payments return 503.
PAYPAL_API_URL = os.getenv("PAYPAL_API_URL", "https://api-m.sandbox.paypal.com").rstrip("/")

# PayPal does not take SAR, so the quote price is charged in US dollars.
# The riyal is pegged at 3.75 per dollar.
SAR_PER_USD = Decimal(os.getenv("SAR_PER_USD", "3.75"))

_token: dict = {"value": None, "expires": 0.0}


class PayPalError(Exception):
    # PayPal could not be reached, or it refused the request.
    pass


class PayPalNotConfigured(Exception):
    pass


def keys() -> tuple[str, str]:
    client_id = os.getenv("PAYPAL_CLIENT_ID", "").strip()
    secret = os.getenv("PAYPAL_CLIENT_SECRET", "").strip()
    if not client_id or not secret:
        raise PayPalNotConfigured
    return client_id, secret


def sar_to_usd(amount: Decimal) -> Decimal:
    return (Decimal(amount) / SAR_PER_USD).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _call(method: str, path: str, body: dict | None = None, token: str | None = None, form: bytes | None = None):
    headers = {"Accept": "application/json"}
    data = None
    if form is not None:
        client_id, secret = keys()
        basic = base64.b64encode(f"{client_id}:{secret}".encode()).decode()
        headers["Authorization"] = f"Basic {basic}"
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        data = form
    else:
        headers["Authorization"] = f"Bearer {token}"
        headers["Content-Type"] = "application/json"
        data = json.dumps(body or {}).encode()
    request = urllib.request.Request(f"{PAYPAL_API_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        try:
            return error.code, json.load(error)
        except ValueError:
            return error.code, {}
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        raise PayPalError("PayPal could not be reached") from error


def access_token() -> str:
    if _token["value"] and _token["expires"] > time.time() + 60:
        return _token["value"]
    status, data = _call("POST", "/v1/oauth2/token", form=b"grant_type=client_credentials")
    if status != 200 or "access_token" not in data:
        raise PayPalError("PayPal refused the keys. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET")
    _token["value"] = data["access_token"]
    _token["expires"] = time.time() + int(data.get("expires_in", 300))
    return _token["value"]


def create_order(amount_usd: Decimal, reference: str, description: str, return_url: str, cancel_url: str) -> tuple[str, str]:
    # Returns (order_id, approve_url). The contractor is sent to approve_url to pay on PayPal.
    body = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": reference,
                "description": description[:127],
                "amount": {"currency_code": "USD", "value": f"{amount_usd:.2f}"},
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "brand_name": "MAMAR",
                    "user_action": "PAY_NOW",
                    "shipping_preference": "NO_SHIPPING",
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                }
            }
        },
    }
    status, data = _call("POST", "/v2/checkout/orders", body, token=access_token())
    if status not in (200, 201) or "id" not in data:
        raise PayPalError("PayPal could not create the payment")
    links = {link.get("rel"): link.get("href") for link in data.get("links", [])}
    approve_url = links.get("payer-action") or links.get("approve")
    if not approve_url:
        raise PayPalError("PayPal did not return a payment page")
    return data["id"], approve_url


def capture_order(order_id: str) -> tuple[str, str | None]:
    # Takes the money of an approved order. Returns (status, capture_id):
    # COMPLETED when paid, NOT_APPROVED when the buyer did not finish on PayPal, DECLINED otherwise.
    status, data = _call("POST", f"/v2/checkout/orders/{order_id}/capture", {}, token=access_token())
    if status in (200, 201):
        captures = data.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [])
        capture = captures[0] if captures else {}
        if data.get("status") == "COMPLETED" and capture.get("status") == "COMPLETED":
            return "COMPLETED", capture.get("id")
        return "DECLINED", capture.get("id")
    issue = (data.get("details") or [{}])[0].get("issue", "")
    if issue == "ORDER_NOT_APPROVED":
        return "NOT_APPROVED", None
    if issue == "ORDER_ALREADY_CAPTURED":
        return "COMPLETED", None
    if status == 404:
        raise PayPalError("PayPal does not know this payment")
    if status == 422:
        return "DECLINED", None
    raise PayPalError("PayPal could not finish the payment")
