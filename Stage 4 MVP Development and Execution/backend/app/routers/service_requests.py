from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Project, ServiceRequest, User
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
    422: {"model": ErrorResponse, "description": "A field is missing or not valid"},
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


@router.post("/projects/{project_id}/requests", status_code=201, response_model=ServiceRequestResponse, responses=CREATE_ERRORS)
def create_request(
    project_id: int,
    data: ServiceRequestCreate,
    user: User = Depends(contractor_only),
    db: Session = Depends(get_db),
):
    # Creates a service request for a project of the signed-in contractor (Stage 3, section 4.2.8).
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.contractor_id != user.user_id:
        raise HTTPException(status_code=403, detail="This project belongs to another contractor")
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
    # Stage 3, section 4.2.9: a contractor sees the requests of their own projects,
    # and a provider sees the open requests. Newest first.
    query = select(ServiceRequest)
    if user.role == "contractor":
        query = query.join(Project).where(Project.contractor_id == user.user_id)
    else:
        query = query.where(ServiceRequest.status == "open")
    if status is not None:
        query = query.where(ServiceRequest.status == status)
    if project_id is not None:
        query = query.where(ServiceRequest.project_id == project_id)
    requests = db.scalars(query.order_by(ServiceRequest.request_id.desc())).all()
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
