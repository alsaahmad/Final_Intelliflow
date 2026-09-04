import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_get_infrastructure_overview(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    response = await async_client.get("/api/v1/infrastructure/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "stats" in data
    assert isinstance(data["projects"], list)
    assert isinstance(data["approvals"], list)


@pytest.mark.anyio
async def test_list_infrastructure_projects(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    response = await async_client.get("/api/v1/infrastructure/projects", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["is_simulated"] is True


@pytest.mark.anyio
async def test_list_road_approvals(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    response = await async_client.get("/api/v1/infrastructure/approvals", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.anyio
async def test_update_road_approval_decision_success(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    payload = {
        "decision": "APPROVED",
        "comments": "Approved for weekend execution.",
    }
    response = await async_client.post(
        "/api/v1/infrastructure/approvals/1/decision", json=payload, headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["comments"] == payload["comments"]


@pytest.mark.anyio
async def test_update_road_approval_invalid_decision(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    payload = {
        "decision": "INVALID_DECISION",
    }
    response = await async_client.post(
        "/api/v1/infrastructure/approvals/1/decision", json=payload, headers=headers
    )
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "INVALID_DECISION"


@pytest.mark.anyio
async def test_run_road_closure_simulation(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    payload = {
        "road_segment": "Western Arterial Expressway (KM 4 - 8)",
        "closure_type": "FULL_CLOSURE",
        "duration_days": 3,
    }
    response = await async_client.post(
        "/api/v1/infrastructure/closure-simulation", json=payload, headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["simulation"]["closure_type"] == payload["closure_type"]
    assert data["simulation"]["is_simulated"] is True
    assert len(data["simulation"]["suggested_detours"]) >= 1


@pytest.mark.anyio
async def test_infrastructure_unauthorized_citizen(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/infrastructure/overview", headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "FORBIDDEN"
