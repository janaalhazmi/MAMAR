import json
import logging
import urllib.error
import urllib.request

from app.core import config

logger = logging.getLogger("mamar.email")

EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send"


def emailjs_is_set() -> bool:
    # The four EmailJS values are needed to send an email.
    return all(
        (config.EMAILJS_SERVICE_ID, config.EMAILJS_TEMPLATE_ID, config.EMAILJS_PUBLIC_KEY, config.EMAILJS_PRIVATE_KEY)
    )


def send_passcode(email: str, passcode: str) -> None:
    # Sends the registration passcode to the email with the EmailJS API.
    # The email text is the EmailJS template, which receives to_email and passcode.
    if not emailjs_is_set():
        # On a local computer EmailJS is not set, so the passcode is written in the server log.
        logger.warning("EmailJS is not set. The passcode for %s is %s", email, passcode)
        return
    body = {
        "service_id": config.EMAILJS_SERVICE_ID,
        "template_id": config.EMAILJS_TEMPLATE_ID,
        "user_id": config.EMAILJS_PUBLIC_KEY,
        "accessToken": config.EMAILJS_PRIVATE_KEY,
        "template_params": {"to_email": email, "passcode": passcode},
    }
    request = urllib.request.Request(
        EMAILJS_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={"content-type": "application/json", "user-agent": "MAMAR-backend"},
        method="POST",
    )
    # Raises an error when EmailJS does not send the email, so the endpoint can tell the user.
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as error:
        # EmailJS explains the problem in the response, for example a wrong template ID.
        reason = error.read().decode("utf-8", errors="replace")[:200]
        raise RuntimeError(f"EmailJS returned {error.code}: {reason}") from error
