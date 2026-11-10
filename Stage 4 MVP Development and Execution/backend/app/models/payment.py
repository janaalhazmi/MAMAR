from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

# created: sent to PayPal, waiting for the contractor. completed: paid. failed: PayPal declined it.
# cancelled: the contractor cancelled on PayPal, or started a new payment.
PAYMENT_STATUSES = ("created", "completed", "failed", "cancelled")


class Payment(Base):
    # The contractor pays for the accepted quotation of a project through PayPal (sandbox).
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("status IN ('created', 'completed', 'failed', 'cancelled')", name="ck_payments_status"),
    )

    payment_id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"))
    quote_id: Mapped[int] = mapped_column(ForeignKey("quotes.quote_id"))
    contractor_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    # The quote price in riyals, and what PayPal charged in dollars.
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="SAR")
    charged_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    charged_currency: Mapped[str] = mapped_column(String(3), default="USD")
    paypal_order_id: Mapped[str] = mapped_column(String(64), unique=True)
    paypal_capture_id: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(20), default="created")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    paid_at: Mapped[datetime | None]

    def to_dict(self) -> dict:
        return {
            "payment_id": self.payment_id,
            "project_id": self.project_id,
            "quote_id": self.quote_id,
            "amount": float(self.amount),
            "currency": self.currency,
            "charged_amount": float(self.charged_amount),
            "charged_currency": self.charged_currency,
            "paypal_order_id": self.paypal_order_id,
            "status": self.status,
            "created_at": self.created_at,
            "paid_at": self.paid_at,
        }
