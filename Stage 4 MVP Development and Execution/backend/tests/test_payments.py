from decimal import Decimal

import pytest

from app.core import paypal
from tests.conftest import QUOTE

SITE = {"return_url": "http://localhost:5173/payment/return", "cancel_url": "http://localhost:5173/payment/cancel"}
PAYMENT_FIELDS = [
    "payment_id", "project_id", "quote_id", "amount", "currency", "charged_amount", "charged_currency",
    "paypal_order_id", "status", "created_at", "paid_at",
]


@pytest.fixture
def fake_paypal(monkeypatch):
    # PayPal sandbox is not called in the tests: these stand in for its answers.
    orders = {"count": 0, "capture": ("COMPLETED", "CAPTURE-1"), "sent": []}

    def create_order(amount_usd, reference, description, return_url, cancel_url):
        orders["count"] += 1
        orders["sent"].append({"amount": amount_usd, "return_url": return_url, "cancel_url": cancel_url})
        order_id = f"ORDER-{reference}-{orders['count']}"
        return order_id, f"https://www.sandbox.paypal.com/checkoutnow?token={order_id}"

    def capture_order(order_id):
        return orders["capture"]

    monkeypatch.setattr(paypal, "create_order", create_order)
    monkeypatch.setattr(paypal, "capture_order", capture_order)
    return orders


def start(api, contractor, project_id, body=SITE):
    return api.client.post(f"/projects/{project_id}/payments", json=body, headers=contractor)


def test_sar_is_charged_in_dollars():
    assert paypal.sar_to_usd(Decimal("4500")) == Decimal("1200.00")
    assert paypal.sar_to_usd(Decimal("100")) == Decimal("26.67")


def test_contractor_pays_the_accepted_quotation(api, fake_paypal):
    project_id, contractor, provider = api.won_project()
    response = start(api, contractor, project_id)
    assert response.status_code == 201
    started = response.json()
    assert started["approve_url"].startswith("https://www.sandbox.paypal.com/")
    payment = started["payment"]
    assert list(payment) == PAYMENT_FIELDS
    assert (payment["status"], payment["amount"], payment["currency"]) == ("created", QUOTE["price"], "SAR")
    assert payment["charged_currency"] == "USD"
    assert fake_paypal["sent"][0]["return_url"] == SITE["return_url"]

    order_id = payment["paypal_order_id"]
    paid = api.client.post(f"/payments/orders/{order_id}/capture", headers=contractor)
    assert paid.status_code == 200
    assert paid.json()["status"] == "completed" and paid.json()["paid_at"] is not None
    # The return page may call it again: still completed, PayPal is not charged twice.
    assert api.client.post(f"/payments/orders/{order_id}/capture", headers=contractor).json()["status"] == "completed"

    # The contractor and the winning provider see it, and it cannot be paid twice.
    for headers in (contractor, provider):
        listed = api.client.get(f"/projects/{project_id}/payments", headers=headers).json()
        assert [p["status"] for p in listed] == ["completed"]
    response = start(api, contractor, project_id)
    assert (response.status_code, response.json()) == (409, {"detail": "This project is already paid"})


def test_cancel_and_start_again(api, fake_paypal):
    project_id, contractor, _ = api.won_project()
    first = start(api, contractor, project_id).json()["payment"]["paypal_order_id"]
    cancelled = api.client.post(f"/payments/orders/{first}/cancel", headers=contractor)
    assert cancelled.json()["status"] == "cancelled"
    response = api.client.post(f"/payments/orders/{first}/capture", headers=contractor)
    assert response.status_code == 400

    # A new payment closes the unfinished one.
    second = start(api, contractor, project_id).json()["payment"]["paypal_order_id"]
    third = start(api, contractor, project_id).json()["payment"]["paypal_order_id"]
    statuses = {p["paypal_order_id"]: p["status"] for p in api.client.get(f"/projects/{project_id}/payments", headers=contractor).json()}
    assert statuses == {first: "cancelled", second: "cancelled", third: "created"}


def test_not_approved_and_declined(api, fake_paypal):
    project_id, contractor, _ = api.won_project()
    order_id = start(api, contractor, project_id).json()["payment"]["paypal_order_id"]
    fake_paypal["capture"] = ("NOT_APPROVED", None)
    response = api.client.post(f"/payments/orders/{order_id}/capture", headers=contractor)
    assert (response.status_code, response.json()) == (400, {"detail": "The payment was not approved on PayPal yet"})
    fake_paypal["capture"] = ("DECLINED", None)
    response = api.client.post(f"/payments/orders/{order_id}/capture", headers=contractor)
    assert response.status_code == 402
    listed = api.client.get(f"/projects/{project_id}/payments", headers=contractor).json()
    assert listed[0]["status"] == "failed"


def test_payment_errors(api, fake_paypal):
    _, contractor = api.account()
    project_id = api.project(contractor)
    # No accepted quotation yet.
    response = start(api, contractor, project_id)
    assert (response.status_code, response.json()) == (400, {"detail": "Confirm a provider's quotation before paying"})

    won_id, owner, provider = api.won_project()
    assert start(api, contractor, won_id).status_code == 403
    assert start(api, provider, won_id).status_code == 403
    assert api.client.post(f"/projects/{won_id}/payments", json=SITE).status_code == 401
    # PayPal only sends the contractor back to the MAMAR site.
    response = start(api, owner, won_id, {**SITE, "return_url": "https://evil.example.com/steal"})
    assert (response.status_code, response.json()) == (422, {"detail": "return_url must be a page of the MAMAR site"})

    order_id = start(api, owner, won_id).json()["payment"]["paypal_order_id"]
    assert api.client.post(f"/payments/orders/{order_id}/capture", headers=contractor).status_code == 403
    assert api.client.post("/payments/orders/NOPE/capture", headers=owner).status_code == 404
    _, other_provider = api.account("provider", 2)
    assert api.client.get(f"/projects/{won_id}/payments", headers=other_provider).status_code == 403


def test_without_paypal_keys_returns_503(api, monkeypatch):
    monkeypatch.delenv("PAYPAL_CLIENT_ID", raising=False)
    monkeypatch.delenv("PAYPAL_CLIENT_SECRET", raising=False)
    monkeypatch.setitem(paypal._token, "value", None)
    project_id, contractor, _ = api.won_project()
    response = start(api, contractor, project_id)
    assert response.status_code == 503
    assert "PAYPAL_CLIENT_ID" in response.json()["detail"]
