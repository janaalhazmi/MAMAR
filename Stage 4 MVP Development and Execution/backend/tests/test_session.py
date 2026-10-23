import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.core.config import SECRET_KEY
from app.core.security import ALGORITHM
from app.db.database import SessionLocal
from app.main import app
from app.models import User

# The fields of GET /auth/me, the same as the register response.
USER_FIELDS = [
    "user_id", "full_name", "email", "phone",
    "role", "provider_id", "is_active", "created_at",
]


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def account(client):
    # A new contractor that is logged in. It is deleted after the test.
    email = f"test-{uuid.uuid4().hex[:12]}@example.com"
    body = {"full_name": "Sara Ahmed", "email": email, "password": "StrongPass123", "role": "contractor"}
    user = client.post("/auth/register", json=body).json()
    token = client.post("/auth/login", json={"email": email, "password": "StrongPass123"}).json()["access_token"]
    yield user, token
    with SessionLocal() as db:
        db.execute(delete(User).where(User.email == email))
        db.commit()


def me(client, token=None):
    headers = {"Authorization": f"Bearer {token}"} if token is not None else {}
    return client.get("/auth/me", headers=headers)


def test_me_returns_the_signed_in_user(client, account):
    user, token = account
    response = me(client, token)
    assert response.status_code == 200
    assert list(response.json()) == USER_FIELDS
    assert response.json() == user


def test_me_without_a_token_returns_401(client):
    response = me(client)
    assert response.status_code == 401
    assert response.json() == {"detail": "Token is missing"}


def test_me_with_an_invalid_or_expired_token_returns_401(client, account):
    user, token = account
    expired = jwt.encode(
        {"sub": str(user["user_id"]), "role": "contractor", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    changed = token[:-2] + ("AA" if not token.endswith("AA") else "BB")
    signed_with_another_key = jwt.encode(
        {"sub": str(user["user_id"]), "role": "contractor"}, "another-secret-key-" + "x" * 32, algorithm=ALGORITHM
    )
    for bad_token in ("not-a-token", expired, changed, signed_with_another_key):
        response = me(client, bad_token)
        assert response.status_code == 401
        assert response.json() == {"detail": "Token is not valid"}


def test_me_after_the_account_is_deactivated_returns_401(client, account):
    user, token = account
    with SessionLocal() as db:
        db.get(User, user["user_id"]).is_active = False
        db.commit()
    response = me(client, token)
    assert response.status_code == 401
    assert response.json() == {"detail": "Token is not valid"}


def test_me_after_the_account_is_deleted_returns_401(client, account):
    user, token = account
    with SessionLocal() as db:
        db.execute(delete(User).where(User.user_id == user["user_id"]))
        db.commit()
    response = me(client, token)
    assert response.status_code == 401
    assert response.json() == {"detail": "Token is not valid"}


def test_frontend_can_check_the_token(client):
    # The browser sends the Authorization header to GET /auth/me from the React frontend (CORS).
    response = client.options(
        "/auth/me",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
