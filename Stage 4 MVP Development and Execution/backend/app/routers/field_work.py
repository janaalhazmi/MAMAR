from app.services.notifications import notify_provider
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, undefer

from app.core.access import accepted_quote, assigned_project
from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Assignment, Project, Provider, SitePhoto, User
from app.models.project import SITE_PROGRESS
from app.models.site_photo import MAX_PHOTO_BYTES, PHOTO_TYPES
from app.routers.workflow import project_photos, provider_summary
from app.schemas.error import ErrorResponse
from app.schemas.workflow import FieldProject, PhotoResponse, SiteStatusUpdate

router = APIRouter(tags=["field work"])

worker_only = allow_roles("worker", detail="Only field workers can do this")

# The most photos in one upload.
MAX_PHOTOS = 10

TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
ASSIGNED_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "The user is not a field worker, or is not assigned to this project"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
}
OPEN_ERRORS = {
    **ASSIGNED_ERRORS,
    400: {"model": ErrorResponse, "description": "The project is already completed or cancelled"},
}


def utc_now() -> datetime:
    # The same clock as PostgreSQL's now() on Render (UTC), saved without a time zone like
    # the created_at columns.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def field_project(db: Session, project: Project) -> dict:
    quote = accepted_quote(db, project.project_id)
    team = db.execute(
        select(User.user_id, User.full_name)
        .join(Assignment, Assignment.worker_id == User.user_id)
        .where(Assignment.project_id == project.project_id)
        .order_by(Assignment.assignment_id)
    ).all()
    return {
        "project": project.to_dict(),
        "site_status": project.site_status,
        "progress": 100 if project.project_status == "completed" else SITE_PROGRESS.get(project.site_status, 0),
        "last_check_in": project.last_check_in,
        "change_note": project.change_note,
        "provider": provider_summary(db.get(Provider, quote.provider_id)) if quote else None,
        "team": [{"user_id": user_id, "full_name": full_name} for user_id, full_name in team],
        "photos": project_photos(db, project.project_id),
    }


def open_project(db: Session, project_id: int, user: User) -> Project:
    project = assigned_project(db, project_id, user)
    if project.project_status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"The project is {project.project_status}")
    return project


@router.get("/field-worker/projects", response_model=list[FieldProject], responses=TOKEN_ERROR)
def my_projects(user: User = Depends(worker_only), db: Session = Depends(get_db)):
    # The Field Worker Dashboard: the projects this worker is assigned to, newest first.
    projects = db.scalars(
        select(Project)
        .join(Assignment, Assignment.project_id == Project.project_id)
        .where(Assignment.worker_id == user.user_id)
        .order_by(Project.project_id.desc())
    ).all()
    return [field_project(db, project) for project in projects]


@router.get("/field-worker/projects/{project_id}", response_model=FieldProject, responses=ASSIGNED_ERRORS)
def my_project(project_id: int, user: User = Depends(worker_only), db: Session = Depends(get_db)):
    return field_project(db, assigned_project(db, project_id, user))


@router.patch("/field-worker/projects/{project_id}/status", response_model=FieldProject, responses=OPEN_ERRORS)
def update_site_status(
    project_id: int,
    data: SiteStatusUpdate,
    user: User = Depends(worker_only),
    db: Session = Depends(get_db),
):
    # Field worker -> provider -> contractor: Completed tells the provider the work is done.
    # The provider then sends it to the contractor (POST /provider/projects/{id}/submit-completion).
    # Any other status takes back work that was already sent.
    project = open_project(db, project_id, user)
    previous_status = project.site_status
    project.site_status = data.status

    if data.status == "Completed" and previous_status != "Completed":
        quote = accepted_quote(db, project_id)
        if quote:
            notify_provider(
                db,
                quote.provider_id,
                "field_completed",
                "Field Work Completed",
                f'Field work for project "{project.project_name}" is ready for review.',
                "/provider/projects",
            )

    if data.status != "Completed":
        project.completion_submitted = False
        project.submitted_at = None
    db.commit()
    db.refresh(project)
    return field_project(db, project)


@router.post("/field-worker/projects/{project_id}/check-in", response_model=FieldProject, responses=OPEN_ERRORS)
def check_in(project_id: int, user: User = Depends(worker_only), db: Session = Depends(get_db)):
    project = open_project(db, project_id, user)
    project.last_check_in = utc_now()
    if project.site_status == "Not Started":
        project.site_status = "Work in Progress"
    db.commit()
    db.refresh(project)
    return field_project(db, project)


@router.post(
    "/field-worker/projects/{project_id}/photos",
    status_code=201,
    response_model=list[PhotoResponse],
    responses={
        **OPEN_ERRORS,
        413: {"model": ErrorResponse, "description": "A photo is bigger than 5 MB"},
        422: {"model": ErrorResponse, "description": "No photo, more than 10 photos, or a file that is not JPEG, PNG or WebP"},
    },
)
async def upload_photos(
    project_id: int,
    photos: list[UploadFile] = File(...),
    captions: list[str] = Form(default=[]),
    user: User = Depends(worker_only),
    db: Session = Depends(get_db),
):
    # multipart/form-data with one "photos" field per file and, optionally, one "captions"
    # field per file in the same order.
    open_project(db, project_id, user)
    if not photos or len(photos) > MAX_PHOTOS:
        raise HTTPException(status_code=422, detail=f"Send between 1 and {MAX_PHOTOS} photos")
    saved = []
    for index, upload in enumerate(photos):
        if upload.content_type not in PHOTO_TYPES:
            raise HTTPException(status_code=422, detail=f"{upload.filename}: only JPEG, PNG or WebP photos")
        data = await upload.read(MAX_PHOTO_BYTES + 1)
        if not data:
            raise HTTPException(status_code=422, detail=f"{upload.filename}: the file is empty")
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=413, detail=f"{upload.filename}: the photo is bigger than 5 MB")
        caption = (captions[index].strip() if index < len(captions) else "")[:150] or "Site photo"
        saved.append(
            SitePhoto(
                project_id=project_id,
                worker_id=user.user_id,
                caption=caption,
                content_type=upload.content_type,
                data=data,
            )
        )
    db.add_all(saved)
    db.commit()
    for photo in saved:
        db.refresh(photo)
    return [photo.to_dict() for photo in saved]


@router.get("/photos/{token}", response_class=Response, responses={404: {"description": "The photo does not exist"}})
def get_photo(token: str, db: Session = Depends(get_db)):
    # Opened by <img src>, which cannot send the token header, so the URL holds a random value.
    photo = db.scalar(select(SitePhoto).options(undefer(SitePhoto.data)).where(SitePhoto.token == token))
    if photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return Response(
        content=photo.data,
        media_type=photo.content_type,
        headers={"Cache-Control": "private, max-age=86400"},
    )
