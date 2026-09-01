import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.junction import Junction, TrafficTelemetry
from app.models.alert import TrafficAlertModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intelliflow.seed_traffic")

# 6 Standard Demo Junctions matching existing project specifications
DEMO_JUNCTIONS = [
    {
        "code": "J14",
        "name": "Central Connaught Plaza Hub",
        "sector": "Sector A - Central Core",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "status": "HEAVY",
        "current_green_time": 32,
        "default_cycle_time": 90,
        "signal_phase": "NORTH_SOUTH",
        "sensor_health": "OPTIMAL",
        "active_advisory": "Lane 2 blockage cleared by patrol team (DEMO DATA)",
        "initial_telemetry": {
            "vehicle_count": 382,
            "average_speed_kmh": 18.0,
            "congestion_percent": 78,
            "queue_length_meters": 140.0,
        },
    },
    {
        "code": "J15",
        "name": "Metro Ring Expressway Toll",
        "sector": "Sector B - Transit Hub",
        "latitude": 28.6250,
        "longitude": 77.2180,
        "status": "MODERATE",
        "current_green_time": 48,
        "default_cycle_time": 90,
        "signal_phase": "EAST_WEST",
        "sensor_health": "OPTIMAL",
        "active_advisory": None,
        "initial_telemetry": {
            "vehicle_count": 245,
            "average_speed_kmh": 36.0,
            "congestion_percent": 54,
            "queue_length_meters": 45.0,
        },
    },
    {
        "code": "J16",
        "name": "Hospital Trauma Corridor Gateway",
        "sector": "Sector C - Medical Enclave",
        "latitude": 28.6010,
        "longitude": 77.2250,
        "status": "OPTIMAL",
        "current_green_time": 75,
        "default_cycle_time": 90,
        "signal_phase": "GREEN_CORRIDOR",
        "sensor_health": "OPTIMAL",
        "active_advisory": "Emergency Green Wave Priority Active (DEMO DATA)",
        "initial_telemetry": {
            "vehicle_count": 118,
            "average_speed_kmh": 45.0,
            "congestion_percent": 26,
            "queue_length_meters": 15.0,
        },
    },
    {
        "code": "J17",
        "name": "Tech Park North Ring Cross",
        "sector": "Sector D - Innovation Corridor",
        "latitude": 28.6380,
        "longitude": 77.2340,
        "status": "OPTIMAL",
        "current_green_time": 42,
        "default_cycle_time": 90,
        "signal_phase": "NORTH_SOUTH",
        "sensor_health": "OPTIMAL",
        "active_advisory": None,
        "initial_telemetry": {
            "vehicle_count": 160,
            "average_speed_kmh": 48.0,
            "congestion_percent": 32,
            "queue_length_meters": 20.0,
        },
    },
    {
        "code": "J18",
        "name": "Western Bypass Interchange",
        "sector": "Sector A - West Zone",
        "latitude": 28.6180,
        "longitude": 77.1950,
        "status": "OPTIMAL",
        "current_green_time": 50,
        "default_cycle_time": 90,
        "signal_phase": "EAST_WEST",
        "sensor_health": "OPTIMAL",
        "active_advisory": None,
        "initial_telemetry": {
            "vehicle_count": 205,
            "average_speed_kmh": 42.0,
            "congestion_percent": 42,
            "queue_length_meters": 30.0,
        },
    },
    {
        "code": "J19",
        "name": "Outer Ring South Underpass",
        "sector": "Sector C - South Belt",
        "latitude": 28.5920,
        "longitude": 77.2150,
        "status": "MODERATE",
        "current_green_time": 35,
        "default_cycle_time": 90,
        "signal_phase": "NORTH_SOUTH",
        "sensor_health": "OPTIMAL",
        "active_advisory": "Drainage suction pumps deployed (DEMO DATA)",
        "initial_telemetry": {
            "vehicle_count": 310,
            "average_speed_kmh": 28.0,
            "congestion_percent": 68,
            "queue_length_meters": 85.0,
        },
    },
]

