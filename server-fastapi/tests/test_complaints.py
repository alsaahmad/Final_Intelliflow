import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_create_complaint(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "title": "Severe Waterlogging near Flyover",
        "category": "WATERLOGGING",
        "location": "Expressway Sector 4",
        "urgency": "HIGH",
        "description": "Standing water causing heavy commute slowdown.",
    }
    response = await async_client.post("/api/v1/complaints", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["category"] == payload["category"]
    assert data["status"] == "PENDING"
    assert "CIVIC-" in data["code"]


@pytest.mark.anyio
async def test_list_complaints(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/complaints", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.anyio
async def test_get_complaint_detail(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/complaints/cmp-101", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "CIVIC-9021"


@pytest.mark.anyio
async def test_get_complaint_not_found(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/complaints/nonexistent", headers=headers)
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "COMPLAINT_NOT_FOUND"


@pytest.mark.anyio
async def test_update_complaint_status_success(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    payload = {
        "status": "IN_PROGRESS",
        "remarks": "Dispatched maintenance team to site.",
    }
    response = await async_client.patch("/api/v1/complaints/cmp-101/status", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "IN_PROGRESS"


@pytest.mark.anyio
async def test_update_complaint_status_unauthorized_citizen(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "status": "RESOLVED",
        "remarks": "Citizen attempt to resolve.",
    }
    response = await async_client.patch("/api/v1/complaints/cmp-101/status", json=payload, headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "FORBIDDEN"


@pytest.mark.anyio
async def test_update_complaint_status_invalid_status(async_client: AsyncClient, municipal_jwt_token: str):
    headers = {"Authorization": f"Bearer {municipal_jwt_token}"}
    payload = {
        "status": "INVALID_STATUS_VALUE",
        "remarks": "Invalid test",
    }
    response = await async_client.patch("/api/v1/complaints/cmp-101/status", json=payload, headers=headers)
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "INVALID_STATUS"
