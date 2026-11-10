from datetime import datetime, timezone

from sqlalchemy import Boolean, ForeignKey, String, Text, func, false
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(String(50), nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)

    link: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.notification_id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "link": self.link,
            "read": self.is_read,
            "created_at": self.created_at.replace(tzinfo=timezone.utc).isoformat() if self.created_at else None,
        }
