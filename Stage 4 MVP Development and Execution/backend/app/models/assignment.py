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

    def complete(self) -> None:
        # Marks the assignment as completed when the worker finishes the field work (Stage 3, section 2.2.6).
        if self.status != "active":
            raise ValueError(f"the assignment is {self.status}, only an active assignment can be completed")
        self.status = "completed"

    def to_dict(self) -> dict:
        # Returns the assignment as JSON, with the same fields as Stage 3, section 4.2.13.
        return {
            "assignment_id": self.assignment_id,
            "project_id": self.project_id,
            "provider_id": self.provider_id,
            "worker_id": self.worker_id,
            "assigned_at": self.assigned_at,
            "status": self.status,
        }
