from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, func, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('contractor', 'provider', 'worker', 'admin')", name="ck_users_role"),
    )

    user_id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[str] = mapped_column(String(20))
    # NULL for contractors and admins
    provider_id: Mapped[int | None] = mapped_column(ForeignKey("providers.provider_id"))
    is_active: Mapped[bool] = mapped_column(server_default=true())
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
