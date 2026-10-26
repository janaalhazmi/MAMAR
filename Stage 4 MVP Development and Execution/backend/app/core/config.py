import os
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")

# Signs the login tokens (JWT).
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set. Copy .env.example to .env and fill it in.")


def normalize_origin(value: str) -> str:
    # The browser sends only the origin, scheme://host:port. A copied link like
    # https://mammar-blush.vercel.app/?_vercel_share=... is cut to that origin, so CORS still matches.
    value = value.strip()
    parsed = urlparse(value)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return value.rstrip("/")


FRONTEND_ORIGINS = [
    normalize_origin(origin)
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# Email verification: register needs the 6-digit passcode that was sent to the email.
# It stays off until the frontend sends the passcode. Put EMAIL_VERIFICATION=on to turn it on.
EMAIL_VERIFICATION = os.getenv("EMAIL_VERIFICATION", "off").strip().lower() == "on"

# EmailJS sends the passcode emails from the team's Gmail account over HTTPS, because the free
# Render plan blocks the SMTP ports. Without these four values, the passcode is written in the
# server log instead (for local testing).
EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID", "")
EMAILJS_TEMPLATE_ID = os.getenv("EMAILJS_TEMPLATE_ID", "")
EMAILJS_PUBLIC_KEY = os.getenv("EMAILJS_PUBLIC_KEY", "")
EMAILJS_PRIVATE_KEY = os.getenv("EMAILJS_PRIVATE_KEY", "")
