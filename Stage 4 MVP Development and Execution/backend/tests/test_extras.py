import uuid
from datetime import date, timedelta

from app.core import config, turnstile, weather
from app.db.init_db import add_demo_accounts, add_demo_providers
from app.routers import extras
from app.services import sms
from tests.test_workflow import active_project_with_worker

DAILY = {
    "time": [(date.today() + timedelta(days=i)).isoformat() for i in range(16)],
    "weather_code": [0] * 14 + [63, 95],
    "temperature_2m_max": [38.0] * 15 + [46.5],
    "temperature_2m_min": [24.0] * 16,
    "precipitation_sum": [0.0] * 14 + [5.2, 0.0],
    "wind_gusts_10m_max": [20.0] * 15 + [62.0],
}


def test_weather_for_the_work_zone(api, monkeypatch):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    url = f"/projects/{project_id}/weather"
    assert api.client.get(url, headers=contractor).status_code == 400  # no location yet
    location = {"latitude": 24.71, "longitude": 46.67, "location": "Olaya"}
    api.client.patch(f"/projects/{project_id}", json=location, headers=contractor)

    monkeypatch.setattr(weather, "fetch", lambda lat, lon: {"daily": DAILY})
    for headers in (contractor, provider, worker):
        body = api.client.get(url, headers=headers).json()
        assert body["source"] == "Open-Meteo" and body["days"]
    days = {d["date"]: d for d in weather.forecast(24.71, 46.67)}
    last = days[DAILY["time"][15]]
    assert last["summary"] == "Thunderstorm" and len(last["alerts"]) == 2
    assert days[DAILY["time"][14]]["summary"] == "Rain" and days[DAILY["time"][14]]["alerts"]
    assert days[DAILY["time"][0]]["alerts"] == []

    _, stranger = api.account()
    assert api.client.get(url, headers=stranger).status_code == 403

    def offline(lat, lon):
        raise weather.WeatherError("The weather service could not be reached")

    monkeypatch.setattr(weather, "fetch", offline)
    assert api.client.get(url, headers=contractor).status_code == 502


def test_receipt_pdf(api, monkeypatch):
    from app.db.database import SessionLocal
    from app.models import Payment
    from app.core.access import accepted_quote

    project_id, contractor, provider, _ = active_project_with_worker(api)
    contractor_id = api.client.get("/auth/me", headers=contractor).json()["user_id"]
    with SessionLocal() as db:
        quote = accepted_quote(db, project_id)
        payment = Payment(project_id=project_id, quote_id=quote.quote_id, contractor_id=contractor_id,
                          amount=quote.price, charged_amount=1, paypal_order_id=uuid.uuid4().hex, status="created")
        db.add(payment)
        db.commit()
        payment_id = payment.payment_id
    url = f"/payments/{payment_id}/receipt"
    assert api.client.get(url, headers=contractor).status_code == 400  # not paid yet
    with SessionLocal() as db:
        row = db.get(Payment, payment_id)
        row.status, row.paypal_capture_id = "completed", "CAPTURE1"
        from datetime import datetime
        row.paid_at = datetime(2026, 11, 13, 10, 0)
        db.commit()
    for headers in (contractor, provider):
        response = api.client.get(url, headers=headers)
        assert response.status_code == 200 and response.headers["content-type"] == "application/pdf"
        assert response.content.startswith(b"%PDF")
    _, stranger = api.account()
    assert api.client.get(url, headers=stranger).status_code == 403
    assert api.client.get("/payments/999999/receipt", headers=contractor).status_code == 404
    with SessionLocal() as db:
        db.delete(db.get(Payment, payment_id))
        db.commit()


