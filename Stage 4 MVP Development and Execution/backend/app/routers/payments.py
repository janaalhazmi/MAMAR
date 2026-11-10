from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import paypal
from app.core.access import accepted_quote, get_project, own_project
from app.core.config import FRONTEND_ORIGINS, normalize_origin
from app.core.security import allow_roles, get_current_user
from app.db.database import get_db
from app.models import Payment, Project, User
from app.routers.field_work import utc_now
from app.schemas.error import ErrorResponse
from app.schemas.payment import PaymentResponse, PaymentStart, PaymentStarted

# Issue #48: the contractor pays for the accepted quotation through PayPal in sandbox mode.
#   1. POST /projects/{id}/payments          -> approve_url (the PayPal page)
#   2. The contractor pays on PayPal with a sandbox buyer account.
#   3. PayPal sends them back to return_url?token=<order id>, and the page calls
#      POST /payments/orders/{order id}/capture, which takes the money and saves "completed".
#      Cancelling on PayPal goes to cancel_url?token=<order id> -> POST .../cancel.
router = APIRouter(tags=["payments"])

contractor_only = allow_roles("contractor", detail="Only contractors can pay")

TOKEN_ERROR = {401: {"model": ErrorResponse, "description": "The token is missing or not valid"}}
PAYPAL_ERRORS = {
    502: {"model": ErrorResponse, "description": "PayPal could not be reached, or it refused the request"},
    503: {"model": ErrorResponse, "description": "The PayPal keys are not set on the server"},
}
NOT_CONFIGURED = "Payments are not set up on the server yet (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET)"


def check_site_url(url: str, field: str) -> str:
    # PayPal only sends the contractor back to the MAMAR site, never to another website.
    if not url.startswith(("https://", "http://")) or normalize_origin(url) not in FRONTEND_ORIGINS:
        raise HTTPException(status_code=422, detail=f"{field} must be a page of the MAMAR site")
    return url


def own_payment(db: Session, order_id: str, user: User) -> Payment:
    payment = db.scalar(select(Payment).where(Payment.paypal_order_id == order_id))
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.contractor_id != user.user_id:
        raise HTTPException(status_code=403, detail="This payment belongs to another contractor")
    return payment


@router.post(
    "/projects/{project_id}/payments",
    status_code=201,
    response_model=PaymentStarted,
    responses={
        **TOKEN_ERROR,
        **PAYPAL_ERRORS,
        400: {"model": ErrorResponse, "description": "No quotation is accepted for this project yet"},
        403: {"model": ErrorResponse, "description": "The user is not a contractor, or the project belongs to another contractor"},
        404: {"model": ErrorResponse, "description": "The project does not exist"},
        409: {"model": ErrorResponse, "description": "The project is already paid"},
        422: {"model": ErrorResponse, "description": "return_url or cancel_url is not a page of the MAMAR site"},
    },
)
def start_payment(
    project_id: int,
    data: PaymentStart,
    user: User = Depends(contractor_only),
    db: Session = Depends(get_db),
):
    project = own_project(db, project_id, user)
    quote = accepted_quote(db, project_id)
    if quote is None:
        raise HTTPException(status_code=400, detail="Confirm a provider's quotation before paying")
    paid = select(Payment).where(Payment.project_id == project_id, Payment.status == "completed")
    if db.scalar(paid) is not None:
        raise HTTPException(status_code=409, detail="This project is already paid")
    return_url = check_site_url(data.return_url, "return_url")
    cancel_url = check_site_url(data.cancel_url, "cancel_url")

    usd = paypal.sar_to_usd(quote.price)
    try:
        order_id, approve_url = paypal.create_order(
            usd,
            reference=f"MAMAR-{project_id}",
            description=f"MAMAR project {project_id}: {project.project_name}",
            return_url=return_url,
            cancel_url=cancel_url,
        )
    except paypal.PayPalNotConfigured:
        raise HTTPException(status_code=503, detail=NOT_CONFIGURED)
    except paypal.PayPalError as error:
        raise HTTPException(status_code=502, detail=str(error))

    # Only the newest unfinished payment stays open.
    for old in db.scalars(select(Payment).where(Payment.project_id == project_id, Payment.status == "created")):
        old.status = "cancelled"
    payment = Payment(
        project_id=project_id,
        quote_id=quote.quote_id,
        contractor_id=user.user_id,
        amount=quote.price,
        currency="SAR",
        charged_amount=usd,
        charged_currency="USD",
        paypal_order_id=order_id,
        status="created",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"payment": payment.to_dict(), "approve_url": approve_url}


