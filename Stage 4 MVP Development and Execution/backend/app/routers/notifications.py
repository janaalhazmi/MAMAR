import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Notification, User
from app.services import sms

router = APIRouter(prefix="/notifications", tags=["notifications"])

authenticated_user = allow_roles("contractor", "provider", "worker", "admin", detail="Authentication required")


@router.get("")
def get_notifications(
    user: User = Depends(authenticated_user),
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.user_id)
        .order_by(Notification.created_at.desc(), Notification.notification_id.desc())
        .limit(100)
    ).all()

    return [notification.to_dict() for notification in notifications]


@router.get("/unread-count")
def get_unread_count(
    user: User = Depends(authenticated_user),
    db: Session = Depends(get_db),
):
    count = db.scalar(
        select(func.count(Notification.notification_id)).where(
            Notification.user_id == user.user_id,
            Notification.is_read.is_(False),
        )
    )

    return {"unread_count": count or 0}


@router.patch("/read-all")
def mark_all_as_read(
    user: User = Depends(authenticated_user),
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(Notification).where(
            Notification.user_id == user.user_id,
            Notification.is_read.is_(False),
        )
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {"message": "All notifications marked as read"}


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    user: User = Depends(authenticated_user),
    db: Session = Depends(get_db),
):
    notification = db.scalar(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.user_id == user.user_id,
        )
    )

    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return notification.to_dict()


@router.get("/channels")
def notification_channels(user: User = Depends(authenticated_user)):
    # Where this user's notifications go: always the site, and WhatsApp/SMS when Twilio is on.
    phone = sms.saudi_number(user.phone)
    return {
        "in_app": True,
        "messages_enabled": sms.enabled(),
        "channel": "whatsapp" if sms.enabled() and sms.config.TWILIO_FROM.startswith("whatsapp:") else "sms",
        "phone_saved": phone is not None,
        # Only the last digits, so the page can say where the message goes.
        "phone_hint": f"…{phone[-4:]}" if phone else None,
    }


_last_test: dict[int, float] = {}


@router.post("/test-message")
def send_test_message(user: User = Depends(authenticated_user)):
    # Sends a short test message to the signed-in user's own phone, at most once a minute.
    now = time.time()
    if now - _last_test.get(user.user_id, 0) < 60:
        raise HTTPException(status_code=429, detail="Wait a minute before sending another test message")
    _last_test[user.user_id] = now
    try:
        to = sms.send_now(user.phone, f"MAMAR: Hello {user.full_name}, notifications reach your phone.")
    except sms.SmsError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"sent": True, "phone_hint": f"…{to[-4:]}"}
