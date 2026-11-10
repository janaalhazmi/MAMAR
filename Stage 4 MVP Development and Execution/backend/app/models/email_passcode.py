from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class EmailPasscode(Base):
    # The passcode sent to an email before its account is created (email verification).
    # The row is deleted when the account is created with the right passcode.
    # This table is added next to the six Stage 3 tables, and it does not change them.
    __tablename__ = "email_passcodes"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    # Only the Argon2 hash of the passcode is saved, like the passwords.
    passcode_hash: Mapped[str] = mapped_column(String(255))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(default=0)
