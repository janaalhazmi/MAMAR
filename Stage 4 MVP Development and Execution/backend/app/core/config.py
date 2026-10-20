import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")

# Signs the login tokens (JWT).
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set. Copy .env.example to .env and fill it in.")

FRONTEND_ORIGINS = [
    origin.strip()
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
