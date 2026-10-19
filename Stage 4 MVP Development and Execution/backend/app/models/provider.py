from datetime import datetime

from sqlalchemy import String, false, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Provider(Base):
    __tablename__ = "providers"

    provider_id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(150))
    service_type: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(50))
    phone: Mapped[str | None] = mapped_column(String(20))
    website: Mapped[str | None] = mapped_column(String(255))
    is_verified: Mapped[bool] = mapped_column(server_default=false())
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
