import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_trigger_emergency_sos(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "citizen_name": "Rahul Sharma",
        "location": "Connaught Center Sector 4",
        "latitude": 28.6139,
        "longitude": 77.2090,
    }
    response = await async_client.post("/api/v1/emergency/sos", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "SOS-112-" in data["code"]
    assert data["is_simulated"] is True
    assert "DEMO - Masked" in data["citizen_name"]


@pytest.mark.anyio
async def test_get_emergency_monitoring(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    response = await async_client.get("/api/v1/emergency/monitoring", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["active_sos"], list)
    assert isinstance(data["green_corridors"], list)
    assert isinstance(data["emergency_units"], list)


@pytest.mark.anyio
async def test_create_simulated_green_corridor(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    payload = {
        "name": "Trauma Priority Wave 02",
        "assigned_unit": "EMS-ALPHA-108",
        "corridor_route": "Junction A -> Hospital Way",
        "eta_minutes": 5,
        "speed_kmh": 70,
    }
    response = await async_client.post("/api/v1/emergency/green-corridor", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["is_simulated"] is True
    assert data["status"] == "ACTIVE"


@pytest.mark.anyio
async def test_get_active_mission_snapshot(async_client: AsyncClient, police_jwt_token: str):
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    response = await async_client.get("/api/v1/emergency/active-mission", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["unit_id"] == "EMS-ALPHA-108"
    assert data["is_simulated"] is True


@pytest.mark.anyio
async def test_green_corridor_unauthorized_citizen(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "name": "Unauthorized Wave",
        "assigned_unit": "EMS-999",
        "corridor_route": "Route X",
    }
    response = await async_client.post("/api/v1/emergency/green-corridor", json=payload, headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "FORBIDDEN"