DEMO_ALERTS = [
    {
        "code": "ALT-401",
        "junction_code": "J14",
        "incident_id": 9812,
        "title": "Multi-Vehicle Obstruction on Central Boulevard (DEMO DATA)",
        "severity": "HIGH",
        "category": "ACCIDENT",
        "location": "Junction J14 (Central Boulevard & 4th Ave)",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "description": "Minor collision blocking lane 2. Traffic patrol on-site; expect 12-15 min slowdown.",
        "estimated_delay_minutes": 14,
        "alternate_route_suggested": "Outer Ring Road East Connector",
        "verified_advisory": True,
        "affected_lanes": "Northbound Lane 2",
    },
    {
        "code": "ALT-402",
        "junction_code": "J16",
        "incident_id": 9813,
        "title": "Active Green Corridor for Emergency Response (DEMO DATA)",
        "severity": "CRITICAL",
        "category": "GREEN_CORRIDOR",
        "location": "Junction J16 (Hospital Trauma Gateway)",
        "latitude": 28.6010,
        "longitude": 77.2250,
        "description": "Priority signal green wave active for emergency ambulance unit heading to City General Trauma.",
        "estimated_delay_minutes": 0,
        "alternate_route_suggested": None,
        "verified_advisory": True,
        "affected_lanes": None,
    },
    {
        "code": "ALT-403",
        "junction_code": "J19",
        "incident_id": 9814,
        "title": "Monsoon Waterlogging Drainage Works (DEMO DATA)",
        "severity": "MEDIUM",
        "category": "WATERLOGGING",
        "location": "Junction J19 South Belt Underpass",
        "latitude": 28.5920,
        "longitude": 77.2150,
        "description": "Municipal de-watering suction pumps active. Single lane operational; drive with caution.",
        "estimated_delay_minutes": 8,
        "alternate_route_suggested": "South-West Connector Link",
        "verified_advisory": True,
        "affected_lanes": "Left Service Lane",
    },
    {
        "code": "ALT-404",
        "junction_code": "J17",
        "incident_id": 9815,
        "title": "Peak Tech Park Inflow Bottleneck (DEMO DATA)",
        "severity": "LOW",
        "category": "CONGESTION",
        "location": "Junction J17 (Tech Park North Ring)",
        "latitude": 28.6380,
        "longitude": 77.2340,
        "description": "Moderate rush-hour accumulation. Adaptive signal timing extended +15s.",
        "estimated_delay_minutes": 5,
        "alternate_route_suggested": None,
        "verified_advisory": False,
        "affected_lanes": None,
    },
]


async def seed_traffic_data():
    """Idempotent seed function populating demo traffic junctions, telemetry, and alerts."""
    async with AsyncSessionLocal() as session:
        logger.info("🌱 Seeding demo traffic domain data into PostgreSQL...")

        code_map = {}

        # 1. Seed Junctions & Baseline Telemetry
        for j_data in DEMO_JUNCTIONS:
            stmt = select(Junction).where(Junction.code == j_data["code"])
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()

            if not existing:
                jnc = Junction(
                    code=j_data["code"],
                    name=j_data["name"],
                    sector=j_data["sector"],
                    latitude=j_data["latitude"],
                    longitude=j_data["longitude"],
                    status=j_data["status"],
                    current_green_time=j_data["current_green_time"],
                    default_cycle_time=j_data["default_cycle_time"],
                    signal_phase=j_data["signal_phase"],
                    sensor_health=j_data["sensor_health"],
                    active_advisory=j_data["active_advisory"],
                )
                session.add(jnc)
                await session.flush()
                code_map[j_data["code"]] = jnc.id

                # Initial baseline telemetry record
                tel_info = j_data["initial_telemetry"]
                telemetry = TrafficTelemetry(
                    junction_id=jnc.id,
                    vehicle_count=tel_info["vehicle_count"],
                    average_speed_kmh=tel_info["average_speed_kmh"],
                    congestion_percent=tel_info["congestion_percent"],
                    queue_length_meters=tel_info["queue_length_meters"],
                )
                session.add(telemetry)
                logger.info(f"   + Created demo Junction {jnc.code} ({jnc.name})")
            else:
                code_map[j_data["code"]] = existing.id
                logger.info(f"   ~ Junction {existing.code} already present.")

        # 2. Seed Traffic Alerts
        for a_data in DEMO_ALERTS:
            stmt = select(TrafficAlertModel).where(TrafficAlertModel.code == a_data["code"])
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()

            if not existing:
                j_id = code_map.get(a_data["junction_code"])
                alert = TrafficAlertModel(
                    code=a_data["code"],
                    junction_id=j_id,
                    incident_id=a_data["incident_id"],
                    title=a_data["title"],
                    severity=a_data["severity"],
                    category=a_data["category"],
                    location=a_data["location"],
                    latitude=a_data["latitude"],
                    longitude=a_data["longitude"],
                    description=a_data["description"],
                    estimated_delay_minutes=a_data["estimated_delay_minutes"],
                    alternate_route_suggested=a_data["alternate_route_suggested"],
                    verified_advisory=a_data["verified_advisory"],
                    affected_lanes=a_data["affected_lanes"],
                    is_active=True,
                )
                session.add(alert)
                logger.info(f"   + Created demo Alert {alert.code} ({alert.title})")
            else:
                logger.info(f"   ~ Alert {existing.code} already present.")

        await session.commit()
        logger.info("✅ Demo traffic domain seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed_traffic_data())
