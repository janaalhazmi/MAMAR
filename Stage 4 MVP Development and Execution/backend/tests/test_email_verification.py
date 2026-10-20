import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select

from app.core import config, email
from app.db.database import SessionLocal
from app.main import app
from app.models import EmailPasscode, User
from app.routers import auth


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def new_email():
    # A new email for every test. Its user and its passcode are deleted after the test.
    address = f"test-{uuid.uuid4().hex[:12]}@example.com"
    yield address
    with SessionLocal() as db:
        db.execute(delete(User).where(func.lower(User.email) == address))
        db.execute(delete(EmailPasscode).where(EmailPasscode.email == address))
        db.commit()


@pytest.fixture
def sent(monkeypatch):
    # Keeps the passcodes here instead of sending real emails.
    passcodes = {}
    monkeypatch.setattr(auth, "send_passcode", lambda to, passcode: passcodes.__setitem__(to, passcode))
    return passcodes


@pytest.fixture
def verification_on(monkeypatch, sent):
    monkeypatch.setattr(config, "EMAIL_VERIFICATION", True)
    return sent


def send_passcode(client, address):
    return client.post("/auth/send-passcode", json={"email": address})


def register(client, address, passcode=None):
    body = {"full_name": "Sara Ahmed", "email": address, "password": "StrongPass123", "role": "contractor"}
    if passcode is not None:
        body["passcode"] = passcode
    return client.post("/auth/register", json=body)


def wrong(passcode):
    return f"{(int(passcode) + 1) % 1_000_000:06d}"


def change_passcode_row(address, **values):
    with SessionLocal() as db:
        row = db.get(EmailPasscode, address)
        for name, value in values.items():
            setattr(row, name, value)
        db.commit()


def test_verification_is_off_by_default(client, new_email):
    # The switch is off on Render until the frontend sends the passcode, so register works as before.
    assert config.EMAIL_VERIFICATION is False
    assert register(client, new_email).status_code == 201


def test_register_with_the_right_passcode_creates_the_account(client, new_email, verification_on):
    response = send_passcode(client, new_email)
    assert response.status_code == 200
    assert response.json() == {"message": "Passcode sent"}
    passcode = verification_on[new_email]
    assert len(passcode) == 6 and passcode.isdigit()

    response = register(client, new_email, passcode)
    assert response.status_code == 201
    assert response.json()["email"] == new_email
    login = client.post("/auth/login", json={"email": new_email, "password": "StrongPass123"})
    assert login.status_code == 200
    # The passcode is used once.
    with SessionLocal() as db:
        assert db.get(EmailPasscode, new_email) is None


def test_register_without_a_passcode_returns_422(client, new_email, verification_on):
    send_passcode(client, new_email)
    response = register(client, new_email)
    assert response.status_code == 422
    assert response.json() == {"detail": "passcode: Field required"}


def test_register_before_asking_for_a_passcode_returns_400(client, new_email, verification_on):
    response = register(client, new_email, "123456")
    assert response.status_code == 400
    assert response.json() == {"detail": "Ask for a passcode first"}


def test_wrong_passcode_returns_400_and_creates_nothing(client, new_email, verification_on):
    send_passcode(client, new_email)
    response = register(client, new_email, wrong(verification_on[new_email]))
    assert response.status_code == 400
    assert response.json() == {"detail": "Passcode is wrong"}
    with SessionLocal() as db:
        assert db.scalar(select(User).where(User.email == new_email)) is None


def test_too_many_wrong_passcodes_block_the_passcode(client, new_email, verification_on):
    send_passcode(client, new_email)
    passcode = verification_on[new_email]
    for _ in range(auth.MAX_ATTEMPTS):
        assert register(client, new_email, wrong(passcode)).status_code == 400
    # Even the right passcode does not work now. A new passcode is needed.
    response = register(client, new_email, passcode)
    assert response.status_code == 429
    assert response.json() == {"detail": "Too many wrong passcodes, ask for a new passcode"}


def test_expired_passcode_returns_400(client, new_email, verification_on):
    send_passcode(client, new_email)
    change_passcode_row(new_email, expires_at=datetime.now(timezone.utc) - timedelta(seconds=1))
    response = register(client, new_email, verification_on[new_email])
    assert response.status_code == 400
    assert response.json() == {"detail": "Passcode has expired, ask for a new passcode"}