@router.post(
    "/payments/orders/{order_id}/capture",
    response_model=PaymentResponse,
    responses={
        **TOKEN_ERROR,
        **PAYPAL_ERRORS,
        400: {"model": ErrorResponse, "description": "The payment was not approved on PayPal, or it was cancelled"},
        402: {"model": ErrorResponse, "description": "PayPal declined the payment"},
        403: {"model": ErrorResponse, "description": "The payment belongs to another contractor"},
        404: {"model": ErrorResponse, "description": "The payment does not exist"},
    },
)
def capture_payment(order_id: str, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    # Called by the return page with the token PayPal put in the URL. Calling it again is safe.
    payment = own_payment(db, order_id, user)
    if payment.status == "completed":
        return payment.to_dict()
    if payment.status == "cancelled":
        raise HTTPException(status_code=400, detail="This payment was cancelled. Start a new payment")
    try:
        result, capture_id = paypal.capture_order(order_id)
    except paypal.PayPalNotConfigured:
        raise HTTPException(status_code=503, detail=NOT_CONFIGURED)
    except paypal.PayPalError as error:
        raise HTTPException(status_code=502, detail=str(error))
    if result == "NOT_APPROVED":
        raise HTTPException(status_code=400, detail="The payment was not approved on PayPal yet")
    if result == "COMPLETED":
        payment.status = "completed"
        payment.paypal_capture_id = capture_id
        payment.paid_at = utc_now()
        db.commit()
        db.refresh(payment)
        return payment.to_dict()
    payment.status = "failed"
    db.commit()
    raise HTTPException(status_code=402, detail="PayPal declined the payment. Try another account or card")


@router.post(
    "/payments/orders/{order_id}/cancel",
    response_model=PaymentResponse,
    responses={
        **TOKEN_ERROR,
        403: {"model": ErrorResponse, "description": "The payment belongs to another contractor"},
        404: {"model": ErrorResponse, "description": "The payment does not exist"},
        409: {"model": ErrorResponse, "description": "The payment is already completed"},
    },
)
def cancel_payment(order_id: str, user: User = Depends(contractor_only), db: Session = Depends(get_db)):
    # Called by the cancel page when the contractor pressed Cancel on PayPal.
    payment = own_payment(db, order_id, user)
    if payment.status == "completed":
        raise HTTPException(status_code=409, detail="This payment is already completed")
    if payment.status == "created":
        payment.status = "cancelled"
        db.commit()
        db.refresh(payment)
    return payment.to_dict()


@router.get(
    "/projects/{project_id}/payments",
    response_model=list[PaymentResponse],
    responses={
        **TOKEN_ERROR,
        403: {"model": ErrorResponse, "description": "The user is not the project's contractor or its winning provider"},
        404: {"model": ErrorResponse, "description": "The project does not exist"},
    },
)
def list_payments(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # The contractor sees the payments of their project, and the winning provider sees them too.
    project: Project = get_project(db, project_id)
    quote = accepted_quote(db, project_id)
    allowed = (user.role == "contractor" and project.contractor_id == user.user_id) or (
        user.role == "provider" and quote is not None and quote.provider_id == user.provider_id
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="You cannot view the payments of this project")
    payments = db.scalars(
        select(Payment).where(Payment.project_id == project_id).order_by(Payment.payment_id.desc())
    ).all()
    return [payment.to_dict() for payment in payments]
