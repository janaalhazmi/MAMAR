from app.core import arcgis
from tests.test_workflow import PLANNED, active_project_with_worker, verify


def test_provider_adds_devices_and_sees_the_saved_verification(api, monkeypatch):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    url = f"/provider/projects/{project_id}/devices"
    monkeypatch.setattr(arcgis, "planned_device_point", lambda device, project_id: PLANNED)

    # The provider adds the devices from the QR labels; codes are saved in capitals.
    added = api.client.post(url, json={"code": "tc-014", "name": "Arrow board"}, headers=provider)
    assert added.status_code == 201
    assert added.json()["devices"][0] == {**added.json()["devices"][0], "code": "TC-014", "status": "Pending"}
    assert api.client.post(url, json={"code": "TC-014"}, headers=provider).status_code == 409
    assert api.client.post(url, json={"code": "bad code!"}, headers=provider).status_code == 422
    assert api.client.post(url, json={"code": "TC-015"}, headers=contractor).status_code == 403

    # The worker verifies it on site; the result is saved, not only returned.
    assert verify(api, worker, project_id, PLANNED[0], PLANNED[1], device_id="TC-014").status_code == 200
    for headers in (provider, contractor):
        body = api.client.get(url, headers=headers).json()
        device = body["devices"][0]
        assert body["verified"] == 1 and body["pending"] == 0
        assert device["status"] == "Verified" and device["verified_by"] and device["distance_m"] == 0
    worker_view = api.client.get(f"/field-worker/projects/{project_id}/devices", headers=worker).json()
    assert worker_view["verified"] == 1
    notes = api.client.get("/notifications", headers=provider).json()
    assert any(n["type"] == "device_verified" for n in notes)

    # A device the provider did not add yet is saved when the worker verifies it.
    assert verify(api, worker, project_id, PLANNED[0], PLANNED[1], device_id="TC-099").status_code == 200
    assert api.client.get(url, headers=provider).json()["total"] == 2

    # A failed verification saves nothing.
    api.client.post(url, json={"code": "TC-020"}, headers=provider)
    assert verify(api, worker, project_id, PLANNED[0] + 200 / 111320, PLANNED[1], device_id="TC-020").status_code == 422
    codes = {d["code"]: d["status"] for d in api.client.get(url, headers=provider).json()["devices"]}
    assert codes == {"TC-014": "Verified", "TC-020": "Pending", "TC-099": "Verified"}

    assert api.client.delete(f"{url}/TC-020", headers=provider).json()["total"] == 2
    assert api.client.delete(f"{url}/TC-020", headers=provider).status_code == 404


def test_other_users_cannot_see_the_devices(api):
    project_id, _, _, worker = active_project_with_worker(api)
    _, other_provider = api.account("provider", 2)
    url = f"/provider/projects/{project_id}/devices"
    assert api.client.get(url, headers=other_provider).status_code == 403
    assert api.client.get(url, headers=worker).status_code == 403
    assert api.client.get(url).status_code == 401
