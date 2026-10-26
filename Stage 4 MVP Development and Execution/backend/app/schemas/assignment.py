from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

# The three statuses of the assignments table in Stage 3.
AssignmentStatus = Literal["active", "completed", "cancelled"]


class AssignmentCreate(BaseModel):
    # The JSON body of POST /projects/{id}/assignments (Stage 3, section 4.2.13).
    # provider_id comes from the token.
    model_config = ConfigDict(json_schema_extra={"examples": [{"worker_id": 15}]})

    worker_id: int


class AssignmentResponse(BaseModel):
    # One assignment as JSON (Stage 3, section 4.2.13).
    assignment_id: int
    project_id: int
    provider_id: int
    worker_id: int
    assigned_at: datetime
    status: str
