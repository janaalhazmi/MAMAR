from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ProjectDevice(Base):
    # A traffic device of a project (cone, sign, barrier...), known by the code on its QR label.
    # The provider adds it; a field worker verifies it on site with the phone GPS, and the last
    # verification is saved here so the provider and the contractor can see it after a refresh.
    __tablename__ = "project_devices"
    __table_args__ = (UniqueConstraint("project_id", "code", name="uq_project_device_code"),)

    device_pk: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"), index=True)
    code: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(80), default="Traffic device")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    status: Mapped[str] = mapped_column(String(20), default="Pending")
    verified_at: Mapped[datetime | None]
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    verified_latitude: Mapped[float | None]
    verified_longitude: Mapped[float | None]
    planned_latitude: Mapped[float | None]
    planned_longitude: Mapped[float | None]
    distance_m: Mapped[float | None]

    def to_dict(self, worker_name: str | None = None) -> dict:
        return {
            "code": self.code,
            "name": self.name,
            "status": self.status,
            "verified_at": self.verified_at,
            "verified_by": worker_name,
            "distance_m": self.distance_m,
            "latitude": self.verified_latitude,
            "longitude": self.verified_longitude,
            "planned_latitude": self.planned_latitude,
            "planned_longitude": self.planned_longitude,
        }
