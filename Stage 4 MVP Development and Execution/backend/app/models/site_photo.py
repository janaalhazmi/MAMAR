import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, LargeBinary, String, func
from sqlalchemy.orm import Mapped, deferred, mapped_column

from app.db.database import Base

# The photo types a field worker can upload, and the biggest file we accept.
PHOTO_TYPES = ("image/jpeg", "image/png", "image/webp")
PHOTO_STAGES = ("before", "during", "after")
MAX_PHOTO_BYTES = 5 * 1024 * 1024


def new_token() -> str:
    return uuid.uuid4().hex


class SitePhoto(Base):
    # A photo that a field worker took on site. The file is saved in PostgreSQL because the
    # free Render server deletes uploaded files on every deploy.
    __tablename__ = "site_photos"

    photo_id: Mapped[int] = mapped_column(primary_key=True)
    # A random value in the photo URL, so the <img> tag can load it without the token header.
    token: Mapped[str] = mapped_column(String(32), unique=True, default=new_token)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.project_id"))
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    caption: Mapped[str] = mapped_column(String(150))
    # before, during or after the work, for the before/after view of the contractor.
    stage: Mapped[str] = mapped_column(String(10), default="during", server_default="during")
    content_type: Mapped[str] = mapped_column(String(30))
    # Loaded only when the photo itself is requested, not in the lists.
    data: Mapped[bytes] = deferred(mapped_column(LargeBinary))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    def to_dict(self) -> dict:
        # url is a path on the API. The frontend adds the API address before it.
        return {
            "photo_id": self.photo_id,
            "url": f"/photos/{self.token}",
            "caption": self.caption,
            "stage": self.stage,
            "created_at": self.created_at,
        }
