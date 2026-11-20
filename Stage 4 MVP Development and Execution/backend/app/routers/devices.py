from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import arcgis
from app.core.access import accepted_quote, assigned_project, open_project_or_400
from app.core.security import allow_roles, get_current_user
from app.db.database import get_db
from app.models import ProjectDevice, User
from app.routers.attendance import managed_project
from app.services.activity import log_activity
from app.services.notifications import notify_user
from app.schemas.error import ErrorResponse
from app.schemas.workflow import DeviceVerificationRequest, DeviceVerificationResponse

router = APIRouter(tags=["devices"])

worker_only = allow_roles("worker", detail="Only field workers can verify devices")

# The same limit as MAX_DISTANCE_METERS in the frontend (fieldWork.js).
MAX_DISTANCE_METERS = 50


@router.post(
    "/devices/{device}/verify",
    response_model=DeviceVerificationResponse,
    responses={
        400: {"model": ErrorResponse, "description": "The project is completed or cancelled"},
        401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
        403: {"model": ErrorResponse, "description": "The user is not a field worker, or is not assigned to this project"},
        404: {"model": ErrorResponse, "description": "The project does not exist, or neither the device nor the project location is saved"},
        422: {"model": ErrorResponse, "description": "The worker is more than 50 m from the device, or the position is not valid"},
        502: {"model": ErrorResponse, "description": "The ArcGIS map service could not be reached and the project has no saved location"},
    },
)
def verify_device(
    device: str,
    data: DeviceVerificationRequest,
    user: User = Depends(worker_only),
    db: Session = Depends(get_db),
):
    # The phone already checks the distance, but the server checks it again, so a changed phone
    # request cannot pass. The planned point is the device in the MAMAR Traffic Devices layer
    # (device_id 3001 or device_code TC-001). A new project has no devices in that layer yet, so
    # then the server uses the location the contractor saved for the project, the same point the
    # Device Verification page shows.
    project = open_project_or_400(assigned_project(db, data.project_id, user))
    map_error = None
    try:
        planned = arcgis.planned_device_point(device, data.project_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Device not found for this project") from error
    except arcgis.ArcGISError as error:
        planned, map_error = None, error
    if planned is None and project.latitude is not None and project.longitude is not None:
        planned = (project.latitude, project.longitude)
    if planned is None:
        if map_error is not None:
            raise HTTPException(status_code=502, detail=f"Could not read the planned device location: {map_error}")
        raise HTTPException(
            status_code=404,
            detail="Device not found for this project, and the project has no saved location",
        )
    distance = arcgis.distance_m(planned[0], planned[1], data.latitude, data.longitude)
    if distance > MAX_DISTANCE_METERS:
        raise HTTPException(
            status_code=422,
            detail=f"You are {round(distance)} m from the planned location. Move within {MAX_DISTANCE_METERS} m and capture again.",
        )
    # Save the result, so the provider and the contractor see it (and it stays after a refresh).
    row = find_device(db, data.project_id, device) or ProjectDevice(project_id=data.project_id, code=clean_code(device), name="Traffic device")
    row.status = "Verified"
    row.verified_at = datetime.now(timezone.utc).replace(tzinfo=None)
    row.verified_by = user.user_id
    row.verified_latitude, row.verified_longitude = data.latitude, data.longitude
    row.planned_latitude, row.planned_longitude = planned
    row.distance_m = round(distance, 1)
    db.add(row)
    log_activity(db, user, "device_verified", f"{row.code} verified {round(distance)} m from its planned point", data.project_id)
    quote = accepted_quote(db, data.project_id)
    if quote is not None:
        for owner in db.scalars(select(User).where(User.provider_id == quote.provider_id, User.role == "provider")):
            notify_user(db, owner.user_id, "device_verified", "Device verified",
                        f"{user.full_name} verified {row.code} on {project.project_name}.",
                        f"/provider/device-verification/{data.project_id}")
    db.commit()
    return {
        "device": device,
        "project_id": data.project_id,
        "planned_latitude": planned[0],
        "planned_longitude": planned[1],
        "distance_m": round(distance, 1),
        "max_distance_m": MAX_DISTANCE_METERS,
        "status": "Verified",
    }


# ---------- Devices of a project ----------

provider_only = allow_roles("provider", detail="Only the project's provider can add devices")
DEVICE_ERRORS = {
    401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
    403: {"model": ErrorResponse, "description": "Not the project's contractor, its provider or an assigned worker"},
    404: {"model": ErrorResponse, "description": "The project or the device does not exist"},
}


class DeviceIn(BaseModel):
    code: str = Field(min_length=1, max_length=30, examples=["TC-014"])
    name: str = Field(default="Traffic device", max_length=80, examples=["Arrow board"])


def clean_code(code: str) -> str:
    code = code.strip().upper()
    if not code or not all(char.isalnum() or char in "-_" for char in code):
        raise HTTPException(status_code=422, detail="A device code uses letters, numbers, - and _ only")
    return code


def find_device(db: Session, project_id: int, code: str) -> ProjectDevice | None:
    return db.scalar(select(ProjectDevice).where(ProjectDevice.project_id == project_id, ProjectDevice.code == clean_code(code)))


def device_list(db: Session, project_id: int) -> dict:
    rows = db.execute(
        select(ProjectDevice, User.full_name)
        .outerjoin(User, User.user_id == ProjectDevice.verified_by)
        .where(ProjectDevice.project_id == project_id)
        .order_by(ProjectDevice.code)
    ).all()
    devices = [device.to_dict(name) for device, name in rows]
    verified = sum(1 for device in devices if device["status"] == "Verified")
    return {"project_id": project_id, "total": len(devices), "verified": verified,
            "pending": len(devices) - verified, "devices": devices}


@router.get("/provider/projects/{project_id}/devices", responses=DEVICE_ERRORS)
def project_devices(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # The devices of the project and their last verification, for the provider and the contractor.
    managed_project(db, project_id, user)
    return device_list(db, project_id)


@router.get("/field-worker/projects/{project_id}/devices", responses=DEVICE_ERRORS)
def worker_project_devices(project_id: int, user: User = Depends(worker_only), db: Session = Depends(get_db)):
    assigned_project(db, project_id, user)
    return device_list(db, project_id)


@router.post("/provider/projects/{project_id}/devices", status_code=201,
             responses={**DEVICE_ERRORS, 409: {"model": ErrorResponse, "description": "The code is already used in this project"}})
def add_project_device(project_id: int, data: DeviceIn, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    project = open_project_or_400(managed_project(db, project_id, user))
    code = clean_code(data.code)
    if find_device(db, project_id, code):
        raise HTTPException(status_code=409, detail=f"{code} is already in this project")
    db.add(ProjectDevice(project_id=project_id, code=code, name=data.name.strip() or "Traffic device"))
    log_activity(db, user, "device_added", f"Added device {code}", project.project_id)
    db.commit()
    return device_list(db, project_id)


@router.delete("/provider/projects/{project_id}/devices/{code}", responses=DEVICE_ERRORS)
def remove_project_device(project_id: int, code: str, user: User = Depends(provider_only), db: Session = Depends(get_db)):
    managed_project(db, project_id, user)
    row = find_device(db, project_id, code)
    if row is None:
        raise HTTPException(status_code=404, detail="Device not found in this project")
    db.delete(row)
    db.commit()
    return device_list(db, project_id)
