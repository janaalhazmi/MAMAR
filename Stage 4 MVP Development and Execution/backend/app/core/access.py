from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Assignment, Project, Quote, ServiceRequest, User


def get_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def own_project(db: Session, project_id: int, user: User) -> Project:
    # The project of the signed-in contractor, or 403/404.
    project = get_project(db, project_id)
    if project.contractor_id != user.user_id:
        raise HTTPException(status_code=403, detail="This project belongs to another contractor")
    return project


def accepted_quote(db: Session, project_id: int) -> Quote | None:
    # The quote the contractor confirmed for this project, if any.
    query = (
        select(Quote)
        .join(ServiceRequest)
        .where(ServiceRequest.project_id == project_id, Quote.status == "accepted")
        .order_by(Quote.quote_id.desc())
    )
    return db.scalars(query).first()


def is_assigned(db: Session, project_id: int, worker: User) -> bool:
    query = select(Assignment).where(Assignment.project_id == project_id, Assignment.worker_id == worker.user_id)
    return db.scalar(query) is not None


def assigned_project(db: Session, project_id: int, worker: User) -> Project:
    # A project that the signed-in field worker is assigned to, or 403/404.
    project = get_project(db, project_id)
    if not is_assigned(db, project_id, worker):
        raise HTTPException(status_code=403, detail="You are not assigned to this project")
    return project


def can_view_project(db: Session, project: Project, user: User) -> bool:
    # Contractor: their own projects. Provider: projects with an open request it was invited to, or that its
    # company quoted or won. Field worker: projects they are assigned to.
    if user.role == "contractor":
        return project.contractor_id == user.user_id
    if user.role == "worker":
        return is_assigned(db, project.project_id, user)
    open_requests = db.scalars(
        select(ServiceRequest).where(ServiceRequest.project_id == project.project_id, ServiceRequest.status == "open")
    )
    if any(request.invites(user.provider_id) for request in open_requests):
        return True
    quoted = (
        select(Quote)
        .join(ServiceRequest)
        .where(ServiceRequest.project_id == project.project_id, Quote.provider_id == user.provider_id)
    )
    return db.scalar(quoted) is not None
