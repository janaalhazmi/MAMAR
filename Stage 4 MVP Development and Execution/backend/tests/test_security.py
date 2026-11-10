from app.core import limits
from tests.conftest import QUOTE, REQUEST
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
    # The field worker cannot change it either.
    response = api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Paused"}, headers=worker)
    assert response.status_code == 400
    assert api.client.post(f"/field-worker/projects/{project_id}/check-in", headers=worker).status_code == 400
    body = {"project_id": project_id, "latitude": 24.7, "longitude": 46.6, "accuracy": 5}
    response = api.client.post("/devices/TC-001/verify", json=body, headers=worker)
    assert (response.status_code, response.json()) == (400, {"detail": "The project is completed"})


def test_one_provider_per_project(api):
    # After a provider is confirmed, no new request is sent out and no second quote is accepted.
    project_id, contractor, _ = api.won_project(provider_id=1)
    project = api.client.get(f"/projects/{project_id}", headers=contractor).json()
    assert project["project_status"] == "active"
    response = api.client.post(
        f"/projects/{project_id}/requests",
        json={"title": "Again", "details": "More signs", "required_by": "2026-11-25"},
        headers=contractor,
    )
    assert (response.status_code, response.json()) == (409, {"detail": "A provider is already confirmed for this project"})


def test_the_whole_flow_in_order(api):
    # Contractor -> provider -> field worker -> provider -> contractor, with every step out of order refused.
    _, contractor = api.account()
    project_id = api.project(contractor)
    _, provider = api.account("provider", 1)
    _, other = api.account("provider", 2)
    worker_id, worker = api.account("worker", 1)
    url = f"/projects/{project_id}"

    # Nothing can happen before a provider is confirmed.
    assert api.client.post(f"{url}/assignments", json={"worker_id": worker_id}, headers=provider).status_code == 403
    assert api.client.post(f"/provider{url}/submit-completion", headers=provider).status_code in (403, 404)
    assert api.client.post(f"{url}/complete", headers=contractor).status_code == 400
    assert api.client.post(f"{url}/payments", json={"return_url": "http://localhost:5173/payment/return",
                                                    "cancel_url": "http://localhost:5173/payment/cancel"},
                           headers=contractor).status_code == 400

    # Request, two quotes, confirm one.
    request = api.request(contractor, project_id)
    mine = api.quote(provider, request["request_id"])
    theirs = api.quote(other, request["request_id"])
    response = api.client.post(f"{url}/confirm-provider", json={"quote_id": mine["quote_id"]}, headers=contractor)
    assert response.status_code == 200 and response.json()["project"]["project_status"] == "active"
    # The losing company cannot confirm itself back in, assign workers or quote again.
    response = api.client.post(f"{url}/confirm-provider", json={"quote_id": theirs["quote_id"]}, headers=contractor)
    assert response.status_code == 400
    assert api.client.post(f"{url}/assignments", json={"worker_id": worker_id}, headers=other).status_code == 403
    assert api.client.post(f"/requests/{request['request_id']}/quotes", json=QUOTE, headers=other).status_code == 400

    # The field worker cannot start before being assigned.
    assert api.client.post(f"/field-worker{url}/check-in", headers=worker).status_code == 403
    assert api.client.post(f"{url}/assignments", json={"worker_id": worker_id}, headers=provider).status_code == 201
    assert api.client.post(f"/field-worker{url}/check-in", headers=worker).json()["site_status"] == "Work in Progress"

    # The provider cannot send unfinished work, and the contractor cannot approve unsent work.
    assert api.client.post(f"/provider{url}/submit-completion", headers=provider).status_code == 400
    assert api.client.patch(f"/field-worker{url}/status", json={"status": "Completed"}, headers=worker).status_code == 200
    assert api.client.post(f"{url}/complete", headers=contractor).status_code == 400
    assert api.client.post(f"/provider{url}/submit-completion", headers=provider).status_code == 200

    # Changes requested: back to the field team, and approving needs a new submission.
    response = api.client.post(f"{url}/request-changes", json={"note": "Move the sign"}, headers=contractor)
    assert response.status_code == 200
    assert api.client.post(f"{url}/complete", headers=contractor).status_code == 400
    assert api.client.patch(f"/field-worker{url}/status", json={"status": "Completed"}, headers=worker).status_code == 200
    assert api.client.post(f"/provider{url}/submit-completion", headers=provider).status_code == 200
    # Another company cannot submit or approve.
    assert api.client.post(f"/provider{url}/submit-completion", headers=other).status_code in (403, 404)
    response = api.client.post(f"{url}/complete", headers=contractor)
    assert response.status_code == 200 and response.json()["project_status"] == "completed"
    # Approving twice or cancelling afterwards is refused.
    assert api.client.post(f"{url}/complete", headers=contractor).status_code == 400
    assert api.client.patch(url, json={"project_status": "cancelled"}, headers=contractor).status_code == 400
