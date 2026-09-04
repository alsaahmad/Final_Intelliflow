import pytest
import jwt
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import settings
from app.core.database import get_db


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def override_db_dependency():
    """Mocks get_db dependency for fast, isolated unit & integration testing."""
    mock_session = AsyncMock()

    mock_jnc = MagicMock()
    mock_jnc.id = 14
    mock_jnc.code = "J14"
    mock_jnc.name = "Central Connaught Plaza Hub"
    mock_jnc.sector = "Sector A - Central Core"
    mock_jnc.latitude = 28.6139
    mock_jnc.longitude = 77.2090
    mock_jnc.status = "HEAVY"
    mock_jnc.severity = "HEAVY"
    mock_jnc.congestion_percent = 78
    mock_jnc.average_speed_kmh = 18.0
    mock_jnc.current_green_time = 32
    mock_jnc.signal_timer_seconds = 32
    mock_jnc.signal_phase = "NORTH_SOUTH"
    mock_jnc.sensor_health = "OPTIMAL"
    mock_jnc.active_advisory = "Lane 2 cleared"


    mock_tel = MagicMock()
    mock_tel.id = 1
    mock_tel.timestamp = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")
    mock_tel.junction_id = 14
    mock_tel.vehicle_count = 382
    mock_tel.average_speed_kmh = 18.0
    mock_tel.congestion_percent = 78
    mock_tel.queue_length_meters = 140.0

    mock_alt = MagicMock()
    mock_alt.id = 1
    mock_alt.code = "ALT-401"
    mock_alt.junction_id = 14
    mock_alt.incident_id = 9812
    mock_alt.title = "Obstruction Alert"
    mock_alt.severity = "HIGH"
    mock_alt.category = "ACCIDENT"
    mock_alt.location = "Junction J14"
    mock_alt.latitude = 28.6139
    mock_alt.longitude = 77.2090
    mock_alt.description = "Collision on lane 2"
    mock_alt.created_at = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")
    mock_alt.estimated_delay_minutes = 14
    mock_alt.alternate_route_suggested = "Outer Ring"
    mock_alt.verified_advisory = True
    mock_alt.affected_lanes = "Lane 2"

    mock_slot = MagicMock()
    mock_slot.id = 1
    mock_slot.facility_id = 1
    mock_slot.slot_code = "A1"
    mock_slot.row_name = "A"
    mock_slot.col_number = 1
    mock_slot.level = 1
    mock_slot.status = "AVAILABLE"
    mock_slot.slot_type = "EV_CHARGING"
    mock_slot.hourly_rate = 40.0
    mock_slot.features = ["60kW Fast DC Charging"]

    mock_fac = MagicMock()
    mock_fac.id = 1
    mock_fac.code = "PKG-CP-01"
    mock_fac.name = "Connaught Central Multi-Level Car Park"
    mock_fac.address = "Block B, Inner Circle, Connaught Center"
    mock_fac.distance_km = 0.45
    mock_fac.distance_display = "450 m away"
    mock_fac.latitude = 28.6139
    mock_fac.longitude = 77.2090
    mock_fac.dijkstra_node_id = "node-cp"
    mock_fac.total_slots = 24
    mock_fac.available_slots = 13
    mock_fac.occupied_slots = 8
    mock_fac.reserved_slots = 2
    mock_fac.disabled_slots = 1
    mock_fac.occupancy_percent = 42
    mock_fac.hourly_rate_inr = 40.0
    mock_fac.operating_hours = "24/7 Open"
    mock_fac.ev_charging_available = True
    mock_fac.ev_slots_available = 3
    mock_fac.accessible_slots_available = 1
    mock_fac.levels = 2
    mock_fac.current_level = 1
    mock_fac.slots = [mock_slot]

    mock_cmp = MagicMock()
    mock_cmp.id = 101
    mock_cmp.code = "CIVIC-9021"
    mock_cmp.title = "Deep Pothole Cluster near Central Underpass"
    mock_cmp.category = "POTHOLE"
    mock_cmp.location = "Sector 4, Central Boulevard East"
    mock_cmp.latitude = 28.6139
    mock_cmp.longitude = 77.2090
    mock_cmp.urgency = "HIGH"
    mock_cmp.status = "PENDING"
    mock_cmp.assigned_department = "Road Maintenance & Infrastructure"
    mock_cmp.reported_by_id = 101
    mock_cmp.reported_by_name = "Rahul Sharma (Citizen)"
    mock_cmp.description = "Multiple sharp potholes causing vehicle slowdown"
    mock_cmp.estimated_resolution_hours = 24
    mock_cmp.remarks = None
    mock_cmp.created_at = MagicMock(strftime=lambda fmt: "2026-09-01 15:00")

    mock_inc = MagicMock()
    mock_inc.id = 1
    mock_inc.code = "SOS-112-9182"
    mock_inc.citizen_name = "Rahul S. (DEMO - Masked)"
    mock_inc.citizen_id = 101
    mock_inc.location = "Connaught Center Inner Circle, Gate 4"
    mock_inc.latitude = 28.6139
    mock_inc.longitude = 77.2090
    mock_inc.priority = "CODE_RED_112"
    mock_inc.assigned_unit = "EMS-ALPHA-07 (ALS Unit)"
    mock_inc.destination_hospital = "City General Trauma Center (H01)"
    mock_inc.eta_minutes = 3.8
    mock_inc.status = "DISPATCHED"
    mock_inc.is_simulated = True
    mock_inc.created_at = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")

    mock_gc = MagicMock()
    mock_gc.id = 1
    mock_gc.name = "Trauma Priority Wave 01"
    mock_gc.assigned_unit = "EMS Ambulance Alpha-108"
    mock_gc.corridor_route = "Junction A -> JNC-103 -> City Trauma Hospital"
    mock_gc.status = "ACTIVE"
    mock_gc.eta_minutes = 6
    mock_gc.signals_cleared = "4/5"
    mock_gc.speed_kmh = 68
    mock_gc.is_simulated = True
    mock_gc.created_at = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")

    mock_prj = MagicMock()
    mock_prj.id = 1
    mock_prj.project_code = "PRJ-201"
    mock_prj.title = "Sector 4 Flyover Expansion & Underpass Reinforcement"
    mock_prj.department = "Bridges & Structural Engineering"
    mock_prj.contractor = "L&T Infrastructure"
    mock_prj.progress_percent = 72
    mock_prj.budget_crores = 14.2
    mock_prj.status = "IN_PROGRESS"
    mock_prj.estimated_completion = "Nov 2026"
    mock_prj.timeline = "Sep 2026 - Nov 2026"
    mock_prj.traffic_diversion_active = True
    mock_prj.is_simulated = True
    mock_prj.created_at = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")

    mock_app = MagicMock()
    mock_app.id = 1
    mock_app.title = "Underground Cable Ducting Closure"
    mock_app.proposed_by = "State Power Distribution Ltd"
    mock_app.location = "Western Express Arterial"
    mock_app.closure_duration = "3 Days (Weekend)"
    mock_app.estimated_delay_mins = 14
    mock_app.traffic_impact_level = "HIGH"
    mock_app.status = "PENDING"
    mock_app.comments = "Requires traffic diversion via Outer Ring Road"
    mock_app.is_simulated = True
    mock_app.created_at = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")

    mock_usr = MagicMock()
    mock_usr.id = 101
    mock_usr.email = "citizen@intelliflow.ai"
    mock_usr.name = "Alex Rivera"
    mock_usr.role = "CITIZEN"
    mock_usr.is_active = True
    mock_usr.created_at = MagicMock(isoformat=lambda: "2026-09-01T15:00:00.000Z")

    mock_log = MagicMock()
    mock_log.id = 1
    mock_log.user_id = 101
    mock_log.user = mock_usr
    mock_log.user_name = "Alex Rivera"
    mock_log.action = "LOGIN_SUCCESS"
    mock_log.resource = "/api/v1/auth/login"
    mock_log.details = "User logged in successfully"
    from datetime import datetime, timezone
    mock_log.timestamp = datetime.now(timezone.utc)


    async def mock_execute(stmt, *args, **kwargs):
        try:
            compiled_str = str(stmt.compile(compile_kwargs={"literal_binds": True}))
        except Exception:
            compiled_str = str(stmt)

        mock_res = MagicMock()
        if "users" in compiled_str.lower():
            if "nonexistent" in compiled_str.lower() or "999" in compiled_str.lower():
                mock_res.scalars.return_value.all.return_value = []
                mock_res.scalar_one_or_none.return_value = None
            else:
                mock_res.scalars.return_value.all.return_value = [mock_usr]
                mock_res.scalar_one_or_none.return_value = mock_usr
        elif "system_audit_logs" in compiled_str.lower():
            mock_res.scalars.return_value.all.return_value = [mock_log]
            mock_res.scalar_one_or_none.return_value = mock_log
        elif "emergency_incidents" in compiled_str.lower():
            if "nonexistent" in compiled_str.lower() or "999" in compiled_str.lower():
                mock_res.scalars.return_value.all.return_value = []
                mock_res.scalar_one_or_none.return_value = None
            else:
                mock_res.scalars.return_value.all.return_value = [mock_inc]
                mock_res.scalar_one_or_none.return_value = mock_inc
        elif "green_corridors" in compiled_str.lower():
            mock_res.scalars.return_value.all.return_value = [mock_gc]
            mock_res.scalar_one_or_none.return_value = mock_gc
        elif "infrastructure_projects" in compiled_str.lower():
            mock_res.scalars.return_value.all.return_value = [mock_prj]
            mock_res.scalar_one_or_none.return_value = mock_prj
        elif "road_approvals" in compiled_str.lower():
            if "nonexistent" in compiled_str.lower() or "999" in compiled_str.lower():
                mock_res.scalars.return_value.all.return_value = []
                mock_res.scalar_one_or_none.return_value = None
            else:
                mock_res.scalars.return_value.all.return_value = [mock_app]
                mock_res.scalar_one_or_none.return_value = mock_app
        elif "parking_facilities" in compiled_str.lower() or "parking_slots" in compiled_str.lower():
            if "nonexistent" in compiled_str.lower() or "999" in compiled_str.lower():
                mock_res.scalars.return_value.all.return_value = []
                mock_res.scalar_one_or_none.return_value = None
            else:
                mock_res.scalars.return_value.all.return_value = [mock_fac]
                mock_res.scalar_one_or_none.return_value = mock_fac
        elif "citizen_complaints" in compiled_str.lower():
            if "nonexistent" in compiled_str.lower() or "999" in compiled_str.lower():
                mock_res.scalars.return_value.all.return_value = []
                mock_res.scalar_one_or_none.return_value = None
            else:
                mock_res.scalars.return_value.all.return_value = [mock_cmp]
                mock_res.scalar_one_or_none.return_value = mock_cmp
        elif "junctions" in compiled_str.lower():
            if "count" in compiled_str.lower():
                mock_res.scalar.return_value = 6
            elif "nonexistent" in compiled_str.lower():
                mock_res.scalars.return_value.all.return_value = []
                mock_res.scalar_one_or_none.return_value = None
            else:
                mock_res.scalars.return_value.all.return_value = [mock_jnc]
                mock_res.scalar_one_or_none.return_value = mock_jnc
        elif "traffic_telemetry" in compiled_str.lower():
            if "avg" in compiled_str.lower():
                mock_res.first.return_value = (44.0, 41.5)
            else:
                mock_res.scalars.return_value.all.return_value = [mock_tel]
                mock_res.scalar_one_or_none.return_value = mock_tel
        elif "traffic_alerts" in compiled_str.lower():
            mock_res.scalars.return_value.all.return_value = [mock_alt]
            mock_res.scalar_one_or_none.return_value = mock_alt
        else:
            mock_res.scalars.return_value.all.return_value = []
            mock_res.scalar_one_or_none.return_value = None
            mock_res.scalar.return_value = 1
            mock_res.first.return_value = (None, None)
        return mock_res


    mock_session.execute.side_effect = mock_execute

    async def _override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_session

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Fixture providing an async HTTP client for FastAPI integration testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def valid_jwt_token() -> str:
    """Generates a valid JWT token for Citizen user."""
    payload = {
        "id": 101,
        "name": "Alex Rivera",
        "email": "citizen@intelliflow.ai",
        "role": "CITIZEN",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture
def police_jwt_token() -> str:
    """Generates a valid JWT token for Traffic Police user."""
    payload = {
        "id": 102,
        "name": "Insp. Rajesh Varma",
        "email": "police@intelliflow.ai",
        "role": "TRAFFIC_POLICE",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture
def municipal_jwt_token() -> str:
    """Generates a valid JWT token for Municipal / City Operations officer."""
    payload = {
        "id": 103,
        "name": "Eng. Sunita Rao",
        "email": "municipal@intelliflow.ai",
        "role": "CITY_OPERATIONS",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture
def admin_jwt_token() -> str:
    """Generates a valid JWT token for Admin user."""
    payload = {
        "id": 100,
        "name": "Super Admin",
        "email": "admin@intelliflow.ai",
        "role": "ADMIN",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

