import uuid

from fastapi.testclient import TestClient
from sqlalchemy import delete, func

from app.db.database import SessionLocal
from app.db.init_db import DEMO_PROVIDERS, add_demo_providers
from app.main import app
from app.models import Provider, User

PROVIDER_FIELDS = ["provider_id", "company_name", "service_type", "city", "phone", "website"]


def start_app():
    # Starting the app creates the tables and adds the demo providers.
    with TestClient(app):
        pass


def test_demo_providers_are_added_when_the_server_starts():
    start_app()
    with SessionLocal() as db:
        for expected in DEMO_PROVIDERS:
            provider = db.get(Provider, expected["provider_id"])
            assert provider is not None
            assert {field: getattr(provider, field) for field in PROVIDER_FIELDS} == expected


def test_adding_them_again_does_not_change_existing_providers():
    start_app()
    with SessionLocal() as db:
        provider = db.get(Provider, 1)
        original_phone = provider.phone
        provider.phone = "0500000000"
        db.commit()
    try:
        add_demo_providers()
        with SessionLocal() as db:
            assert db.get(Provider, 1).phone == "0500000000"
    finally:
        with SessionLocal() as db:
            db.get(Provider, 1).phone = original_phone
            db.commit()


def test_a_new_provider_does_not_reuse_a_demo_provider_id():
    start_app()
    with SessionLocal() as db:
        provider = Provider(company_name="Test Traffic Control", service_type="Traffic Control", city="Riyadh")
        db.add(provider)
        db.commit()
        new_id = provider.provider_id
        db.delete(provider)
        db.commit()
    assert new_id > max(expected["provider_id"] for expected in DEMO_PROVIDERS)


def test_register_a_provider_account_with_a_demo_provider():
    # The QA case that returned "Provider not found" before the demo providers were added.
    email = f"test-{uuid.uuid4().hex[:12]}@example.com"
    body = {
        "full_name": "Test Provider",
        "email": email,
        "password": "StrongPass123",
        "role": "provider",
        "provider_id": 1,
    }
    try:
        with TestClient(app) as client:
            response = client.post("/auth/register", json=body)
            assert response.status_code == 201
            assert response.json()["provider_id"] == 1
            login = client.post("/auth/login", json={"email": email, "password": "StrongPass123"})
            assert login.status_code == 200
            assert login.json()["user"]["role"] == "provider"
    finally:
        with SessionLocal() as db:
            db.execute(delete(User).where(func.lower(User.email) == email))
            db.commit()
