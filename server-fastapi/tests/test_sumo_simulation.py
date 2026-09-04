import pytest
from httpx import AsyncClient
from app.services.sumo_service import sumo_service


@pytest.mark.anyio
async def test_gis_layers_endpoint_success(async_client: AsyncClient, valid_jwt_token: str):
    """Verifies GET /api/v1/gis/layers returns normalized GeoJSON FeatureCollection."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/gis/layers", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["type"] == "FeatureCollection"
    assert isinstance(data["features"], list)
    assert len(data["features"]) >= 1
    feature = data["features"][0]
    assert feature["geometry"]["type"] == "Polygon"
    assert len(feature["geometry"]["coordinates"][0]) >= 4


@pytest.mark.anyio
async def test_sumo_simulation_run_success(async_client: AsyncClient, police_jwt_token: str):
    """Verifies POST /api/v1/simulation/run executes baseline vs scenario microsimulation."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    payload = {
        "junction_code": "J01",
        "delta_green_time_sec": 15,
        "duration_seconds": 900,
    }
    response = await async_client.post("/api/v1/simulation/run", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["junction_code"] == "J01"
    assert data["delta_green_time_sec"] == 15
    assert data["duration_seconds"] == 900
    assert data["is_simulated"] is True
    assert data["dataSource"] == "SUMO_MICROSIMULATION"
    assert "DEMO SIMULATION ONLY" in data["disclaimer"]

    # Baseline & Scenario metrics assertions
    assert "baseline" in data
    assert "scenario" in data
    assert "comparison" in data
    assert data["baseline"]["average_travel_time_sec"] > 0
    assert data["scenario"]["average_vehicle_delay_sec"] < data["baseline"]["average_vehicle_delay_sec"]


@pytest.mark.anyio
async def test_sumo_simulation_invalid_delta_bounds(async_client: AsyncClient, police_jwt_token: str):
    """Verifies delta_green_time_sec outside [-30, +60] is rejected with 422 Unprocessable Entity."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    payload = {
        "junction_code": "J01",
        "delta_green_time_sec": 100,  # Exceeds max +60
        "duration_seconds": 900,
    }
    response = await async_client.post("/api/v1/simulation/run", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_sumo_simulation_invalid_duration_bounds(async_client: AsyncClient, police_jwt_token: str):
    """Verifies duration_seconds outside [300, 3600] is rejected with 422 Unprocessable Entity."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    payload = {
        "junction_code": "J01",
        "delta_green_time_sec": 15,
        "duration_seconds": 10,  # Below min 300
    }
    response = await async_client.post("/api/v1/simulation/run", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_sumo_simulation_rbac_citizen_forbidden(async_client: AsyncClient, valid_jwt_token: str):
    """Verifies Citizen role is forbidden from triggering microsimulation execution."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    payload = {
        "junction_code": "J01",
        "delta_green_time_sec": 15,
        "duration_seconds": 900,
    }
    response = await async_client.post("/api/v1/simulation/run", json=payload, headers=headers)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_sumo_service_junction_resolution():
    """Verifies deterministic junction mapping for J01, J02, J03, and J14."""
    j01 = sumo_service.resolve_junction("J01")
    assert j01["osm_node_id"] == "249791204"
    assert j01["latitude"] == 28.6137551
    assert "cluster_" in j01["sumo_junction_id"]

    j14 = sumo_service.resolve_junction("J14")
    assert j14["osm_node_id"] == "1870091900"
    assert j14["latitude"] == 28.6131567


@pytest.mark.anyio
async def test_invalid_unmapped_junction_rejected(async_client: AsyncClient, police_jwt_token: str):
    """Verifies unmapped junction code is rejected with 404 Not Found."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    payload = {
        "junction_code": "INVALID_UNMAPPED_JNC",
        "delta_green_time_sec": 15,
        "duration_seconds": 900,
    }
    response = await async_client.post("/api/v1/simulation/run", json=payload, headers=headers)
    assert response.status_code == 404


