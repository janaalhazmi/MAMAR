import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator, model_validator

# A simple email check: text@text.text without spaces.
EMAIL_PATTERN = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


class RegisterRequest(BaseModel):
    # The JSON body of POST /auth/register (Stage 3, section 4.2.3).
    # The example from Stage 3 is shown in /docs.
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "full_name": "Sara Ahmed",
                    "email": "sara@example.com",
                    "password": "StrongPass123",
                    "phone": "0500000000",
                    "role": "contractor",
                    "provider_id": None,
                }
            ]
        }
    )

    # The maximum lengths are the column sizes of the users table.
    full_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    # Saved in lowercase without spaces, like the register page does.
    email: Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, max_length=255)]
    # The register page also asks for at least 6 characters.
    password: Annotated[str, StringConstraints(min_length=6)]
    phone: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None
    # admin is not accepted here, because anyone could open this endpoint and make
    # themselves an admin. The users table still allows admin for accounts the team adds.
    role: Literal["contractor", "provider", "worker"]
    provider_id: int | None = None

    @field_validator("email")
    @classmethod
    def check_email(cls, email: str) -> str:
        if not EMAIL_PATTERN.fullmatch(email):
            raise ValueError("value is not a valid email address")
        return email

    @model_validator(mode="after")
    def check_provider_id(self):
        # provider_id is required for providers and workers, and NULL for contractors.
        if self.role in ("provider", "worker") and self.provider_id is None:
            raise ValueError("provider_id is required when role is provider or worker")
        if self.role == "contractor" and self.provider_id is not None:
            raise ValueError("provider_id must be null when role is contractor")
        return self


class UserResponse(BaseModel):
    # The user as JSON, without the password (Stage 3, section 4.2.3).
    user_id: int
    full_name: str
    email: str
    phone: str | None
    role: str
    provider_id: int | None
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    # The JSON body of POST /auth/login (Stage 3, section 4.2.4).
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"email": "sara@example.com", "password": "StrongPass123"}]}
    )

    # Lowercase without spaces, the same way register saves it.
    email: Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True)]
    password: str


class LoginUser(BaseModel):
    # The user part of the login response.
    user_id: int
    full_name: str
    role: str
    provider_id: int | None


class LoginResponse(BaseModel):
    # The login response (Stage 3, section 4.2.4).
    access_token: str
    token_type: str
    user: LoginUser
