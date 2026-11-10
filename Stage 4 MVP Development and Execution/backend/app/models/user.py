from datetime import datetime
import uuid

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from sqlalchemy import CheckConstraint, ForeignKey, String, func, true, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, deferred

from app.db.database import Base

# Hashes the passwords with Argon2, using the library's default settings.
password_hasher = PasswordHasher()

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

    # Profile picture fields stored in PostgreSQL.
    avatar_token: Mapped[str | None] = mapped_column(String(32), unique=True)
    avatar_content_type: Mapped[str | None] = mapped_column(String(30))
    avatar_data: Mapped[bytes | None] = deferred(mapped_column(LargeBinary))

    def set_password(self, password: str) -> None:
        # Hashes the new password and saves only the hash, so the real password is never stored.
        self.password_hash = password_hasher.hash(password)

    def check_password(self, password: str) -> bool:
        # Compares a password with the saved hash when the user logs in.
        try:
            return password_hasher.verify(self.password_hash, password)
        except (VerificationError, InvalidHashError):
            return False

    # Saves or replaces the user's profile picture.
    def set_avatar(self, content_type: str, data: bytes) -> None:
        self.avatar_token = uuid.uuid4().hex
        self.avatar_content_type = content_type
        self.avatar_data = data

    # Removes the user's profile picture.
    def remove_avatar(self) -> None:
        self.avatar_token = None
        self.avatar_content_type = None
        self.avatar_data = None

    def to_dict(self) -> dict:
        # Returns the user as JSON, without the password hash.
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "provider_id": self.provider_id,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "profile_picture": f"/photos/{self.avatar_token}" if self.avatar_token else None,
        }
