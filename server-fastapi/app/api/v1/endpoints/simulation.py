from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user_payload
from app.schemas.simulation import (
    SimulationRequestSchema,
    SimulationResultResponseSchema,
)
from app.services.sumo_service import sumo_service

router = APIRouter()

ALLOWED_SIMULATION_ROLES = {
    "TRAFFIC_POLICE",
    "CITY_OPERATIONS",
    "MUNICIPAL_CORP",
    "COMMAND_CENTER",
    "ADMIN",
}


@router.post(
    "/run",
    response_model=SimulationResultResponseSchema,
    summary="Execute SUMO Microsimulation (Baseline vs Scenario)",
    description="Triggers transient SUMO microsimulation run comparing baseline (delta=0) against proposed green time delta.",
)
async def run_simulation(
    payload: SimulationRequestSchema,
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
) -> SimulationResultResponseSchema:
    """Executes controlled SUMO microsimulation and returns comparative metrics."""
    user_role = user_payload.get("role", "CITIZEN").upper()
    if user_role not in ALLOWED_SIMULATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to execute SUMO microsimulation runs.",
            },
        )

    # Execute simulation run via SumoService
    result = await sumo_service.execute_simulation_run(
        junction_code=payload.junction_code,
        delta_green_time_sec=payload.delta_green_time_sec,
        duration_seconds=payload.duration_seconds,
    )

    return SimulationResultResponseSchema(**result)
