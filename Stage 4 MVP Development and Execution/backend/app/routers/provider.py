from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.access import get_project
from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Assignment, Project, Quote, ServiceRequest, SitePhoto, User
from app.models.project import SITE_PROGRESS
from app.routers.workflow import project_photos
from app.schemas.error import ErrorResponse
from app.schemas.provider_view import (
    ProjectTab,
    ProviderDashboard,
    ProviderProject,
    ProviderProjectDetail,
    ProviderRequest,
    ProviderWorker,
    WorkerStatus,
)

# The provider's own pages: Dashboard, Service Requests and Projects. Every list holds only
# the data of the signed-in provider's company (provider_id in the token), and a company
# with no requests or projects gets empty lists and zeros.
router = APIRouter(prefix="/provider", tags=["provider"])

provider_only = allow_roles("provider", detail="Only providers can view this page")

TOKEN_ERRORS = {
    401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
    403: {"model": ErrorResponse, "description": "The user is not a provider"},
}
PROJECT_ERRORS = {
    401: TOKEN_ERRORS[401],
    403: {"model": ErrorResponse, "description": "The user is not a provider, or the company did not win this project"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
}

# Saudi Arabia is UTC+3 all year, so "today" is the same day the provider sees.
RIYADH = timezone(timedelta(hours=3))


def today() -> date:
    return datetime.now(RIYADH).date()


def project_tab(project: Project) -> str:
    # Completed: approved by the contractor. Active: started (the start date came, or the field
    # team already checked in). Upcoming: confirmed but not started yet.
    if project.project_status == "completed":
        return "Completed"
    if project.project_status == "cancelled":
        return "Cancelled"
    if project.project_status == "active" and (project.start_date <= today() or project.site_status != "Not Started"):
        return "Active"
    return "Upcoming"


def won_projects(db: Session, provider_id: int) -> list[tuple[Project, Quote]]:
    # The projects where the contractor accepted this company's quote, newest first.
    rows = db.execute(
        select(Project, Quote)
        .join(ServiceRequest, ServiceRequest.project_id == Project.project_id)
        .join(Quote, Quote.request_id == ServiceRequest.request_id)
        .where(Quote.provider_id == provider_id, Quote.status == "accepted")
        .order_by(Project.project_id.desc(), Quote.quote_id.desc())
    ).all()
    seen, result = set(), []
    for project, quote in rows:
        if project.project_id not in seen:
            seen.add(project.project_id)
            result.append((project, quote))
    return result


def provider_project(db: Session, project: Project, quote: Quote) -> dict:
    team = db.scalar(
        select(func.count()).select_from(Assignment).where(Assignment.project_id == project.project_id)
    )
    return {
        "project": project.to_dict(),
        "status": project_tab(project),
        "site_status": project.site_status,
        "progress": 100 if project.project_status == "completed" else SITE_PROGRESS.get(project.site_status, 0),
        "field_team_count": team,
        "last_check_in": project.last_check_in,
        "completion_submitted": project.completion_submitted,
        "quote": quote.to_dict(),
    }


def invited_requests(db: Session, provider_id: int) -> list[dict]:
    # The open requests the company was invited to (or open to every provider), newest first,
    # each with its project and the company's quote.
    rows = db.execute(
        select(ServiceRequest, Project)
        .join(Project, Project.project_id == ServiceRequest.project_id)
        .where(ServiceRequest.status == "open", Project.project_status.not_in(("completed", "cancelled")))
        .order_by(ServiceRequest.request_id.desc())
    ).all()
    quotes = {
        quote.request_id: quote
        for quote in db.scalars(select(Quote).where(Quote.provider_id == provider_id))
    }
    result = []
    for request, project in rows:
        if not request.invites(provider_id):
            continue
        quote = quotes.get(request.request_id)
        result.append(
            {
                **request.to_dict(),
                "project": project.to_dict(),
                "quoted": quote is not None,
                "my_quote": quote.to_dict() if quote else None,
            }
        )
    return result


@router.get("/requests", response_model=list[ProviderRequest], responses=TOKEN_ERRORS)
def my_requests(quoted: bool | None = None, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    # The Service Requests page. ?quoted=false: only the requests still waiting for a quote
    # from this company. ?quoted=true: only the ones it already quoted.
    requests = invited_requests(db, user.provider_id)
    if quoted is not None:
        requests = [request for request in requests if request["quoted"] == quoted]
    return requests


@router.get("/projects", response_model=list[ProviderProject], responses=TOKEN_ERRORS)
def my_projects(status: ProjectTab | None = None, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    # The Projects page: the projects the company won, without cancelled ones. ?status= picks a tab.
    projects = [provider_project(db, project, quote) for project, quote in won_projects(db, user.provider_id)]
    projects = [project for project in projects if project["status"] != "Cancelled"]
    if status is not None:
        projects = [project for project in projects if project["status"] == status]
    return projects


@router.get("/projects/{project_id}", response_model=ProviderProjectDetail, responses=PROJECT_ERRORS)
def my_project(project_id: int, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    # Project Details: progress, field team and site photos of a project the company won.
    project = get_project(db, project_id)
    quote = next((quote for won, quote in won_projects(db, user.provider_id) if won.project_id == project_id), None)
    if quote is None:
        raise HTTPException(status_code=403, detail="Your company did not win this project")
    team = db.execute(
        select(User.user_id, User.full_name)
        .join(Assignment, Assignment.worker_id == User.user_id)
        .where(Assignment.project_id == project_id)
        .order_by(Assignment.assignment_id)
    ).all()
    return {
        **provider_project(db, project, quote),
        "submitted_at": project.submitted_at,
        "change_note": project.change_note,
        "team": [{"user_id": user_id, "full_name": full_name} for user_id, full_name in team],
        "photos": project_photos(db, project_id),
    }


@router.get("/dashboard", response_model=ProviderDashboard, responses=TOKEN_ERRORS)
def dashboard(user: User = Depends(provider_only), db: Session = Depends(get_db)):
    # The Provider Dashboard. Every number is counted here, so the frontend shows it as it is.
    projects = [provider_project(db, project, quote) for project, quote in won_projects(db, user.provider_id)]
    projects = [project for project in projects if project["status"] != "Cancelled"]
    active = [project for project in projects if project["status"] == "Active"]
    upcoming = sorted(
        (project for project in projects if project["status"] == "Upcoming"),
        key=lambda project: (project["project"]["start_date"], project["project"]["project_id"]),
    )
    completed = [project for project in projects if project["status"] == "Completed"]
    requests = invited_requests(db, user.provider_id)

    active_ids = [project["project"]["project_id"] for project in active]
    workers_active = 0
    if active_ids:
        workers_active = db.scalar(
            select(func.count(func.distinct(Assignment.worker_id))).where(
                Assignment.project_id.in_(active_ids),
                Assignment.provider_id == user.provider_id,
                Assignment.status == "active",
            )
        )
    field_workers = db.scalar(
        select(func.count())
        .select_from(User)
        .where(User.role == "worker", User.provider_id == user.provider_id, User.is_active.is_(True))
    )
    return {
        "stats": {
            "assigned": len(projects),
            "active": len(active),
            "upcoming": len(upcoming),
            "completed": len(completed),
        },
        "pending_quotes": sum(1 for request in requests if request["quoted"] and request["my_quote"]["status"] == "pending"),
        "new_requests": [request for request in requests if not request["quoted"]],
        "next_project": upcoming[0] if upcoming else None,
        "active_projects": active,
        "overview": {
            "workers_active": workers_active,
            "sites_active": len(active),
            "field_workers": field_workers,
        },
    }


@router.get("/workers", response_model=list[ProviderWorker], responses=TOKEN_ERRORS)
def my_workers(status: WorkerStatus | None = None, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    # The Field Team page: every field worker account of the company, newest first, so a worker
    # added on this page is still listed after the page is opened again. ?status= picks a filter.
    workers = db.scalars(
        select(User)
        .where(User.role == "worker", User.provider_id == user.provider_id)
        .order_by(User.user_id.desc())
    ).all()
    if not workers:
        return []
    ids = [worker.user_id for worker in workers]

    # The open projects each worker is assigned to now, newest assignment first.
    open_work = db.execute(
        select(Assignment.worker_id, Project.project_id, Project.project_name)
        .join(Project, Project.project_id == Assignment.project_id)
        .where(
            Assignment.worker_id.in_(ids),
            Assignment.status == "active",
            Project.project_status.not_in(("completed", "cancelled")),
        )
        .order_by(Assignment.assigned_at.desc(), Assignment.assignment_id.desc())
    ).all()
    current, counts = {}, {}
    for worker_id, project_id, project_name in open_work:
        current.setdefault(worker_id, {"project_id": project_id, "project_name": project_name})
        counts[worker_id] = counts.get(worker_id, 0) + 1

    # The last thing each worker did: a photo upload or a new assignment.
    last_photo = dict(
        db.execute(
            select(SitePhoto.worker_id, func.max(SitePhoto.created_at))
            .where(SitePhoto.worker_id.in_(ids))
            .group_by(SitePhoto.worker_id)
        ).all()
    )
    last_assigned = dict(
        db.execute(
            select(Assignment.worker_id, func.max(Assignment.assigned_at))
            .where(Assignment.worker_id.in_(ids))
            .group_by(Assignment.worker_id)
        ).all()
    )

    result = []
    for worker in workers:
        if not worker.is_active:
            worker_status = "On Leave"
        elif worker.user_id in current:
            worker_status = "Active"
        else:
            worker_status = "Available"
        if status is not None and worker_status != status:
            continue
        times = [time for time in (last_photo.get(worker.user_id), last_assigned.get(worker.user_id)) if time]
        result.append(
            {
                "user_id": worker.user_id,
                "full_name": worker.full_name,
                "email": worker.email,
                "phone": worker.phone,
                "status": worker_status,
                "project": current.get(worker.user_id),
                "active_projects": counts.get(worker.user_id, 0),
                "last_activity": max(times) if times else None,
                "created_at": worker.created_at,
            }
        )
    return result
