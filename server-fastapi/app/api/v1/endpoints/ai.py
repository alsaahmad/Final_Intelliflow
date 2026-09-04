import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.junction import Junction, TrafficTelemetry
from app.models.audit import SystemAuditLog
from app.schemas.ai import (
    TrafficPredictionSchema,
    JunctionPredictionDetailSchema,
    WhatIfRequestSchema,
    WhatIfResponseSchema,
    RecommendationSchema,
    RecommendationDetailSchema,
    SimulatedActRequestSchema,
    SimulatedActResponseSchema,
)
from app.services.ai_engine import (
    TrafficPredictor,
    ExplainabilityEngine,
    WhatIfSimulator,
    RecommendationEngine,
)
from app.services.redis_service import redis_service

router = APIRouter()

ALLOWED_VIEW_ROLES = {
    "TRAFFIC_POLICE",
    "CITY_OPERATIONS",
    "COMMAND_CENTER",
    "ADMIN",
    "MUNICIPAL_CORP",
}

ALLOWED_ACT_ROLES = {
    "TRAFFIC_POLICE",  # TRAFFIC_POLICE is the ONLY role authorized for simulated action execution
}


@router.get(
    "/predictions",
    response_model=List[TrafficPredictionSchema],
    summary="List Monitored Junction Traffic Predictions",
    description="Returns analytical short-term traffic predictions for monitored junctions.",
)
async def get_predictions(
    sector: Optional[str] = Query(None, description="Optional sector filter"),
    horizon_minutes: int = Query(15, ge=15, le=30, description="Prediction horizon in minutes (15-30)"),
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> List[TrafficPredictionSchema]:
    stmt = select(Junction)
    if sector:
        stmt = stmt.where(Junction.sector.ilike(f"%{sector}%"))

    result = await db.execute(stmt)
    junctions = result.scalars().all()

    predictions: List[TrafficPredictionSchema] = []
    for jnc in junctions:
        tel_stmt = (
            select(TrafficTelemetry)
            .where(TrafficTelemetry.junction_id == jnc.id)
            .order_by(desc(TrafficTelemetry.timestamp))
            .limit(20)
        )
        tel_res = await db.execute(tel_stmt)
        records = list(tel_res.scalars().all())

        pred_schema, _ = TrafficPredictor.predict(
            junction_code=jnc.code,
            junction_name=jnc.name,
            records=records,
            current_green_time=jnc.current_green_time,
            default_cycle_time=jnc.default_cycle_time,
            horizon_minutes=horizon_minutes,
        )
        predictions.append(pred_schema)

    return predictions


@router.get(
    "/predictions/{junction_code}",
    response_model=JunctionPredictionDetailSchema,
    summary="Get Junction Prediction & Factor Explanation",
    description="Returns combined analytical prediction and factor contribution breakdown for a specific junction.",
)
async def get_junction_prediction_detail(
    junction_code: str,
    horizon_minutes: int = Query(15, ge=15, le=30, description="Prediction horizon in minutes (15-30)"),
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> JunctionPredictionDetailSchema:
    stmt = select(Junction)
    if junction_code.startswith("j-"):
        try:
            numeric_id = int(junction_code.replace("j-", ""))
            stmt = stmt.where(Junction.id == numeric_id)
        except ValueError:
            stmt = stmt.where(Junction.code == junction_code)
    else:
        stmt = stmt.where(Junction.code == junction_code)

    result = await db.execute(stmt)
    jnc = result.scalar_one_or_none()

    if not jnc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "JUNCTION_NOT_FOUND",
                "message": f"No traffic junction found matching '{junction_code}'.",
            },
        )

    tel_stmt = (
        select(TrafficTelemetry)
        .where(TrafficTelemetry.junction_id == jnc.id)
        .order_by(desc(TrafficTelemetry.timestamp))
        .limit(20)
    )
    tel_res = await db.execute(tel_stmt)
    records = list(tel_res.scalars().all())

    pred_schema, trend_velocity = TrafficPredictor.predict(
        junction_code=jnc.code,
        junction_name=jnc.name,
        records=records,
        current_green_time=jnc.current_green_time,
        default_cycle_time=jnc.default_cycle_time,
        horizon_minutes=horizon_minutes,
    )

    latest = records[0] if records else None
    curr_cong = latest.congestion_percent if latest else 35
    curr_veh = latest.vehicle_count if latest else 150
    curr_speed = latest.average_speed_kmh if latest else 40.0

    factors = ExplainabilityEngine.explain(
        current_congestion=curr_cong,
        vehicle_count=curr_veh,
        average_speed_kmh=curr_speed,
        current_green_time=jnc.current_green_time,
        default_cycle_time=jnc.default_cycle_time,
        trend_velocity=trend_velocity,
    )

    return JunctionPredictionDetailSchema(
        prediction=pred_schema,
        analytical_factor_contributions=factors,
    )


