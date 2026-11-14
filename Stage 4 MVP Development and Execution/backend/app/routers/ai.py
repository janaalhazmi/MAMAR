import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import ai, traffic, ttc_plan, weather
from app.core.access import accepted_quote, can_view_project, get_project, own_project
from app.core.security import allow_roles, get_current_user
from app.db.database import SessionLocal, get_db
from app.models import (
    Activity, AIResult, Attendance, Project, Provider, Quote, Review, ServiceRequest, SitePhoto, User,
)
from app.schemas.error import ErrorResponse
from app.services.activity import log_activity
from app.services.notifications import notify_user

# The four AI features (Claude Haiku through app.core.ai):
#   1. Safety check of site photos (cones, signs, vests, barriers, hazards) with a score out of 10.
#   2. Traffic plan assistant: fixed formulas give the numbers, the AI explains them.
#   3. Quote comparison: which provider to choose and why.
#   4. Daily summary of a project: attendance, safety, weather, traffic and activity of today.
# Every answer is saved in ai_results, so the same thing is never paid for twice.
router = APIRouter(tags=["ai"])

contractor_only = allow_roles("contractor", detail="Only contractors can do this")

AI_ERRORS = {
    401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
    403: {"model": ErrorResponse, "description": "The user cannot see this project"},
    404: {"model": ErrorResponse, "description": "Not found"},
    429: {"model": ErrorResponse, "description": "Too many AI requests in the last hour"},
    502: {"model": ErrorResponse, "description": "The AI service could not answer"},
    503: {"model": ErrorResponse, "description": "The AI is not set up (ANTHROPIC_API_KEY)"},
}


# The shape of each answer: Claude fills these through the give_answer tool.
PHOTO_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {"type": "integer", "description": "0-10, 10 = fully safe"},
        "checks": {"type": "array", "items": {"type": "object", "properties": {
            "item": {"type": "string"},
            "status": {"type": "string", "enum": ["ok", "missing", "unclear"]},
            "note": {"type": "string"},
        }, "required": ["item", "status", "note"]}},
        "hazards": ai.text_list("Short hazards, empty if none"),
        "advice": {"type": "string", "description": "One short sentence for the field team"},
    },
    "required": ["score", "checks", "hazards", "advice"],
}
PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "steps": ai.text_list("4-6 short set-up steps in order"),
        "risks": ai.text_list("2-3 short things to watch"),
    },
    "required": ["summary", "steps", "risks"],
}
COMPARE_SCHEMA = {
    "type": "object",
    "properties": {
        "recommended_quote_id": {"type": "integer"},
        "headline": {"type": "string"},
        "quotes": {"type": "array", "items": {"type": "object", "properties": {
            "quote_id": {"type": "integer"},
            "pros": ai.text_list("Max 3 short"),
            "cons": ai.text_list("Max 3 short"),
        }, "required": ["quote_id", "pros", "cons"]}},
        "tip": {"type": "string"},
    },
    "required": ["recommended_quote_id", "headline", "quotes", "tip"],
}
SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "headline": {"type": "string"},
        "summary": {"type": "string"},
        "highlights": ai.text_list("2-4 short facts"),
        "risks": ai.text_list("0-3 short items that need attention"),
    },
    "required": ["headline", "summary", "highlights", "risks"],
}

UNSAFE_SCORE = 5
RIYADH = timezone(timedelta(hours=3))


def ai_call(function, *args, **kwargs):
    # Turns the AI errors into HTTP errors the page can show.
    try:
        return function(*args, **kwargs)
    except ai.AIOff as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ai.AILimit as error:
        raise HTTPException(status_code=429, detail=str(error)) from error
    except ai.AIError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


def saved(db: Session, key: str) -> AIResult | None:
    return db.scalar(select(AIResult).where(AIResult.key == key))


def save(db: Session, key: str, project_id: int | None, result: dict) -> dict:
    row = saved(db, key)
    if row is None:
        db.add(AIResult(key=key, project_id=project_id, result=result))
    else:
        row.result = result
        row.created_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    return result


def viewable_project(db: Session, project_id: int, user: User) -> Project:
    project = get_project(db, project_id)
    if not can_view_project(db, project, user):
        raise HTTPException(status_code=403, detail="You cannot view this project")
    return project


@router.get("/ai/status")
def ai_status(user: User = Depends(get_current_user)):
    # The pages show the AI buttons only when this is on.
    return {"enabled": ai.enabled(), "model": "Claude Haiku" if "haiku" in ai.config.AI_MODEL else ai.config.AI_MODEL}


# ---------- 1. Safety check of site photos ----------

