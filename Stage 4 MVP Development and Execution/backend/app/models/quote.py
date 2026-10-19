from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text, UniqueConstraint, func
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
