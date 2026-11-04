from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.access import accepted_quote, get_project, own_project
from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Assignment, Project, Provider, Quote, ServiceRequest, SitePhoto, User
from app.models.project import SITE_PROGRESS
from app.schemas.error import ErrorResponse
from app.schemas.quote import QuoteResponse
from app.schemas.workflow import (
    ChangeRequest,
    ConfirmProviderRequest,
    ConfirmProviderResponse,
    ProjectQuotation,
    QuotationCreate,
    SiteProgress,
)
from app.schemas.project import ProjectResponse

router = APIRouter(tags=["workflow"])

contractor_only = allow_roles("contractor", detail="Only contractors can do this")
provider_only = allow_roles("provider", detail="Only providers can submit quotations")

TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
OWN_PROJECT_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "The user is not a contractor, or the project belongs to another contractor"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
}


def provider_summary(provider: Provider | None) -> dict | None:
    if provider is None:
        return None
    return {
        "provider_id": provider.provider_id,
        "company_name": provider.company_name,
        "service_type": provider.service_type,
    }


def project_photos(db: Session, project_id: int) -> list[dict]:
    photos = db.scalars(
        select(SitePhoto).where(SitePhoto.project_id == project_id).order_by(SitePhoto.photo_id.desc())
    ).all()
    return [photo.to_dict() for photo in photos]


def site_progress(db: Session, project: Project) -> dict:
    # The execution of a project, for Project Monitoring and Review Completion.
    quote = accepted_quote(db, project.project_id)
    team = db.scalar(
        select(func.count()).select_from(Assignment).where(Assignment.project_id == project.project_id)
    )
    return {
        "project_id": project.project_id,
        "project_status": project.project_status,
        "site_status": project.site_status,
        "progress": 100 if project.project_status == "completed" else SITE_PROGRESS.get(project.site_status, 0),
        "field_team_count": team,
        "last_check_in": project.last_check_in,
        "completion_submitted": project.completion_submitted,
        "submitted_at": project.submitted_at,
        "change_note": project.change_note,
        "services": list(project.services or []),
        "provider": provider_summary(db.get(Provider, quote.provider_id)) if quote else None,
        "quote": quote.to_dict() if quote else None,
        "photos": project_photos(db, project.project_id),
    }


# ---------------------------------------------------------------------------
# Quotations
# ---------------------------------------------------------------------------


