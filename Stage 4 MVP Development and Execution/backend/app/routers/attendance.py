import hashlib
import hmac
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import arcgis
from app.core.access import accepted_quote, assigned_project, get_project
from app.core.config import SECRET_KEY
from app.core.security import allow_roles, get_current_user
from app.db.database import get_db
from app.models import Attendance, Project, User
from app.schemas.error import ErrorResponse
from app.services.activity import log_activity
from app.services.notifications import notify_user

# Worker attendance: each project has a QR code that the provider prints and puts at the work
# zone. The field worker scans it on arrival and on leaving. The backend checks the code, that the
# worker is assigned to the project, and that the phone GPS is at the work zone, so nobody can
# check in from home or for a project that is not theirs.
router = APIRouter(tags=["attendance"])

worker_only = allow_roles("worker", detail="Only field workers can do this")

# The phone must be this close to the project pin or to the work zone (a road zone is long).
SITE_RADIUS_M = 300

TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
WORKER_ERRORS = {
    **TOKEN_ERROR,
    400: {"model": ErrorResponse, "description": "The project is closed, has no location, or the visit state is wrong"},
    403: {"model": ErrorResponse, "description": "Not a field worker, not assigned, or the site code is wrong"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
    422: {"model": ErrorResponse, "description": "The phone is too far from the work zone"},
}
VIEW_ERRORS = {
    **TOKEN_ERROR,
    403: {"model": ErrorResponse, "description": "Only the project's contractor, winning provider or the admin"},
    404: {"model": ErrorResponse, "description": "The project does not exist"},
}


class CheckIn(BaseModel):
    code: str = Field(min_length=4, max_length=40)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class CheckOut(BaseModel):
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def site_code(project_id: int) -> str:
    # The same code every time for a project, and impossible to guess without SECRET_KEY,
    # so it needs no column in the database.
    digest = hmac.new(SECRET_KEY.encode(), f"site:{project_id}".encode(), hashlib.sha256).hexdigest()
    return digest[:10].upper()


def inside(point: tuple[float, float], polygon: list) -> bool:
    # Ray casting. point = (lat, lng); polygon = [[lng, lat], ...] like Project.work_zone.
    lat, lng = point
    result = False
    for i in range(len(polygon)):
        x1, y1 = polygon[i][0], polygon[i][1]
        x2, y2 = polygon[i - 1][0], polygon[i - 1][1]
        if (y1 > lat) != (y2 > lat) and lng < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            result = not result
    return result


def distance_to_site(project: Project, latitude: float, longitude: float) -> float:
    # 0 inside the work zone, otherwise the distance to the pin or the nearest corner of the zone.
    zone = [p for p in (project.work_zone or []) if isinstance(p, (list, tuple)) and len(p) >= 2]
    if len(zone) >= 3 and inside((latitude, longitude), zone):
        return 0.0
    points = [(project.latitude, project.longitude)] if project.latitude is not None else []
    points += [(p[1], p[0]) for p in zone]
    if not points:
        raise HTTPException(status_code=400, detail="The project has no saved location")
    return min(arcgis.distance_m(lat, lng, latitude, longitude) for lat, lng in points)


def open_visit(db: Session, project_id: int, worker_id: int) -> Attendance | None:
    return db.scalar(
        select(Attendance).where(
            Attendance.project_id == project_id,
            Attendance.worker_id == worker_id,
            Attendance.check_out_at.is_(None),
        )
    )


def can_manage(db: Session, project: Project, user: User) -> bool:
    if user.role == "admin":
        return True
    if user.role == "contractor":
        return project.contractor_id == user.user_id
    if user.role == "provider":
        quote = accepted_quote(db, project.project_id)
        return quote is not None and quote.provider_id == user.provider_id
    return False


def managed_project(db: Session, project_id: int, user: User) -> Project:
    project = get_project(db, project_id)
    if not can_manage(db, project, user):
        raise HTTPException(status_code=403, detail="Only the project's contractor or its provider can see this")
    return project


def my_status(db: Session, project: Project, user: User) -> dict:
    now = utc_now()
    visits = db.scalars(
        select(Attendance)
        .where(Attendance.project_id == project.project_id, Attendance.worker_id == user.user_id)
        .order_by(Attendance.attendance_id.desc())
        .limit(20)
    ).all()
    current = next((visit for visit in visits if visit.check_out_at is None), None)
    return {
        "project_id": project.project_id,
        "on_site": current is not None,
        "current": current.to_dict(now) if current else None,
        "total_minutes": sum(visit.minutes(now) for visit in visits),
        "visits": [visit.to_dict(now) for visit in visits],
        "radius_m": SITE_RADIUS_M,
    }


@router.get("/projects/{project_id}/site-code", responses=VIEW_ERRORS)
def get_site_code(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # The code inside the site QR. The provider prints it and puts it at the work zone.
    project = managed_project(db, project_id, user)
    return {"project_id": project.project_id, "project_name": project.project_name, "code": site_code(project_id)}


@router.get("/field-worker/projects/{project_id}/attendance", responses=WORKER_ERRORS)
def my_attendance(project_id: int, user: User = Depends(worker_only), db: Session = Depends(get_db)):
    return my_status(db, assigned_project(db, project_id, user), user)


@router.post("/field-worker/projects/{project_id}/attendance/check-in", status_code=201, responses=WORKER_ERRORS)
def check_in(project_id: int, data: CheckIn, user: User = Depends(worker_only), db: Session = Depends(get_db)):
    project = assigned_project(db, project_id, user)
    if project.project_status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"The project is {project.project_status}")
    if not hmac.compare_digest(data.code.strip().upper(), site_code(project_id)):
        raise HTTPException(status_code=403, detail="This QR code is not the code of this project")
    if open_visit(db, project_id, user.user_id) is not None:
        raise HTTPException(status_code=400, detail="You are already checked in at this site")
    distance = distance_to_site(project, data.latitude, data.longitude)
    if distance > SITE_RADIUS_M:
        raise HTTPException(
            status_code=422,
            detail=f"You are {distance:.0f} m from the work zone. Check in when you are within {SITE_RADIUS_M} m",
        )
    now = utc_now()
    db.add(Attendance(
        project_id=project_id,
        worker_id=user.user_id,
        check_in_at=now,
        check_in_latitude=data.latitude,
        check_in_longitude=data.longitude,
        check_in_distance_m=distance,
    ))
    # The same as the old check-in button: the work has started.
    project.last_check_in = now
    if project.site_status == "Not Started":
        project.site_status = "Work in Progress"
    log_activity(db, user, "checked_in", f'{user.full_name} arrived at "{project.project_name}"', project_id)
    notify_user(
        db,
        project.contractor_id,
        "worker_checked_in",
        "Field Worker Arrived",
        f'{user.full_name} checked in at the site of "{project.project_name}".',
        "/contractor-dashboard#projects",
    )
    db.commit()
    return my_status(db, project, user)


@router.post("/field-worker/projects/{project_id}/attendance/check-out", responses=WORKER_ERRORS)
def check_out(project_id: int, data: CheckOut, user: User = Depends(worker_only), db: Session = Depends(get_db)):
    project = assigned_project(db, project_id, user)
    visit = open_visit(db, project_id, user.user_id)
    if visit is None:
        raise HTTPException(status_code=400, detail="You are not checked in at this site")
    visit.check_out_at = utc_now()
    visit.check_out_latitude = data.latitude
    visit.check_out_longitude = data.longitude
    log_activity(
        db, user, "checked_out",
        f'{user.full_name} left "{project.project_name}" after {visit.minutes(visit.check_out_at)} min', project_id,
    )
    db.commit()
    return my_status(db, project, user)


@router.get("/projects/{project_id}/attendance", responses=VIEW_ERRORS)
def project_attendance(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Who is at the work zone now, and the visits of the team, for the contractor and the provider.
    managed_project(db, project_id, user)
    now = utc_now()
    rows = db.execute(
        select(Attendance, User.full_name)
        .join(User, User.user_id == Attendance.worker_id)
        .where(Attendance.project_id == project_id)
        .order_by(Attendance.attendance_id.desc())
        .limit(200)
    ).all()
    visits = [{**visit.to_dict(now), "worker_name": name} for visit, name in rows]
    workers: dict[int, dict] = {}
    for visit in visits:
        worker = workers.setdefault(
            visit["worker_id"],
            {"worker_id": visit["worker_id"], "worker_name": visit["worker_name"], "on_site": False,
             "since": None, "total_minutes": 0, "visits": 0},
        )
        worker["total_minutes"] += visit["minutes"]
        worker["visits"] += 1
        if visit["on_site"]:
            worker["on_site"] = True
            worker["since"] = visit["check_in_at"]
    return {
        "project_id": project_id,
        "on_site_now": sum(1 for worker in workers.values() if worker["on_site"]),
        "workers": list(workers.values()),
        "visits": visits,
    }
