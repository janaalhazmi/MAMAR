import json

from sqlalchemy import delete

from app.core import ai, config, ttc_plan
from app.db.database import SessionLocal
from app.models import AIResult
from tests.test_workflow import PNG, active_project_with_worker, project_with_request, send_quotation

# Claude is never called in the tests: ai.send is replaced with a fake that answers like it.


def fake_claude(monkeypatch, answers):
    calls = []
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setattr(ai, "_used", {})

    def send(system, content, max_tokens, schema=None):
        calls.append({"system": system, "content": content, "schema": schema})
        return json.loads(json.dumps(answers(system, content) if callable(answers) else answers))

    monkeypatch.setattr(ai, "send", send)
    return calls


def upload(api, worker, project_id, caption="Cones and signs"):
    files = [("photos", ("site.png", PNG, "image/png"))]
    return api.client.post(f"/field-worker/projects/{project_id}/photos", files=files, data={"captions": [caption]}, headers=worker).json()[0]


def test_ai_is_off_without_a_key(api, monkeypatch):
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "")
    project_id, contractor, _, worker = active_project_with_worker(api)
    assert api.client.get("/ai/status", headers=contractor).json()["enabled"] is False
    photo = upload(api, worker, project_id)
    assert api.client.post(f"/photos/{photo['photo_id']}/safety-check", headers=contractor).status_code == 503
    assert api.client.get(f"/projects/{project_id}/safety-checks", headers=contractor).json() == {}
    # The traffic plan numbers still work without the AI.
    plan = api.client.post("/ai/traffic-plan", json={"speed_kmh": 80}, headers=contractor).json()
    assert plan["explanation"] is None and plan["devices"]


def test_new_photos_are_checked_and_unsafe_ones_raise_an_alert(api, monkeypatch):
    calls = fake_claude(monkeypatch, {
        "score": 3, "checks": [{"item": "Workers' reflective vests", "status": "missing", "note": "No vest"}],
        "hazards": ["Worker inside the lane"], "advice": "Put on vests and move the cones out.",
    })
    project_id, contractor, provider, worker = active_project_with_worker(api)
    photo = upload(api, worker, project_id)
    assert len(calls) == 1 and calls[0]["content"][0]["type"] == "image"  # checked right after the upload
    assert calls[0]["schema"]["required"] == ["score", "checks", "hazards", "advice"]
    checks = api.client.get(f"/projects/{project_id}/safety-checks", headers=contractor).json()
    result = checks[str(photo["photo_id"])]
    assert result["score"] == 3 and result["level"] == "Unsafe" and result["checks"][0]["status"] == "missing"
    for headers in (contractor, provider):
        assert any(n["type"] == "safety_alert" for n in api.client.get("/notifications", headers=headers).json())
    # Saved: asking again does not call Claude; refresh does.
    assert api.client.post(f"/photos/{photo['photo_id']}/safety-check", headers=worker).json()["score"] == 3
    assert len(calls) == 1
    api.client.post(f"/photos/{photo['photo_id']}/safety-check?refresh=true", headers=provider)
    assert len(calls) == 2
    _, stranger = api.account()
    assert api.client.post(f"/photos/{photo['photo_id']}/safety-check", headers=stranger).status_code == 403


def test_safe_photo_has_no_alert(api, monkeypatch):
    fake_claude(monkeypatch, {"score": 9, "checks": [], "hazards": [], "advice": "Good setup."})
    project_id, contractor, _, worker = active_project_with_worker(api)
    upload(api, worker, project_id)
    result = next(iter(api.client.get(f"/projects/{project_id}/safety-checks", headers=contractor).json().values()))
    assert result["level"] == "Safe"
    assert not any(n["type"] == "safety_alert" for n in api.client.get("/notifications", headers=contractor).json())


def test_traffic_plan_numbers_and_explanation(api, monkeypatch):
    calls = fake_claude(monkeypatch, {"summary": "Drivers see three signs.", "steps": ["Put sign A"], "risks": ["Fast cars"]})
    with SessionLocal() as db:  # saved plans are not tied to a project, so clear them from earlier runs
        db.execute(delete(AIResult).where(AIResult.key.like("plan:%")))
        db.commit()
    _, contractor = api.account()
    body = {"closure_type": "lane_closure", "speed_kmh": 80, "lanes_total": 3, "lanes_closed": 1,
            "work_length_m": 120, "night_work": True, "duration_days": 5}
    plan = api.client.post("/ai/traffic-plan", json=body, headers=contractor).json()
    taper = next(z for z in plan["zones"] if z["name"] == "Taper")
    assert taper["length_m"] == ttc_plan.taper_length(80, 3.6) == 179
    names = [d["name"] for d in plan["devices"]]
    assert "Arrow board" in names and any("lights" in n for n in names) and any("barriers" in n for n in names)
    assert plan["explanation"]["summary"] == "Drivers see three signs."
    api.client.post("/ai/traffic-plan", json=body, headers=contractor)
    assert len(calls) == 1  # the same inputs are saved
    assert "179 m" in calls[0]["content"][0]["text"]
    _, provider = api.account("provider", 1)
    assert api.client.post("/ai/traffic-plan", json=body, headers=provider).status_code == 403


def test_traffic_plan_rules():
    slow = ttc_plan.plan("lane_closure", 50, 2, 1, 50, False, 1)
    assert ttc_plan.taper_length(50, 3.6) == 59 and "Arrow board" not in [d["name"] for d in slow["devices"]]
    full = ttc_plan.plan("full_closure", 60, 2, 2, 80, False, 2)
    assert any(d["name"] == "Detour signs" for d in full["devices"])
    flag = ttc_plan.plan("one_lane_two_way", 40, 2, 1, 60, False, 1)
    assert any("Flaggers" in d["name"] for d in flag["devices"])


