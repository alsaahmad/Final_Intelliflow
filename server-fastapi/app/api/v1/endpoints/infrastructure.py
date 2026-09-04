from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.infrastructure import InfrastructureProjectModel, RoadApprovalModel
from app.schemas.infrastructure import (
    InfrastructureProjectResponse,
    RoadApprovalResponse,
    RoadApprovalDecision,
    InfrastructureOverviewResponse,
    InfrastructureOverviewStats,
    RoadClosureSimRequest,
    RoadClosureSimResponse,
    RoadClosureSimDetails,
    DetourOption,
)

router = APIRouter()

ALLOWED_MUNICIPAL_ROLES = {
    "CITY_OPERATIONS",
    "MUNICIPAL_CORP",
    "MUNICIPAL_ENGINEER",
    "MUNICIPAL_CORPORATION",
    "COMMAND_CENTER",
    "ADMIN",
}


def verify_municipal_access(user_payload: dict):
    """Helper to verify municipal / city operations role authorization."""
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_MUNICIPAL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access infrastructure operations.",
            },
        )


@router.get("/overview", response_model=InfrastructureOverviewResponse)
async def get_infrastructure_overview(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Get high-level overview metrics for municipal capital works & road approvals."""
    verify_municipal_access(user_payload)

    stmt_prj = select(InfrastructureProjectModel).order_by(desc(InfrastructureProjectModel.created_at))
    res_prj = await db.execute(stmt_prj)
    projects = res_prj.scalars().all()

    stmt_app = select(RoadApprovalModel).order_by(desc(RoadApprovalModel.created_at))
    res_app = await db.execute(stmt_app)
    approvals = res_app.scalars().all()

    active_projects_count = len([p for p in projects if p.status == "IN_PROGRESS"])
    pending_approvals_count = len([a for a in approvals if a.status == "PENDING"])
    total_budget_cr = sum(p.budget_crores for p in projects)

    stats = InfrastructureOverviewStats(
        active_projects_count=active_projects_count,
        pending_approvals_count=pending_approvals_count,
        total_capital_budget_crores=f"₹{total_budget_cr:.2f} Cr",
        grievances_resolved_month=184,
    )

    return InfrastructureOverviewResponse(
        success=True,
        stats=stats,
        projects=projects,
        approvals=approvals,
    )


@router.get("/projects", response_model=List[InfrastructureProjectResponse])
async def list_infrastructure_projects(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """List active capital infrastructure projects (DEMO/SIMULATION)."""
    verify_municipal_access(user_payload)

    stmt = select(InfrastructureProjectModel).order_by(desc(InfrastructureProjectModel.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/approvals", response_model=List[RoadApprovalResponse])
async def list_road_approvals(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """List pending road work and utility closure approval requests."""
    verify_municipal_access(user_payload)

    stmt = select(RoadApprovalModel).order_by(desc(RoadApprovalModel.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/approvals/{approval_id}/decision", response_model=RoadApprovalResponse)
async def update_road_approval_decision(
    approval_id: int,
    payload: RoadApprovalDecision,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Approve or Reject a pending road work permit request."""
    verify_municipal_access(user_payload)

    decision_upper = payload.decision.upper()
    if decision_upper not in {"APPROVED", "REJECTED"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "INVALID_DECISION",
                "message": "Decision must be 'APPROVED' or 'REJECTED'.",
            },
        )

    stmt = select(RoadApprovalModel).where(RoadApprovalModel.id == approval_id)
    res = await db.execute(stmt)
    approval = res.scalar_one_or_none()

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "APPROVAL_NOT_FOUND",
                "message": f"Road approval permit #{approval_id} not found.",
            },
        )

    officer_name = user_payload.get("name") or "City Operations Officer"
    approval.status = decision_upper
    if payload.comments:
        approval.comments = payload.comments
    else:
        approval.comments = f"Decision executed by {officer_name} (DEMO Mode)."

    await db.commit()
    await db.refresh(approval)

    return approval


@router.post("/closure-simulation", response_model=RoadClosureSimResponse)
async def run_road_closure_simulation(
    payload: RoadClosureSimRequest,
    user_payload: dict = Depends(get_current_user_payload),
):
    """Run traffic impact simulation for proposed road closures (DEMO/SIMULATION)."""
    verify_municipal_access(user_payload)

    impact_factor = 1.0
    if payload.closure_type in {"SINGLE_LANE", "PARTIAL_CLOSURE"}:
        impact_factor = 0.45
    elif payload.closure_type == "NIGHT_ONLY":
        impact_factor = 0.20

    base_vph = payload.peak_hour_traffic_vph or 4800
    diverted_vph = round(base_vph * impact_factor)
    delay_mins = round(14 * impact_factor * (1.2 if payload.duration_days > 1 else 1.0))
    secondary_congestion = min(round(45 + impact_factor * 40), 96)
    impact_score = "CRITICAL" if impact_factor >= 0.8 else "HIGH" if impact_factor >= 0.4 else "MODERATE"

    suggested_detours = [
        DetourOption(
            route_code="DETOUR-ALPHA",
            route_name="Outer Bypass Boulevard via Sector 8",
            capacity_pct="72% Available",
            extra_distance_km=2.8,
            eta_added_mins=4,
        ),
        DetourOption(
            route_code="DETOUR-BETA",
            route_name="Metro Service Ring Road",
            capacity_pct="58% Available",
            extra_distance_km=4.1,
            eta_added_mins=7,
        ),
    ]

    mitigation_plan = [
        "Adjust traffic signals on Detour Alpha +15s green wave during peak hours",
        "Deploy 4 traffic wardens at Sector 8 merge junction",
        "Broadcast public detour advisory on Citizen Portal & GPS feeds 48h prior",
    ]

    sim_details = RoadClosureSimDetails(
        road_segment=payload.road_segment,
        closure_type=payload.closure_type,
        duration_days=payload.duration_days,
        impact_score=impact_score,
        diverted_vehicles_per_hour=diverted_vph,
        estimated_average_delay_mins=delay_mins,
        secondary_corridor_congestion_pct=secondary_congestion,
        suggested_detours=suggested_detours,
        mitigation_plan=mitigation_plan,
        is_simulated=True,
    )

    return RoadClosureSimResponse(success=True, simulation=sim_details)
