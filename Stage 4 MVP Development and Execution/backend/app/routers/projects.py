from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.access import accepted_quote, can_view_project, get_project, open_project_or_400
from app.core.security import get_current_user
from app.db.database import get_db
from app.models import Project, ServiceRequest, User
from app.schemas.error import ErrorResponse
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectStatus, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])

# The errors of each endpoint in Stage 3, shown in /docs.
TOKEN_ERRORS = {
    401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
    403: {"model": ErrorResponse, "description": "The user is not a contractor"},
}
LIST_ERRORS = {
    **TOKEN_ERRORS,
    422: {"model": ErrorResponse, "description": "project_status is not one of the four statuses"},
}
CREATE_ERRORS = {
    **TOKEN_ERRORS,
    422: {"model": ErrorResponse, "description": "A field is missing or not valid, or end_date is before start_date"},
}
UPDATE_ERRORS = {
    401: TOKEN_ERRORS[401],
    400: {
        "model": ErrorResponse,
        "description": "The project is completed or cancelled, or the status change is not allowed (completed only through POST /projects/{id}/complete)",
    },
    403: {"model": ErrorResponse, "description": "The user is not a contractor, or the project belongs to another contractor"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
    422: {
        "model": ErrorResponse,
        "description": "The data is not valid, including an unsupported project status or end_date before start_date",
    },
}


def get_current_contractor(user: User = Depends(get_current_user)) -> User:
    # Stage 3: only a contractor can use the projects endpoints.
    if user.role != "contractor":
        raise HTTPException(status_code=403, detail="Only contractors can use the projects endpoints")
    return user


@router.get("", response_model=list[ProjectResponse], responses=LIST_ERRORS)
def list_projects(
    project_status: ProjectStatus | None = None,
    user: User = Depends(get_current_contractor),
    db: Session = Depends(get_db),
):
    # Returns the projects of the signed-in contractor, newest first (Stage 3, section 4.2.5).
    query = select(Project).where(Project.contractor_id == user.user_id)
    if project_status is not None:
        query = query.where(Project.project_status == project_status)
    projects = db.scalars(query.order_by(Project.project_id.desc())).all()
    return [project.to_dict() for project in projects]


VIEW_ERRORS = {
    401: TOKEN_ERRORS[401],
    403: {"model": ErrorResponse, "description": "The user cannot view this project"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
}


@router.get("/{project_id}", response_model=ProjectResponse, responses=VIEW_ERRORS)
def get_one_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # One project: for its contractor, for providers who can quote on it or won it, and for
    # the field workers assigned to it.
    project = get_project(db, project_id)
    if not can_view_project(db, project, user):
        raise HTTPException(status_code=403, detail="You cannot view this project")
    return project.to_dict()


@router.post("", status_code=201, response_model=ProjectResponse, responses=CREATE_ERRORS)
def create_project(
    data: ProjectCreate,
    user: User = Depends(get_current_contractor),
    db: Session = Depends(get_db),
):
    # Creates a project as draft (Stage 3, section 4.2.6). The frontend uses the returned
    # project_id to save the work zone polygon in the MAMAR_Projects layer.
    project = Project(contractor_id=user.user_id, project_status="draft", **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project.to_dict()


@router.patch("/{project_id}", response_model=ProjectResponse, responses=UPDATE_ERRORS)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    user: User = Depends(get_current_contractor),
    db: Session = Depends(get_db),
):
    # Updates only the fields that are sent (Stage 3, section 4.2.7).
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.contractor_id != user.user_id:
        raise HTTPException(status_code=403, detail="This project belongs to another contractor")

    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(
            status_code=422,
            detail="Send at least one of: project_name, project_status, closure_type, start_date, end_date, description, services",
        )
    # The dates are checked together, also when only one of them is sent.
    if changes.get("end_date", project.end_date) < changes.get("start_date", project.start_date):
        raise HTTPException(status_code=422, detail="end_date: cannot be before start_date")

    # A finished project keeps its data, and "completed" comes only from approving the work
    # (POST /projects/{id}/complete), after the field team and the provider sent it.
    open_project_or_400(project)
    status = changes.pop("project_status", None)
    if status == "completed":
        raise HTTPException(status_code=400, detail="A project is completed by approving the work (Review Completion)")
    if status == "draft" and project.project_status != "draft" and accepted_quote(db, project.project_id) is not None:
        raise HTTPException(status_code=400, detail="A project with a confirmed provider cannot go back to draft")
    if status == "cancelled":
        # Providers stop seeing the requests of a cancelled project.
        for request in db.scalars(
            select(ServiceRequest).where(ServiceRequest.project_id == project.project_id, ServiceRequest.status == "open")
        ):
            request.close()
    for field, value in changes.items():
        setattr(project, field, value)
    if status is not None:
        project.update_status(status)
    db.commit()
    db.refresh(project)
    return project.to_dict()
