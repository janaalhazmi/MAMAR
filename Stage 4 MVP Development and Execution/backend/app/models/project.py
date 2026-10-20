from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

# The four project statuses in Stage 3. A new project starts as draft.
PROJECT_STATUSES = ("draft", "active", "completed", "cancelled")


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(
            "project_status IN ('draft', 'active', 'completed', 'cancelled')",
            name="ck_projects_project_status",
        ),
    )

    project_id: Mapped[int] = mapped_column(primary_key=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    project_name: Mapped[str] = mapped_column(String(150))
    project_status: Mapped[str] = mapped_column(String(20))
    closure_type: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[date]
    end_date: Mapped[date]
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def update_status(self, status: str) -> None:
        # Moves project_status between draft, active, completed and cancelled (Stage 3, section 2.2.3).
        if status not in PROJECT_STATUSES:
            raise ValueError(f"project_status must be one of: {', '.join(PROJECT_STATUSES)}")
        self.project_status = status

    def to_dict(self) -> dict:
        # Returns the project as JSON, with the same fields as GET /projects in Stage 3.
        return {
            "project_id": self.project_id,
            "contractor_id": self.contractor_id,
            "project_name": self.project_name,
            "project_status": self.project_status,
            "closure_type": self.closure_type,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "description": self.description,
            "created_at": self.created_at,
        }
