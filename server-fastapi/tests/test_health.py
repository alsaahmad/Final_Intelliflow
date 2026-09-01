import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient):
    """Verify GET /api/v1/health returns HTTP 200 and valid JSON schema."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "IntelliFlow AI FastAPI Backend"
    assert data["version"] == "1.0.0"
    assert "timestamp" in data
    assert "environment" in data


@pytest.mark.asyncio
async def test_db_health_check_endpoint(async_client: AsyncClient):
    """Verify GET /api/v1/db-health returns valid response (200 if reachable, 503 if unreachable)."""
    response = await async_client.get("/api/v1/db-health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert data["status"] in ("ok", "error")
    assert "database" in data
    db = data["database"]
    assert "healthy" in db
    assert "engine" in db
    assert "latency_ms" in db
    assert db["engine"] == "PostgreSQL (asyncpg)"
