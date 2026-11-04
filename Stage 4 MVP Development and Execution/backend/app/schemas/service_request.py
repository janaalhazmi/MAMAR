from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

# The three statuses of the service_requests table in Stage 3.
RequestStatus = Literal["open", "awarded", "closed"]

# The maximum length is the column size of the service_requests table.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Details = Annotated[str, StringConstraints(strip_whitespace=True)]


class ServiceRequestCreate(BaseModel):
    # The JSON body of POST /projects/{id}/requests (Stage 3, section 4.2.8). details is optional.
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "title": "Lane closure signs and barriers",
                    "details": "20 cones, 4 warning signs and 1 detour",
                    "required_by": "2026-11-25",
                    "provider_ids": [1, 3],
                }
            ]
        }
    )

    title: Title
    details: Details | None = None
    required_by: date
    # The providers chosen on the Select Provider page. Left out or null: every provider sees it.
    provider_ids: list[int] | None = None

    @field_validator("provider_ids")
    @classmethod
    def check_provider_ids(cls, provider_ids: list[int] | None) -> list[int] | None:
        if provider_ids is None:
            return None
        if not provider_ids:
            raise ValueError("choose at least one provider, or leave provider_ids out")
        # The same provider twice is saved once, in the order it was chosen.
        return list(dict.fromkeys(provider_ids))

    @field_validator("details")
    @classmethod
    def check_details(cls, details: str | None) -> str | None:
        # Empty details are saved as NULL, the same as no details.
        return details or None


class ServiceRequestResponse(BaseModel):
    # One service request as JSON (Stage 3, section 4.2.8).
    request_id: int
    project_id: int
    title: str
    details: str | None
    required_by: date
    status: str
    created_at: datetime
    provider_ids: list[int] | None


class AwardRequest(BaseModel):
    # The JSON body of POST /requests/{id}/award (Stage 3, section 4.2.12).
    model_config = ConfigDict(json_schema_extra={"examples": [{"quote_id": 54}]})

    quote_id: int


class AcceptedQuote(BaseModel):
    quote_id: int
    provider_id: int
    price: float
    status: str


class AwardResponse(BaseModel):
    # The award response (Stage 3, section 4.2.12).
    request_id: int
    status: str
    accepted_quote: AcceptedQuote