def test_turnstile_on_login_and_register(api, monkeypatch):
    api.account()
    email = api.emails[-1]
    monkeypatch.setattr(config, "TURNSTILE_SECRET_KEY", "secret")
    monkeypatch.setattr(turnstile, "token_is_valid", lambda token: token == "good")
    body = {"email": email, "password": "StrongPass123"}
    assert api.client.post("/auth/login", json=body).json()["detail"] == "Please confirm you are not a robot"
    assert api.client.post("/auth/login", json={**body, "turnstile_token": "bad"}).status_code == 400
    assert api.client.post("/auth/login", json={**body, "turnstile_token": "good"}).status_code == 200
    new = {"full_name": "T", "email": f"t-{uuid.uuid4().hex[:8]}@example.com", "password": "StrongPass123", "role": "contractor"}
    assert api.client.post("/auth/register", json=new).status_code == 400


def test_sms_numbers_and_sending(api, monkeypatch):
    assert sms.saudi_number("0501234567") == "+966501234567"
    assert sms.saudi_number("501234567") == "+966501234567"
    assert sms.saudi_number("+966 50 123 4567") == "+966501234567"
    assert sms.saudi_number("00966501234567") == "+966501234567"
    assert sms.saudi_number("12345") is None
    assert sms.send_sms("0501234567", "hi") is False  # Twilio not set up

    sent = []
    monkeypatch.setattr(config, "TWILIO_ACCOUNT_SID", "AC1")
    monkeypatch.setattr(config, "TWILIO_AUTH_TOKEN", "t")
    monkeypatch.setattr(config, "TWILIO_FROM", "+15550001111")
    monkeypatch.setattr(sms, "post", lambda to, text: sent.append((to, text)))
    monkeypatch.setattr(sms.threading, "Thread", lambda target, args, daemon: type("T", (), {"start": lambda self: target(*args)})())
    project_id, contractor, provider, worker = active_project_with_worker(api)
    worker_row = api.client.get("/auth/me", headers=worker).json()
    api.client.patch("/auth/me", json={"phone": "0501234567"}, headers=worker)
    # Assigning again is refused, so use a fresh assignment on a new project for the message.
    from tests.test_workflow import project_with_request, send_quotation
    new_project, contractor2 = project_with_request(api)
    quote = send_quotation(api, provider, new_project).json()
    api.client.post(f"/projects/{new_project}/confirm-provider", json={"quote_id": quote["quote_id"]}, headers=contractor2)
    api.client.post(f"/projects/{new_project}/assignments", json={"worker_id": worker_row["user_id"]}, headers=provider)
    assert any(to == "+966501234567" and text.startswith("MAMAR:") for to, text in sent)


def test_demo_accounts_and_company_domains(api, monkeypatch):
    add_demo_providers()
    monkeypatch.setattr(config, "DEMO_PASSWORD", "Demo_1234")
    emails = [f"{who}@{domain}" for domain in ("tcm.com", "safetyarabia.com", "shawahid.com", "safetytriangle.com")
              for who in ("provider", "fieldworker")]
    from app.db.database import SessionLocal
    from app.models import User
    from sqlalchemy import delete
    with SessionLocal() as db:
        existed = {u.email for u in db.query(User).filter(User.email.in_(emails))}
    add_demo_accounts()
    try:
        login = api.client.post("/auth/login", json={"email": "provider@safetyarabia.com", "password": "Demo_1234"}).json()
        assert login["user"]["role"] == "provider" and login["user"]["provider_id"] == 2
        login = api.client.post("/auth/login", json={"email": "fieldworker@tcm.com", "password": "Demo_1234"}).json()
        assert login["user"]["role"] == "worker" and login["user"]["provider_id"] == 1
        # Sign up accepts the website domain and the demo domain.
        body = {"full_name": "X", "password": "StrongPass123", "role": "worker", "provider_id": 3,
                "email": f"x{uuid.uuid4().hex[:6]}@gmail.com"}
        response = api.client.post("/auth/register", json=body)
        assert response.status_code == 422 and "@shawahid.com" in response.json()["detail"]
    finally:
        with SessionLocal() as db:
            db.execute(delete(User).where(User.email.in_(set(emails) - existed)))
            db.commit()


