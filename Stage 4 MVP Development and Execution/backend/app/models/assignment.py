from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (
        # The same field worker cannot be assigned to one project twice.
        UniqueConstraint("project_id", "worker_id", name="uq_assignments_project_worker"),
        CheckConstraint("status IN ('active', 'completed', 'cancelled')", name="ck_assignments_status"),
    )

    assignment_id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.provider_id"))
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    assigned_at: Mapped[datetime] = mapped_column(server_default=func.now())
    status: Mapped[str] = mapped_column(String(20))