@pytest.mark.anyio
async def test_sumo_unauthenticated_access_denied(async_client: AsyncClient):
    """Verifies unauthenticated access to simulation endpoint returns 401 Unauthorized."""
    payload = {
        "junction_code": "J01",
        "delta_green_time_sec": 15,
        "duration_seconds": 900,
    }
    response = await async_client.post("/api/v1/simulation/run", json=payload)
    assert response.status_code == 401


@pytest.mark.anyio
async def test_synthetic_datasets_file_verification():
    """Verifies file-based synthetic datasets (data/*.json) exist and contain required tags."""
    import os
    import json
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    for file_name in ["traffic_signals.json", "intersections.json", "traffic_telemetry.json", "incidents.json", "scenarios.json", "junction_mapping.json"]:
        file_path = os.path.join(data_dir, file_name)
        assert os.path.exists(file_path), f"Synthetic dataset missing: {file_name}"
        with open(file_path, "r", encoding="utf-8") as f:
            content = json.load(f)
            assert isinstance(content, list)
            assert len(content) >= 1
            for record in content:
                assert record.get("is_simulated") is True
                assert record.get("data_origin") == "SYNTHETIC_DEMO"


@pytest.mark.anyio
async def test_osm_signal_mapping_validation():
    """Validates OSM node existence, coordinate consistency, and SUMO junction matching across datasets."""
    import os
    import json
    import xml.etree.ElementTree as ET

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    osm_path = os.path.join(base_dir, "SUMO", "networks", "sector_a", "sector_a.osm")
    net_path = os.path.join(base_dir, "SUMO", "networks", "sector_a", "sector_a.net.xml")
    data_dir = os.path.join(base_dir, "data")

    # 1. Parse OSM signals
    tree = ET.parse(osm_path)
    osm_signals = {}
    for node in tree.getroot().findall("node"):
        tags = {t.attrib.get("k"): t.attrib.get("v") for t in node.findall("tag")}
        if tags.get("highway") == "traffic_signals":
            osm_signals[node.attrib.get("id")] = {
                "lat": float(node.attrib.get("lat")),
                "lon": float(node.attrib.get("lon")),
            }

    # 2. Parse SUMO net junctions
    net_tree = ET.parse(net_path)
    sumo_junction_ids = {jnc.attrib.get("id") for jnc in net_tree.getroot().findall("junction")}

    # 3. Read JSON datasets
    with open(os.path.join(data_dir, "junction_mapping.json"), "r", encoding="utf-8") as f:
        mappings = json.load(f)
    with open(os.path.join(data_dir, "traffic_signals.json"), "r", encoding="utf-8") as f:
        signals = {s["junction_code"]: s for s in json.load(f)}
    with open(os.path.join(data_dir, "intersections.json"), "r", encoding="utf-8") as f:
        intersections = {i["junction_code"]: i for i in json.load(f)}

    for m in mappings:
        code = m["junction_code"]
        node_id = m["osm_node_id"]
        
        # Verify node exists in OSM signals
        assert node_id in osm_signals, f"OSM Node {node_id} for {code} is not a valid OSM traffic signal."
        
        # Verify coordinate consistency across all 3 files
        osm_lat = osm_signals[node_id]["lat"]
        osm_lon = osm_signals[node_id]["lon"]
        assert m["latitude"] == pytest.approx(osm_lat), f"Lat mismatch for {code}"
        assert m["longitude"] == pytest.approx(osm_lon), f"Lon mismatch for {code}"
        
        assert signals[code]["latitude"] == pytest.approx(osm_lat), f"Signal Lat mismatch for {code}"
        assert signals[code]["longitude"] == pytest.approx(osm_lon), f"Signal Lon mismatch for {code}"
        
        assert intersections[code]["latitude"] == pytest.approx(osm_lat), f"Intersection Lat mismatch for {code}"
        assert intersections[code]["longitude"] == pytest.approx(osm_lon), f"Intersection Lon mismatch for {code}"

        # Verify SUMO junction ID exists in .net.xml
        sumo_id = m["sumo_junction_id"]
        assert sumo_id in sumo_junction_ids, f"SUMO Junction ID '{sumo_id}' not found in sector_a.net.xml."


