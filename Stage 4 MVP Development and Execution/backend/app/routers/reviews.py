from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.access import accepted_quote, own_project
from app.core.security import allow_roles, get_current_user
from app.db.database import get_db
from app.models import Provider, Review, User
from app.schemas.error import ErrorResponse
from app.services.activity import log_activity
from app.services.notifications import notify_provider

# The contractor rates the provider (1 to 5 stars and a comment) once the project is completed.
# The average shows next to each company when the next contractor picks providers.
router = APIRouter(tags=["reviews"])
contractor_only = allow_roles("contractor", detail="Only contractors can rate providers")
TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None


@router.post(
    "/projects/{project_id}/review",
    status_code=201,
    responses={
        **TOKEN_ERROR,
        400: {"model": ErrorResponse, "description": "The project is not completed yet"},
        403: {"model": ErrorResponse, "description": "The project belongs to another contractor"},
        409: {"model": ErrorResponse, "description": "This project is already rated"},
    },
)
def rate_provider(project_id: int, data: ReviewCreate, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    project = own_project(db, project_id, user)
    if project.project_status != "completed":
        raise HTTPException(status_code=400, detail="You can rate the provider after approving the work")
    if db.scalar(select(Review).where(Review.project_id == project_id)) is not None:
        raise HTTPException(status_code=409, detail="This project is already rated")
    quote = accepted_quote(db, project_id)
    review = Review(project_id=project_id, provider_id=quote.provider_id, contractor_id=user.user_id,
                    rating=data.rating, comment=data.comment or None)
    db.add(review)
    notify_provider(db, quote.provider_id, "review", "New Rating",
                    f'Your company got {data.rating} stars for "{project.project_name}".', "/provider-dashboard")
    log_activity(db, user, "provider_rated", f"Rated the provider {data.rating}/5", project_id)
    db.commit()
    db.refresh(review)
    return review.to_dict()


@router.get("/projects/{project_id}/review", responses=TOKEN_ERROR)
def project_review(project_id: int, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    # The rating of this project, or null when it is not rated yet.
    own_project(db, project_id, user)
    review = db.scalar(select(Review).where(Review.project_id == project_id))
    return review.to_dict() if review else None


@router.get("/providers/ratings", responses=TOKEN_ERROR)
def provider_ratings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Average stars and number of ratings for every company.
    rows = db.execute(
        select(Provider.provider_id, Provider.company_name, func.avg(Review.rating), func.count(Review.review_id))
        .outerjoin(Review, Review.provider_id == Provider.provider_id)
        .group_by(Provider.provider_id, Provider.company_name)
        .order_by(Provider.provider_id)
    ).all()
    return [
        {"provider_id": pid, "company_name": name, "average": round(float(avg), 1) if avg else None, "count": count}
        for pid, name, avg, count in rows
    ]


@router.get("/providers/{provider_id}/reviews", responses=TOKEN_ERROR)
def provider_reviews(provider_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # The latest 20 ratings of a company, newest first.
    reviews = db.scalars(
        select(Review).where(Review.provider_id == provider_id).order_by(Review.review_id.desc()).limit(20)
    ).all()
    return [review.to_dict() for review in reviews]
