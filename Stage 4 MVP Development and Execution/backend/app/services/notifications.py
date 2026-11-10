from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Notification, User


def notify_user(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    link: str | None = None,
):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
    )

    db.add(notification)
    return notification


def notify_provider(
    db: Session,
    provider_id: int,
    notification_type: str,
    title: str,
    message: str,
    link: str | None = None,
):
    users = db.scalars(
        select(User).where(
            User.provider_id == provider_id,
            User.role == "provider",
            User.is_active.is_(True),
        )
    ).all()

    for user in users:
        notify_user(
            db,
            user.user_id,
            notification_type,
            title,
            message,
            link,
        )


def notify_all_providers(
    db: Session,
    notification_type: str,
    title: str,
    message: str,
    link: str | None = None,
):
    users = db.scalars(
        select(User).where(
            User.role == "provider",
            User.is_active.is_(True),
        )
    ).all()

    for user in users:
        notify_user(
            db,
            user.user_id,
            notification_type,
            title,
            message,
            link,
        )
