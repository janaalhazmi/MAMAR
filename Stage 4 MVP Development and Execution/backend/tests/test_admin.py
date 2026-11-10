import uuid

from app.core import config
from app.db.init_db import add_admin_account


def admin_login(api, monkeypatch, password="AdminPass123"):
    # The admin account comes from ADMIN_EMAIL and ADMIN_PASSWORD when the server starts.
    email = f"admin-{uuid.uuid4().hex[:10]}@example.com"
    api.emails.append(email)
    monkeypatch.setattr(config, "ADMIN_EMAIL", email)
    monkeypatch.setattr(config, "ADMIN_PASSWORD", password)
    add_admin_account()
    login = api.client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200 and login.json()["user"]["role"] == "admin"
    return email, {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_admin_account_from_render_settings(api, monkeypatch):
    email, _ = admin_login(api, monkeypatch)
    # Running again with a new password changes it; the old one stops working.
    monkeypatch.setattr(config, "ADMIN_PASSWORD", "NewAdminPass456")
    add_admin_account()
    assert api.client.post("/auth/login", json={"email": email, "password": "AdminPass123"}).status_code == 401
    assert api.client.post("/auth/login", json={"email": email, "password": "NewAdminPass456"}).status_code == 200


def test_admin_never_takes_over_another_account(api, monkeypatch):
    user_id, _ = api.account()
    email = api.emails[-1]
    monkeypatch.setattr(config, "ADMIN_EMAIL", email)
    monkeypatch.setattr(config, "ADMIN_PASSWORD", "AdminPass123")
    add_admin_account()
    assert api.client.post("/auth/login", json={"email": email, "password": "AdminPass123"}).status_code == 401
    assert api.client.post("/auth/login", json={"email": email, "password": "StrongPass123"}).json()["user"]["role"] == "contractor"


def test_only_the_admin_opens_the_dashboard(api):
    _, contractor = api.account()
    for path in ("/admin/users", "/admin/summary", "/admin/companies"):
        assert api.client.get(path, headers=contractor).status_code == 403
        assert api.client.get(path).status_code == 401
    # Nobody can sign up as an admin.
    body = {"full_name": "X", "email": f"x-{uuid.uuid4().hex[:8]}@example.com", "password": "StrongPass123", "role": "admin"}
    assert api.client.post("/auth/register", json=body).status_code == 422


def test_admin_lists_adds_and_stops_users(api, monkeypatch):
    _, admin = admin_login(api, monkeypatch)
    contractor_id, contractor = api.account()
    api.project(contractor)
    worker_id, _ = api.account("worker", 1)

    rows = {r["user_id"]: r for r in api.client.get("/admin/users", headers=admin).json()}
    assert rows[contractor_id]["role"] == "contractor" and rows[contractor_id]["projects"] == 1
    assert rows[worker_id]["company_name"] and rows[worker_id]["provider_id"] == 1
    assert all(r["role"] != "admin" for r in rows.values())
    workers = api.client.get("/admin/users?role=worker", headers=admin).json()
    assert {r["role"] for r in workers} == {"worker"}
    summary = api.client.get("/admin/summary", headers=admin).json()
    assert summary["contractors"] >= 1 and summary["workers"] >= 1
    assert any(c["provider_id"] == 1 for c in api.client.get("/admin/companies", headers=admin).json())

    # Add a worker for company 2 (no company email rule and no passcode for the admin).
    email = f"new-{uuid.uuid4().hex[:8]}@gmail.com"
    api.emails.append(email)
    body = {"full_name": "New Worker", "email": email, "password": "WorkerPass1", "role": "worker", "provider_id": 2}
    response = api.client.post("/admin/users", json=body, headers=admin)
    assert response.status_code == 201 and response.json()["company_name"]
    assert api.client.post("/admin/users", json=body, headers=admin).status_code == 409
    assert api.client.post("/admin/users", json={**body, "role": "admin"}, headers=admin).status_code == 422
    assert api.client.post("/admin/users", json={**body, "email": "a" + email, "provider_id": None}, headers=admin).status_code == 422
    new_id = response.json()["user_id"]
    login = api.client.post("/auth/login", json={"email": email, "password": "WorkerPass1"})
    assert login.status_code == 200
    token = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # Stop the user: login and the old token are refused; allow again and it works.
    assert api.client.patch(f"/admin/users/{new_id}", json={"is_active": False}, headers=admin).json()["is_active"] is False
    assert api.client.post("/auth/login", json={"email": email, "password": "WorkerPass1"}).status_code == 401
    assert api.client.get("/auth/me", headers=token).status_code == 401
    api.client.patch(f"/admin/users/{new_id}", json={"is_active": True}, headers=admin)
    assert api.client.post("/auth/login", json={"email": email, "password": "WorkerPass1"}).status_code == 200
    assert api.client.patch(f"/admin/users/{new_id}", json={}, headers=admin).status_code == 422
    assert api.client.patch("/admin/users/999999", json={"is_active": False}, headers=admin).status_code == 404
