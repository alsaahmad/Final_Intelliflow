from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """API Health Check response schema."""

    status: str = Field(..., json_schema_extra={"example": "ok"})
    service: str = Field(..., json_schema_extra={"example": "IntelliFlow AI FastAPI Backend"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    timestamp: str = Field(..., json_schema_extra={"example": "2026-09-01T15:00:00.000Z"})
    environment: str = Field(..., json_schema_extra={"example": "development"})


class DatabaseDetail(BaseModel):
    """Database connection detail schema."""

    healthy: bool = Field(..., json_schema_extra={"example": True})
    engine: str = Field(..., json_schema_extra={"example": "PostgreSQL (asyncpg)"})
    latency_ms: float = Field(..., json_schema_extra={"example": 1.5})
    error: Optional[str] = Field(None, json_schema_extra={"example": None})


class DatabaseHealthResponse(BaseModel):
    """Database Health Check response schema."""

    status: str = Field(..., json_schema_extra={"example": "ok"})
    service: str = Field(..., json_schema_extra={"example": "IntelliFlow AI FastAPI Backend"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    timestamp: str = Field(..., json_schema_extra={"example": "2026-09-01T15:00:00.000Z"})
    database: DatabaseDetail
