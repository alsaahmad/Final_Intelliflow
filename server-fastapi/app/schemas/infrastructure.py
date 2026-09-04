from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class InfrastructureProjectResponse(BaseModel):
    """Response schema for capital infrastructure projects."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    project_code: str
    title: str
    department: str
    contractor: str
    progress_percent: int
    budget_crores: float
    status: str
    estimated_completion: str
    timeline: str
    traffic_diversion_active: bool
    is_simulated: bool
    created_at: datetime


class RoadApprovalResponse(BaseModel):
    """Response schema for road work and utility permit approvals."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    proposed_by: str
    location: str
    closure_duration: str
    estimated_delay_mins: int
    traffic_impact_level: str
    status: str
    comments: Optional[str] = None
    is_simulated: bool
    created_at: datetime


class RoadApprovalDecision(BaseModel):
    """Payload schema for executing an Approve/Reject decision on a road permit."""

    decision: str = Field(..., description="Decision status: 'APPROVED' or 'REJECTED'")
    comments: Optional[str] = Field(default=None, description="Optional officer comments.")


class InfrastructureOverviewStats(BaseModel):
    """Summary statistics for municipal overview."""

    active_projects_count: int
    pending_approvals_count: int
    total_capital_budget_crores: str
    grievances_resolved_month: int


class InfrastructureOverviewResponse(BaseModel):
    """Aggregated infrastructure overview response."""

    success: bool = True
    stats: InfrastructureOverviewStats
    projects: List[InfrastructureProjectResponse]
    approvals: List[RoadApprovalResponse]


class RoadClosureSimRequest(BaseModel):
    """Payload schema for road closure impact simulation."""

    road_segment: str = Field(
        default="Western Arterial Expressway (KM 4 - 8)", description="Target arterial corridor"
    )
    closure_type: str = Field(
        default="FULL_CLOSURE", description="'FULL_CLOSURE' | 'SINGLE_LANE' | 'NIGHT_ONLY'"
    )
    duration_days: int = Field(default=3, description="Planned closure duration in days")
    peak_hour_traffic_vph: Optional[int] = Field(default=4800, description="Base peak hour traffic volume")


class DetourOption(BaseModel):
    """Suggested detour route."""

    route_code: str
    route_name: str
    capacity_pct: str
    extra_distance_km: float
    eta_added_mins: int


class RoadClosureSimDetails(BaseModel):
    """Simulation metrics output."""

    road_segment: str
    closure_type: str
    duration_days: int
    impact_score: str
    diverted_vehicles_per_hour: int
    estimated_average_delay_mins: int
    secondary_corridor_congestion_pct: int
    suggested_detours: List[DetourOption]
    mitigation_plan: List[str]
    is_simulated: bool = True


class RoadClosureSimResponse(BaseModel):
    """Response schema for road closure impact simulation."""

    success: bool = True
    simulation: RoadClosureSimDetails
