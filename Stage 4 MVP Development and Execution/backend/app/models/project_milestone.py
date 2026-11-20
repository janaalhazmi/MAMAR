from datetime import datetime

from sqlalchemy import (
    String, Integer, DateTime, ForeignKey,
    UniqueConstraint, CheckConstraint, func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


MILESTONES = [
    "Site Preparation",
    "Traffic Control Installation",
    "Final Site Check",
]


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "name",
            name="uq_project_milestone_name"
        ),
        CheckConstraint(
            "status IN ('pending', 'in_progress', 'completed')",
            name="ck_project_milestone_status"
        ),
    )

    milestone_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.project_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        server_default="pending",
        nullable=False
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False
    )

    def to_dict(self):
        return {
            "milestone_id": self.milestone_id,
            "project_id": self.project_id,
            "name": self.name,
            "status": self.status,
            "updated_at": self.updated_at,
        }