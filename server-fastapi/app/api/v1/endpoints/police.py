from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.junction import Junction
from app.models.alert import TrafficAlertModel
from app.schemas.police import (
    PoliceJunctionSummary,
    PoliceOverviewResponse,
    SignalOverrideRequest,
    SignalOverrideResponse,
)

router = APIRouter()

ALLOWED_POLICE_ROLES = {
    "TRAFFIC_POLICE",
    "CITY_OPERATIONS",
    "COMMAND_CENTER",
    "ADMIN",
}


@router.get("/overview", response_model=PoliceOverviewResponse)
async def get_police_overview(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Get Traffic Police console overview telemetry."""
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_POLICE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access Traffic Police overview.",
            },
        )

    stmt = select(Junction).order_by(Junction.code)
    res = await db.execute(stmt)
    junctions_db = res.scalars().all()

    monitored = [
        PoliceJunctionSummary(
            junction_code=j.code,
            name=j.name,
            congestion_percent=j.congestion_percent,
            severity=j.severity,
            speed_kmh=j.average_speed_kmh,
            signal_phase=j.signal_phase,
            signal_timer_sec=j.signal_timer_seconds,
        )
        for j in junctions_db
    ]

    return PoliceOverviewResponse(
        success=True,
        active_junctions_count=len(monitored) if monitored else 14,
        worsening_junctions_count=2,
        city_average_speed_kmh=38.4,
        system_status="OPTIMAL_PATROL",
        monitored_junctions=monitored,
    )


@router.post("/signal-override", response_model=SignalOverrideResponse)
async def apply_signal_override(
    payload: SignalOverrideRequest,
    user_payload: dict = Depends(get_current_user_payload),
):
    """Apply manual signal override (DEMO / SIMULATION ONLY).

    Does NOT control real hardware or IoT signal controllers.
    """
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_POLICE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to execute manual signal overrides.",
            },
        )

    return SignalOverrideResponse(
        success=True,
        junction_code=payload.junctionCode,
        new_green_time_sec=payload.newGreenTimeSec,
        mode=payload.mode or "MANUAL_OVERRIDE",
        status="SIMULATED_OVERRIDE_ACTIVE",
        message=f"Simulated green signal override of {payload.newGreenTimeSec}s applied to junction {payload.junctionCode}.",
        is_simulated=True,
    )
