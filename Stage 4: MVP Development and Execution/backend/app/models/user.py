from datetime import datetime

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from sqlalchemy import CheckConstraint, ForeignKey, String, func, true
from sqlalchemy.orm import Mapped, mapped_column

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

    def set_password(self, password: str) -> None:
        # Hashes the new password and saves only the hash, so the real password is never stored.
        self.password_hash = password_hasher.hash(password)

    def check_password(self, password: str) -> bool:
        # Compares a password with the saved hash when the user logs in.
        try:
            return password_hasher.verify(self.password_hash, password)
        except (VerificationError, InvalidHashError):
            return False

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
        }
