import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_get_gis_layers_authenticated(async_client: AsyncClient, valid_jwt_token: str):
    """Verify GET /api/v1/gis/layers returns normalized GeoJSON for sector boundary."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/gis/layers", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 1

    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Polygon"
    assert len(feature["geometry"]["coordinates"]) >= 1
    assert len(feature["geometry"]["coordinates"][0]) >= 4  # Closed polygon ring
    assert feature["properties"]["layerType"] == "SECTOR_BOUNDARY"
    assert feature["properties"]["source"] == "KML_USER_DATASET"


@pytest.mark.anyio
async def test_get_gis_layers_unauthenticated_rejection(async_client: AsyncClient):
    """Verify unauthenticated GET /api/v1/gis/layers is rejected."""
    response = await async_client.get("/api/v1/gis/layers")
    assert response.status_code in [401, 403]


@pytest.mark.anyio
async def test_get_osm_roads_authenticated(async_client: AsyncClient, police_jwt_token: str):
    """Verify GET /api/v1/gis/roads returns authorized OSM GeoJSON road network."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    response = await async_client.get("/api/v1/gis/roads", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 50  # sector_a has many road segments

    sample_road = data["features"][0]
    assert sample_road["type"] == "Feature"
    assert sample_road["geometry"]["type"] == "LineString"
    assert len(sample_road["geometry"]["coordinates"]) >= 2
    assert sample_road["properties"]["source"] == "OPENSTREETMAP_SECTOR_A"


@pytest.mark.anyio
async def test_get_osm_roads_unauthenticated_rejection(async_client: AsyncClient):
    """Verify unauthenticated GET /api/v1/gis/roads is rejected."""
    response = await async_client.get("/api/v1/gis/roads")
    assert response.status_code in [401, 403]
