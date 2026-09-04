from typing import List, Optional
from pydantic import BaseModel, Field


class PoliceJunctionSummary(BaseModel):
    junction_code: str
    name: str
    congestion_percent: int
    severity: str
    speed_kmh: float
    signal_phase: str
    signal_timer_sec: int


class PoliceOverviewResponse(BaseModel):
    success: bool = True
    active_junctions_count: int = 14
    worsening_junctions_count: int = 2
    city_average_speed_kmh: float = 38.4
    system_status: str = "OPTIMAL_PATROL"
    monitored_junctions: List[PoliceJunctionSummary] = []


class SignalOverrideRequest(BaseModel):
    junctionCode: str = Field(..., alias="junctionCode")
    newGreenTimeSec: int = Field(..., alias="newGreenTimeSec")
    mode: Optional[str] = "MANUAL_OVERRIDE"


class SignalOverrideResponse(BaseModel):
    success: bool = True
    junction_code: str
    new_green_time_sec: int
    mode: str
    status: str = "SIMULATED_OVERRIDE_ACTIVE"
    message: str = "Simulated manual signal override applied successfully."
    is_simulated: bool = True