def test_quote_comparison(api, monkeypatch):
    project_id, contractor = project_with_request(api, services=["ttc-plan"])
    _, first = api.account("provider", 1)
    _, second = api.account("provider", 2)
    q1 = send_quotation(api, first, project_id, price=9000).json()
    q2 = send_quotation(api, second, project_id, price=7000).json()
    calls = fake_claude(monkeypatch, {
        "recommended_quote_id": q2["quote_id"], "headline": "Choose the cheaper one.",
        "quotes": [{"quote_id": q1["quote_id"], "pros": ["Fast"], "cons": ["Expensive"]},
                   {"quote_id": q2["quote_id"], "pros": ["Cheap"], "cons": []}, {"quote_id": 999999, "pros": ["?"]}],
        "tip": "Ask about night work.",
    })
    result = api.client.get(f"/projects/{project_id}/quotes/ai-compare", headers=contractor).json()
    assert result["recommended_quote_id"] == q2["quote_id"] and result["recommended_company"]
    assert [q["quote_id"] for q in result["quotes"]] == [q1["quote_id"], q2["quote_id"]]  # unknown ids are dropped
    assert "9000" in calls[0]["content"][0]["text"]
    api.client.get(f"/projects/{project_id}/quotes/ai-compare", headers=contractor)
    assert len(calls) == 1
    # A new or changed quote makes a new comparison.
    _, third = api.account("provider", 3)
    send_quotation(api, third, project_id, price=8000)
    api.client.get(f"/projects/{project_id}/quotes/ai-compare", headers=contractor)
    assert len(calls) == 2
    _, other = api.account()
    assert api.client.get(f"/projects/{project_id}/quotes/ai-compare", headers=other).status_code in (403, 404)
    empty_id, empty_owner = project_with_request(api)
    assert api.client.get(f"/projects/{empty_id}/quotes/ai-compare", headers=empty_owner).status_code == 404


def test_daily_summary(api, monkeypatch):
    calls = fake_claude(monkeypatch, {"headline": "Good day.", "summary": "One worker on site.", "highlights": ["1 check-in"], "risks": []})
    project_id, contractor, provider, worker = active_project_with_worker(api)
    for headers in (contractor, provider):
        assert api.client.get(f"/projects/{project_id}/ai-summary", headers=headers).json()["headline"] == "Good day."
    assert len(calls) == 1  # saved for the day
    assert "Attendance today" in calls[0]["content"][0]["text"]
    api.client.get(f"/projects/{project_id}/ai-summary?refresh=true", headers=contractor)
    assert len(calls) == 2
    assert api.client.get(f"/projects/{project_id}/ai-summary", headers=worker).status_code == 403


def test_errors_and_hourly_limit(api, monkeypatch):
    project_id, contractor, _, _ = active_project_with_worker(api)
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-key")

    def broken(system, content, max_tokens, schema=None):
        raise ai.AIError("The AI account has no credit left")

    monkeypatch.setattr(ai, "send", broken)
    response = api.client.get(f"/projects/{project_id}/ai-summary", headers=contractor)
    assert response.status_code == 502 and "credit" in response.json()["detail"]
    monkeypatch.setattr(ai, "_used", {})
    monkeypatch.setattr(ai, "HOURLY_LIMIT", 1)
    fake_ok = lambda system, content, max_tokens, schema=None: {"headline": "x"}  # noqa: E731
    monkeypatch.setattr(ai, "send", fake_ok)
    assert api.client.get(f"/projects/{project_id}/ai-summary?refresh=true", headers=contractor).status_code == 200
    assert api.client.get(f"/projects/{project_id}/ai-summary?refresh=true", headers=contractor).status_code == 429


def test_parse_json_and_services_row(api, monkeypatch):
    assert ai.parse_json('Sure! {"a": 1} hope it helps') == {"a": 1}
    try:
        ai.parse_json("no json here")
        raise AssertionError
    except ai.AIError:
        pass
    from tests.test_admin import admin_login
    _, admin = admin_login(api, monkeypatch)
    rows = {row["name"]: row for row in api.client.get("/admin/services", headers=admin).json()}
    assert "AI assistant" in rows
    assert AIResult.__tablename__ == "ai_results"


def test_send_reads_the_tool_answer_and_text(monkeypatch):
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-key")
    sent = []

    def answer_with(content, stop="end_turn"):
        def post(body):
            sent.append(body)
            return {"content": content, "stop_reason": stop}
        return post

    # The normal way: Claude answers through the give_answer tool with ready JSON.
    monkeypatch.setattr(ai, "post", answer_with([{"type": "tool_use", "name": "give_answer", "input": {"score": 7}}]))
    assert ai.ask_json("sys", [{"type": "text", "text": "hi"}], schema={"type": "object"}) == {"score": 7}
    assert sent[0]["tool_choice"] == {"type": "tool", "name": "give_answer"}
    assert sent[0]["tools"][0]["input_schema"] == {"type": "object"}
    # Old style text still works.
    monkeypatch.setattr(ai, "post", answer_with([{"type": "text", "text": 'Sure ```json {"a": 1} ```'}]))
    assert ai.ask_json("sys", []) == {"a": 1}
    # A cut answer gives a clear message.
    monkeypatch.setattr(ai, "post", answer_with([{"type": "text", "text": '{"a": '}], stop="max_tokens"))
    try:
        ai.ask_json("sys", [])
        raise AssertionError
    except ai.AIError as error:
        assert "too long" in str(error)
