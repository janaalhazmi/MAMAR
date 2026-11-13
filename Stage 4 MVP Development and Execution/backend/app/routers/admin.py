import os
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import config, traffic
from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Activity, Assignment, Project, Provider, Quote, ServiceRequest, User
from app.schemas.admin import AdminCompany, AdminSummary, AdminUser, AdminUserCreate, AdminUserUpdate
from app.schemas.error import ErrorResponse
from app.services import sms
from app.services.activity import log_activity

# The admin dashboard: one admin account (ADMIN_EMAIL and ADMIN_PASSWORD on Render) sees every
# contractor, provider and field worker, adds users, and can stop a user's login.
router = APIRouter(prefix="/admin", tags=["admin"])

admin_only = allow_roles("admin", detail="Only the admin can open this page")

ERRORS = {
    401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
    403: {"model": ErrorResponse, "description": "The user is not the admin"},
}
OPEN_STATUSES = ("draft", "active")


def user_rows(db: Session, users: list[User]) -> list[dict]:
    # Adds the company name and a project count to each user, with one query per kind.
    companies = dict(db.execute(select(Provider.provider_id, Provider.company_name)).all())
    contractor_projects = dict(
        db.execute(select(Project.contractor_id, func.count()).group_by(Project.contractor_id)).all()
    )
    worker_projects = dict(
        db.execute(
            select(Assignment.worker_id, func.count())
            .join(Project, Project.project_id == Assignment.project_id)
            .where(Assignment.status == "active", Project.project_status.in_(OPEN_STATUSES))
            .group_by(Assignment.worker_id)
        ).all()
    )
    company_projects = dict(
        db.execute(
            select(Assignment.provider_id, func.count(func.distinct(Assignment.project_id)))
            .join(Project, Project.project_id == Assignment.project_id)
            .where(Project.project_status.in_(OPEN_STATUSES))
            .group_by(Assignment.provider_id)
        ).all()
    )
    rows = []
    for user in users:
        if user.role == "contractor":
            projects = contractor_projects.get(user.user_id, 0)
        elif user.role == "worker":
            projects = worker_projects.get(user.user_id, 0)
        elif user.role == "provider":
            projects = company_projects.get(user.provider_id, 0)
        else:
            projects = 0
        rows.append({**user.to_dict(), "company_name": companies.get(user.provider_id), "projects": projects})
    return rows


