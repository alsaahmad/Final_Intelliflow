import pytest
from httpx import AsyncClient
from app.services.navigation_service import navigation_service

# Real test coordinates from validated sector_a OSM junctions
J01_LAT, J01_LON = 28.6137551, 77.2122049  # Kartavya Path & Rafi Ahmed Kidwai Marg
J03_LAT, J03_LON = 28.6130207, 77.2276662  # Kartavya Path Signalized Junction


def test_osm_graph_loading():
    """Verify OSM graph was parsed properly and contains nodes and graph edges."""
    assert navigation_service._is_loaded is True
    assert len(navigation_service.nodes) > 10000
    assert len(navigation_service.graph) > 500


def test_coordinate_snapping():
    """Verify coordinate snapping locates the correct nearest OSM node."""
    nid, lat, lon, dist = navigation_service.snap_to_nearest_node(J01_LAT, J01_LON)
    assert nid == "249791204"
    assert abs(lat - J01_LAT) < 0.0001
    assert abs(lon - J01_LON) < 0.0001
    assert dist < 5.0  # within 5 meters of exact node


@pytest.mark.anyio
async def test_navigation_route_fastest_success(async_client: AsyncClient, valid_jwt_token: str):
    """Verify POST /api/v1/navigation/route returns valid route JSON."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "origin": {"latitude": J01_LAT, "longitude": J01_LON},
        "destination": {"latitude": J03_LAT, "longitude": J03_LON},
        "route_preference": "FASTEST",
        "include_alternatives": True,
    }
    response = await async_client.post("/api/v1/navigation/route", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["route_id"].startswith("route_osm_")
    assert data["data_source"] == "OPENSTREETMAP_SECTOR_A"
    assert data["is_simulated"] is False
    assert len(data["routes"]) >= 1

    primary_route = data["routes"][0]
    assert primary_route["route_type"] == "PRIMARY_FASTEST"
    assert primary_route["distance_meters"] > 1000.0  # ~1.5 km along Kartavya Path
    assert primary_route["duration_seconds"] > 30.0
    assert primary_route["geometry"]["type"] == "LineString"
    assert len(primary_route["geometry"]["coordinates"]) >= 4
    assert len(primary_route["steps"]) >= 1


@pytest.mark.anyio
async def test_navigation_route_shortest_preference(async_client: AsyncClient, police_jwt_token: str):
    """Verify SHORTEST route preference is handled cleanly."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    payload = {
        "origin": {"latitude": J01_LAT, "longitude": J01_LON},
        "destination": {"latitude": J03_LAT, "longitude": J03_LON},
        "route_preference": "SHORTEST",
        "include_alternatives": False,
    }
    response = await async_client.post("/api/v1/navigation/route", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["selected_preference"] == "SHORTEST"
    assert len(data["routes"]) == 1
    assert data["routes"][0]["route_type"] == "PRIMARY_SHORTEST"


@pytest.mark.anyio
async def test_navigation_out_of_bounds_rejection(async_client: AsyncClient, valid_jwt_token: str):
    """Verify coordinates far outside sector network boundary raise HTTP 400."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "origin": {"latitude": 0.0, "longitude": 0.0},  # Middle of the Atlantic Ocean
        "destination": {"latitude": J03_LAT, "longitude": J03_LON},
        "route_preference": "FASTEST",
    }
    response = await async_client.post("/api/v1/navigation/route", json=payload, headers=headers)
    assert response.status_code == 400
    err = response.json()
    error_code = err.get("error") or (err.get("detail", {}).get("error") if isinstance(err.get("detail"), dict) else None)
    assert error_code == "COORDINATE_OUT_OF_BOUNDS"


@pytest.mark.anyio
async def test_navigation_unauthenticated_rejection(async_client: AsyncClient):
    """Verify unauthenticated route requests are rejected with 401."""
    payload = {
        "origin": {"latitude": J01_LAT, "longitude": J01_LON},
        "destination": {"latitude": J03_LAT, "longitude": J03_LON},
    }
    response = await async_client.post("/api/v1/navigation/route", json=payload)
    assert response.status_code in [401, 403]
