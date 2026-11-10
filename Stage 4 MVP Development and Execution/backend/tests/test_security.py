from app.core import limits
from tests.conftest import REQUEST
from tests.test_workflow import active_project_with_worker


def test_too_many_wrong_passwords_wait(api, monkeypatch):
    monkeypatch.setattr(limits, "_failed", {})
    _, _ = api.account()
    email = api.emails[-1]
    for _ in range(limits.MAX_FAILED):
        assert api.client.post("/auth/login", json={"email": email, "password": "Wrong123"}).status_code == 401
    response = api.client.post("/auth/login", json={"email": email, "password": "StrongPass123"})
    assert (response.status_code, response.json()) == (429, {"detail": "Too many wrong passwords. Try again in 15 minutes"})
    # Another email is not affected.
    _, _ = api.account()
    assert api.client.post("/auth/login", json={"email": api.emails[-1], "password": "StrongPass123"}).status_code == 200


def test_a_right_password_clears_the_count(api, monkeypatch):
    monkeypatch.setattr(limits, "_failed", {})
    _, _ = api.account()
    email = api.emails[-1]
    for _ in range(limits.MAX_FAILED - 1):
        api.client.post("/auth/login", json={"email": email, "password": "Wrong123"})
    assert api.client.post("/auth/login", json={"email": email, "password": "StrongPass123"}).status_code == 200
    assert limits._failed == {}


def test_huge_password_or_request_is_refused(api):
    body = {"full_name": "A", "email": "huge@example.com", "password": "x" * 129, "role": "contractor"}
    assert api.client.post("/auth/register", json=body).status_code == 422
    response = api.client.post("/auth/login", json={"email": "a@b.co", "password": "x"}, headers={"content-length": str(60 * 1024 * 1024)})
    assert (response.status_code, response.json()) == (413, {"detail": "The request is too big"})


def test_cancelled_project_is_closed_for_everyone(api):
    _, contractor = api.account()
    _, provider = api.account("provider", 1)
    project_id = api.project(contractor)
    request = api.request(contractor, project_id, provider_ids=[1])
    assert api.client.patch(f"/projects/{project_id}", json={"project_status": "cancelled"}, headers=contractor).status_code == 200
    # Its open request is closed, so providers stop seeing it and cannot quote.
    rows = api.client.get(f"/requests?project_id={project_id}", headers=contractor).json()
    assert rows[0]["status"] == "closed"
    assert request["request_id"] not in [r["request_id"] for r in api.client.get("/provider/requests", headers=provider).json()]
    response = api.client.post(f"/projects/{project_id}/requests", json=REQUEST, headers=contractor)
    assert (response.status_code, response.json()) == (400, {"detail": "The project is cancelled"})


def test_finished_project_cannot_be_changed(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    # Back to draft is not allowed once a provider is confirmed.
    response = api.client.patch(f"/projects/{project_id}", json={"project_status": "draft"}, headers=contractor)
    assert (response.status_code, response.json()) == (400, {"detail": "A project with a confirmed provider cannot go back to draft"})

    api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    api.client.post(f"/provider/projects/{project_id}/submit-completion", headers=provider)
    assert api.client.post(f"/projects/{project_id}/complete", headers=contractor).status_code == 200
    # After approval: no changes request, no new worker, no edits.
    response = api.client.post(f"/projects/{project_id}/request-changes", json={"note": "again"}, headers=contractor)
    assert (response.status_code, response.json()) == (400, {"detail": "The project is completed"})
    worker_id, _ = api.account("worker", 1)
    response = api.client.post(f"/projects/{project_id}/assignments", json={"worker_id": worker_id}, headers=provider)
    assert (response.status_code, response.json()) == (400, {"detail": "The project is completed"})
    assert api.client.patch(f"/projects/{project_id}", json={"project_name": "x"}, headers=contractor).status_code == 400
