from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Review(Base):
    # The contractor rates the provider once, after approving the finished project.
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),)

    review_id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"), unique=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.provider_id"), index=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    rating: Mapped[int] = mapped_column(SmallInteger)
    comment: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def to_dict(self) -> dict:
        return {
            "review_id": self.review_id,
            "project_id": self.project_id,
            "provider_id": self.provider_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at,
        }
