import json
import urllib.parse
import urllib.request

from fastapi import HTTPException

from app.core import config

# Cloudflare Turnstile: the free "I am not a robot" check (https://www.cloudflare.com/products/turnstile/).
# The page shows the widget with the site key and sends its token; the server asks Cloudflare
# with the secret key if the token is real. Without TURNSTILE_SECRET_KEY the check is off.
VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def token_is_valid(token: str) -> bool:
    body = urllib.parse.urlencode({"secret": config.TURNSTILE_SECRET_KEY, "response": token}).encode()
    try:
        with urllib.request.urlopen(VERIFY_URL, data=body, timeout=10) as response:
            return bool(json.loads(response.read()).get("success"))
    except Exception:  # noqa: BLE001 - if Cloudflare cannot be reached, the check fails closed
        return False


def check_human(token: str | None) -> None:
    if not config.TURNSTILE_SECRET_KEY:
        return
    if not token or not token_is_valid(token):
        raise HTTPException(status_code=400, detail="Please confirm you are not a robot")
