from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, CheckConstraint, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Quote(Base):
    __tablename__ = "quotes"
    __table_args__ = (
        # A provider cannot send two quotes for the same request.
        UniqueConstraint("request_id", "provider_id", name="uq_quotes_request_provider"),
        CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name="ck_quotes_status"),
    )

    quote_id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("service_requests.request_id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.provider_id"))
    # in SAR
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    duration_days: Mapped[int]
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    # Added for the Prepare Quotation page: when the provider can start, and the services
    # the price covers. Optional, and last, so a new and an upgraded database match.
    start_date: Mapped[date | None]
    services: Mapped[list[str] | None] = mapped_column(JSON)

    # accept() and reject() are only called from ServiceRequest.award() (Stage 3, section 2.2.5).
    def accept(self) -> None:
        self.status = "accepted"

    def reject(self) -> None:
        self.status = "rejected"

    def to_dict(self) -> dict:
        # Returns the quote as JSON, with the same fields as Stage 3, section 4.2.10.
        # price is a number in JSON, like 18500.0, and not the text "18500.00".
        return {
            "quote_id": self.quote_id,
            "request_id": self.request_id,
            "provider_id": self.provider_id,
            "price": float(self.price),
            "duration_days": self.duration_days,
            "notes": self.notes,
            "start_date": self.start_date,
            "services": list(self.services or []),
            "status": self.status,
            "created_at": self.created_at,
        }
