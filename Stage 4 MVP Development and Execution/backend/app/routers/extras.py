from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core import weather
from app.core.access import accepted_quote, can_view_project, get_project
from app.core.receipt import receipt_pdf
from app.core.security import get_current_user
from app.db.database import get_db
from app.models import Payment, Provider, User
from app.schemas.error import ErrorResponse

router = APIRouter(tags=["extras"])

TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}


@router.get(
    "/projects/{project_id}/weather",
    responses={
        **TOKEN_ERROR,
        400: {"model": ErrorResponse, "description": "The project has no saved location"},
        403: {"model": ErrorResponse, "description": "The user cannot view this project"},
        404: {"model": ErrorResponse, "description": "The project does not exist"},
        502: {"model": ErrorResponse, "description": "The weather service could not be reached"},
    },
)
def project_weather(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # The forecast at the work zone (Open-Meteo) for the project days, with safety alerts.
    # Shows the days of the project that are in the next 16 days, or the next 7 days if none are.
    project = get_project(db, project_id)
    if not can_view_project(db, project, user):
        raise HTTPException(status_code=403, detail="You cannot view this project")
    if project.latitude is None or project.longitude is None:
        raise HTTPException(status_code=400, detail="The project has no saved location")
    try:
        days = weather.forecast(project.latitude, project.longitude)
    except weather.WeatherError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    start, end = project.start_date.isoformat(), project.end_date.isoformat()
    project_days = [day for day in days if start <= day["date"] <= end]
    shown = project_days or days[:7]
    return {
        "project_id": project_id,
        "location": project.location,
        "project_days": bool(project_days),
        "days": shown,
        "alerts": sum(1 for day in shown if day["alerts"]),
        "source": "Open-Meteo",
        "updated": date.today().isoformat(),
    }


@router.get(
    "/payments/{payment_id}/receipt",
    response_class=Response,
    responses={
        **TOKEN_ERROR,
        200: {"content": {"application/pdf": {}}, "description": "The receipt as a PDF file"},
        400: {"model": ErrorResponse, "description": "The payment is not completed"},
        403: {"model": ErrorResponse, "description": "The user is not the project's contractor or its winning provider"},
        404: {"model": ErrorResponse, "description": "The payment does not exist"},
    },
)
def payment_receipt(payment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # A PDF receipt of a completed payment, for the contractor and the winning provider.
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    project = get_project(db, payment.project_id)
    quote = accepted_quote(db, project.project_id)
    allowed = (user.role == "contractor" and project.contractor_id == user.user_id) or (
        user.role == "provider" and quote is not None and quote.provider_id == user.provider_id
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="You cannot view this receipt")
    if payment.status != "completed":
        raise HTTPException(status_code=400, detail="The payment is not completed")
    provider = db.get(Provider, quote.provider_id) if quote else None
    contractor = db.get(User, project.contractor_id)
    pdf = receipt_pdf(payment, project, provider, contractor)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="mamar-receipt-{payment.payment_id}.pdf"'},
    )
