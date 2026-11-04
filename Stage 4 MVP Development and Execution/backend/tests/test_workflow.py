import pytest

from app.core import arcgis
from tests.conftest import PROJECT

# A 1x1 PNG, small enough for the upload tests.
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360000000000200010be7f1a90000000049454e44ae426082"
)

QUOTATION = {"price": 18500.00, "duration_days": 15, "start_date": "2026-11-10", "services": ["ttc-plan", "road-signs"]}


def project_with_request(api, **project):
    # A contractor's project that asks for quotations.
    _, contractor = api.account()
    response = api.client.post("/projects", json={**PROJECT, **project}, headers=contractor)
    assert response.status_code == 201
    project_id = response.json()["project_id"]
    api.request(contractor, project_id)
    return project_id, contractor


def send_quotation(api, headers, project_id, **changes):
    return api.client.post("/quotations", json={**QUOTATION, "project_id": project_id, **changes}, headers=headers)


def active_project_with_worker(api, provider_id=1):
    # A project whose provider was confirmed and has one assigned field worker.
    project_id, contractor = project_with_request(api, services=["ttc-plan"])
    _, provider = api.account("provider", provider_id)
    quote = send_quotation(api, provider, project_id).json()
    assert api.client.post(
        f"/projects/{project_id}/confirm-provider", json={"quote_id": quote["quote_id"]}, headers=contractor
    ).status_code == 200
    worker_id, worker = api.account("worker", provider_id)
    assert api.client.post(
        f"/projects/{project_id}/assignments", json={"worker_id": worker_id}, headers=provider
    ).status_code == 201
    return project_id, contractor, provider, worker


# ---------------------------------------------------------------------------
# Projects: services and GET /projects/{id}
# ---------------------------------------------------------------------------


def test_project_saves_the_services_once(api):
    _, contractor = api.account()
    body = {**PROJECT, "services": ["ttc-plan", "road-signs", "ttc-plan"]}
    project = api.client.post("/projects", json=body, headers=contractor).json()
    assert project["services"] == ["ttc-plan", "road-signs"]
    assert api.client.post("/projects", json=PROJECT, headers=contractor).json()["services"] == []
    response = api.client.patch(f"/projects/{project['project_id']}", json={"services": ["cones-barriers"]}, headers=contractor)
    assert response.json()["services"] == ["cones-barriers"]


def test_unknown_service_returns_422(api):
    _, contractor = api.account()
    response = api.client.post("/projects", json={**PROJECT, "services": ["helicopter"]}, headers=contractor)
    assert response.status_code == 422
    assert response.json() == {"detail": "services: Input should be 'ttc-plan', 'cones-barriers' or 'road-signs'"}


