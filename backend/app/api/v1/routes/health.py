from fastapi import APIRouter

from app.config.config import get_settings
from app.schemas.health import HealthCheckResponse

router = APIRouter()


@router.get("", response_model=HealthCheckResponse)
async def health_check() -> HealthCheckResponse:
    settings = get_settings()
    return HealthCheckResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )
