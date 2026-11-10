import uuid


def test_profile_update_and_password_change(api):
    _, contractor = api.account()
    response = api.client.patch("/auth/me", json={"full_name": "Sara A.", "phone": "0500000000"}, headers=contractor)
    assert response.status_code == 200 and response.json()["full_name"] == "Sara A."
    assert api.client.patch("/auth/me", json={}, headers=contractor).status_code == 422
    # An email that belongs to someone else is refused.
    api.account()
    taken = api.emails[-1]
    assert api.client.patch("/auth/me", json={"email": taken}, headers=contractor).status_code == 409

    email = api.emails[0]
    wrong = {"current_password": "nope", "new_password": "NewPass1234"}
    assert api.client.post("/auth/change-password", json=wrong, headers=contractor).status_code == 400
    right = {"current_password": "StrongPass123", "new_password": "NewPass1234"}
    assert api.client.post("/auth/change-password", json=right, headers=contractor).status_code == 200
    assert api.client.post("/auth/login", json={"email": email, "password": "NewPass1234"}).status_code == 200


def test_provider_keeps_the_company_email(api):
    _, worker = api.account("worker", 1)
    other = f"x-{uuid.uuid4().hex[:8]}@gmail.com"
    response = api.client.patch("/auth/me", json={"email": other}, headers=worker)
    assert response.status_code == 422 and "company email" in response.json()["detail"]


def test_profile_picture(api):
    _, contractor = api.account()
    files = {"file": ("me.png", b"\x89PNG fake", "image/png")}
    picture = api.client.post("/auth/me/avatar", files=files, headers=contractor).json()["profile_picture"]
    assert picture.startswith("/photos/")
    assert api.client.get(picture).content == b"\x89PNG fake"
    bad = {"file": ("me.txt", b"hi", "text/plain")}
    assert api.client.post("/auth/me/avatar", files=bad, headers=contractor).status_code == 422
    assert api.client.delete("/auth/me/avatar", headers=contractor).json()["profile_picture"] is None
    assert api.client.get(picture).status_code == 404
