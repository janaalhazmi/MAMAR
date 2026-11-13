import base64
import re
import threading
import urllib.parse
import urllib.request

from app.core import config

# Twilio SMS or WhatsApp. Each notification is also sent to the user's phone when
# TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM are set on Render. A Twilio trial
# account only sends to numbers verified in the Twilio console.
# WhatsApp: set TWILIO_FROM to "whatsapp:+14155238886" (the Twilio sandbox number); each phone
# first joins the sandbox by sending the "join ..." code to that number on WhatsApp.


def enabled() -> bool:
    return bool(config.TWILIO_ACCOUNT_SID and config.TWILIO_AUTH_TOKEN and config.TWILIO_FROM)


def saudi_number(phone: str | None) -> str | None:
    # "0501234567", "501234567", "966501234567", "+966 50 123 4567" -> "+966501234567"
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if phone.strip().startswith("+") and 8 <= len(digits) <= 15 and not digits.startswith("9665"):
        return "+" + digits
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("9665") and len(digits) == 12:
        return "+" + digits
    if digits.startswith("05") and len(digits) == 10:
        return "+966" + digits[1:]
    if digits.startswith("5") and len(digits) == 9:
        return "+966" + digits
    return None


def post(to: str, text: str) -> None:
    url = f"https://api.twilio.com/2010-04-01/Accounts/{config.TWILIO_ACCOUNT_SID}/Messages.json"
    auth = base64.b64encode(f"{config.TWILIO_ACCOUNT_SID}:{config.TWILIO_AUTH_TOKEN}".encode()).decode()
    if config.TWILIO_FROM.startswith("whatsapp:"):
        to = f"whatsapp:{to}"
    body = urllib.parse.urlencode({"To": to, "From": config.TWILIO_FROM, "Body": text}).encode()
    request = urllib.request.Request(url, data=body, headers={"Authorization": f"Basic {auth}"})
    try:
        urllib.request.urlopen(request, timeout=15).close()
    except Exception as error:  # noqa: BLE001 - an SMS problem never stops the main action
        print(f"SMS to {to} failed: {error}")


def send_sms(phone: str | None, text: str) -> bool:
    # Sends in the background, so the page does not wait for Twilio. Returns False when skipped.
    to = saudi_number(phone)
    if not enabled() or to is None:
        return False
    threading.Thread(target=post, args=(to, text[:300]), daemon=True).start()
    return True
