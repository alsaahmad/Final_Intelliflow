import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_junctions_list(async_client: AsyncClient):
    """Verify GET /api/v1/traffic/junctions returns junction list."""
    response = await async_client.get("/api/v1/traffic/junctions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_junctions_sector_filter(async_client: AsyncClient):
    """Verify GET /api/v1/traffic/junctions supports sector query param."""
    response = await async_client.get("/api/v1/traffic/junctions?sector=Central")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_unknown_junction_returns_404(async_client: AsyncClient):
    """Verify GET /api/v1/traffic/junctions/NONEXISTENT returns 404."""
    response = await async_client.get("/api/v1/traffic/junctions/NONEXISTENT")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "JUNCTION_NOT_FOUND"


@pytest.mark.asyncio
async def test_telemetry_ingestion_requires_auth(async_client: AsyncClient):
    """Verify POST /api/v1/traffic/telemetry requires authentication bearer token."""
    payload = {
        "junction_code": "J14",
        "vehicle_count": 350,
        "average_speed_kmh": 22.5,
        "congestion_percent": 65,
        "queue_length_meters": 80.0,
    }
    response = await async_client.post("/api/v1/traffic/telemetry", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_telemetry_ingestion_role_restriction(async_client: AsyncClient, valid_jwt_token: str):
    """Verify Citizen role cannot post telemetry data (403 Forbidden)."""
    payload = {
        "junction_code": "J14",
        "vehicle_count": 350,
        "average_speed_kmh": 22.5,
        "congestion_percent": 65,
        "queue_length_meters": 80.0,
    }
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.post("/api/v1/traffic/telemetry", json=payload, headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_telemetry_ingestion_invalid_numeric_bounds(async_client: AsyncClient, police_jwt_token: str):
    """Verify validation bounds on telemetry ingestion (congestion_percent > 100)."""
    payload = {
        "junction_code": "J14",
        "vehicle_count": -5,  # Invalid
        "average_speed_kmh": 0.0,  # Invalid
        "congestion_percent": 150,  # Invalid
        "queue_length_meters": -10.0,  # Invalid
    }
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    response = await async_client.post("/api/v1/traffic/telemetry", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_alerts_list(async_client: AsyncClient):
    """Verify GET /api/v1/traffic/alerts returns list of traffic advisories."""
    response = await async_client.get("/api/v1/traffic/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_alerts_severity_filter(async_client: AsyncClient):
    """Verify GET /api/v1/traffic/alerts supports severity filtering."""
    response = await async_client.get("/api/v1/traffic/alerts?severity=HIGH")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_alert_creation_requires_auth(async_client: AsyncClient):
    """Verify POST /api/v1/traffic/alerts requires authentication."""
    payload = {
        "code": "ALT-999",
        "title": "Test Accident Alert",
        "severity": "HIGH",
        "category": "ACCIDENT",
        "location": "Main Crossing",
        "description": "Lane 1 blocked",
    }
    response = await async_client.post("/api/v1/traffic/alerts", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_mobility_status(async_client: AsyncClient):
    """Verify GET /api/v1/traffic/mobility-status returns valid city status metrics."""
    response = await async_client.get("/api/v1/traffic/mobility-status")
    assert response.status_code == 200
    data = response.json()
    assert "cityCongestionIndex" in data
    assert "averageSpeedKmh" in data
    assert "activeGreenCorridors" in data
    assert "trafficStatus" in data
    assert "dataSource" in data
    assert data["dataSource"] == "FASTAPI_DEMO_DERIVED"
