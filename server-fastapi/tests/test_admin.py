import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_admin_list_users(async_client: AsyncClient, admin_jwt_token: str):
    headers = {"Authorization": f"Bearer {admin_jwt_token}"}
    response = await async_client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["users"]) > 0
    assert data["users"][0]["email"] == "citizen@intelliflow.ai"


@pytest.mark.anyio
async def test_admin_list_users_forbidden_for_citizen(async_client: AsyncClient, valid_jwt_token: str):
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_admin_update_user_role(async_client: AsyncClient, admin_jwt_token: str):
    headers = {"Authorization": f"Bearer {admin_jwt_token}"}
    payload = {"role": "TRAFFIC_POLICE"}
    response = await async_client.patch("/api/v1/admin/users/101/role", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "TRAFFIC_POLICE"


@pytest.mark.anyio
async def test_admin_toggle_user_status(async_client: AsyncClient, admin_jwt_token: str):
    headers = {"Authorization": f"Bearer {admin_jwt_token}"}
    payload = {"is_active": False}
    response = await async_client.patch("/api/v1/admin/users/101/status", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False


@pytest.mark.anyio
async def test_admin_get_audit_logs(async_client: AsyncClient, admin_jwt_token: str):
    headers = {"Authorization": f"Bearer {admin_jwt_token}"}
    response = await async_client.get("/api/v1/admin/audit-logs", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["logs"]) > 0
