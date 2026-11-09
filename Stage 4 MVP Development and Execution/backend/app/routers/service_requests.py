from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Project, Provider, Quote, ServiceRequest, User
from app.schemas.error import ErrorResponse
from app.schemas.service_request import (
    AwardRequest,
    AwardResponse,
    RequestStatus,
    ServiceRequestCreate,
    ServiceRequestResponse,
)

router = APIRouter(tags=["requests"])

contractor_only = allow_roles("contractor", detail="Only contractors can create or award service requests")
contractor_or_provider = allow_roles("contractor", "provider", detail="Only contractors and providers can view service requests")

# The errors of each endpoint in Stage 3, shown in /docs.
TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
CREATE_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "The user is not a contractor, or the project belongs to another contractor"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
    422: {"model": ErrorResponse, "description": "A field is missing or not valid, or a provider_id does not exist"},
}
LIST_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "The user is not a contractor or a provider"},
    422: {"model": ErrorResponse, "description": "status is not open, awarded or closed"},
}
AWARD_ERRORS = {
    **TOKEN_ERROR,
    400: {"model": ErrorResponse, "description": "The request is already awarded or closed"},
    403: {"model": ErrorResponse, "description": "The user is not a contractor, or the request belongs to another contractor"},
    404: {"model": ErrorResponse, "description": "The request does not exist, or the quote does not belong to this request"},
    422: {"model": ErrorResponse, "description": "quote_id is missing or not a number"},
}


@router.post(
    "/projects/{project_id}/requests",
    status_code=201,
    response_model=ServiceRequestResponse,
    responses={**CREATE_ERRORS, 200: {"model": ServiceRequestResponse, "description": "The project already had an open request, which is updated and returned"}},
)
def create_request(
    project_id: int,
    data: ServiceRequestCreate,
    response: Response,
    user: User = Depends(contractor_only),
    db: Session = Depends(get_db),
):
    # Creates a service request for a project of the signed-in contractor (Stage 3, section 4.2.8).
    # A project has one open request: if it already has one (the contractor went back and asked
    # again), that request is updated and returned with 200, so providers do not see it twice.
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.contractor_id != user.user_id:
        raise HTTPException(status_code=403, detail="This project belongs to another contractor")
    if data.provider_ids:
        found = set(db.scalars(select(Provider.provider_id).where(Provider.provider_id.in_(data.provider_ids))))
        missing = [provider_id for provider_id in data.provider_ids if provider_id not in found]
        if missing:
            raise HTTPException(status_code=422, detail=f"provider_ids: provider {missing[0]} does not exist")
    existing = db.scalars(
        select(ServiceRequest)
        .where(ServiceRequest.project_id == project.project_id, ServiceRequest.status == "open")
        .order_by(ServiceRequest.request_id.desc())
    ).first()
    if existing is not None:
        existing.title = data.title
        existing.details = data.details
        existing.required_by = data.required_by
        # Invited providers stay invited, so a provider that already quoted is not cut off.
        if existing.provider_ids is None or data.provider_ids is None:
            existing.provider_ids = None
        else:
            existing.provider_ids = list(dict.fromkeys([*existing.provider_ids, *data.provider_ids]))
        db.commit()
        db.refresh(existing)
        response.status_code = 200
        return existing.to_dict()
    request = ServiceRequest(project_id=project.project_id, status="open", **data.model_dump())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request.to_dict()


@router.get("/requests", response_model=list[ServiceRequestResponse], responses=LIST_ERRORS)
def list_requests(
    status: RequestStatus | None = None,
    project_id: int | None = None,
    user: User = Depends(contractor_or_provider),
    db: Session = Depends(get_db),
):
    # Stage 3, section 4.2.9: a contractor sees the requests of their own projects. A provider
    # sees the open requests it was invited to (no status, or status=open), and the requests
    # its company won (status=awarded or status=closed). Newest first.
    query = select(ServiceRequest)
    if user.role == "contractor":
        query = query.join(Project).where(Project.contractor_id == user.user_id)
        if status is not None:
            query = query.where(ServiceRequest.status == status)
    elif status in (None, "open"):
        query = query.where(ServiceRequest.status == "open")
    else:
        won = select(Quote.request_id).where(Quote.provider_id == user.provider_id, Quote.status == "accepted")
        query = query.where(ServiceRequest.status == status, ServiceRequest.request_id.in_(won))
    if project_id is not None:
        query = query.where(ServiceRequest.project_id == project_id)
    requests = db.scalars(query.order_by(ServiceRequest.request_id.desc())).all()
    if user.role == "provider":
        requests = [request for request in requests if request.status != "open" or request.visible_to(user.provider_id)]
    return [request.to_dict() for request in requests]


@router.post("/requests/{request_id}/award", response_model=AwardResponse, responses=AWARD_ERRORS)
def award_request(
    request_id: int,
    data: AwardRequest,
    user: User = Depends(contractor_only),
    db: Session = Depends(get_db),
):
    # Runs award(quote_id): accepts the chosen quote, rejects the others and marks the
    # request as awarded (Stage 3, section 4.2.12).
    request = db.get(ServiceRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if db.get(Project, request.project_id).contractor_id != user.user_id:
        raise HTTPException(status_code=403, detail="This request belongs to another contractor")
    if request.status != "open":
        raise HTTPException(status_code=400, detail=f"The request is already {request.status}")
    try:
        quote = request.award(data.quote_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Quote not found for this request") from error
    db.commit()
    return {
        "request_id": request.request_id,
        "status": request.status,
        "accepted_quote": {
            "quote_id": quote.quote_id,
            "provider_id": quote.provider_id,
            "price": float(quote.price),
            "status": quote.status,
        },
    }
