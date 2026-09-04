import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_police_overview(async_client: AsyncClient, police_jwt_token: str):
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    response = await async_client.get("/api/v1/traffic-police/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["system_status"] == "OPTIMAL_PATROL"
    assert len(data["monitored_junctions"]) > 0


@pytest.mark.anyio
async def test_police_overview_forbidden_for_citizen(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/traffic-police/overview", headers=headers)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_police_signal_override(async_client: AsyncClient, police_jwt_token: str):
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    payload = {
        "junctionCode": "J14",
        "newGreenTimeSec": 60,
        "mode": "MANUAL_OVERRIDE",
    }
    response = await async_client.post("/api/v1/traffic-police/signal-override", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["junction_code"] == "J14"
    assert data["new_green_time_sec"] == 60
    assert data["is_simulated"] is True
