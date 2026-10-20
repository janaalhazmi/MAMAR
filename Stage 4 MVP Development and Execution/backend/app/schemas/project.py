from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints, ValidationInfo, field_validator

# The four statuses of the projects table in Stage 3.
ProjectStatus = Literal["draft", "active", "completed", "cancelled"]

# The maximum lengths are the column sizes of the projects table.
ProjectName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
ClosureType = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Description = Annotated[str, StringConstraints(strip_whitespace=True)]

# The example from Stage 3, section 4.2.6.
PROJECT_EXAMPLE = {
    "project_name": "King Fahd Road Maintenance",
    "closure_type": "lane_closure",
    "start_date": "2026-11-01",
    "end_date": "2026-12-15",
    "description": "Night work on the right lane",
}


def empty_to_none(description: str | None) -> str | None:
    # An empty description is saved as NULL, the same as no description.
    return description or None


class ProjectCreate(BaseModel):
    # The JSON body of POST /projects (Stage 3, section 4.2.6). description is optional.
    model_config = ConfigDict(json_schema_extra={"examples": [PROJECT_EXAMPLE]})

    project_name: ProjectName
    closure_type: ClosureType
    start_date: date
    end_date: date
    description: Description | None = None

    @field_validator("end_date")
    @classmethod
    def check_end_date(cls, end_date: date, info: ValidationInfo) -> date:
        # Stage 3: 422 if end_date is before start_date.
        start_date = info.data.get("start_date")
        if start_date is not None and end_date < start_date:
            raise ValueError("cannot be before start_date")
        return end_date

    @field_validator("description")
    @classmethod
    def check_description(cls, description: str | None) -> str | None:
        return empty_to_none(description)


class ProjectUpdate(BaseModel):
    # The JSON body of PATCH /projects/{id} (Stage 3, section 4.2.7).
    # Only the fields that are sent are changed.
    model_config = ConfigDict(json_schema_extra={"examples": [{"project_status": "active"}]})

    project_name: ProjectName | None = None
    project_status: ProjectStatus | None = None
    closure_type: ClosureType | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: Description | None = None

    @field_validator("project_name", "project_status", "closure_type", "start_date", "end_date")
    @classmethod
    def check_not_null(cls, value):
        # These columns are NOT NULL, so they can be changed but not removed.
        if value is None:
            raise ValueError("cannot be null")
        return value

    @field_validator("description")
    @classmethod
    def check_description(cls, description: str | None) -> str | None:
        return empty_to_none(description)


class ProjectResponse(BaseModel):
    # One project as JSON (Stage 3, section 4.2.5).
    project_id: int
    contractor_id: int
    project_name: str
    project_status: str
    closure_type: str
    start_date: date
    end_date: date
    description: str | None
    created_at: datetime
