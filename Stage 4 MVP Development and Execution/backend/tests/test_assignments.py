from app.models import Assignment
import pytest

# The fields of one assignment in Stage 3, section 4.2.13, in the same order.
ASSIGNMENT_FIELDS = ["assignment_id", "project_id", "provider_id", "worker_id", "assigned_at", "status"]


def test_the_winning_provider_assigns_its_worker(api):
    project_id, _, provider = api.won_project(provider_id=1)
    worker_id, _ = api.account("worker", 1)
    response = api.client.post(f"/projects/{project_id}/assignments", json={"worker_id": worker_id}, headers=provider)
    assert response.status_code == 201
    assignment = response.json()
    assert list(assignment) == ASSIGNMENT_FIELDS
    assert (assignment["project_id"], assignment["provider_id"], assignment["worker_id"], assignment["status"]) == (project_id, 1, worker_id, "active")


def test_assignment_rules(api):
    project_id, contractor, provider = api.won_project(provider_id=1)
    _, loser = api.account("provider", 2)
    worker_id, worker = api.account("worker", 1)
    other_worker_id, _ = api.account("worker", 2)
    contractor_id = api.client.get("/auth/me", headers=contractor).json()["user_id"]
    url = f"/projects/{project_id}/assignments"

    assert api.client.post(url, json={"worker_id": worker_id}).status_code == 401
    response = api.client.post(url, json={"worker_id": worker_id}, headers=worker)
    assert (response.status_code, response.json()) == (403, {"detail": "Only providers can assign field workers"})
    response = api.client.post(url, json={"worker_id": other_worker_id}, headers=loser)
    assert (response.status_code, response.json()) == (403, {"detail": "Your company did not win a request for this project"})
    response = api.client.post("/projects/999999999/assignments", json={"worker_id": worker_id}, headers=provider)
    assert (response.status_code, response.json()) == (404, {"detail": "Project not found"})
    # A worker of another company, a contractor and an unknown user are not workers of this provider.
    for unknown in (other_worker_id, contractor_id, 999999999):
        response = api.client.post(url, json={"worker_id": unknown}, headers=provider)
        assert (response.status_code, response.json()) == (404, {"detail": "Worker not found in your company"})
    assert api.client.post(url, json={}, headers=provider).json() == {"detail": "worker_id: Field required"}

    assert api.client.post(url, json={"worker_id": worker_id}, headers=provider).status_code == 201
    response = api.client.post(url, json={"worker_id": worker_id}, headers=provider)
    assert (response.status_code, response.json()) == (409, {"detail": "This worker is already assigned to this project"})


def test_a_provider_with_a_rejected_or_pending_quote_cannot_assign(api):
    _, contractor = api.account()
    _, winner = api.account("provider", 1)
    _, loser = api.account("provider", 2)
    _, waiting = api.account("provider", 3)
    worker_id, _ = api.account("worker", 2)
    waiting_worker_id, _ = api.account("worker", 3)
    project_id = api.project(contractor)
    request_id = api.request(contractor, project_id)["request_id"]
    win = api.quote(winner, request_id)
    api.quote(loser, request_id)
    open_request_id = api.request(contractor, project_id)["request_id"]
    api.quote(waiting, open_request_id)
    api.award(contractor, request_id, win["quote_id"])
    url = f"/projects/{project_id}/assignments"
    assert api.client.post(url, json={"worker_id": worker_id}, headers=loser).status_code == 403
    assert api.client.post(url, json={"worker_id": waiting_worker_id}, headers=waiting).status_code == 403


def test_who_sees_the_assignments(api):
    project_id, contractor, provider = api.won_project(provider_id=1)
    first_id, first = api.account("worker", 1)
    second_id, second = api.account("worker", 1)
    url = f"/projects/{project_id}/assignments"
    a1 = api.client.post(url, json={"worker_id": first_id}, headers=provider).json()
    a2 = api.client.post(url, json={"worker_id": second_id}, headers=provider).json()
    # The provider sees the assignments of their company, newest first.
    mine = api.client.get(f"/assignments?project_id={project_id}", headers=provider).json()
    assert [a["assignment_id"] for a in mine] == [a2["assignment_id"], a1["assignment_id"]]
    # A worker sees only their own.
    assert [a["assignment_id"] for a in api.client.get("/assignments", headers=first).json()] == [a1["assignment_id"]]
    assert api.client.get("/assignments?status=completed", headers=second).json() == []
    _, other_provider = api.account("provider", 2)
    assert api.client.get(f"/assignments?project_id={project_id}", headers=other_provider).json() == []
    response = api.client.get("/assignments", headers=contractor)
    assert (response.status_code, response.json()) == (403, {"detail": "Only providers and field workers can view assignments"})
    assert api.client.get("/assignments").status_code == 401
    assert api.client.get("/assignments?status=done", headers=provider).status_code == 422


def test_complete_method():
    assignment = Assignment(status="active")
    assignment.complete()
    assert assignment.status == "completed"
    with pytest.raises(ValueError):
        assignment.complete()
