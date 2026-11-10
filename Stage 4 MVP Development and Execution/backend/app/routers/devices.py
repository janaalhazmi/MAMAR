from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core import arcgis
from app.core.access import assigned_project, open_project_or_400
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
    return {
        "device": device,
        "project_id": data.project_id,
        "planned_latitude": planned[0],
        "planned_longitude": planned[1],
        "distance_m": round(distance, 1),
        "max_distance_m": MAX_DISTANCE_METERS,
        "status": "Verified",
    }
