import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_get_parking_facilities(async_client: AsyncClient):
    response = await async_client.get("/api/v1/parking/facilities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    facility = data[0]
    assert "id" in facility
    assert "code" in facility
    assert "availableSlots" in facility
    assert "slots" in facility


@pytest.mark.anyio
async def test_get_parking_facility_detail(async_client: AsyncClient):
    response = await async_client.get("/api/v1/parking/facilities/gar-01")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "PKG-CP-01"
    assert "totalSlots" in data
    assert len(data["slots"]) >= 1


@pytest.mark.anyio
async def test_get_parking_facility_not_found(async_client: AsyncClient):
    response = await async_client.get("/api/v1/parking/facilities/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "FACILITY_NOT_FOUND"


@pytest.mark.anyio
async def test_get_parking_facility_slots(async_client: AsyncClient):
    response = await async_client.get("/api/v1/parking/facilities/gar-01/slots?level=1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        slot = data[0]
        assert "code" in slot
        assert "status" in slot
        assert "type" in slot
