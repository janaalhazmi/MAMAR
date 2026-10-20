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

# Brevo sends the emails over HTTPS, because the free Render plan blocks the SMTP ports.
# Without BREVO_API_KEY, the passcode is written in the server log instead (for local testing).
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
EMAIL_SENDER = os.getenv("EMAIL_SENDER", "")
