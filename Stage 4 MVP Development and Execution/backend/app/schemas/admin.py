from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints, model_validator

from app.schemas.auth import RegisterRequest


class AdminUser(BaseModel):
    # One row of the admin dashboard lists.
    user_id: int
    full_name: str
    email: str
    phone: str | None
    role: str
    provider_id: int | None
    company_name: str | None
    is_active: bool
    created_at: datetime
    # contractors: their projects; providers and workers: the open projects of their company or assignments
    projects: int


class AdminSummary(BaseModel):
    contractors: int
    providers: int
    workers: int
    companies: int
    projects: dict[str, int]


class AdminCompany(BaseModel):
    provider_id: int
    company_name: str
    website: str | None
    users: int


class AdminUserCreate(RegisterRequest):
    # The admin adds contractors, providers and workers. No passcode and no company email rule:
    # the admin is trusted. Another admin cannot be added.
    role: Literal["contractor", "provider", "worker"]
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]


class AdminUserUpdate(BaseModel):
    # Stop or allow a user's login, or fix the name and phone.
    is_active: bool | None = None
    full_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)] | None = None
    phone: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None

    @model_validator(mode="after")
    def not_empty(self):
        if self.is_active is None and self.full_name is None and self.phone is None:
            raise ValueError("send is_active, full_name or phone")
        return self
