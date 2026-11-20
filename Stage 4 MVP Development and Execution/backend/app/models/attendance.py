from datetime import datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Attendance(Base):
    # One visit of a field worker to the work zone: scanned in with the site QR code and the
    # phone GPS, and scanned out when leaving. An open visit has no check_out_at.
    __tablename__ = "attendance"

    attendance_id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"), index=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), index=True)
    check_in_at: Mapped[datetime] = mapped_column(server_default=func.now())
    check_in_latitude: Mapped[float]
    check_in_longitude: Mapped[float]
    check_in_distance_m: Mapped[float]
    check_out_at: Mapped[datetime | None]
    check_out_latitude: Mapped[float | None]
    check_out_longitude: Mapped[float | None]

    def minutes(self, now: datetime) -> int:
        # The time on site so far, or of the whole visit when it is closed.
        end = self.check_out_at or now
        return max(0, int((end - self.check_in_at).total_seconds() // 60))

    def to_dict(self, now: datetime) -> dict:
        return {
            "attendance_id": self.attendance_id,
            "project_id": self.project_id,
            "worker_id": self.worker_id,
            "check_in_at": self.check_in_at,
            "check_out_at": self.check_out_at,
            "distance_m": round(self.check_in_distance_m),
            "minutes": self.minutes(now),
            "on_site": self.check_out_at is None,
        }
