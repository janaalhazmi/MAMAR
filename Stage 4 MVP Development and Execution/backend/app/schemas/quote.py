from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


class QuoteCreate(BaseModel):
    # The JSON body of POST /requests/{id}/quotes (Stage 3, section 4.2.10). notes is optional.
    # The provider enters the price. MAMAR does not calculate it. provider_id comes from the token.
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"price": 18500.00, "duration_days": 5, "notes": "Includes installation and removal"}]
        }
    )

    # In SAR. NUMERIC(12, 2) in the quotes table: up to 10 digits before the point and 2 after it.
    price: Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
    duration_days: Annotated[int, Field(ge=1)]
    notes: Annotated[str, StringConstraints(strip_whitespace=True)] | None = None

    @field_validator("notes")
    @classmethod
    def check_notes(cls, notes: str | None) -> str | None:
        # Empty notes are saved as NULL, the same as no notes.
        return notes or None


class QuoteResponse(BaseModel):
    # One quote as JSON (Stage 3, section 4.2.10).
    quote_id: int
    request_id: int
    provider_id: int
    price: float
    duration_days: int
    notes: str | None
    status: str
    created_at: datetime
