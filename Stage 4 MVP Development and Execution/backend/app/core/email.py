import json
import logging
import urllib.request

from app.core import config

logger = logging.getLogger("mamar.email")

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def send_passcode(email: str, passcode: str) -> None:
    # Sends the registration passcode to the email with the Brevo API.
    if not config.BREVO_API_KEY:
        # On a local computer there is no Brevo key, so the passcode is written in the server log.
        logger.warning("BREVO_API_KEY is not set. The passcode for %s is %s", email, passcode)
        return
    body = {
        "sender": {"name": "MAMAR", "email": config.EMAIL_SENDER},
        "to": [{"email": email}],
        "subject": "Your MAMAR passcode",
        "textContent": (
            "Hello,\n\n"
            f"Your MAMAR passcode is {passcode}.\n"
            "Enter it on the Create Account page. It expires in 10 minutes.\n"
            "If you did not ask for a MAMAR account, ignore this email.\n"
        ),
    }
    request = urllib.request.Request(
        BREVO_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "api-key": config.BREVO_API_KEY,
            "accept": "application/json",
            "content-type": "application/json",
        },
        method="POST",
    )
    # Raises an error when Brevo does not accept the email, so the endpoint can tell the user.
    with urllib.request.urlopen(request, timeout=10) as response:
        response.read()
