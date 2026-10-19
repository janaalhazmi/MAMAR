import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select

from app.core.config import SECRET_KEY
from app.core.security import ALGORITHM, get_current_user
from app.db.database import SessionLocal
from app.main import app
from app.models import Provider, User

# The fields of the 201 response in Stage 3, section 4.2.3, in the same order.
USER_FIELDS = [
    "user_id", "full_name", "email", "phone",
    "role", "provider_id", "is_active", "created_at",
]


@pytest.fixture
def client():
    # "with" runs the startup code, so the tables exist before the requests.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def email():
    # A new email for every test. Its user is deleted after the test.
    email = f"test-{uuid.uuid4().hex[:12]}@example.com"
    yield email
    with SessionLocal() as db:
        db.execute(delete(User).where(func.lower(User.email) == email))
        db.commit()


@pytest.fixture
def provider_id():
    # A provider prepared in advance, like Stage 3 describes. It is deleted after the test.
    with SessionLocal() as db:
        provider = Provider(company_name="Test Traffic Control", service_type="Traffic Control", city="Riyadh")
        db.add(provider)
        db.commit()
        provider_id = provider.provider_id
    yield provider_id
    with SessionLocal() as db:
        db.execute(delete(User).where(User.provider_id == provider_id))
        db.execute(delete(Provider).where(Provider.provider_id == provider_id))
        db.commit()


def register_body(new_email, **changes):
    # The example body from Stage 3, section 4.2.3, with a new email.
    body = {
        "full_name": "Sara Ahmed",
        "email": new_email,
        "password": "StrongPass123",
        "phone": "0500000000",
        "role": "contractor",
        "provider_id": None,
    }
    body.update(changes)
    return body


def test_register_creates_the_user(client, email):
    response = client.post("/auth/register", json=register_body(email))
    assert response.status_code == 201
    user = response.json()
    assert list(user) == USER_FIELDS
    assert user["full_name"] == "Sara Ahmed"
    assert user["email"] == email
    assert user["phone"] == "0500000000"
    assert user["role"] == "contractor"
    assert user["provider_id"] is None
    assert user["is_active"] is True


def test_register_saves_only_the_password_hash(client, email):
    client.post("/auth/register", json=register_body(email))
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
    assert user.password_hash != "StrongPass123"
    assert user.password_hash.startswith("$argon2id$")
    assert user.check_password("StrongPass123")
    assert not user.check_password("WrongPass123")


def test_register_with_an_existing_email_returns_409(client, email):
    client.post("/auth/register", json=register_body(email))
    # The same email in capital letters is still the same account.
    response = client.post("/auth/register", json=register_body(email.upper()))
    assert response.status_code == 409
    assert response.json() == {"detail": "Email is already registered"}


def test_register_with_a_missing_field_returns_422(client, email):
    body = register_body(email)
    del body["full_name"]
    response = client.post("/auth/register", json=body)
    assert response.status_code == 422
    assert response.json() == {"detail": "full_name: Field required"}


# Each case breaks one rule of the request body, with the message the API returns.
INVALID_BODIES = [
    pytest.param(
        {"role": "field-worker"},
        "role: Input should be 'contractor', 'provider', 'worker' or 'admin'",
        id="role-field-worker",
    ),
    pytest.param(
        {"email": "sara"},
        "email: value is not a valid email address",
        id="email-without-at",
    ),
    pytest.param(
        {"password": "12345"},
        "password: String should have at least 6 characters",
        id="short-password",
    ),
    pytest.param(
        {"role": "worker"},
        "provider_id is required when role is provider or worker",
        id="worker-without-provider",
    ),
    pytest.param(
        {"provider_id": 1},
        "provider_id must be null when role is contractor or admin",
        id="contractor-with-provider",
    ),
]


@pytest.mark.parametrize(("changes", "detail"), INVALID_BODIES)
def test_register_with_an_invalid_body_returns_422(client, email, changes, detail):
    response = client.post("/auth/register", json=register_body(email, **changes))
    assert response.status_code == 422
    assert response.json() == {"detail": detail}


def test_register_with_an_unknown_provider_returns_404(client, email):
    response = client.post("/auth/register", json=register_body(email, role="worker", provider_id=999999))
    assert response.status_code == 404
    assert response.json() == {"detail": "Provider not found"}


def test_register_a_worker_of_an_existing_provider(client, email, provider_id):
    response = client.post("/auth/register", json=register_body(email, role="worker", provider_id=provider_id))
    assert response.status_code == 201
    assert response.json()["role"] == "worker"
    assert response.json()["provider_id"] == provider_id


def test_frontend_can_send_the_register_request(client):
    # Before sending JSON to another address, the browser asks the API first (CORS preflight).
    response = client.options(
        "/auth/register",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def login(client, email, password="StrongPass123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def test_login_returns_a_token_and_the_user(client, email):
    user_id = client.post("/auth/register", json=register_body(email)).json()["user_id"]
    # Capital letters and spaces in the email still work, the same as in register.
    response = login(client, f" {email.upper()} ")
    assert response.status_code == 200
    body = response.json()
    assert list(body) == ["access_token", "token_type", "user"]
    assert body["token_type"] == "bearer"
    assert body["user"] == {"user_id": user_id, "full_name": "Sara Ahmed", "role": "contractor", "provider_id": None}
    payload = jwt.decode(body["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "contractor"


def test_login_with_a_wrong_password_returns_401(client, email):
    client.post("/auth/register", json=register_body(email))
    response = login(client, email, password="WrongPass123")
    assert response.status_code == 401
    assert response.json() == {"detail": "Email or password is wrong"}


def test_login_with_an_unknown_email_returns_401(client, email):
    response = login(client, email)
    assert response.status_code == 401
    assert response.json() == {"detail": "Email or password is wrong"}


# A small app with one protected endpoint, to test the token check that the next endpoints will use.
protected_app = FastAPI()


@protected_app.get("/protected")
def protected_endpoint(user: User = Depends(get_current_user)):
    return {"user_id": user.user_id}


def test_protected_endpoint_accepts_the_login_token(client, email):
    user_id = client.post("/auth/register", json=register_body(email)).json()["user_id"]
    token = login(client, email).json()["access_token"]
    response = TestClient(protected_app).get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"user_id": user_id}


def test_protected_endpoint_without_a_valid_token_returns_401():
    protected = TestClient(protected_app)
    response = protected.get("/protected")
    assert response.status_code == 401
    assert response.json() == {"detail": "Token is missing"}

    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, SECRET_KEY, algorithm=ALGORITHM
    )
    signed_with_another_key = jwt.encode({"sub": "1"}, "another-secret-key-" + "x" * 32, algorithm=ALGORITHM)
    for token in ("not-a-token", expired, signed_with_another_key):
        response = protected.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        assert response.json() == {"detail": "Token is not valid"}
