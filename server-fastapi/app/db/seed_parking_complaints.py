import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.parking import ParkingFacilityModel, ParkingSlotModel
from app.models.complaint import CitizenComplaintModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intelliflow.seed_parking_complaints")

# Parking Facilities Dataset matching frontend MOCK_PARKING_FACILITIES
DEMO_FACILITIES = [
    {
        "code": "PKG-CP-01",
        "name": "Connaught Central Multi-Level Car Park",
        "address": "Block B, Inner Circle, Connaught Center",
        "distance_km": 0.45,
        "distance_display": "450 m away",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "dijkstra_node_id": "node-cp",
        "total_slots": 24,
        "available_slots": 13,
        "occupied_slots": 8,
        "reserved_slots": 2,
        "disabled_slots": 1,
        "occupancy_percent": 42,
        "hourly_rate_inr": 40.0,
        "operating_hours": "24/7 Open",
        "ev_charging_available": True,
        "ev_slots_available": 3,
        "accessible_slots_available": 1,
        "levels": 2,
        "current_level": 1,
        "prefix": "CP",
        "slots_spec": [
            {"code": "A1", "row": "A", "col": 1, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 1, "rate": 40, "features": ["60kW Fast DC Charging", "Covered Bay"]},
            {"code": "A2", "row": "A", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Standard Sedan Bay"]},
            {"code": "A3", "row": "A", "col": 3, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 40, "features": ["CCTV Monitored", "Close to Elevator 1"]},
            {"code": "A4", "row": "A", "col": 4, "status": "RESERVED", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Corporate Reserved"]},
            {"code": "A5", "row": "A", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Extra Width SUV Bay"]},
            {"code": "A6", "row": "A", "col": 6, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 1, "rate": 40, "features": ["Type-2 AC 22kW", "Solar Powered"]},

            {"code": "B1", "row": "B", "col": 1, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "B2", "row": "B", "col": 2, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "B3", "row": "B", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Occupied by DL-01-AB-1234"]},
            {"code": "B4", "row": "B", "col": 4, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Occupied by HR-26-CC-8821"]},
            {"code": "B5", "row": "B", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "B6", "row": "B", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 40, "features": ["Occupied by DL-03-XY-9901"]},

            {"code": "C1", "row": "C", "col": 1, "status": "DISABLED", "type": "ACCESSIBLE", "level": 2, "rate": 40, "features": ["Maintenance / Sensor Calibration"]},
            {"code": "C2", "row": "C", "col": 2, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "C3", "row": "C", "col": 3, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "C4", "row": "C", "col": 4, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Occupied by UP-16-ZZ-4411"]},
            {"code": "C5", "row": "C", "col": 5, "status": "RESERVED", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Staff Reserved Bay"]},
            {"code": "C6", "row": "C", "col": 6, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Standard Car Bay"]},

            {"code": "D1", "row": "D", "col": 1, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "D2", "row": "D", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Occupied by DL-08-QR-5566"]},
            {"code": "D3", "row": "D", "col": 3, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "D4", "row": "D", "col": 4, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Standard Car Bay"]},
            {"code": "D5", "row": "D", "col": 5, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 2, "rate": 40, "features": ["Fast EV 50kW Charger"]},
            {"code": "D6", "row": "D", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 40, "features": ["Occupied by DL-04-MM-7788"]},
        ],
    },
    {
        "code": "PKG-MTH-02",
        "name": "Metro Tech Hub Underground Smart Garage",
        "address": "Gate 3, Cyber Tech Complex, Metro Ring Road",
        "distance_km": 1.2,
        "distance_display": "1.2 km away",
        "latitude": 28.6195,
        "longitude": 77.2145,
        "dijkstra_node_id": "node-metro",
        "total_slots": 24,
        "available_slots": 10,
        "occupied_slots": 11,
        "reserved_slots": 2,
        "disabled_slots": 1,
        "occupancy_percent": 54,
        "hourly_rate_inr": 30.0,
        "operating_hours": "06:00 AM - 11:30 PM",
        "ev_charging_available": True,
        "ev_slots_available": 2,
        "accessible_slots_available": 1,
        "levels": 2,
        "current_level": 1,
        "prefix": "MTH",
        "slots_spec": [
            {"code": "A1", "row": "A", "col": 1, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 1, "rate": 30, "features": ["Type-2 Fast AC Plug"]},
            {"code": "A2", "row": "A", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "A3", "row": "A", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "A4", "row": "A", "col": 4, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Near Metro Gate 3 Exit"]},
            {"code": "A5", "row": "A", "col": 5, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "A6", "row": "A", "col": 6, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 1, "rate": 30, "features": ["60kW Fast DC Plug"]},

            {"code": "B1", "row": "B", "col": 1, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "B2", "row": "B", "col": 2, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "B3", "row": "B", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "B4", "row": "B", "col": 4, "status": "RESERVED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Metro Transit Reserved"]},
            {"code": "B5", "row": "B", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "B6", "row": "B", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 30, "features": ["Standard Sedan Bay"]},

            {"code": "C1", "row": "C", "col": 1, "status": "AVAILABLE", "type": "ACCESSIBLE", "level": 2, "rate": 30, "features": ["Wide Ramped Accessible Bay"]},
            {"code": "C2", "row": "C", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "C3", "row": "C", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "C4", "row": "C", "col": 4, "status": "RESERVED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Cyber Hub Permit Holder"]},
            {"code": "C5", "row": "C", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "C6", "row": "C", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},

            {"code": "D1", "row": "D", "col": 1, "status": "DISABLED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Underground Drainage Work"]},
            {"code": "D2", "row": "D", "col": 2, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "D3", "row": "D", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "D4", "row": "D", "col": 4, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "D5", "row": "D", "col": 5, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
            {"code": "D6", "row": "D", "col": 6, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 30, "features": ["Standard Sedan Bay"]},
        ],
    },
    {
        "code": "PKG-CGT-03",
        "name": "City General Trauma Plaza Parking Deck",
        "address": "Hospital Access Boulevard, Medical Emergency Zone",
        "distance_km": 2.1,
        "distance_display": "2.1 km away",
        "latitude": 28.6255,
        "longitude": 77.2185,
        "dijkstra_node_id": "node-hosp1",
        "total_slots": 24,
        "available_slots": 16,
        "occupied_slots": 6,
        "reserved_slots": 2,
        "disabled_slots": 0,
        "occupancy_percent": 33,
        "hourly_rate_inr": 20.0,
        "operating_hours": "24/7 Priority Open",
        "ev_charging_available": True,
        "ev_slots_available": 1,
        "accessible_slots_available": 2,
        "levels": 2,
        "current_level": 1,
        "prefix": "CGT",
        "slots_spec": [
            {"code": "A1", "row": "A", "col": 1, "status": "AVAILABLE", "type": "VIP_EMERGENCY", "level": 1, "rate": 20, "features": ["Emergency Direct Trauma Access"]},
            {"code": "A2", "row": "A", "col": 2, "status": "AVAILABLE", "type": "VIP_EMERGENCY", "level": 1, "rate": 20, "features": ["Emergency Doctor Priority Bay"]},
            {"code": "A3", "row": "A", "col": 3, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "A4", "row": "A", "col": 4, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Visitor Bay Occupied"]},
            {"code": "A5", "row": "A", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "A6", "row": "A", "col": 6, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 1, "rate": 20, "features": ["Hospital EV Fleet Fast Plug"]},

            {"code": "B1", "row": "B", "col": 1, "status": "AVAILABLE", "type": "ACCESSIBLE", "level": 1, "rate": 20, "features": ["Wheelchair Level Hospital Bay"]},
            {"code": "B2", "row": "B", "col": 2, "status": "AVAILABLE", "type": "ACCESSIBLE", "level": 1, "rate": 20, "features": ["Wheelchair Level Hospital Bay"]},
            {"code": "B3", "row": "B", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Visitor Bay Occupied"]},
            {"code": "B4", "row": "B", "col": 4, "status": "RESERVED", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Surgeon On-Call Reserved"]},
            {"code": "B5", "row": "B", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "B6", "row": "B", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 20, "features": ["Visitor Bay Occupied"]},

            {"code": "C1", "row": "C", "col": 1, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "C2", "row": "C", "col": 2, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "C3", "row": "C", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Bay Occupied"]},
            {"code": "C4", "row": "C", "col": 4, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "C5", "row": "C", "col": 5, "status": "RESERVED", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Medical Staff Reserved"]},
            {"code": "C6", "row": "C", "col": 6, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},

            {"code": "D1", "row": "D", "col": 1, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "D2", "row": "D", "col": 2, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "D3", "row": "D", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Bay Occupied"]},
            {"code": "D4", "row": "D", "col": 4, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
            {"code": "D5", "row": "D", "col": 5, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Bay Occupied"]},
            {"code": "D6", "row": "D", "col": 6, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 20, "features": ["Visitor Car Bay"]},
        ],
    },
    {
        "code": "PKG-CIVIC-04",
        "name": "Municipal Civic Secretariat Visitor Parking",
        "address": "Gate 2, Municipal Civic Secretariat Complex",
        "distance_km": 1.8,
        "distance_display": "1.8 km away",
        "latitude": 28.6160,
        "longitude": 77.2220,
        "dijkstra_node_id": "node-civic",
        "total_slots": 24,
        "available_slots": 8,
        "occupied_slots": 13,
        "reserved_slots": 2,
        "disabled_slots": 1,
        "occupancy_percent": 63,
        "hourly_rate_inr": 25.0,
        "operating_hours": "08:00 AM - 08:00 PM",
        "ev_charging_available": True,
        "ev_slots_available": 2,
        "accessible_slots_available": 1,
        "levels": 2,
        "current_level": 1,
        "prefix": "CIVIC",
        "slots_spec": [
            {"code": "A1", "row": "A", "col": 1, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Government Fleet Bay"]},
            {"code": "A2", "row": "A", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Government Fleet Bay"]},
            {"code": "A3", "row": "A", "col": 3, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Public Citizen Visitor Bay"]},
            {"code": "A4", "row": "A", "col": 4, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Public Visitor Bay"]},
            {"code": "A5", "row": "A", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Public Citizen Visitor Bay"]},
            {"code": "A6", "row": "A", "col": 6, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 1, "rate": 25, "features": ["Civic EV Public Charger"]},

            {"code": "B1", "row": "B", "col": 1, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Official Duty Bay"]},
            {"code": "B2", "row": "B", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Official Duty Bay"]},
            {"code": "B3", "row": "B", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Official Duty Bay"]},
            {"code": "B4", "row": "B", "col": 4, "status": "RESERVED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Mayor Office Protocol Reserved"]},
            {"code": "B5", "row": "B", "col": 5, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Visitor Bay Occupied"]},
            {"code": "B6", "row": "B", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 1, "rate": 25, "features": ["Visitor Bay Occupied"]},

            {"code": "C1", "row": "C", "col": 1, "status": "AVAILABLE", "type": "ACCESSIBLE", "level": 2, "rate": 25, "features": ["Universal Access Ramped Bay"]},
            {"code": "C2", "row": "C", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Visitor Bay"]},
            {"code": "C3", "row": "C", "col": 3, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Visitor Bay"]},
            {"code": "C4", "row": "C", "col": 4, "status": "RESERVED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Commissioner Staff Reserved"]},
            {"code": "C5", "row": "C", "col": 5, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Citizen Visitor Bay"]},
            {"code": "C6", "row": "C", "col": 6, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Citizen Visitor Bay"]},

            {"code": "D1", "row": "D", "col": 1, "status": "DISABLED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Pavement Resurfacing Work"]},
            {"code": "D2", "row": "D", "col": 2, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Visitor Bay"]},
            {"code": "D3", "row": "D", "col": 3, "status": "AVAILABLE", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Citizen Visitor Bay"]},
            {"code": "D4", "row": "D", "col": 4, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Visitor Bay"]},
            {"code": "D5", "row": "D", "col": 5, "status": "AVAILABLE", "type": "EV_CHARGING", "level": 2, "rate": 25, "features": ["Fast EV Charger 50kW"]},
            {"code": "D6", "row": "D", "col": 6, "status": "OCCUPIED", "type": "STANDARD", "level": 2, "rate": 25, "features": ["Public Visitor Bay"]},
        ],
    },
]

# Demo Citizen Complaints Dataset matching frontend INITIAL_COMPLAINTS
DEMO_COMPLAINTS = [
    {
        "code": "CIVIC-9021",
        "title": "Deep Pothole Cluster near Central Underpass",
        "category": "POTHOLE",
        "location": "Sector 4, Central Boulevard East",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "urgency": "HIGH",
        "status": "IN_PROGRESS",
        "assigned_department": "Road Maintenance & Infrastructure",
        "reported_by_name": "Rahul Sharma (Citizen)",
        "description": "Multiple sharp potholes causing vehicle slowdown and hazard for two-wheelers.",
        "estimated_resolution_hours": 24,
        "remarks": "Field repair team mobilized. Bitumen cold-mix application scheduled.",
    },
    {
        "code": "CIVIC-9022",
        "title": "Traffic Signal Stuck on Red Phase",
        "category": "TRAFFIC_LIGHT_FAILURE",
        "location": "Junction J16, Inner Ring Crossing",
        "latitude": 28.6010,
        "longitude": 77.2250,
        "urgency": "EMERGENCY",
        "status": "PENDING",
        "assigned_department": "Traffic Police Electrical Wing",
        "reported_by_name": "Priya Mehra (Citizen)",
        "description": "North-bound signal timer freezing at 00s causing heavy intersection gridlock.",
        "estimated_resolution_hours": 4,
        "remarks": "Dispatched emergency electrical team for PLC reboot.",
    },
    {
        "code": "CIVIC-9023",
        "title": "Monsoon Waterlogging & Blocked Storm Drain",
        "category": "WATERLOGGING",
        "location": "Expressway Flyover Service Road",
        "latitude": 28.5920,
        "longitude": 77.2150,
        "urgency": "MEDIUM",
        "status": "RESOLVED",
        "assigned_department": "Storm Water Drainage & Sewage",
        "reported_by_name": "Anil Gupta (Citizen)",
        "description": "1.5 feet standing water after thunderstorm blocking left service lane.",
        "estimated_resolution_hours": 8,
        "remarks": "High-capacity de-watering suction pumps deployed. Drain cleared.",
    },
]


async def seed_parking_and_complaints():
    async with AsyncSessionLocal() as session:
        logger.info("Seeding Parking Facilities & Cinema-style Slots...")
        for fac_data in DEMO_FACILITIES:
            stmt = select(ParkingFacilityModel).where(ParkingFacilityModel.code == fac_data["code"])
            res = await session.execute(stmt)
            existing_fac = res.scalar_one_or_none()

            if not existing_fac:
                slots_spec = fac_data.pop("slots_spec")
                prefix = fac_data.pop("prefix")
                facility = ParkingFacilityModel(**fac_data)
                session.add(facility)
                await session.flush()

                for s in slots_spec:
                    slot = ParkingSlotModel(
                        facility_id=facility.id,
                        slot_code=s["code"],
                        row_name=s["row"],
                        col_number=s["col"],
                        level=s["level"],
                        status=s["status"],
                        slot_type=s["type"],
                        hourly_rate=s["rate"],
                        features=s["features"],
                    )
                    session.add(slot)
                logger.info(f"Seeded parking facility '{facility.code}' with {len(slots_spec)} slots.")
            else:
                logger.info(f"Parking facility '{fac_data['code']}' already exists. Skipping.")

        logger.info("Seeding Demo Citizen Complaints...")
        for cmp_data in DEMO_COMPLAINTS:
            stmt = select(CitizenComplaintModel).where(CitizenComplaintModel.code == cmp_data["code"])
            res = await session.execute(stmt)
            existing_cmp = res.scalar_one_or_none()

            if not existing_cmp:
                complaint = CitizenComplaintModel(**cmp_data)
                session.add(complaint)
                logger.info(f"Seeded complaint '{complaint.code}'.")
            else:
                logger.info(f"Complaint '{cmp_data['code']}' already exists. Skipping.")

        await session.commit()
        logger.info("Phase 3C Seed Data completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_parking_and_complaints())
