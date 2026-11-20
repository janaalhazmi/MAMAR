from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Activity(Base):
    # The audit log: who did what and when. Only the admin reads it.
    __tablename__ = "activity_log"

    activity_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.user_id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(50))
    detail: Mapped[str] = mapped_column(String(300))
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.project_id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), index=True)

    def to_dict(self) -> dict:
        return {
            "activity_id": self.activity_id,
            "user_id": self.user_id,
            "action": self.action,
            "detail": self.detail,
            "project_id": self.project_id,
            "created_at": self.created_at,
        }
