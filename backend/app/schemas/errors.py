from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    detail: str
    code: str
    request_id: str | None = None

    model_config = ConfigDict(extra="forbid")