@router.post(
    "/simulate",
    response_model=WhatIfResponseSchema,
    summary="Transient What-If Signal Scenario Simulation",
    description="Calculates transient analytical comparative estimates for signal green time changes. ZERO DB mutation.",
)
async def simulate_what_if_scenario(
    payload: WhatIfRequestSchema,
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> WhatIfResponseSchema:
    stmt = select(Junction).where(Junction.code == payload.junction_code)
    result = await db.execute(stmt)
    jnc = result.scalar_one_or_none()

    if not jnc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "JUNCTION_NOT_FOUND",
                "message": f"No traffic junction found matching '{payload.junction_code}'.",
            },
        )

    tel_stmt = (
        select(TrafficTelemetry)
        .where(TrafficTelemetry.junction_id == jnc.id)
        .order_by(desc(TrafficTelemetry.timestamp))
        .limit(1)
    )
    tel_res = await db.execute(tel_stmt)
    latest = tel_res.scalar_one_or_none()

    curr_cong = latest.congestion_percent if latest else 35
    curr_queue = latest.queue_length_meters if latest else 20.0
    curr_veh = latest.vehicle_count if latest else 150

    try:
        response = WhatIfSimulator.simulate(
            junction_code=jnc.code,
            current_green_time=jnc.current_green_time,
            default_cycle_time=jnc.default_cycle_time,
            current_congestion=curr_cong,
            current_queue=curr_queue,
            current_vehicle_count=curr_veh,
            delta_green_time_sec=payload.delta_green_time_sec,
        )
        return response
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "success": False,
                "error": "INVALID_SIMULATION_PARAMETERS",
                "message": str(err),
            },
        )


# Phase 4B Endpoints: Recommendations & Server-Authoritative Simulated Act


@router.get(
    "/recommendations/{junction_code}",
    response_model=RecommendationDetailSchema,
    summary="Get Detailed AI Recommendation for Junction (Primary Endpoint)",
    description="Returns analytical signal timing recommendation combined with prediction and factor breakdown for a specific junction.",
)
async def get_junction_recommendation_detail(
    junction_code: str,
    horizon_minutes: int = Query(15, ge=15, le=30, description="Prediction horizon in minutes (15-30)"),
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> RecommendationDetailSchema:
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_VIEW_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to view AI recommendations.",
            },
        )

    stmt = select(Junction)
    if junction_code.startswith("j-"):
        try:
            numeric_id = int(junction_code.replace("j-", ""))
            stmt = stmt.where(Junction.id == numeric_id)
        except ValueError:
            stmt = stmt.where(Junction.code == junction_code)
    else:
        stmt = stmt.where(Junction.code == junction_code)

    result = await db.execute(stmt)
    jnc = result.scalar_one_or_none()

    if not jnc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "JUNCTION_NOT_FOUND",
                "message": f"No traffic junction found matching '{junction_code}'.",
            },
        )

    tel_stmt = (
        select(TrafficTelemetry)
        .where(TrafficTelemetry.junction_id == jnc.id)
        .order_by(desc(TrafficTelemetry.timestamp))
        .limit(20)
    )
    tel_res = await db.execute(tel_stmt)
    records = list(tel_res.scalars().all())

    recommendation = RecommendationEngine.recommend(
        junction_code=jnc.code,
        junction_name=jnc.name,
        records=records,
        current_green_time=jnc.current_green_time,
        default_cycle_time=jnc.default_cycle_time,
        horizon_minutes=horizon_minutes,
    )

    pred_schema, trend_velocity = TrafficPredictor.predict(
        junction_code=jnc.code,
        junction_name=jnc.name,
        records=records,
        current_green_time=jnc.current_green_time,
        default_cycle_time=jnc.default_cycle_time,
        horizon_minutes=horizon_minutes,
    )

    latest = records[0] if records else None
    curr_cong = latest.congestion_percent if latest else 35
    curr_veh = latest.vehicle_count if latest else 150
    curr_speed = latest.average_speed_kmh if latest else 40.0

    factors = ExplainabilityEngine.explain(
        current_congestion=curr_cong,
        vehicle_count=curr_veh,
        average_speed_kmh=curr_speed,
        current_green_time=jnc.current_green_time,
        default_cycle_time=jnc.default_cycle_time,
        trend_velocity=trend_velocity,
    )

    return RecommendationDetailSchema(
        recommendation=recommendation,
        prediction=pred_schema,
        analytical_factor_contributions=factors,
    )


