from datetime import datetime

from sqlalchemy import JSON, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class AIResult(Base):
    # Saved AI answers, so the same photo, the same quotes or the same day are never paid for
    # twice. key examples: "photo:12", "quotes:5:<hash>", "summary:3:2026-11-14".
    __tablename__ = "ai_results"

    result_id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.project_id"), index=True)
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