def finished_project(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    api.client.post(f"/provider/projects/{project_id}/submit-completion", headers=provider)
    return project_id, contractor, provider, worker


def test_rating_the_provider(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    url = f"/projects/{project_id}/review"
    assert api.client.post(url, json={"rating": 5}, headers=contractor).status_code == 400  # not finished
    api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    api.client.post(f"/provider/projects/{project_id}/submit-completion", headers=provider)
    assert api.client.post(f"/projects/{project_id}/complete", headers=contractor).status_code == 200
    assert api.client.post(url, json={"rating": 6}, headers=contractor).status_code == 422
    response = api.client.post(url, json={"rating": 4, "comment": "Fast and clean work"}, headers=contractor)
    assert response.status_code == 201 and response.json()["provider_id"] == 1
    assert api.client.post(url, json={"rating": 5}, headers=contractor).status_code == 409
    assert api.client.get(url, headers=contractor).json()["rating"] == 4
    ratings = {r["provider_id"]: r for r in api.client.get("/providers/ratings", headers=provider).json()}
    assert ratings[1]["count"] >= 1 and 1 <= ratings[1]["average"] <= 5
    assert api.client.get("/providers/1/reviews", headers=contractor).json()[0]["comment"]
    assert api.client.post(url, json={"rating": 3}, headers=provider).status_code == 403


def test_photo_stages(api):
    project_id, _, _, worker = active_project_with_worker(api)
    files = [("photos", ("a.png", b"\x89PNG a", "image/png")), ("photos", ("b.png", b"\x89PNG b", "image/png"))]
    data = {"captions": ["Before", "After"], "stages": ["before", "after"]}
    saved = api.client.post(f"/field-worker/projects/{project_id}/photos", files=files, data=data, headers=worker).json()
    assert [p["stage"] for p in saved] == ["before", "after"]
    one = [("photos", ("c.png", b"\x89PNG c", "image/png"))]
    assert api.client.post(f"/field-worker/projects/{project_id}/photos", files=one, headers=worker).json()[0]["stage"] == "during"
    bad = api.client.post(f"/field-worker/projects/{project_id}/photos", files=one, data={"stages": ["later"]}, headers=worker)
    assert bad.status_code == 422


def test_admin_activity_and_map(api, monkeypatch):
    from tests.test_admin import admin_login
    _, admin = admin_login(api, monkeypatch)
    project_id, contractor, provider, _ = active_project_with_worker(api)
    api.client.patch(f"/projects/{project_id}", json={"latitude": 24.7, "longitude": 46.6}, headers=contractor)
    actions = [a["action"] for a in api.client.get("/admin/activity?limit=300", headers=admin).json()]
    for action in ("project_created", "request_sent", "quote_sent", "provider_confirmed", "worker_assigned", "login"):
        assert action in actions
    rows = {p["project_id"]: p for p in api.client.get("/admin/projects", headers=admin).json()}
    assert rows[project_id]["provider"] and rows[project_id]["latitude"] == 24.7
    assert api.client.get("/admin/activity", headers=contractor).status_code == 403


def test_whatsapp_sender(monkeypatch):
    calls = []
    monkeypatch.setattr(config, "TWILIO_ACCOUNT_SID", "AC1")
    monkeypatch.setattr(config, "TWILIO_AUTH_TOKEN", "t")
    monkeypatch.setattr(config, "TWILIO_FROM", "whatsapp:+14155238886")

    class Done:
        def close(self):
            pass

    def fake_urlopen(request, timeout):
        calls.append(request.data.decode())
        return Done()

    monkeypatch.setattr(sms.urllib.request, "urlopen", fake_urlopen)
    sms.post("+966501234567", "hello")
    assert "To=whatsapp%3A%2B966501234567" in calls[0] and "From=whatsapp%3A%2B14155238886" in calls[0]