@router.get(
    "/recommendations",
    response_model=List[RecommendationSchema],
    summary="List AI Recommendations (Convenience Endpoint)",
    description="Returns AI signal recommendations for monitored junctions. Note: Iterates monitored junctions independently; does NOT perform citywide network optimization.",
)
async def list_recommendations(
    sector: Optional[str] = Query(None, description="Optional sector filter"),
    horizon_minutes: int = Query(15, ge=15, le=30, description="Prediction horizon in minutes (15-30)"),
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> List[RecommendationSchema]:
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_VIEW_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to view AI recommendations.",
            },
        )

    stmt = select(Junction)
    if sector:
        stmt = stmt.where(Junction.sector.ilike(f"%{sector}%"))

    result = await db.execute(stmt)
    junctions = result.scalars().all()

    recommendations: List[RecommendationSchema] = []
    for jnc in junctions:
        tel_stmt = (
            select(TrafficTelemetry)
            .where(TrafficTelemetry.junction_id == jnc.id)
            .order_by(desc(TrafficTelemetry.timestamp))
            .limit(20)
        )
        tel_res = await db.execute(tel_stmt)
        records = list(tel_res.scalars().all())

        rec = RecommendationEngine.recommend(
            junction_code=jnc.code,
            junction_name=jnc.name,
            records=records,
            current_green_time=jnc.current_green_time,
            default_cycle_time=jnc.default_cycle_time,
            horizon_minutes=horizon_minutes,
        )
        recommendations.append(rec)

    return recommendations


