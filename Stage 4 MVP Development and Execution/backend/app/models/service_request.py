from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

# The three request statuses in Stage 3. A new request starts as open.
REQUEST_STATUSES = ("open", "awarded", "closed")


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    __table_args__ = (
        CheckConstraint("status IN ('open', 'awarded', 'closed')", name="ck_service_requests_status"),
    )

    request_id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"))
    title: Mapped[str] = mapped_column(String(150))
    details: Mapped[str | None] = mapped_column(Text)
    required_by: Mapped[date]
    status: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    # The quotes that providers sent for this request, oldest first.
    quotes: Mapped[list["Quote"]] = relationship(order_by="Quote.quote_id")  # noqa: F821

    def award(self, quote_id: int) -> "Quote":  # noqa: F821
        # Stage 3, section 2.2.4: accepts the quote that the contractor picked, rejects all the
        # other quotes and marks the request as awarded. Returns the accepted quote.
        if self.status != "open":
            raise ValueError(f"the request is {self.status}, only an open request can be awarded")
        chosen = next((quote for quote in self.quotes if quote.quote_id == quote_id), None)
        if chosen is None:
            raise LookupError("the quote does not belong to this request")
        for quote in self.quotes:
            if quote is chosen:
                quote.accept()
            else:
                quote.reject()
        self.status = "awarded"
        return chosen

    def close(self) -> None:
        # Marks an open request as closed when no more quotes are needed (Stage 3, section 2.2.4).
        if self.status != "open":
            raise ValueError(f"the request is {self.status}, only an open request can be closed")
        self.status = "closed"

    def to_dict(self) -> dict:
        # Returns the request as JSON, with the same fields as Stage 3, section 4.2.8.
        return {
            "request_id": self.request_id,
            "project_id": self.project_id,
            "title": self.title,
            "details": self.details,
            "required_by": self.required_by,
            "status": self.status,
            "created_at": self.created_at,
        }