@pytest.mark.parametrize("passcode", ["12345", "1234567", "abcdef", "١٢٣٤٥٦"])
def test_passcode_must_have_6_digits(client, new_email, verification_on, passcode):
    response = register(client, new_email, passcode)
    assert response.status_code == 422
    assert response.json() == {"detail": "passcode: the passcode has 6 digits"}


def test_only_the_hash_of_the_passcode_is_saved(client, new_email, verification_on):
    send_passcode(client, new_email)
    with SessionLocal() as db:
        row = db.get(EmailPasscode, new_email)
    assert row.passcode_hash != verification_on[new_email]
    assert row.passcode_hash.startswith("$argon2id$")


def test_new_passcode_waits_a_minute_and_replaces_the_old_one(client, new_email, verification_on):
    send_passcode(client, new_email)
    old_passcode = verification_on[new_email]

    response = send_passcode(client, new_email)
    assert response.status_code == 429
    assert response.json() == {"detail": "Wait a minute before asking for a new passcode"}

    change_passcode_row(new_email, sent_at=datetime.now(timezone.utc) - timedelta(seconds=auth.RESEND_SECONDS))
    assert send_passcode(client, new_email).status_code == 200
    new_passcode = verification_on[new_email]
    if new_passcode != old_passcode:
        assert register(client, new_email, old_passcode).status_code == 400
    assert register(client, new_email, new_passcode).status_code == 201


def test_new_passcode_after_wrong_passcodes_works(client, new_email, verification_on):
    send_passcode(client, new_email)
    for _ in range(auth.MAX_ATTEMPTS):
        register(client, new_email, wrong(verification_on[new_email]))
    change_passcode_row(new_email, sent_at=datetime.now(timezone.utc) - timedelta(seconds=auth.RESEND_SECONDS))
    send_passcode(client, new_email)
    assert register(client, new_email, verification_on[new_email]).status_code == 201


def test_send_passcode_to_a_registered_email_returns_409(client, new_email, sent):
    register(client, new_email)
    response = send_passcode(client, new_email)
    assert response.status_code == 409
    assert response.json() == {"detail": "Email is already registered"}


def test_send_passcode_with_an_invalid_email_returns_422(client, sent):
    response = client.post("/auth/send-passcode", json={"email": "sara"})
    assert response.status_code == 422
    assert response.json() == {"detail": "email: value is not a valid email address"}


def test_send_passcode_returns_502_when_the_email_cannot_be_sent(client, new_email, monkeypatch):
    def broken_sender(to, passcode):
        raise OSError("Brevo is not reachable")

    monkeypatch.setattr(auth, "send_passcode", broken_sender)
    response = send_passcode(client, new_email)
    assert response.status_code == 502
    assert response.json() == {"detail": "Could not send the email, try again later"}
    # The user can try again right away, without waiting a minute.
    response = send_passcode(client, new_email)
    assert response.status_code == 502


def test_brevo_request(monkeypatch):
    # Checks the request that goes to Brevo, without sending it.
    request_sent = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b'{"messageId": "<test>"}'

    def fake_urlopen(request, timeout):
        request_sent["url"] = request.full_url
        request_sent["headers"] = {name.lower(): value for name, value in request.header_items()}
        request_sent["body"] = json.loads(request.data)
        return FakeResponse()

    monkeypatch.setattr(config, "BREVO_API_KEY", "test-key")
    monkeypatch.setattr(config, "EMAIL_SENDER", "mamar@example.com")
    monkeypatch.setattr(email.urllib.request, "urlopen", fake_urlopen)
    email.send_passcode("sara@example.com", "042917")

    assert request_sent["url"] == "https://api.brevo.com/v3/smtp/email"
    assert request_sent["headers"]["api-key"] == "test-key"
    assert request_sent["body"]["sender"] == {"name": "MAMAR", "email": "mamar@example.com"}
    assert request_sent["body"]["to"] == [{"email": "sara@example.com"}]
    assert "042917" in request_sent["body"]["textContent"]