PHOTO_SYSTEM = (
    "You are a traffic control safety inspector for road work zones in Saudi Arabia. "
    "Look at the site photo and check the temporary traffic control. Be strict but fair, and only "
    "judge what you can see. Answer with: "
    '"score" (integer 0-10, 10 = fully safe), '
    '"checks" (list of {"item": short name, "status": "ok" | "missing" | "unclear", "note": few words}) for: '
    "Traffic cones / channelizers, Warning signs, Barriers, Workers' reflective vests, Helmets, Lights (if dark), "
    "Clear buffer space; "
    '"hazards" (list of short strings, empty if none); '
    '"advice" (one short sentence for the field team). '
    'If the photo is not a road work site, give score 0 and advice "This does not look like a work zone photo".'
)


def level_for(score: int) -> str:
    return "Safe" if score >= 8 else "Check" if score >= UNSAFE_SCORE else "Unsafe"


def check_photo(db: Session, photo: SitePhoto) -> dict:
    answer = ai.ask_json(PHOTO_SYSTEM, [
        ai.image_block(photo.data, photo.content_type),
        {"type": "text", "text": f'Photo caption from the worker: "{photo.caption}". Stage: {photo.stage} the work.'},
    ], max_tokens=1200, schema=PHOTO_SCHEMA)
    try:
        score = max(0, min(10, int(answer.get("score", 0))))
    except (TypeError, ValueError):
        score = 0
    checks = [
        {"item": str(c.get("item", ""))[:60], "status": c.get("status") if c.get("status") in ("ok", "missing", "unclear") else "unclear",
         "note": str(c.get("note", ""))[:120]}
        for c in answer.get("checks", []) if isinstance(c, dict)
    ][:10]
    result = {
        "photo_id": photo.photo_id,
        "score": score,
        "level": level_for(score),
        "checks": checks,
        "hazards": [str(h)[:120] for h in answer.get("hazards", []) if h][:6],
        "advice": str(answer.get("advice", ""))[:300],
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
    save(db, f"photo:{photo.photo_id}", photo.project_id, result)
    if score < UNSAFE_SCORE:
        warn_unsafe(db, photo, result)
    return result


def warn_unsafe(db: Session, photo: SitePhoto, result: dict) -> None:
    project = db.get(Project, photo.project_id)
    if project is None:
        return
    text = f'A site photo of "{project.project_name}" scored {result["score"]}/10 in the AI safety check. {result["advice"]}'
    notify_user(db, project.contractor_id, "safety_alert", "Safety Alert at the Work Zone", text, "/contractor-dashboard#projects")
    quote = accepted_quote(db, project.project_id)
    if quote is not None:
        for provider_user in db.scalars(select(User).where(User.provider_id == quote.provider_id, User.role == "provider")):
            notify_user(db, provider_user.user_id, "safety_alert", "Safety Alert at the Work Zone", text, "/provider/projects")
    db.commit()


def check_new_photos(photo_ids: list[int]) -> None:
    # Runs after the worker's upload has answered, in its own database session.
    if not ai.enabled():
        return
    with SessionLocal() as db:
        for photo_id in photo_ids:
            photo = db.get(SitePhoto, photo_id)
            if photo is None or saved(db, f"photo:{photo_id}") is not None:
                continue
            try:
                check_photo(db, photo)
            except ai.AIError:
                db.rollback()  # the photo can still be checked later with the button


@router.get("/projects/{project_id}/safety-checks", responses=AI_ERRORS)
def project_safety_checks(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # The saved checks of the project's photos: {photo_id: result}.
    viewable_project(db, project_id, user)
    rows = db.scalars(select(AIResult).where(AIResult.project_id == project_id, AIResult.key.like("photo:%")))
    return {str(row.result["photo_id"]): row.result for row in rows}


@router.post("/photos/{photo_id}/safety-check", responses=AI_ERRORS)
def safety_check(photo_id: int, refresh: bool = Query(default=False), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    photo = db.get(SitePhoto, photo_id)
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    viewable_project(db, photo.project_id, user)
    old = saved(db, f"photo:{photo_id}")
    if old is not None and not refresh:
        return old.result
    ai_call(ai.take_turn, user.user_id)
    return ai_call(check_photo, db, photo)


# ---------- 2. Traffic plan assistant ----------

class PlanRequest(BaseModel):
    closure_type: str = Field(default="lane_closure", max_length=40)
    speed_kmh: int = Field(default=60, ge=20, le=140)
    lanes_total: int = Field(default=3, ge=1, le=8)
    lanes_closed: int = Field(default=1, ge=0, le=8)
    work_length_m: int = Field(default=100, ge=10, le=5000)
    night_work: bool = False
    duration_days: int = Field(default=3, ge=1, le=365)
    location: str | None = Field(default=None, max_length=200)
    explain: bool = True


PLAN_SYSTEM = (
    "You help contractors in Riyadh understand a temporary traffic control plan. You get a plan that "
    "was calculated with fixed formulas. Do not change any number. Answer with: "
    '"summary" (2-3 plain sentences: what the setup looks like from the driver\'s view), '
    '"steps" (4-6 short set-up steps in order, from the first sign to the work area), '
    '"risks" (2-3 short things to watch on this kind of road). Simple English.'
)


@router.post("/ai/traffic-plan", responses=AI_ERRORS)
def traffic_plan(data: PlanRequest, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    result = ttc_plan.plan(
        data.closure_type, data.speed_kmh, data.lanes_total, data.lanes_closed,
        data.work_length_m, data.night_work, data.duration_days,
    )
    result["explanation"] = None
    if data.explain and ai.enabled():
        key = "plan:" + hashlib.sha256(repr(sorted(result["inputs"].items())).encode()).hexdigest()[:32]
        old = saved(db, key)
        if old is not None:
            result["explanation"] = old.result
        else:
            ai_call(ai.take_turn, user.user_id)
            numbers = "\n".join(f"- {z['name']}: {z['length_m']} m ({z['detail']})" for z in result["zones"])
            devices = "\n".join(f"- {d['qty']} x {d['name']}" for d in result["devices"])
            answer = ai_call(ai.ask_json, PLAN_SYSTEM, [{"type": "text", "text": (
                f"{result['closure']} at {data.speed_kmh} km/h, {data.lanes_closed} of {data.lanes_total} lanes closed, "
                f"{'night' if data.night_work else 'day'} work for {data.duration_days} days"
                f"{', at ' + data.location if data.location else ''}.\nZones:\n{numbers}\nDevices:\n{devices}"
            )}], max_tokens=1200, schema=PLAN_SCHEMA)
            explanation = {
                "summary": str(answer.get("summary", ""))[:600],
                "steps": [str(s)[:200] for s in answer.get("steps", [])][:6],
                "risks": [str(r)[:200] for r in answer.get("risks", [])][:3],
            }
            result["explanation"] = save(db, key, None, explanation)
    return result


# ---------- 3. Quote comparison ----------

COMPARE_SYSTEM = (
    "You help a contractor in Riyadh choose a traffic control provider. Compare the quotes fairly using "
    "price (SAR), duration, start date, the provider's rating and the notes. Answer with: "
    '"recommended_quote_id" (number), "headline" (one sentence: who and why), '
    '"quotes" (list of {"quote_id": number, "pros": [max 3 short], "cons": [max 3 short]}), '
    '"tip" (one short sentence, e.g. what to ask before confirming). Simple English. '
    "The contractor makes the final choice."
)


@router.get("/projects/{project_id}/quotes/ai-compare", responses=AI_ERRORS)
def compare_quotes(project_id: int, refresh: bool = Query(default=False), user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    own_project(db, project_id, user)
    rows = db.execute(
        select(Quote, Provider.company_name)
        .join(ServiceRequest, ServiceRequest.request_id == Quote.request_id)
        .join(Provider, Provider.provider_id == Quote.provider_id)
        .where(ServiceRequest.project_id == project_id, Quote.status == "pending")
        .order_by(Quote.quote_id)
    ).all()
    if not rows:
        raise HTTPException(status_code=404, detail="There are no quotes to compare yet")
    ratings = dict(
        (provider_id, (round(float(avg), 1), count))
        for provider_id, avg, count in db.execute(
            select(Review.provider_id, func.avg(Review.rating), func.count(Review.review_id)).group_by(Review.provider_id)
        )
    )
    fingerprint = ",".join(f"{q.quote_id}:{q.price}:{q.duration_days}:{q.start_date}" for q, _ in rows)
    key = f"quotes:{project_id}:" + hashlib.sha256(fingerprint.encode()).hexdigest()[:24]
    old = saved(db, key)
    if old is not None and not refresh:
        return old.result
    ai_call(ai.take_turn, user.user_id)
    lines = []
    for quote, company in rows:
        avg, count = ratings.get(quote.provider_id, (None, 0))
        lines.append(
            f"quote_id {quote.quote_id}: {company}, {quote.price} SAR, {quote.duration_days} days, "
            f"start {quote.start_date or 'not given'}, rating {f'{avg}/5 from {count} reviews' if count else 'no reviews yet'}, "
            f"services {', '.join(quote.services or []) or 'not listed'}, notes: {(quote.notes or 'none')[:300]}"
        )
    answer = ai_call(ai.ask_json, COMPARE_SYSTEM, [{"type": "text", "text": "\n".join(lines)}], max_tokens=1500, schema=COMPARE_SCHEMA)
    ids = {quote.quote_id for quote, _ in rows}
    names = {quote.quote_id: company for quote, company in rows}
    try:
        recommended = int(answer.get("recommended_quote_id"))
    except (TypeError, ValueError):
        recommended = None
    result = {
        "recommended_quote_id": recommended if recommended in ids else None,
        "recommended_company": names.get(recommended),
        "headline": str(answer.get("headline", ""))[:400],
        "quotes": [
            {"quote_id": int(q["quote_id"]), "company": names[int(q["quote_id"])],
             "pros": [str(p)[:120] for p in q.get("pros", [])][:3], "cons": [str(c)[:120] for c in q.get("cons", [])][:3]}
            for q in answer.get("quotes", []) if isinstance(q, dict) and str(q.get("quote_id", "")).isdigit() and int(q["quote_id"]) in ids
        ],
        "tip": str(answer.get("tip", ""))[:300],
        "quote_count": len(rows),
    }
    log_activity(db, user, "ai_compare", f"AI compared {len(rows)} quotes", project_id)
    return save(db, key, project_id, result)


# ---------- 4. Daily summary ----------

SUMMARY_SYSTEM = (
    "You write a short end-of-day report for a road work project in Riyadh, for the contractor and the "
    "traffic control provider. Use only the facts given. Answer with: "
    '"headline" (one sentence), "summary" (2-3 sentences), '
    '"highlights" (2-4 short facts), "risks" (0-3 short items that need attention, empty if none). Simple English.'
)


def today_facts(db: Session, project: Project) -> tuple[str, str]:
    now_riyadh = datetime.now(RIYADH)
    day = now_riyadh.date().isoformat()
    start = (now_riyadh.replace(hour=0, minute=0, second=0, microsecond=0)).astimezone(timezone.utc).replace(tzinfo=None)
    facts = [
        f"Project: {project.project_name} ({project.closure_type}), status {project.project_status}, "
        f"site status {project.site_status}, dates {project.start_date} to {project.end_date}.",
    ]
    visits = db.execute(
        select(Attendance, User.full_name).join(User, User.user_id == Attendance.worker_id)
        .where(Attendance.project_id == project.project_id, Attendance.check_in_at >= start)
    ).all()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if visits:
        facts.append("Attendance today: " + "; ".join(
            f"{name} {visit.minutes(now)} min{' (still on site)' if visit.check_out_at is None else ''}" for visit, name in visits))
    else:
        facts.append("Attendance today: no check-ins.")
    activity = db.scalars(
        select(Activity).where(Activity.project_id == project.project_id, Activity.created_at >= start).order_by(Activity.activity_id)
    ).all()
    if activity:
        facts.append("Activity today: " + "; ".join(a.detail for a in activity[-15:]))
    checks = [
        row.result for row in db.scalars(select(AIResult).where(AIResult.project_id == project.project_id, AIResult.key.like("photo:%")))
        if str(row.result.get("checked_at", "")) >= start.isoformat()
    ]
    if checks:
        facts.append("Photo safety checks today: " + "; ".join(f"{c['score']}/10 {c['advice']}" for c in checks[:6]))
    photos = db.scalar(select(func.count(SitePhoto.photo_id)).where(SitePhoto.project_id == project.project_id, SitePhoto.created_at >= start))
    facts.append(f"Photos uploaded today: {photos or 0}.")
    if project.latitude is not None and project.longitude is not None:
        try:
            today = next((d for d in weather.forecast(project.latitude, project.longitude) if d["date"] == day), None)
            if today:
                facts.append(f"Weather: {today['summary']}, max {today['temp_max']}°C, alerts: {', '.join(today['alerts']) or 'none'}.")
        except Exception:  # noqa: BLE001 - the report still works without the weather
            pass
        if traffic.enabled():
            try:
                flow = traffic.flow(project.latitude, project.longitude)
                facts.append(f"Traffic now: {flow['level']}, {flow['congestion']}% slower than an empty road.")
            except traffic.TrafficError:
                pass
    return day, "\n".join(facts)


@router.get("/projects/{project_id}/ai-summary", responses=AI_ERRORS)
def daily_summary(project_id: int, refresh: bool = Query(default=False), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = viewable_project(db, project_id, user)
    if user.role == "worker":
        raise HTTPException(status_code=403, detail="Only the contractor and the provider see the daily summary")
    day, facts = today_facts(db, project)
    key = f"summary:{project_id}:{day}"
    old = saved(db, key)
    if old is not None and not refresh:
        return old.result
    ai_call(ai.take_turn, user.user_id)
    answer = ai_call(ai.ask_json, SUMMARY_SYSTEM, [{"type": "text", "text": facts}], max_tokens=1200, schema=SUMMARY_SCHEMA)
    result = {
        "date": day,
        "headline": str(answer.get("headline", ""))[:300],
        "summary": str(answer.get("summary", ""))[:800],
        "highlights": [str(h)[:200] for h in answer.get("highlights", [])][:4],
        "risks": [str(r)[:200] for r in answer.get("risks", [])][:3],
        "made_at": datetime.now(timezone.utc).isoformat(),
    }
    return save(db, key, project_id, result)
