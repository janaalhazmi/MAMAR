from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Assignment, Project, Quote, ServiceRequest, User
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentStatus
from app.schemas.error import ErrorResponse

router = APIRouter(tags=["assignments"])

provider_only = allow_roles("provider", detail="Only providers can assign field workers")
provider_or_worker = allow_roles("provider", "worker", detail="Only providers and field workers can view assignments")

# The errors of each endpoint in Stage 3, shown in /docs.
TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
CREATE_ERRORS = {
    **TOKEN_ERROR,
    403: {
        "model": ErrorResponse,
        "description": "The user is not a provider, or the provider did not win a request for this project",
    },
    404: {"model": ErrorResponse, "description": "The project does not exist, or the worker does not belong to this provider"},
    409: {"model": ErrorResponse, "description": "The worker is already assigned to this project"},
    422: {"model": ErrorResponse, "description": "worker_id is missing or not a number"},
}
LIST_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "The user is not a provider or a field worker"},
    422: {"model": ErrorResponse, "description": "status is not active, completed or cancelled"},
}


@router.post("/projects/{project_id}/assignments", status_code=201, response_model=AssignmentResponse, responses=CREATE_ERRORS)
def assign_worker(
    project_id: int,
    data: AssignmentCreate,
    user: User = Depends(provider_only),
    db: Session = Depends(get_db),
):
    # Assigns a field worker of the provider to a project (Stage 3, section 4.2.13). Only the
    # provider whose quote was accepted for a request of this project can do it.
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    won = (
        select(Quote)
        .join(ServiceRequest)
        .where(
            ServiceRequest.project_id == project_id,
            ServiceRequest.status == "awarded",
            Quote.status == "accepted",
            Quote.provider_id == user.provider_id,
        )
    )
    if db.scalar(won) is None:
        raise HTTPException(status_code=403, detail="Your company did not win a request for this project")
    worker = db.get(User, data.worker_id)
    if worker is None or worker.role != "worker" or worker.provider_id != user.provider_id or not worker.is_active:
        raise HTTPException(status_code=404, detail="Worker not found in your company")
    already = select(Assignment).where(Assignment.project_id == project_id, Assignment.worker_id == worker.user_id)
    if db.scalar(already) is not None:
        raise HTTPException(status_code=409, detail="This worker is already assigned to this project")
    assignment = Assignment(project_id=project_id, provider_id=user.provider_id, worker_id=worker.user_id, status="active")
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError as error:
        # The same worker was assigned twice at the same moment.
        db.rollback()
        raise HTTPException(status_code=409, detail="This worker is already assigned to this project") from error
    db.refresh(assignment)
    return assignment.to_dict()


@router.get("/assignments", response_model=list[AssignmentResponse], responses=LIST_ERRORS)
def list_assignments(
    status: AssignmentStatus | None = None,
    project_id: int | None = None,
    user: User = Depends(provider_or_worker),
    db: Session = Depends(get_db),
):
    # Stage 3, section 4.2.14: a field worker sees their own assignments, and a provider sees
    # the assignments that their company created. Newest first.
    if user.role == "worker":
        query = select(Assignment).where(Assignment.worker_id == user.user_id)
    else:
        query = select(Assignment).where(Assignment.provider_id == user.provider_id)
    if status is not None:
        query = query.where(Assignment.status == status)
    if project_id is not None:
        query = query.where(Assignment.project_id == project_id)
    assignments = db.scalars(query.order_by(Assignment.assignment_id.desc())).all()
    return [assignment.to_dict() for assignment in assignments]
