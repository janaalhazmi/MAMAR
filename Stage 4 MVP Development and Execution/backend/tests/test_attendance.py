from app.core import config, traffic
from app.routers import attendance
from app.services import sms
from tests.test_workflow import active_project_with_worker

# A small work zone on Olaya Street ([lng, lat] corners) and its pin.
PIN = {"latitude": 24.7000, "longitude": 46.6800, "location": "Olaya"}
ZONE = [[46.6790, 24.6990], [46.6810, 24.6990], [46.6810, 24.7010], [46.6790, 24.7010]]


def project_on_site(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    api.client.patch(f"/projects/{project_id}", json={**PIN, "work_zone": ZONE}, headers=contractor)
    return project_id, contractor, provider, worker


def test_site_code_only_for_the_contractor_and_the_provider(api):
    project_id, contractor, provider, worker = project_on_site(api)
    url = f"/projects/{project_id}/site-code"
    code = api.client.get(url, headers=contractor).json()["code"]
    assert code == api.client.get(url, headers=provider).json()["code"] == attendance.site_code(project_id)
    assert api.client.get(url, headers=worker).status_code == 403
    _, other_provider = api.account("provider", 2)
    assert api.client.get(url, headers=other_provider).status_code == 403


def test_check_in_needs_the_code_and_the_place(api):
    project_id, contractor, provider, worker = project_on_site(api)
    code = attendance.site_code(project_id)
    url = f"/field-worker/projects/{project_id}/attendance/check-in"

    wrong = api.client.post(url, json={"code": "WRONGCODE1", "latitude": 24.7, "longitude": 46.68}, headers=worker)
    assert wrong.status_code == 403
    far = api.client.post(url, json={"code": code, "latitude": 24.75, "longitude": 46.68}, headers=worker)
    assert far.status_code == 422 and "m from the work zone" in far.json()["detail"]

    inside = api.client.post(url, json={"code": code.lower(), "latitude": 24.7005, "longitude": 46.6805}, headers=worker)
    assert inside.status_code == 201
    body = inside.json()
    assert body["on_site"] and body["current"]["distance_m"] == 0
    again = api.client.post(url, json={"code": code, "latitude": 24.7005, "longitude": 46.6805}, headers=worker)
    assert again.status_code == 400

    # The contractor and the provider see who is at the site, and the work has started.
    for headers in (contractor, provider):
        team = api.client.get(f"/projects/{project_id}/attendance", headers=headers).json()
        assert team["on_site_now"] == 1 and team["workers"][0]["on_site"]
    field = api.client.get(f"/field-worker/projects/{project_id}", headers=worker).json()
    assert field["site_status"] == "Work in Progress" and field["last_check_in"]
    notes = api.client.get("/notifications", headers=contractor).json()
    assert any(n["type"] == "worker_checked_in" for n in notes)

    out = api.client.post(f"/field-worker/projects/{project_id}/attendance/check-out", json={}, headers=worker)
    assert out.status_code == 200 and not out.json()["on_site"]
    assert api.client.post(f"/field-worker/projects/{project_id}/attendance/check-out", json={}, headers=worker).status_code == 400
    team = api.client.get(f"/projects/{project_id}/attendance", headers=contractor).json()
    assert team["on_site_now"] == 0 and len(team["visits"]) == 1


def test_check_in_near_the_pin_without_a_zone(api):
    project_id, contractor, _, worker = active_project_with_worker(api)
    url = f"/field-worker/projects/{project_id}/attendance/check-in"
    body = {"code": attendance.site_code(project_id), "latitude": 24.7010, "longitude": 46.6800}
    assert api.client.post(url, json=body, headers=worker).status_code == 400  # no location saved
    api.client.patch(f"/projects/{project_id}", json=PIN, headers=contractor)
    response = api.client.post(url, json=body, headers=worker)  # about 111 m from the pin
    assert response.status_code == 201 and 100 < response.json()["current"]["distance_m"] < 120


def test_other_workers_cannot_check_in(api):
    project_id, _, _, _ = project_on_site(api)
    _, stranger = api.account("worker", 1)
    body = {"code": attendance.site_code(project_id), "latitude": 24.7005, "longitude": 46.6805}
    assert api.client.post(f"/field-worker/projects/{project_id}/attendance/check-in", json=body, headers=stranger).status_code == 403


def test_traffic_at_the_work_zone(api, monkeypatch):
    project_id, contractor, provider, worker = project_on_site(api)
    url = f"/projects/{project_id}/traffic"
    monkeypatch.setattr(config, "TOMTOM_API_KEY", "")
    assert api.client.get(url, headers=contractor).status_code == 503

    monkeypatch.setattr(config, "TOMTOM_API_KEY", "key")
    segment = {"currentSpeed": 30, "freeFlowSpeed": 80, "currentTravelTime": 200, "freeFlowTravelTime": 75,
               "confidence": 0.9, "roadClosure": False}
    monkeypatch.setattr(traffic, "fetch", lambda lat, lon: {"flowSegmentData": segment})
    for headers in (contractor, provider, worker):
        body = api.client.get(url, headers=headers).json()
        assert body["level"] == "Heavy" and body["congestion"] == 62 and body["delay_seconds"] == 125
    assert traffic.level_for(70, 80, False) == ("Light", 12)
    assert traffic.level_for(50, 80, False)[0] == "Moderate"
    assert traffic.level_for(None, None, True) == ("Closed", 100)


def test_test_message_and_channels(api, monkeypatch):
    _, user = api.account()
    monkeypatch.setattr(config, "TWILIO_ACCOUNT_SID", "")
    assert api.client.get("/notifications/channels", headers=user).json()["messages_enabled"] is False
    response = api.client.post("/notifications/test-message", headers=user)
    assert response.status_code == 400 and "not set up" in response.json()["detail"]

    monkeypatch.setattr(config, "TWILIO_ACCOUNT_SID", "AC1")
    monkeypatch.setattr(config, "TWILIO_AUTH_TOKEN", "t")
    monkeypatch.setattr(config, "TWILIO_FROM", "whatsapp:+14155238886")
    api.client.patch("/auth/me", json={"phone": "0501234567"}, headers=user)
    channels = api.client.get("/notifications/channels", headers=user).json()
    assert channels["channel"] == "whatsapp" and channels["phone_hint"] == "…4567"

    sent = []

    class Done:
        def close(self):
            pass

    monkeypatch.setattr(sms.urllib.request, "urlopen", lambda request, timeout: sent.append(request) or Done())
    monkeypatch.setattr("app.routers.notifications._last_test", {})
    response = api.client.post("/notifications/test-message", headers=user)
    assert response.status_code == 200 and len(sent) == 1
    assert api.client.post("/notifications/test-message", headers=user).status_code == 429


def test_admin_services(api, monkeypatch):
    from tests.test_admin import admin_login
    _, admin = admin_login(api, monkeypatch)
    rows = {row["name"]: row for row in api.client.get("/admin/services", headers=admin).json()}
    assert rows["Database"]["on"] and "Live traffic" in rows and "WhatsApp / SMS" in rows
    assert all("key" not in str(row["on"]).lower() for row in rows.values())
    _, contractor = api.account()
    assert api.client.get("/admin/services", headers=contractor).status_code == 403
