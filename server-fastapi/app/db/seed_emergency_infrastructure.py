import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.emergency import EmergencyIncidentModel, GreenCorridorModel
from app.models.infrastructure import InfrastructureProjectModel, RoadApprovalModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intelliflow.seed_emergency_infrastructure")

# Demo emergency incidents dataset
DEMO_EMERGENCY_INCIDENTS = [
    {
        "code": "SOS-112-9182",
        "citizen_name": "Rahul S. (DEMO - Masked)",
        "location": "Connaught Center Inner Circle, Gate 4",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "priority": "CODE_RED_112",
        "assigned_unit": "EMS-ALPHA-07 (ALS Unit)",
        "destination_hospital": "City General Trauma Center (H01)",
        "eta_minutes": 3.8,
        "status": "DISPATCHED",
        "is_simulated": True,
    },
    {
        "code": "SOS-112-4029",
        "citizen_name": "Anita K. (DEMO - Masked)",
        "location": "Sector 4 Underpass Expressway",
        "latitude": 28.6250,
        "longitude": 77.2180,
        "priority": "CODE_RED_112",
        "assigned_unit": "EMS-BETA-102",
        "destination_hospital": "Metro Hospital Trauma Corridor",
        "eta_minutes": 5.2,
        "status": "EN_ROUTE",
        "is_simulated": True,
    },
]

# Demo green corridors dataset
DEMO_GREEN_CORRIDORS = [
    {
        "name": "Trauma Priority Wave 01",
        "assigned_unit": "EMS Ambulance Alpha-108",
        "corridor_route": "Junction A -> JNC-103 -> City Trauma Hospital",
        "status": "ACTIVE",
        "eta_minutes": 6,
        "signals_cleared": "4/5",
        "speed_kmh": 68,
        "is_simulated": True,
    },
]

# Demo infrastructure capital projects dataset
DEMO_INFRASTRUCTURE_PROJECTS = [
    {
        "project_code": "PRJ-201",
        "title": "Sector 4 Flyover Expansion & Underpass Reinforcement",
        "department": "Bridges & Structural Engineering",
        "contractor": "L&T Infrastructure",
        "progress_percent": 72,
        "budget_crores": 14.2,
        "status": "IN_PROGRESS",
        "estimated_completion": "Nov 2026",
        "timeline": "Sep 2026 - Nov 2026",
        "traffic_diversion_active": True,
        "is_simulated": True,
    },
    {
        "project_code": "PRJ-202",
        "title": "Smart Storm-Water High-Capacity Drainage Grid",
        "department": "Flood Prevention & Public Health",
        "contractor": "NCC Urban Works",
        "progress_percent": 45,
        "budget_crores": 8.6,
        "status": "IN_PROGRESS",
        "estimated_completion": "Dec 2026",
        "timeline": "Aug 2026 - Dec 2026",
        "traffic_diversion_active": False,
        "is_simulated": True,
    },
    {
        "project_code": "PRJ-203",
        "title": "Arterial Corridor Bitumen Cold-Mix Asphalt Resurfacing",
        "department": "Road Maintenance Bureau",
        "contractor": "Afcons Infra",
        "progress_percent": 90,
        "budget_crores": 5.1,
        "status": "IN_PROGRESS",
        "estimated_completion": "Oct 2026",
        "timeline": "Jul 2026 - Oct 2026",
        "traffic_diversion_active": True,
        "is_simulated": True,
    },
]

# Demo road plan approvals dataset
DEMO_ROAD_APPROVALS = [
    {
        "title": "Underground Cable Ducting Closure",
        "proposed_by": "State Power Distribution Ltd",
        "location": "Western Express Arterial",
        "closure_duration": "3 Days (Weekend)",
        "estimated_delay_mins": 14,
        "traffic_impact_level": "HIGH",
        "status": "PENDING",
        "comments": "Requires traffic diversion via Outer Ring Road",
        "is_simulated": True,
    },
    {
        "title": "Water Main Replacement Project",
        "proposed_by": "Municipal Water Board",
        "location": "Sector 7 Market Cross",
        "closure_duration": "24 Hours",
        "estimated_delay_mins": 8,
        "traffic_impact_level": "MODERATE",
        "status": "PENDING",
        "comments": "Partial single-lane night closure proposed",
        "is_simulated": True,
    },
    {
        "title": "Pedestrian Skywalk Girder Placement",
        "proposed_by": "Urban Mobility Authority",
        "location": "Metro Station Gate 2",
        "closure_duration": "6 Hours (Night)",
        "estimated_delay_mins": 4,
        "traffic_impact_level": "LOW",
        "status": "APPROVED",
        "comments": "Scheduled for Sunday 01:00 AM - 07:00 AM",
        "is_simulated": True,
    },
]


async def seed_emergency_and_infrastructure():
    """Idempotently seed demo Emergency and Infrastructure records."""
    async with AsyncSessionLocal() as session:
        logger.info("Seeding Demo Emergency Incidents...")
        for inc_data in DEMO_EMERGENCY_INCIDENTS:
            stmt = select(EmergencyIncidentModel).where(EmergencyIncidentModel.code == inc_data["code"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                incident = EmergencyIncidentModel(**inc_data)
                session.add(incident)
                logger.info(f"Seeded emergency incident '{inc_data['code']}'.")

        logger.info("Seeding Demo Green Corridors...")
        for gc_data in DEMO_GREEN_CORRIDORS:
            stmt = select(GreenCorridorModel).where(GreenCorridorModel.name == gc_data["name"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                corridor = GreenCorridorModel(**gc_data)
                session.add(corridor)
                logger.info(f"Seeded green corridor '{gc_data['name']}'.")

        logger.info("Seeding Demo Infrastructure Capital Projects...")
        for prj_data in DEMO_INFRASTRUCTURE_PROJECTS:
            stmt = select(InfrastructureProjectModel).where(
                InfrastructureProjectModel.project_code == prj_data["project_code"]
            )
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                project = InfrastructureProjectModel(**prj_data)
                session.add(project)
                logger.info(f"Seeded infrastructure project '{prj_data['project_code']}'.")

        logger.info("Seeding Demo Road Approvals...")
        for app_data in DEMO_ROAD_APPROVALS:
            stmt = select(RoadApprovalModel).where(RoadApprovalModel.title == app_data["title"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                approval = RoadApprovalModel(**app_data)
                session.add(approval)
                logger.info(f"Seeded road approval '{app_data['title']}'.")

        await session.commit()
        logger.info("Phase 3D Emergency & Infrastructure Seed Data completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_emergency_and_infrastructure())
