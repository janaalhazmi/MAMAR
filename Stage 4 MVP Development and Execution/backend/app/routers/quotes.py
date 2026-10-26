from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Project, Quote, ServiceRequest, User
from app.schemas.error import ErrorResponse
from app.schemas.quote import QuoteCreate, QuoteResponse

router = APIRouter(prefix="/requests/{request_id}/quotes", tags=["quotes"])

provider_only = allow_roles("provider", detail="Only providers can submit quotes")
contractor_or_provider = allow_roles("contractor", "provider", detail="Only contractors and providers can view quotes")

# The errors of each endpoint in Stage 3, shown in /docs.
TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
CREATE_ERRORS = {
    **TOKEN_ERROR,
    400: {"model": ErrorResponse, "description": "The request is not open"},
    403: {"model": ErrorResponse, "description": "The user is not a provider"},
    404: {"model": ErrorResponse, "description": "The request does not exist"},
    409: {"model": ErrorResponse, "description": "This provider already submitted a quote for the request"},
    422: {"model": ErrorResponse, "description": "price or duration_days is missing or not valid"},
}
LIST_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "The user is not allowed to view the quotes of this request"},
    404: {"model": ErrorResponse, "description": "The request does not exist"},
}


@router.post("", status_code=201, response_model=QuoteResponse, responses=CREATE_ERRORS)
def submit_quote(
    request_id: int,
    data: QuoteCreate,
    user: User = Depends(provider_only),
    db: Session = Depends(get_db),
):
    # A provider sends a price for an open request (Stage 3, section 4.2.10).
    request = db.get(ServiceRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != "open":
        raise HTTPException(status_code=400, detail=f"The request is {request.status}, quotes are only sent to open requests")
    already_sent = select(Quote).where(Quote.request_id == request_id, Quote.provider_id == user.provider_id)
    if db.scalar(already_sent) is not None:
        raise HTTPException(status_code=409, detail="Your company already sent a quote for this request")
    quote = Quote(request_id=request_id, provider_id=user.provider_id, status="pending", **data.model_dump())
    db.add(quote)
    try:
        db.commit()
    except IntegrityError as error:
        # Two employees of the same company sent a quote at the same moment.
        db.rollback()
        raise HTTPException(status_code=409, detail="Your company already sent a quote for this request") from error
    db.refresh(quote)
    return quote.to_dict()


@router.get("", response_model=list[QuoteResponse], responses=LIST_ERRORS)
def list_quotes(
    request_id: int,
    user: User = Depends(contractor_or_provider),
    db: Session = Depends(get_db),
):
    # Stage 3, section 4.2.11: the contractor of the request sees all the quotes, cheapest first,
    # and a provider sees only the quote of their own company.
    request = db.get(ServiceRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    query = select(Quote).where(Quote.request_id == request_id)
    if user.role == "contractor":
        if db.get(Project, request.project_id).contractor_id != user.user_id:
            raise HTTPException(status_code=403, detail="This request belongs to another contractor")
    else:
        query = query.where(Quote.provider_id == user.provider_id)
    quotes = db.scalars(query.order_by(Quote.price, Quote.quote_id)).all()
    return [quote.to_dict() for quote in quotes]