def test_get_one_project_for_each_role(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    for headers in (contractor, provider, worker):
        response = api.client.get(f"/projects/{project_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["project_id"] == project_id
    _, other_contractor = api.account()
    _, other_provider = api.account("provider", 2)
    _, other_worker = api.account("worker", 1)
    for headers in (other_contractor, other_provider, other_worker):
        assert api.client.get(f"/projects/{project_id}", headers=headers).status_code == 403
    assert api.client.get("/projects/999999999", headers=contractor).status_code == 404


def test_provider_can_view_a_project_that_asks_for_quotations(api):
    project_id, _ = project_with_request(api)
    _, provider = api.account("provider", 3)
    assert api.client.get(f"/projects/{project_id}", headers=provider).status_code == 200


# ---------------------------------------------------------------------------
# Quotations
# ---------------------------------------------------------------------------


def test_provider_sends_a_quotation_for_a_project(api):
    project_id, contractor = project_with_request(api)
    _, provider = api.account("provider", 1)
    response = send_quotation(api, provider, project_id, notes="  Includes removal  ")
    assert response.status_code == 201
    quote = response.json()
    assert quote["provider_id"] == 1
    assert quote["price"] == 18500.0
    assert quote["start_date"] == "2026-11-10"
    assert quote["services"] == ["ttc-plan", "road-signs"]
    assert quote["notes"] == "Includes removal"
    assert quote["status"] == "pending"
    assert send_quotation(api, provider, project_id).status_code == 409


def test_quotation_errors(api):
    _, contractor = api.account()
    project_id = api.project(contractor)
    _, provider = api.account("provider", 1)
    response = send_quotation(api, provider, project_id)
    assert response.status_code == 400
    assert response.json() == {"detail": "This project is not asking for quotations"}
    assert send_quotation(api, provider, 999999999).status_code == 404
    assert send_quotation(api, contractor, project_id).status_code == 403
    assert send_quotation(api, provider, project_id, price=0).status_code == 422


def test_contractor_sees_the_quotations_cheapest_first(api):
    project_id, contractor = project_with_request(api)
    _, tcm = api.account("provider", 1)
    _, safety = api.account("provider", 2)
    send_quotation(api, tcm, project_id, price=21000)
    send_quotation(api, safety, project_id, price=16800)
    response = api.client.get(f"/projects/{project_id}/quotations", headers=contractor)
    assert response.status_code == 200
    quotes = response.json()
    assert [quote["price"] for quote in quotes] == [16800.0, 21000.0]
    assert quotes[0]["provider"] == {
        "provider_id": 2,
        "company_name": "Safety Arabia Co. LTD",
        "service_type": "Traffic Devices",
    }
    _, other = api.account()
    assert api.client.get(f"/projects/{project_id}/quotations", headers=other).status_code == 403


def test_contractor_rejects_a_quotation(api):
    project_id, contractor = project_with_request(api)
    _, provider = api.account("provider", 1)
    quote = send_quotation(api, provider, project_id).json()
    _, other = api.account()
    assert api.client.post(f"/quotes/{quote['quote_id']}/reject", headers=other).status_code == 403
    response = api.client.post(f"/quotes/{quote['quote_id']}/reject", headers=contractor)
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
    assert api.client.post(f"/quotes/{quote['quote_id']}/reject", headers=contractor).status_code == 400
    assert api.client.post("/quotes/999999999/reject", headers=contractor).status_code == 404


def test_confirm_provider_accepts_one_quote_and_activates_the_project(api):
    project_id, contractor = project_with_request(api)
    _, tcm = api.account("provider", 1)
    _, safety = api.account("provider", 2)
    chosen = send_quotation(api, tcm, project_id).json()
    other = send_quotation(api, safety, project_id).json()

    response = api.client.post(
        f"/projects/{project_id}/confirm-provider", json={"quote_id": chosen["quote_id"]}, headers=contractor
    )
    assert response.status_code == 200
    assert response.json()["project"]["project_status"] == "active"
    assert response.json()["quote"]["status"] == "accepted"
    statuses = {q["quote_id"]: q["status"] for q in api.client.get(f"/projects/{project_id}/quotations", headers=contractor).json()}
    assert statuses == {chosen["quote_id"]: "accepted", other["quote_id"]: "rejected"}
    # A provider is confirmed once.
    again = api.client.post(f"/projects/{project_id}/confirm-provider", json={"quote_id": other["quote_id"]}, headers=contractor)
    assert again.status_code == 400


def test_confirm_provider_errors(api):
    project_id, contractor = project_with_request(api)
    other_project, _ = project_with_request(api)
    _, provider = api.account("provider", 1)
    rejected = send_quotation(api, provider, project_id).json()
    api.client.post(f"/quotes/{rejected['quote_id']}/reject", headers=contractor)
    foreign = send_quotation(api, provider, other_project).json()

    url = f"/projects/{project_id}/confirm-provider"
    assert api.client.post(url, json={"quote_id": rejected["quote_id"]}, headers=contractor).status_code == 400
    assert api.client.post(url, json={"quote_id": foreign["quote_id"]}, headers=contractor).status_code == 404
    assert api.client.post(url, json={"quote_id": 999999999}, headers=contractor).status_code == 404
    assert api.client.post(url, json={"quote_id": rejected["quote_id"]}, headers=provider).status_code == 403


# ---------------------------------------------------------------------------
# Field work, photos, monitoring and completion
# ---------------------------------------------------------------------------


def test_field_worker_sees_only_assigned_projects(api):
    project_id, _, _, worker = active_project_with_worker(api)
    response = api.client.get("/field-worker/projects", headers=worker)
    assert response.status_code == 200
    projects = response.json()
    assert [item["project"]["project_id"] for item in projects] == [project_id]
    assert projects[0]["site_status"] == "Not Started"
    assert projects[0]["provider"]["provider_id"] == 1
    assert [member["full_name"] for member in projects[0]["team"]] == ["Sara Ahmed"]

    _, other_worker = api.account("worker", 1)
    assert api.client.get("/field-worker/projects", headers=other_worker).json() == []
    assert api.client.get(f"/field-worker/projects/{project_id}", headers=other_worker).status_code == 403
    _, contractor = api.account()
    assert api.client.get("/field-worker/projects", headers=contractor).status_code == 403


def test_check_in_and_status_reach_the_contractor(api):
    project_id, contractor, _, worker = active_project_with_worker(api)
    checked = api.client.post(f"/field-worker/projects/{project_id}/check-in", headers=worker).json()
    assert checked["last_check_in"] is not None
    assert checked["site_status"] == "Work in Progress"

    monitoring = api.client.get(f"/projects/{project_id}/monitoring", headers=contractor).json()
    assert monitoring["site_status"] == "Work in Progress"
    assert monitoring["progress"] == 50
    assert monitoring["field_team_count"] == 1
    assert monitoring["completion_submitted"] is False
    assert monitoring["provider"]["company_name"] == "Traffic and Construction Management TCM"
    assert monitoring["quote"]["price"] == 18500.0
    assert monitoring["services"] == ["ttc-plan"]

    response = api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    assert response.status_code == 200
    completion = api.client.get(f"/projects/{project_id}/completion", headers=contractor).json()
    assert completion["completion_submitted"] is True
    assert completion["submitted_at"] is not None
    assert completion["progress"] == 100
    assert api.client.patch(
        f"/field-worker/projects/{project_id}/status", json={"status": "Done"}, headers=worker
    ).status_code == 422


def test_worker_uploads_photos_that_the_contractor_can_open(api):
    project_id, contractor, _, worker = active_project_with_worker(api)
    files = [("photos", ("a.png", PNG, "image/png")), ("photos", ("b.png", PNG, "image/png"))]
    response = api.client.post(
        f"/field-worker/projects/{project_id}/photos",
        files=files,
        data={"captions": ["Work zone setup", ""]},
        headers=worker,
    )
    assert response.status_code == 201
    photos = response.json()
    assert [photo["caption"] for photo in photos] == ["Work zone setup", "Site photo"]
    assert all(photo["url"].startswith("/photos/") for photo in photos)

    image = api.client.get(photos[0]["url"])
    assert image.status_code == 200
    assert image.headers["content-type"] == "image/png"
    assert image.content == PNG
    assert api.client.get("/photos/unknown").status_code == 404

    monitoring = api.client.get(f"/projects/{project_id}/monitoring", headers=contractor).json()
    assert {photo["photo_id"] for photo in monitoring["photos"]} == {photo["photo_id"] for photo in photos}


def test_photo_upload_rules(api):
    project_id, _, _, worker = active_project_with_worker(api)
    url = f"/field-worker/projects/{project_id}/photos"
    text_file = [("photos", ("notes.txt", b"hello", "text/plain"))]
    assert api.client.post(url, files=text_file, headers=worker).status_code == 422
    big = [("photos", ("big.jpg", b"x" * (5 * 1024 * 1024 + 1), "image/jpeg"))]
    assert api.client.post(url, files=big, headers=worker).status_code == 413
    many = [("photos", (f"{i}.png", PNG, "image/png")) for i in range(11)]
    assert api.client.post(url, files=many, headers=worker).status_code == 422
    _, other_worker = api.account("worker", 1)
    one = [("photos", ("a.png", PNG, "image/png"))]
    assert api.client.post(url, files=one, headers=other_worker).status_code == 403


def test_contractor_approves_the_completion(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    response = api.client.post(f"/projects/{project_id}/complete", headers=contractor)
    assert response.status_code == 400
    assert response.json() == {"detail": "The field team has not submitted the work yet"}

    api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    response = api.client.post(f"/projects/{project_id}/complete", headers=contractor)
    assert response.status_code == 200
    assert response.json()["project_status"] == "completed"
    assignments = api.client.get(f"/assignments?project_id={project_id}", headers=provider).json()
    assert [assignment["status"] for assignment in assignments] == ["completed"]
    # A completed project cannot be changed by the field worker.
    assert api.client.post(f"/field-worker/projects/{project_id}/check-in", headers=worker).status_code == 400


def test_contractor_requests_changes(api):
    project_id, contractor, _, worker = active_project_with_worker(api)
    api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    response = api.client.post(
        f"/projects/{project_id}/request-changes", json={"note": "Add two more warning signs"}, headers=contractor
    )
    assert response.status_code == 200
    detail = api.client.get(f"/field-worker/projects/{project_id}", headers=worker).json()
    assert detail["site_status"] == "Work in Progress"
    assert detail["change_note"] == "Add two more warning signs"
    monitoring = api.client.get(f"/projects/{project_id}/monitoring", headers=contractor).json()
    assert monitoring["completion_submitted"] is False
    assert api.client.post(
        f"/projects/{project_id}/request-changes", json={"note": "Again"}, headers=contractor
    ).status_code == 400
    assert api.client.post(f"/projects/{project_id}/request-changes", json={"note": " "}, headers=contractor).status_code == 422


# ---------------------------------------------------------------------------
# Device verification
# ---------------------------------------------------------------------------

PLANNED = (24.681660817, 46.678362549)


def verify(api, headers, project_id, latitude, longitude, device_id=3001):
    body = {"project_id": project_id, "latitude": latitude, "longitude": longitude, "accuracy": 5}
    return api.client.post(f"/devices/{device_id}/verify", json=body, headers=headers)


def test_device_verified_within_50_m(api, monkeypatch):
    project_id, _, _, worker = active_project_with_worker(api)
    monkeypatch.setattr(arcgis, "planned_device_point", lambda device, project_id: PLANNED)
    # About 20 m north of the planned point.
    response = verify(api, worker, project_id, PLANNED[0] + 20 / 111320, PLANNED[1])
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "Verified"
    assert 19 <= result["distance_m"] <= 21
    assert result["max_distance_m"] == 50


def test_device_too_far_is_rejected_by_the_server(api, monkeypatch):
    project_id, _, _, worker = active_project_with_worker(api)
    monkeypatch.setattr(arcgis, "planned_device_point", lambda device, project_id: PLANNED)
    response = verify(api, worker, project_id, PLANNED[0] + 200 / 111320, PLANNED[1])
    assert response.status_code == 422
    assert response.json()["detail"].startswith("You are 200 m from the planned location")


def test_device_errors(api, monkeypatch):
    project_id, _, _, worker = active_project_with_worker(api)
    monkeypatch.setattr(arcgis, "planned_device_point", lambda device, project_id: None)
    assert verify(api, worker, project_id, *PLANNED).status_code == 404

    def offline(device, project_id):
        raise arcgis.ArcGISError("The map service could not be reached")

    monkeypatch.setattr(arcgis, "planned_device_point", offline)
    assert verify(api, worker, project_id, *PLANNED).status_code == 502
    _, other_worker = api.account("worker", 1)
    assert verify(api, other_worker, project_id, *PLANNED).status_code == 403
    assert verify(api, worker, project_id, 95, 0).status_code == 422


def test_device_found_by_code(api, monkeypatch):
    project_id, _, _, worker = active_project_with_worker(api)
    seen = []
    monkeypatch.setattr(arcgis, "planned_device_point", lambda device, project_id: seen.append(device) or PLANNED)
    assert verify(api, worker, project_id, *PLANNED, device_id="TC-014").json()["device"] == "TC-014"
    assert seen == ["TC-014"]


def test_device_filter_accepts_ids_and_codes_only():
    assert arcgis.device_filter("3001") == "device_id = 3001"
    assert arcgis.device_filter("TC-014") == "device_code = 'TC-014'"
    with pytest.raises(ValueError):
        arcgis.device_filter("x' OR '1'='1")


def test_haversine_matches_the_frontend():
    assert arcgis.distance_m(*PLANNED, *PLANNED) == 0
    assert round(arcgis.distance_m(24.0, 46.0, 24.001, 46.0)) == 111

