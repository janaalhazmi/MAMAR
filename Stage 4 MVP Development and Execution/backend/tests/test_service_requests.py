import pytest

from app.models import Quote, ServiceRequest
from tests.conftest import REQUEST

# The fields of one service request in Stage 3, section 4.2.8, in the same order.
REQUEST_FIELDS = ["request_id", "project_id", "title", "details", "required_by", "status", "created_at"]


def test_create_request_returns_201_as_open(api):
    _, contractor = api.account()
    project_id = api.project(contractor)
    response = api.client.post(f"/projects/{project_id}/requests", json=REQUEST, headers=contractor)
    assert response.status_code == 201
    request = response.json()
    assert list(request) == REQUEST_FIELDS
    assert request["project_id"] == project_id
    assert request["status"] == "open"
    for field, value in REQUEST.items():
        assert request[field] == value


def test_create_request_without_details(api):
    _, contractor = api.account()
    project_id = api.project(contractor)
    body = {"title": "Detour signs", "required_by": "2026-11-20"}
    assert api.client.post(f"/projects/{project_id}/requests", json=body, headers=contractor).json()["details"] is None
    assert api.request(contractor, project_id, details="  ")["details"] is None


@pytest.mark.parametrize(
    ("changes", "field"),
    [({"title": ""}, "title"), ({"title": "x" * 151}, "title"), ({"required_by": "next week"}, "required_by"), ({"required_by": None}, "required_by")],
)
def test_create_request_with_an_invalid_body_returns_422(api, changes, field):
    _, contractor = api.account()
    project_id = api.project(contractor)
    response = api.client.post(f"/projects/{project_id}/requests", json={**REQUEST, **changes}, headers=contractor)
    assert response.status_code == 422
    assert response.json()["detail"].startswith(f"{field}: ")


def test_create_request_rules(api):
    _, owner = api.account()
    _, other = api.account()
    _, provider = api.account("provider", 1)
    project_id = api.project(owner)
    url = f"/projects/{project_id}/requests"
    assert api.client.post(url, json=REQUEST).status_code == 401
    response = api.client.post(url, json=REQUEST, headers=other)
    assert (response.status_code, response.json()) == (403, {"detail": "This project belongs to another contractor"})
    response = api.client.post(url, json=REQUEST, headers=provider)
    assert (response.status_code, response.json()) == (403, {"detail": "Only contractors can create or award service requests"})
    response = api.client.post("/projects/999999999/requests", json=REQUEST, headers=owner)
    assert (response.status_code, response.json()) == (404, {"detail": "Project not found"})


def test_contractor_sees_only_the_requests_of_their_projects(api):
    _, owner = api.account()
    _, other = api.account()
    first = api.request(owner, api.project(owner))
    second_project = api.project(owner)
    second = api.request(owner, second_project)
    api.request(other, api.project(other))
    ids = [r["request_id"] for r in api.client.get("/requests", headers=owner).json()]
    assert ids == [second["request_id"], first["request_id"]]
    filtered = api.client.get(f"/requests?project_id={second_project}", headers=owner).json()
    assert [r["request_id"] for r in filtered] == [second["request_id"]]


def test_provider_sees_only_open_requests(api):
    _, contractor = api.account()
    _, provider = api.account("provider", 1)
    project_id = api.project(contractor)
    open_request = api.request(contractor, project_id)
    awarded = api.request(contractor, project_id)
    quote = api.quote(provider, awarded["request_id"])
    assert api.award(contractor, awarded["request_id"], quote["quote_id"]).status_code == 200
    ids = [r["request_id"] for r in api.client.get(f"/requests?project_id={project_id}", headers=provider).json()]
    assert ids == [open_request["request_id"]]
    assert api.client.get(f"/requests?status=awarded&project_id={project_id}", headers=provider).json() == []


def test_list_requests_rules(api):
    _, worker = api.account("worker", 1)
    assert api.client.get("/requests").status_code == 401
    response = api.client.get("/requests", headers=worker)
    assert (response.status_code, response.json()) == (403, {"detail": "Only contractors and providers can view service requests"})
    _, contractor = api.account()
    response = api.client.get("/requests?status=pending", headers=contractor)
    assert response.status_code == 422
    assert response.json()["detail"].startswith("status: ")


def test_award_accepts_one_quote_and_rejects_the_others(api):
    _, contractor = api.account()
    _, tcm = api.account("provider", 1)
    _, safety_arabia = api.account("provider", 2)
    request = api.request(contractor, api.project(contractor))
    cheap = api.quote(tcm, request["request_id"], price=15000)
    expensive = api.quote(safety_arabia, request["request_id"], price=21000.5)
    response = api.award(contractor, request["request_id"], cheap["quote_id"])
    assert response.status_code == 200
    assert response.json() == {
        "request_id": request["request_id"],
        "status": "awarded",
        "accepted_quote": {"quote_id": cheap["quote_id"], "provider_id": 1, "price": 15000.0, "status": "accepted"},
    }
    quotes = {q["quote_id"]: q["status"] for q in api.client.get(f"/requests/{request['request_id']}/quotes", headers=contractor).json()}
    assert quotes == {cheap["quote_id"]: "accepted", expensive["quote_id"]: "rejected"}


def test_award_rules(api):
    _, owner = api.account()
    _, other = api.account()
    _, provider = api.account("provider", 1)
    request = api.request(owner, api.project(owner))
    other_request = api.request(owner, api.project(owner))
    quote = api.quote(provider, request["request_id"])
    other_quote = api.quote(provider, other_request["request_id"])
    request_id = request["request_id"]

    response = api.award(other, request_id, quote["quote_id"])
    assert (response.status_code, response.json()) == (403, {"detail": "This request belongs to another contractor"})
    response = api.award(provider, request_id, quote["quote_id"])
    assert response.status_code == 403
    response = api.award(owner, 999999999, quote["quote_id"])
    assert (response.status_code, response.json()) == (404, {"detail": "Request not found"})
    response = api.award(owner, request_id, other_quote["quote_id"])
    assert (response.status_code, response.json()) == (404, {"detail": "Quote not found for this request"})
    response = api.client.post(f"/requests/{request_id}/award", json={}, headers=owner)
    assert (response.status_code, response.json()) == (422, {"detail": "quote_id: Field required"})

    assert api.award(owner, request_id, quote["quote_id"]).status_code == 200
    response = api.award(owner, request_id, quote["quote_id"])
    assert (response.status_code, response.json()) == (400, {"detail": "The request is already awarded"})


def test_award_and_close_methods():
    request = ServiceRequest(status="open")
    first, second = Quote(quote_id=1, status="pending"), Quote(quote_id=2, status="pending")
    request.quotes = [first, second]
    with pytest.raises(LookupError):
        request.award(3)
    assert request.award(2) is second
    assert (request.status, first.status, second.status) == ("awarded", "rejected", "accepted")
    with pytest.raises(ValueError):
        request.award(1)
    with pytest.raises(ValueError):
        request.close()
    open_request = ServiceRequest(status="open")
    open_request.close()
    assert open_request.status == "closed"


def test_frontend_can_send_a_request_with_the_token(api):
    response = api.client.options(
        "/projects/1/requests",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Authorization, Content-Type"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