@router.post(
    "/act",
    response_model=SimulatedActResponseSchema,
    summary="Execute Server-Authoritative Simulated Action (TRAFFIC_POLICE Only)",
    description="Recomputes live recommendation server-side, validates requested action, logs durable audit entry, and publishes simulated WebSocket event. Restricted strictly to TRAFFIC_POLICE.",
)
async def execute_simulated_action(
    payload: SimulatedActRequestSchema,
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> SimulatedActResponseSchema:
    # 1. Enforce strict operational RBAC: TRAFFIC_POLICE ONLY
    user_role = user_payload.get("role", "")
    if user_role not in ALLOWED_ACT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to execute simulated actions. Execution is restricted exclusively to Traffic Police.",
            },
        )

    # 2. Resolve junction from PostgreSQL
    stmt = select(Junction).where(Junction.code == payload.junction_code)
    result = await db.execute(stmt)
    jnc = result.scalar_one_or_none()

    if not jnc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "JUNCTION_NOT_FOUND",
                "message": f"No traffic junction found matching '{payload.junction_code}'.",
            },
        )

    # 3. Load latest telemetry and recompute recommendation server-side
    tel_stmt = (
        select(TrafficTelemetry)
        .where(TrafficTelemetry.junction_id == jnc.id)
        .order_by(desc(TrafficTelemetry.timestamp))
        .limit(20)
    )
    tel_res = await db.execute(tel_stmt)
    records = list(tel_res.scalars().all())

    live_recommendation = RecommendationEngine.recommend(
        junction_code=jnc.code,
        junction_name=jnc.name,
        records=records,
        current_green_time=jnc.current_green_time,
        default_cycle_time=jnc.default_cycle_time,
    )

    # 4. Stale/Mismatch Protection: Validate requested action vs live recommendation
    if payload.requested_action.upper() != live_recommendation.recommended_action:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "success": False,
                "error": "STALE_RECOMMENDATION_MISMATCH",
                "message": (
                    f"Requested action '{payload.requested_action}' does not match live server-recomputed recommendation "
                    f"'{live_recommendation.recommended_action}'. Please refresh state."
                ),
            },
        )

    # 5. Extract server-authoritative timings and parameters
    action_type = live_recommendation.recommended_action
    prev_green = jnc.current_green_time
    sim_green = live_recommendation.proposed_green_time_sec
    delta_green = live_recommendation.delta_green_time_sec
    reason = live_recommendation.recommendation_reason

    # 6. Generate server-side UUID action ID
    action_id = f"act_evt_{uuid.uuid4()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    raw_user_id = user_payload.get("id")
    user_id_val = int(raw_user_id) if (isinstance(raw_user_id, int) or (isinstance(raw_user_id, str) and raw_user_id.isdigit())) else None

    # 7. Write SystemAuditLog entry synchronously BEFORE returning response
    audit_entry = SystemAuditLog(
        user_id=user_id_val,
        action="SIMULATED_AI_TRAFFIC_ACTION_EXECUTED",
        severity="INFO",
        details=json.dumps({
            "action_id": action_id,
            "junction_code": jnc.code,
            "action_type": action_type,
            "previous_green_time_sec": prev_green,
            "simulated_green_time_sec": sim_green,
            "delta_green_time_sec": delta_green,
            "recommendation_reason": reason,
            "executed_by_role": user_role,
            "is_simulated": True,
        }),
    )

    db.add(audit_entry)
    await db.commit()
    await db.refresh(audit_entry)

    # 8. Publish real-time WebSocket event over Redis Pub/Sub (with in-memory fallback)
    try:
        await redis_service.publish(
            "intelliflow:channels:traffic",
            {
                "eventId": action_id,
                "timestamp": now_iso,
                "type": "SIMULATED_TRAFFIC_ACTION_EXECUTED",
                "channel": "traffic",
                "is_simulated": True,
                "dataSource": "FASTAPI_SIMULATED_ACTION",
                "data": {
                    "actionId": action_id,
                    "junctionCode": jnc.code,
                    "actionType": action_type,
                    "previousGreenTimeSec": prev_green,
                    "simulatedGreenTimeSec": sim_green,
                    "deltaGreenTimeSec": delta_green,
                    "executedByUserId": user_id_val,
                    "executedByRole": user_role,
                    "status": "SIMULATED_ACTION_EXECUTED",
                },
            },
        )
    except Exception as ws_err:
        import logging
        logging.getLogger("intelliflow.ai").warning(f"WebSocket broadcast notice: {ws_err}")

    # 9. Return response contract
    return SimulatedActResponseSchema(
        success=True,
        action_id=action_id,
        junction_code=jnc.code,
        action_type=action_type,
        previous_green_time_sec=prev_green,
        simulated_green_time_sec=sim_green,
        delta_green_time_sec=delta_green,
        recommendation_reason=reason,
        execution_timestamp=now_iso,
        executed_by_role=user_role,
        status="SIMULATED_ACTION_EXECUTED",
        confirmation_message="Simulated traffic signal adjustment successfully recorded. NO real physical hardware was altered.",
        is_simulated=True,
        dataSource="FASTAPI_SIMULATED_ACTION",
    )
