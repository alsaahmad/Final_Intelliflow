import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload, security_bearer
from app.models.emergency import EmergencyIncidentModel, GreenCorridorModel
from app.schemas.emergency import (
    EmergencySosCreate,
    EmergencySosResponse,
    GreenCorridorCreate,
    GreenCorridorResponse,
    EmergencyMonitoringResponse,
    AmbulanceMissionResponse,
    EmergencyUnitTelemetry,
)

router = APIRouter()

ALLOWED_EMERGENCY_ROLES = {
    "CITY_OPERATIONS",
    "TRAFFIC_POLICE",
    "COMMAND_CENTER",
    "AMBULANCE_RESPONDER",
    "MUNICIPAL_CORP",
    "ADMIN",
}


@router.post("/sos", response_model=EmergencySosResponse, status_code=status.HTTP_201_CREATED)
async def trigger_emergency_sos(
    payload: EmergencySosCreate,
    db: AsyncSession = Depends(get_db),
    auth_credentials=Depends(security_bearer),
):
    """Trigger a 1-click distress SOS emergency beacon (DEMO/SIMULATION).

    Personal data is masked for demo/simulation privacy protection.
    """
    user_id = None
    if auth_credentials and auth_credentials.credentials:
        try:
            from app.core.security import decode_jwt_token

            jwt_data = decode_jwt_token(auth_credentials.credentials)
            user_id = jwt_data.get("user_id") or jwt_data.get("id")
        except Exception:
            pass

    code_num = random.randint(1000, 9999)
    incident_code = f"SOS-112-{code_num}"

    # Enforce DPDP privacy demo masking on citizen name
    masked_name = "Verified Citizen (DEMO - Masked)"
    if payload.citizen_name and payload.citizen_name != "Verified Citizen":
        first_part = payload.citizen_name.split()[0]
        masked_name = f"{first_part} S. (DEMO - Masked)"

    incident = EmergencyIncidentModel(
        code=incident_code,
        citizen_name=masked_name,
        citizen_id=user_id,
        location=payload.location or "GPS Location: Connaught Center Sector 4",
        latitude=payload.latitude or 28.6139,
        longitude=payload.longitude or 77.2090,
        priority="CODE_RED_112",
        assigned_unit="EMS-ALPHA-07 (ALS Unit)",
        destination_hospital="City General Trauma Center (H01)",
        eta_minutes=3.8,
        status="DISPATCHED",
        is_simulated=True,
    )

    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    if getattr(incident, "id", None) is None:
        incident.id = random.randint(100, 999)
    if getattr(incident, "created_at", None) is None:
        from datetime import datetime, timezone
        incident.created_at = datetime.now(timezone.utc)

    # Publish real-time emergency event to Redis Pub/Sub channel
    import uuid
    from app.services.redis_service import redis_service
    now_iso = incident.created_at.isoformat() if hasattr(incident.created_at, "isoformat") else datetime.now(timezone.utc).isoformat()
    
    await redis_service.publish(
        "intelliflow:channels:emergency",
        {
            "eventId": f"evt_{uuid.uuid4()}",
            "timestamp": now_iso,
            "type": "EMERGENCY_SOS_TRIGGERED",
            "channel": "emergency",
            "is_simulated": True,
            "dataSource": "FASTAPI_POSTGRES",
            "data": {
                "id": str(incident.id),
                "code": incident.code,
                "citizen_name": incident.citizen_name,
                "location": incident.location,
                "priority": incident.priority,
                "assigned_unit": incident.assigned_unit,
                "destination_hospital": incident.destination_hospital,
                "eta_minutes": incident.eta_minutes,
                "status": incident.status,
                "is_simulated": True,
            },
        },
    )

    return incident




@router.get("/monitoring", response_model=EmergencyMonitoringResponse)
async def get_emergency_monitoring(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Get live emergency monitoring feed (DEMO/SIMULATION)."""
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_EMERGENCY_ROLES and user_role != "CITIZEN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access emergency monitoring.",
            },
        )

    # Fetch active SOS incidents
    stmt_sos = select(EmergencyIncidentModel).order_by(desc(EmergencyIncidentModel.created_at)).limit(10)
    res_sos = await db.execute(stmt_sos)
    active_sos = res_sos.scalars().all()

    # Fetch active green corridors
    stmt_gc = select(GreenCorridorModel).order_by(desc(GreenCorridorModel.created_at)).limit(10)
    res_gc = await db.execute(stmt_gc)
    green_corridors = res_gc.scalars().all()

    # Static demo emergency units telemetry
    emergency_units = [
        EmergencyUnitTelemetry(
            unit_id="EMS-ALPHA-108",
            type="Advanced Cardiac Ambulance",
            status="IN_TRANSIT",
            speed_kmh=68,
            gps="Sector C Hospital Way",
        ),
        EmergencyUnitTelemetry(
            unit_id="POLICE-INTERCEPTOR-04",
            type="Highway Patrol",
            status="PATROLLING",
            speed_kmh=45,
            gps="Western Expressway Toll",
        ),
        EmergencyUnitTelemetry(
            unit_id="FIRE-HAZMAT-02",
            type="Heavy Rescue Tender",
            status="STANDBY",
            speed_kmh=0,
            gps="Station 12 Central",
        ),
    ]

    return EmergencyMonitoringResponse(
        success=True,
        active_sos=active_sos,
        green_corridors=green_corridors,
        emergency_units=emergency_units,
    )


@router.post("/green-corridor", response_model=GreenCorridorResponse, status_code=status.HTTP_201_CREATED)
async def create_simulated_green_corridor(
    payload: GreenCorridorCreate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Request a simulated priority green corridor (DEMO/SIMULATION).

    Does NOT control real traffic signal hardware. Strictly records a simulated request.
    """
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_EMERGENCY_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to create priority green corridors.",
            },
        )

    corridor = GreenCorridorModel(
        name=payload.name,
        assigned_unit=payload.assigned_unit,
        corridor_route=payload.corridor_route,
        status="ACTIVE",
        eta_minutes=payload.eta_minutes or 6,
        signals_cleared="4/5",
        speed_kmh=payload.speed_kmh or 68,
        is_simulated=True,
    )

    db.add(corridor)
    await db.commit()
    await db.refresh(corridor)

    if getattr(corridor, "id", None) is None:
        corridor.id = random.randint(100, 999)
    if getattr(corridor, "created_at", None) is None:
        from datetime import datetime, timezone
        corridor.created_at = datetime.now(timezone.utc)

    return corridor



@router.get("/active-mission", response_model=AmbulanceMissionResponse)
async def get_active_mission_snapshot(
    user_payload: dict = Depends(get_current_user_payload),
):
    """Get a static demo active mission telemetry snapshot for UI compatibility."""
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_EMERGENCY_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access active mission details.",
            },
        )

    return AmbulanceMissionResponse(
        status="success",
        unit_id="EMS-ALPHA-108",
        driver=user_payload.get("name") or "Ambulance Driver (DEMO)",
        paramedic_status="EN_ROUTE_TO_PATIENT",
        is_simulated=True,
    )
