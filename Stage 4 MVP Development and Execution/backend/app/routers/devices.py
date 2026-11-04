from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import arcgis
from app.core.access import assigned_project
from app.core.security import allow_roles
from app.db.database import get_db
from app.models import User
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
        401: {"model": ErrorResponse, "description": "The token is missing or not valid"},
        403: {"model": ErrorResponse, "description": "The user is not a field worker, or is not assigned to this project"},
        404: {"model": ErrorResponse, "description": "The project, or the device of this project, does not exist"},
        422: {"model": ErrorResponse, "description": "The worker is more than 50 m from the device, or the position is not valid"},
        502: {"model": ErrorResponse, "description": "The ArcGIS map service could not be reached"},
    },
)
def verify_device(
    device: str,
    data: DeviceVerificationRequest,
    user: User = Depends(worker_only),
    db: Session = Depends(get_db),
):
    # The phone already checks the distance, but the server checks it again with the planned
    # point from ArcGIS, so a changed phone request cannot pass.
    # device is the device_id (3001) or the device_code (TC-001) of the MAMAR Traffic Devices layer.
    assigned_project(db, data.project_id, user)
    try:
        planned = arcgis.planned_device_point(device, data.project_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail="Device not found for this project") from error
    except arcgis.ArcGISError as error:
        raise HTTPException(status_code=502, detail=f"Could not read the planned device location: {error}") from error
    if planned is None:
        raise HTTPException(status_code=404, detail="Device not found for this project")
    distance = arcgis.distance_m(planned[0], planned[1], data.latitude, data.longitude)
    if distance > MAX_DISTANCE_METERS:
        raise HTTPException(
            status_code=422,
            detail=f"You are {round(distance)} m from the planned location. Move within {MAX_DISTANCE_METERS} m and capture again.",
        )
    return {
        "device": device,
        "project_id": data.project_id,
        "planned_latitude": planned[0],
        "planned_longitude": planned[1],
        "distance_m": round(distance, 1),
        "max_distance_m": MAX_DISTANCE_METERS,
        "status": "Verified",
    }