@router.post(
    "/quotations",
    status_code=201,
    response_model=QuoteResponse,
    responses={
        **TOKEN_ERROR,
        400: {"model": ErrorResponse, "description": "The project has no open request for quotations"},
        403: {"model": ErrorResponse, "description": "The user is not a provider, or the contractor did not invite this provider"},
        404: {"model": ErrorResponse, "description": "The project does not exist"},
        409: {"model": ErrorResponse, "description": "The provider already sent a quotation for this project"},
        422: {"model": ErrorResponse, "description": "A field is missing or not valid"},
    },
)
def submit_quotation(data: QuotationCreate, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    # The Prepare Quotation page: the quote is added to the newest open request of the project.
    get_project(db, data.project_id)
    open_requests = db.scalars(
        select(ServiceRequest)
        .where(ServiceRequest.project_id == data.project_id, ServiceRequest.status == "open")
        .order_by(ServiceRequest.request_id.desc())
    ).all()
    if not open_requests:
        raise HTTPException(status_code=400, detail="This project is not asking for quotations")
    request = next((item for item in open_requests if item.invites(user.provider_id)), None)
    if request is None:
        raise HTTPException(status_code=403, detail="The contractor did not invite your company to this project")
    already = select(Quote).where(Quote.request_id == request.request_id, Quote.provider_id == user.provider_id)
    if db.scalar(already) is not None:
        raise HTTPException(status_code=409, detail="Your company already sent a quotation for this project")
    quote = Quote(
        request_id=request.request_id,
        provider_id=user.provider_id,
        status="pending",
        **data.model_dump(exclude={"project_id"}),
    )
    db.add(quote)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Your company already sent a quotation for this project") from error
    db.refresh(quote)
    return quote.to_dict()


@router.get("/projects/{project_id}/quotations", response_model=list[ProjectQuotation], responses=OWN_PROJECT_ERRORS)
def list_project_quotations(project_id: int, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    # The Quotations page: every quote sent for the project, with its company, cheapest first.
    own_project(db, project_id, user)
    rows = db.execute(
        select(Quote, Provider)
        .join(ServiceRequest, Quote.request_id == ServiceRequest.request_id)
        .join(Provider, Quote.provider_id == Provider.provider_id)
        .where(ServiceRequest.project_id == project_id)
        .order_by(Quote.price, Quote.quote_id)
    ).all()
    return [{**quote.to_dict(), "provider": provider_summary(provider)} for quote, provider in rows]


def own_quote(db: Session, quote_id: int, user: User) -> tuple[Quote, ServiceRequest]:
    quote = db.get(Quote, quote_id)
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    request = db.get(ServiceRequest, quote.request_id)
    own_project(db, request.project_id, user)
    return quote, request


@router.post(
    "/quotes/{quote_id}/reject",
    response_model=QuoteResponse,
    responses={
        **TOKEN_ERROR,
        400: {"model": ErrorResponse, "description": "The quote is already accepted or rejected"},
        403: {"model": ErrorResponse, "description": "The quote is for a project of another contractor"},
        404: {"model": ErrorResponse, "description": "The quote does not exist"},
    },
)
def reject_quote(quote_id: int, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    quote, _ = own_quote(db, quote_id, user)
    if quote.status != "pending":
        raise HTTPException(status_code=400, detail=f"The quote is already {quote.status}")
    quote.reject()
    db.commit()
    return quote.to_dict()


@router.post(
    "/projects/{project_id}/confirm-provider",
    response_model=ConfirmProviderResponse,
    responses={
        **OWN_PROJECT_ERRORS,
        400: {"model": ErrorResponse, "description": "The quote was rejected, or a provider is already confirmed"},
        404: {"model": ErrorResponse, "description": "The project or the quote does not exist"},
    },
)
def confirm_provider(
    project_id: int,
    data: ConfirmProviderRequest,
    user: User = Depends(contractor_only),
    db: Session = Depends(get_db),
):
    # The Select Provider page: accepts the quote, rejects the other quotes of the request
    # (ServiceRequest.award) and moves the project to active.
    project = own_project(db, project_id, user)
    quote = db.get(Quote, data.quote_id)
    request = db.get(ServiceRequest, quote.request_id) if quote else None
    if quote is None or request.project_id != project_id:
        raise HTTPException(status_code=404, detail="Quote not found for this project")
    if request.status != "open":
        raise HTTPException(status_code=400, detail="A provider is already confirmed for this project")
    if quote.status != "pending":
        raise HTTPException(status_code=400, detail=f"The quote is {quote.status}")
    request.award(quote.quote_id)
    project.update_status("active")
    db.commit()
    db.refresh(project)
    return {"project": project.to_dict(), "quote": quote.to_dict()}


# ---------------------------------------------------------------------------
# Project Monitoring and Review Completion
# ---------------------------------------------------------------------------


@router.get("/projects/{project_id}/monitoring", response_model=SiteProgress, responses=OWN_PROJECT_ERRORS)
def project_monitoring(project_id: int, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    return site_progress(db, own_project(db, project_id, user))


@router.get("/projects/{project_id}/completion", response_model=SiteProgress, responses=OWN_PROJECT_ERRORS)
def project_completion(project_id: int, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    # The same data as monitoring: the evidence photos and the date the worker submitted.
    return site_progress(db, own_project(db, project_id, user))


def submitted_project(db: Session, project_id: int, user: User) -> Project:
    project = own_project(db, project_id, user)
    if not project.completion_submitted:
        raise HTTPException(status_code=400, detail="The field team has not submitted the work yet")
    return project


COMPLETION_ERRORS = {
    **OWN_PROJECT_ERRORS,
    400: {"model": ErrorResponse, "description": "The field team has not submitted the work yet"},
}


@router.post("/projects/{project_id}/complete", response_model=ProjectResponse, responses=COMPLETION_ERRORS)
def approve_completion(project_id: int, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    project = submitted_project(db, project_id, user)
    project.update_status("completed")
    for assignment in db.scalars(select(Assignment).where(Assignment.project_id == project_id)):
        assignment.complete()
    db.commit()
    db.refresh(project)
    return project.to_dict()


@router.post("/projects/{project_id}/request-changes", response_model=ProjectResponse, responses=COMPLETION_ERRORS)
def request_changes(
    project_id: int,
    data: ChangeRequest,
    user: User = Depends(contractor_only),
    db: Session = Depends(get_db),
):
    # Sends the work back to the field team with a note.
    project = submitted_project(db, project_id, user)
    project.completion_submitted = False
    project.submitted_at = None
    project.site_status = "Work in Progress"
    project.change_note = data.note
    db.commit()
    db.refresh(project)
    return project.to_dict()
