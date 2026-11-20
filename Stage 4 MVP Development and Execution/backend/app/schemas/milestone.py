from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class MilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    milestone_id: int
    project_id: int
    name: str
    status: str
    updated_at: datetime | None = None


class MilestoneUpdate(BaseModel):
    status: Literal["pending", "in_progress", "completed"]