@router.get("/summary", response_model=AdminSummary, responses=ERRORS)
def summary(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    # The numbers at the top of the dashboard.
    roles = dict(db.execute(select(User.role, func.count()).group_by(User.role)).all())
    projects = dict(db.execute(select(Project.project_status, func.count()).group_by(Project.project_status)).all())
    return {
        "contractors": roles.get("contractor", 0),
        "providers": roles.get("provider", 0),
        "workers": roles.get("worker", 0),
        "companies": db.scalar(select(func.count()).select_from(Provider)),
        "projects": projects,
    }


@router.get("/users", response_model=list[AdminUser], responses=ERRORS)
def list_users(
    role: Literal["contractor", "provider", "worker"] | None = None,
    search: str | None = None,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
):
    # ?role=contractor | provider | worker for one list; no role returns all three, newest first.
    # ?search= matches the name or email.
    query = select(User).where(User.role != "admin").order_by(User.user_id.desc())
    if role:
        query = query.where(User.role == role)
    if search and search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.where(func.lower(User.full_name).like(pattern) | User.email.like(pattern))
    return user_rows(db, db.scalars(query).all())


@router.get("/companies", response_model=list[AdminCompany], responses=ERRORS)
def list_companies(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    # The provider companies, for the company list when adding a provider or a worker.
    counts = dict(
        db.execute(select(User.provider_id, func.count()).where(User.provider_id.is_not(None)).group_by(User.provider_id)).all()
    )
    companies = db.scalars(select(Provider).order_by(Provider.company_name)).all()
    return [
        {
            "provider_id": company.provider_id,
            "company_name": company.company_name,
            "website": company.website,
            "users": counts.get(company.provider_id, 0),
        }
        for company in companies
    ]


@router.post(
    "/users",
    status_code=201,
    response_model=AdminUser,
    responses={
        **ERRORS,
        409: {"model": ErrorResponse, "description": "The email is already registered"},
        422: {"model": ErrorResponse, "description": "A field is missing or not valid, or the company does not exist"},
    },
)
def add_user(data: AdminUserCreate, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="This email is already registered")
    if data.provider_id is not None and db.get(Provider, data.provider_id) is None:
        raise HTTPException(status_code=422, detail="provider_id: this company does not exist")
    new_user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        role=data.role,
        provider_id=data.provider_id,
    )
    new_user.set_password(data.password)
    db.add(new_user)
    log_activity(db, user, "admin_added_user", f"Added {data.role} {data.email}")
    db.commit()
    db.refresh(new_user)
    return user_rows(db, [new_user])[0]


@router.patch(
    "/users/{user_id}",
    response_model=AdminUser,
    responses={
        **ERRORS,
        400: {"model": ErrorResponse, "description": "The admin tried to change the admin account"},
        404: {"model": ErrorResponse, "description": "The user does not exist"},
    },
)
def update_user(user_id: int, data: AdminUserUpdate, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    # is_active false stops the user's login at once (the token is refused too); true allows it again.
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == "admin":
        raise HTTPException(status_code=400, detail="The admin account is changed from Render (ADMIN_EMAIL, ADMIN_PASSWORD)")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(target, field, value)
    if data.is_active is not None:
        log_activity(db, user, "admin_login_" + ("allowed" if data.is_active else "stopped"), f"{target.email}")
    db.commit()
    db.refresh(target)
    return user_rows(db, [target])[0]


@router.get("/activity", responses=ERRORS)
def activity_log(limit: int = 100, user: User = Depends(admin_only), db: Session = Depends(get_db)):
    # The audit log, newest first: who did what and when (at most 300 lines).
    limit = max(1, min(limit, 300))
    rows = db.execute(
        select(Activity, User.full_name, User.role)
        .outerjoin(User, User.user_id == Activity.user_id)
        .order_by(Activity.activity_id.desc())
        .limit(limit)
    ).all()
    return [{**activity.to_dict(), "user_name": name, "user_role": role} for activity, name, role in rows]


@router.get("/projects", responses=ERRORS)
def project_map(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    # Every project with a saved location, for the admin map of work zones in Riyadh.
    companies = dict(db.execute(select(Provider.provider_id, Provider.company_name)).all())
    winners = dict(
        db.execute(
            select(ServiceRequest.project_id, Quote.provider_id)
            .join(Quote, Quote.request_id == ServiceRequest.request_id)
            .where(Quote.status == "accepted")
        ).all()
    )
    contractors = dict(db.execute(select(User.user_id, User.full_name).where(User.role == "contractor")).all())
    projects = db.scalars(
        select(Project).where(Project.latitude.is_not(None), Project.longitude.is_not(None)).order_by(Project.project_id.desc())
    ).all()
    return [
        {
            "project_id": p.project_id,
            "project_name": p.project_name,
            "project_status": p.project_status,
            "site_status": p.site_status,
            "location": p.location,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "work_zone": p.work_zone,
            "start_date": p.start_date,
            "end_date": p.end_date,
            "contractor": contractors.get(p.contractor_id),
            "provider": companies.get(winners.get(p.project_id)),
        }
        for p in projects
    ]


@router.get("/services", responses=ERRORS)
def services_status(user: User = Depends(admin_only), db: Session = Depends(get_db)):
    # Which outside services are switched on (only on/off, never the keys themselves).
    def service(name: str, on: bool, what: str, setting: str) -> dict:
        return {"name": name, "on": on, "what": what, "setting": setting}

    return [
        service("Database", True, "PostgreSQL on Render", "DATABASE_URL"),
        service("PayPal", bool(os.getenv("PAYPAL_CLIENT_ID", "").strip() and os.getenv("PAYPAL_CLIENT_SECRET", "").strip()),
                "Sandbox payments and receipts", "PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET"),
        service("WhatsApp / SMS", sms.enabled(), "Notifications on the phone (Twilio)",
                "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM"),
        service("Bot check", bool(config.TURNSTILE_SECRET_KEY), "Cloudflare Turnstile on login and sign up",
                "TURNSTILE_SECRET_KEY"),
        service("Live traffic", traffic.enabled(), "TomTom traffic at the work zone", "TOMTOM_API_KEY"),
        service("Weather", True, "Open-Meteo forecast and safety alerts (no key)", "-"),
        service("Email codes", bool(config.EMAILJS_SERVICE_ID and config.EMAILJS_PRIVATE_KEY),
                "Sign-up passcodes by email (EmailJS)", "EMAILJS_*"),
        service("Demo accounts", bool(config.DEMO_PASSWORD), "provider@ and fieldworker@ for the four companies",
                "DEMO_PASSWORD"),
    ]
