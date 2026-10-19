from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


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
