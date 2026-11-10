from pydantic import BaseModel


class ErrorResponse(BaseModel):
    # The Stage 3 error format: {"detail": "message"}
    detail: str
