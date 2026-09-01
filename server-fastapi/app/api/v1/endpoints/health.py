from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.database import check_database_health
from app.schemas.health import HealthResponse, DatabaseHealthResponse, DatabaseDetail

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health Check",
    description="Returns high-level service metadata and current timestamp.",
)
async def get_app_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=settings.ENVIRONMENT,
    )


@router.get(
    "/db-health",
    response_model=DatabaseHealthResponse,
    summary="Database Health Check",
    description="Executes a live query against PostgreSQL to test database connectivity.",
)
async def get_db_health(response: Response) -> DatabaseHealthResponse:
    health_data = await check_database_health()
    now_iso = datetime.now(timezone.utc).isoformat()

    db_detail = DatabaseDetail(
        healthy=health_data["healthy"],
        engine=health_data["engine"],
        latency_ms=health_data["latency_ms"],
        error=health_data["error"],
    )

    if not health_data["healthy"]:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return DatabaseHealthResponse(
            status="error",
            service=settings.APP_NAME,
            version=settings.APP_VERSION,
            timestamp=now_iso,
            database=db_detail,
        )

    return DatabaseHealthResponse(
        status="ok",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        timestamp=now_iso,
        database=db_detail,
    )
