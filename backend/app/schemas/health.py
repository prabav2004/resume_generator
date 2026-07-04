from pydantic import BaseModel, ConfigDict


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str

    model_config = ConfigDict(extra="forbid")
