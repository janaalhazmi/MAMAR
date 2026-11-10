from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import allow_roles
from app.db.database import get_db
from app.models import Notification, User

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
