from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.schemas.project import ProjectResponse, ServiceId, unique_services
from app.schemas.quote import QuoteResponse

SiteStatus = Literal["Not Started", "Work in Progress", "Paused", "Completed"]


class QuotationCreate(BaseModel):
    # The JSON body of POST /quotations, sent from the provider's Prepare Quotation page.
    # The quote goes to the open service request of the project. provider_id comes from the token.
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "project_id": 12,
                    "price": 18500.00,
                    "duration_days": 15,
                    "start_date": "2026-11-10",
                    "services": ["ttc-plan", "road-signs"],
                    "notes": "Includes installation and removal",
                }
            ]
        }
    )

    project_id: int
    price: Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
    duration_days: Annotated[int, Field(ge=1)]
    start_date: date | None = None
    services: list[ServiceId] = []
    notes: Annotated[str, StringConstraints(strip_whitespace=True)] | None = None

    @field_validator("services")
    @classmethod
    def check_services(cls, services: list[str]) -> list[str]:
        return unique_services(services)

    @field_validator("notes")
    @classmethod
    def check_notes(cls, notes: str | None) -> str | None:
        return notes or None


class ProviderSummary(BaseModel):
    provider_id: int
    company_name: str
    service_type: str


class ProjectQuotation(QuoteResponse):
    # A quote of the project with the company that sent it (GET /projects/{id}/quotations).
    provider: ProviderSummary


class ConfirmProviderRequest(BaseModel):
    quote_id: int


class ConfirmProviderResponse(BaseModel):
    project: ProjectResponse
    quote: QuoteResponse


class PhotoResponse(BaseModel):
    # url is a path on the API, for example /photos/3f2a..., so the frontend adds the API address.
    photo_id: int
    url: str
    caption: str
    created_at: datetime


class SiteProgress(BaseModel):
    # What the contractor sees on Project Monitoring and Review Completion.
    project_id: int
    project_status: str
    site_status: str
    progress: int
    field_team_count: int
    last_check_in: datetime | None
    completion_submitted: bool
    submitted_at: datetime | None
    change_note: str | None
    services: list[str]
    provider: ProviderSummary | None
    quote: QuoteResponse | None
    photos: list[PhotoResponse]


class ChangeRequest(BaseModel):
    note: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class TeamMember(BaseModel):
    user_id: int
    full_name: str


class FieldProject(BaseModel):
    # A project as the assigned field worker sees it.
    project: ProjectResponse
    site_status: str
    progress: int
    last_check_in: datetime | None
    change_note: str | None
    provider: ProviderSummary | None
    team: list[TeamMember]
    photos: list[PhotoResponse]


class SiteStatusUpdate(BaseModel):
    status: SiteStatus


class DeviceVerificationRequest(BaseModel):
    # The position the phone captured on site.
    project_id: int
    latitude: Annotated[float, Field(ge=-90, le=90)]
    longitude: Annotated[float, Field(ge=-180, le=180)]
    accuracy: Annotated[float, Field(ge=0)] | None = None


class DeviceVerificationResponse(BaseModel):
    device: str
    project_id: int
    planned_latitude: float
    planned_longitude: float
    distance_m: float
    max_distance_m: float
    status: str
