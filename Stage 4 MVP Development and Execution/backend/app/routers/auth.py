import logging
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import config
from app.core.email import send_passcode
from app.core.security import create_access_token
from app.db.database import get_db
from app.models import EmailPasscode, Provider, User
from app.models.user import password_hasher
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RegisterRequest,
    SendPasscodeRequest,
    UserResponse,
)
from app.schemas.error import ErrorResponse

logger = logging.getLogger("mamar.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

# Email verification limits.
PASSCODE_MINUTES = 10  # A passcode expires 10 minutes after it is sent.
MAX_ATTEMPTS = 5  # After 5 wrong passcodes, the user must ask for a new passcode.
RESEND_SECONDS = 60  # A new passcode can be asked for once a minute.

# The errors of each endpoint in Stage 3, shown in /docs.
REGISTER_ERRORS = {
    400: {"model": ErrorResponse, "description": "The passcode is wrong or has expired (when email verification is on)"},
    404: {"model": ErrorResponse, "description": "The provider_id does not exist"},
    409: {"model": ErrorResponse, "description": "The email is already registered"},
    422: {
        "model": ErrorResponse,
        "description": "A field is missing or not valid, or a provider or worker email is not the company email",
    },
    429: {"model": ErrorResponse, "description": "Too many wrong passcodes, a new passcode is needed"},
}
LOGIN_ERRORS = {
    401: {"model": ErrorResponse, "description": "The email or password is wrong"},
    422: {"model": ErrorResponse, "description": "A field is missing or not valid"},
}
SEND_PASSCODE_ERRORS = {
    409: {"model": ErrorResponse, "description": "The email is already registered"},
    422: {"model": ErrorResponse, "description": "The email is missing or not valid"},
    429: {"model": ErrorResponse, "description": "A passcode was sent less than a minute ago"},
    502: {"model": ErrorResponse, "description": "The email could not be sent"},
}


def company_domain(website: str | None) -> str | None:
    # "https://www.tcmksa.com" -> "tcmksa.com". None when the provider has no website.
    if not website:
        return None
    host = urlparse(website if "://" in website else f"https://{website}").hostname
    return host.removeprefix("www.") if host else None


def passcode_is_right(row: EmailPasscode, passcode: str) -> bool:
    try:
        return password_hasher.verify(row.passcode_hash, passcode)
    except (VerificationError, InvalidHashError):
        return False


def check_passcode(db: Session, email: str, passcode: str | None) -> EmailPasscode:
    # Returns the passcode row when the passcode is right. Otherwise raises the error for the frontend.
    if passcode is None:
        raise HTTPException(status_code=422, detail="passcode: Field required")
    row = db.get(EmailPasscode, email)
    if row is None:
        raise HTTPException(status_code=400, detail="Ask for a passcode first")
    if row.attempts >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many wrong passcodes, ask for a new passcode")
    if datetime.now(timezone.utc) > row.expires_at:
        raise HTTPException(status_code=400, detail="Passcode has expired, ask for a new passcode")
    if not passcode_is_right(row, passcode):
        row.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Passcode is wrong")
    return row


@router.post("/send-passcode", response_model=MessageResponse, responses=SEND_PASSCODE_ERRORS)
def send_passcode_to_email(data: SendPasscodeRequest, db: Session = Depends(get_db)):
    # Sends a 6-digit passcode to the email before its account is created. Asking again replaces it.
    if db.scalar(select(User).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")
    now = datetime.now(timezone.utc)
    row = db.get(EmailPasscode, data.email)
    if row is not None and now < row.sent_at + timedelta(seconds=RESEND_SECONDS):
        raise HTTPException(status_code=429, detail="Wait a minute before asking for a new passcode")
    if row is None:
        row = EmailPasscode(email=data.email)
        db.add(row)
    passcode = f"{secrets.randbelow(1_000_000):06d}"
    row.passcode_hash = password_hasher.hash(passcode)
    row.expires_at = now + timedelta(minutes=PASSCODE_MINUTES)
    row.sent_at = now
    row.attempts = 0
    db.commit()
    try:
        send_passcode(data.email, passcode)
    except Exception as error:
        logger.exception("Could not send the passcode to %s", data.email)
        # The email did not go out, so the user can try again right away.
        row.sent_at = now - timedelta(seconds=RESEND_SECONDS)
        db.commit()
        raise HTTPException(status_code=502, detail="Could not send the email, try again later") from error
    return {"message": "Passcode sent"}


@router.post("/register", status_code=201, response_model=UserResponse, responses=REGISTER_ERRORS)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Creates a new user account (Stage 3, section 4.2.3). It does not need a token.
    if data.provider_id is not None:
        provider = db.get(Provider, data.provider_id)
        if provider is None:
            raise HTTPException(status_code=404, detail="Provider not found")
        # Stage 3: a user cannot link themselves freely to any provider. A provider or
        # worker account must use the company email, the same domain as the provider's website.
        domain = company_domain(provider.website)
        if domain is None:
            raise HTTPException(status_code=422, detail="provider_id: this provider has no company website yet")
        if not data.email.endswith(f"@{domain}"):
            raise HTTPException(status_code=422, detail=f"email: use your company email (@{domain})")

    if db.scalar(select(User).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")

    # With email verification on, the account is created only with the right passcode.
    passcode_row = check_passcode(db, data.email, data.passcode) if config.EMAIL_VERIFICATION else None

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        role=data.role,
        provider_id=data.provider_id,
    )
    user.set_password(data.password)
    db.add(user)
    if passcode_row is not None:
        # The passcode is used once, in the same save as the new account.
        db.delete(passcode_row)
    try:
        db.commit()
    except IntegrityError as error:
        # Two requests with the same email at the same moment.
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered") from error
    db.refresh(user)
    return user.to_dict()


@router.post("/login", response_model=LoginResponse, responses=LOGIN_ERRORS)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Checks the email and password, then returns a token for the next requests (Stage 3, section 4.2.4).
    user = db.scalar(select(User).where(User.email == data.email))
    # The same message for a wrong email and a wrong password, so the API does not tell which one is wrong.
    if user is None or not user.is_active or not user.check_password(data.password):
        raise HTTPException(status_code=401, detail="Email or password is wrong")
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "role": user.role,
            "provider_id": user.provider_id,
        },
    }
