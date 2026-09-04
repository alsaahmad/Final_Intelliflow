from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.junction import Junction, TrafficTelemetry
from app.models.alert import TrafficAlertModel
from app.schemas.traffic import (
    CitizenJunctionSummarySchema,
    CitizenJunctionDetailSchema,
    TelemetryIngestionSchema,
    TelemetryResponseSchema,
    TrafficAlertSchema,
    CreateTrafficAlertSchema,
    CityMobilityStatusSchema,
)

router = APIRouter()

ALLOWED_WRITE_ROLES = {"TRAFFIC_POLICE", "CITY_OPERATIONS", "MUNICIPAL_CORP", "COMMAND_CENTER", "ADMIN"}


def compute_severity(congestion: int) -> str:
    if congestion >= 75:
        return "HEAVY"
    if congestion >= 50:
        return "MODERATE"
    return "CLEAR"


@router.get(
    "/junctions",
    response_model=List[CitizenJunctionSummarySchema],
    summary="List Nearby Traffic Junctions",
    description="Returns junction summaries populated with latest PostgreSQL telemetry data.",
)
async def get_junctions(
    sector: Optional[str] = Query(None, description="Optional sector name filter"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
) -> List[CitizenJunctionSummarySchema]:
    stmt = select(Junction)
    if sector:
        stmt = stmt.where(Junction.sector.ilike(f"%{sector}%"))
    if limit:
        stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    junctions = result.scalars().all()

    response_list: List[CitizenJunctionSummarySchema] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for jnc in junctions:
        # Fetch latest telemetry observation for junction
        tel_stmt = (
            select(TrafficTelemetry)
            .where(TrafficTelemetry.junction_id == jnc.id)
            .order_by(desc(TrafficTelemetry.timestamp))
            .limit(1)
        )
        tel_res = await db.execute(tel_stmt)
        latest_tel = tel_res.scalar_one_or_none()

        congestion = latest_tel.congestion_percent if latest_tel else 35
        speed = latest_tel.average_speed_kmh if latest_tel else 40.0
        queue = latest_tel.queue_length_meters if latest_tel else 20.0
        vehicles = latest_tel.vehicle_count if latest_tel else 150
        last_time = latest_tel.timestamp.isoformat() if (latest_tel and latest_tel.timestamp) else now_iso

        lat = jnc.latitude if jnc.latitude is not None else 28.6139
        lng = jnc.longitude if jnc.longitude is not None else 77.2090

        response_list.append(
            CitizenJunctionSummarySchema(
                id=f"j-{jnc.id}",
                code=jnc.code,
                name=jnc.name,
                sector=jnc.sector,
                location=[lat, lng],
                congestionPercent=congestion,
                severity=compute_severity(congestion),
                trend="STABLE",
                averageSpeedKmh=speed,
                queueLengthMeters=queue,
                vehicleCount=vehicles,
                signalPhase=jnc.signal_phase,
                signalTimerSeconds=jnc.current_green_time,
                sensorHealth=jnc.sensor_health,
                activeAdvisory=jnc.active_advisory,
                lastUpdated=last_time,
                dataSource="FASTAPI_DEMO_POSTGRESQL",
            )
        )

    return response_list


@router.get(
    "/junctions/{id_or_code}",
    response_model=CitizenJunctionDetailSchema,
    summary="Get Junction Detail",
    description="Returns junction details along with recent telemetry observations.",
)
async def get_junction_by_id_or_code(
    id_or_code: str,
    db: AsyncSession = Depends(get_db),
) -> CitizenJunctionDetailSchema:
    stmt = select(Junction)
    if id_or_code.startswith("j-"):
        try:
            numeric_id = int(id_or_code.replace("j-", ""))
            stmt = stmt.where(Junction.id == numeric_id)
        except ValueError:
            stmt = stmt.where(Junction.code == id_or_code)
    elif id_or_code.isdigit():
        stmt = stmt.where(Junction.id == int(id_or_code))
    else:
        stmt = stmt.where(Junction.code == id_or_code)

    result = await db.execute(stmt)
    jnc = result.scalar_one_or_none()

    if not jnc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "JUNCTION_NOT_FOUND",
                "message": f"No traffic junction found matching '{id_or_code}'.",
            },
        )

    # Fetch recent 10 telemetry observations
    tel_stmt = (
        select(TrafficTelemetry)
        .where(TrafficTelemetry.junction_id == jnc.id)
        .order_by(desc(TrafficTelemetry.timestamp))
        .limit(10)
    )
    tel_res = await db.execute(tel_stmt)
    recent_telemetry = tel_res.scalars().all()

    latest_tel = recent_telemetry[0] if recent_telemetry else None
    congestion = latest_tel.congestion_percent if latest_tel else 35
    speed = latest_tel.average_speed_kmh if latest_tel else 40.0
    queue = latest_tel.queue_length_meters if latest_tel else 20.0
    vehicles = latest_tel.vehicle_count if latest_tel else 150
    now_iso = datetime.now(timezone.utc).isoformat()
    last_time = latest_tel.timestamp.isoformat() if (latest_tel and latest_tel.timestamp) else now_iso

    lat = jnc.latitude if jnc.latitude is not None else 28.6139
    lng = jnc.longitude if jnc.longitude is not None else 77.2090

    summary = CitizenJunctionSummarySchema(
        id=f"j-{jnc.id}",
        code=jnc.code,
        name=jnc.name,
        sector=jnc.sector,
        location=[lat, lng],
        congestionPercent=congestion,
        severity=compute_severity(congestion),
        trend="STABLE",
        averageSpeedKmh=speed,
        queueLengthMeters=queue,
        vehicleCount=vehicles,
        signalPhase=jnc.signal_phase,
        signalTimerSeconds=jnc.current_green_time,
        sensorHealth=jnc.sensor_health,
        activeAdvisory=jnc.active_advisory,
        lastUpdated=last_time,
        dataSource="FASTAPI_DEMO_POSTGRESQL",
    )

    telemetry_responses = [TelemetryResponseSchema.model_validate(t) for t in recent_telemetry]

    return CitizenJunctionDetailSchema(
        junction=summary,
        recentTelemetry=telemetry_responses,
    )


@router.post(
    "/telemetry",
    response_model=TelemetryResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Traffic Sensor Telemetry",
    description="Ingests a new traffic observation record. Requires Traffic Police or Command Center authorization.",
)
async def ingest_telemetry(
    payload: TelemetryIngestionSchema,
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> TelemetryResponseSchema:
    user_role = user_payload.get("role")
    if user_role not in ALLOWED_WRITE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' does not have clearance to ingest telemetry data.",
            },
        )

    # Verify junction exists
    stmt = select(Junction).where(Junction.code == payload.junction_code)
    result = await db.execute(stmt)
    jnc = result.scalar_one_or_none()

    if not jnc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "JUNCTION_NOT_FOUND",
                "message": f"Junction code '{payload.junction_code}' does not exist in PostgreSQL.",
            },
        )

    telemetry_record = TrafficTelemetry(
        junction_id=jnc.id,
        vehicle_count=payload.vehicle_count,
        average_speed_kmh=payload.average_speed_kmh,
        congestion_percent=payload.congestion_percent,
        queue_length_meters=payload.queue_length_meters,
    )

    db.add(telemetry_record)

    # Update junction status if heavily congested
    if payload.congestion_percent >= 75:
        jnc.status = "HEAVY"
    elif payload.congestion_percent >= 50:
        jnc.status = "MODERATE"
    else:
        jnc.status = "OPTIMAL"

    await db.commit()
    await db.refresh(telemetry_record)

    # Publish real-time event to Redis Pub/Sub channel
    import uuid
    from app.services.redis_service import redis_service
    await redis_service.publish(
        "intelliflow:channels:traffic",
        {
            "eventId": f"evt_{uuid.uuid4()}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "TRAFFIC_TELEMETRY_UPDATE",
            "channel": "traffic",
            "is_simulated": False,
            "dataSource": "FASTAPI_POSTGRES",
            "data": {
                "junctionCode": jnc.code,
                "junctionName": jnc.name,
                "congestionPercent": payload.congestion_percent,
                "severity": compute_severity(payload.congestion_percent),
                "averageSpeedKmh": payload.average_speed_kmh,
                "queueLengthMeters": payload.queue_length_meters,
                "vehicleCount": payload.vehicle_count,
                "signalPhase": jnc.signal_phase,
                "signalTimerSeconds": jnc.current_green_time,
            },
        },
    )

    return TelemetryResponseSchema.model_validate(telemetry_record)



@router.get(
    "/alerts",
    response_model=List[TrafficAlertSchema],
    summary="List Active Traffic Alerts",
    description="Returns active traffic alert advisories.",
)
async def get_alerts(
    severity: Optional[str] = Query(None, description="Optional severity filter: LOW, MEDIUM, HIGH, CRITICAL"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
) -> List[TrafficAlertSchema]:
    stmt = select(TrafficAlertModel).where(TrafficAlertModel.is_active == is_active)
    if severity and severity.upper() != "ALL":
        stmt = stmt.where(TrafficAlertModel.severity == severity.upper())

    stmt = stmt.order_by(desc(TrafficAlertModel.created_at))
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    response_list: List[TrafficAlertSchema] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for alt in alerts:
        lat = alt.latitude if alt.latitude is not None else 28.6139
        lng = alt.longitude if alt.longitude is not None else 77.2090
        ts = alt.created_at.isoformat() if alt.created_at else now_iso
        jnc_id_str = f"j-{alt.junction_id}" if alt.junction_id else None
        inc_id_str = f"inc-{alt.incident_id}" if alt.incident_id else None

        response_list.append(
            TrafficAlertSchema(
                id=f"alt-{alt.id}",
                code=alt.code,
                incidentId=inc_id_str,
                junctionId=jnc_id_str,
                title=alt.title,
                severity=alt.severity,
                category=alt.category,
                location=alt.location,
                coordinates=[lat, lng],
                description=alt.description,
                timestamp=ts,
                estimatedDelayMinutes=alt.estimated_delay_minutes,
                alternateRouteSuggested=alt.alternate_route_suggested,
                verifiedAdvisory=alt.verified_advisory,
                affectedLanes=alt.affected_lanes,
                dataSource="FASTAPI_DEMO_POSTGRESQL",
            )
        )

    return response_list


@router.post(
    "/alerts",
    response_model=TrafficAlertSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Publish Verified Traffic Alert",
    description="Creates a new verified traffic alert. Requires Traffic Police or Command Center authorization.",
)
async def create_alert(
    payload: CreateTrafficAlertSchema,
    user_payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
) -> TrafficAlertSchema:
    user_role = user_payload.get("role")
    if user_role not in ALLOWED_WRITE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' does not have clearance to publish traffic alerts.",
            },
        )

    jnc_id = None
    if payload.junction_code:
        j_stmt = select(Junction).where(Junction.code == payload.junction_code)
        j_res = await db.execute(j_stmt)
        found_jnc = j_res.scalar_one_or_none()
        if found_jnc:
            jnc_id = found_jnc.id

    alert_record = TrafficAlertModel(
        code=payload.code,
        junction_id=jnc_id,
        incident_id=payload.incident_id,
        title=payload.title,
        severity=payload.severity.upper(),
        category=payload.category.upper(),
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        estimated_delay_minutes=payload.estimated_delay_minutes,
        alternate_route_suggested=payload.alternate_route_suggested,
        verified_advisory=payload.verified_advisory,
        affected_lanes=payload.affected_lanes,
        is_active=True,
    )

    db.add(alert_record)
    await db.commit()

    await db.refresh(alert_record)

    lat = alert_record.latitude if alert_record.latitude is not None else 28.6139
    lng = alert_record.longitude if alert_record.longitude is not None else 77.2090
    now_iso = datetime.now(timezone.utc).isoformat()
    ts = alert_record.created_at.isoformat() if alert_record.created_at else now_iso

    response_schema = TrafficAlertSchema(
        id=f"alt-{alert_record.id}",
        code=alert_record.code,
        incidentId=f"inc-{alert_record.incident_id}" if alert_record.incident_id else None,
        junctionId=f"j-{alert_record.junction_id}" if alert_record.junction_id else None,
        title=alert_record.title,
        severity=alert_record.severity,
        category=alert_record.category,
        location=alert_record.location,
        coordinates=[lat, lng],
        description=alert_record.description,
        timestamp=ts,
        estimatedDelayMinutes=alert_record.estimated_delay_minutes,
        alternateRouteSuggested=alert_record.alternate_route_suggested,
        verifiedAdvisory=alert_record.verified_advisory,
        affectedLanes=alert_record.affected_lanes,
        dataSource="FASTAPI_DEMO_POSTGRESQL",
    )

    # Publish real-time event to Redis Pub/Sub channel
    import uuid
    from app.services.redis_service import redis_service
    await redis_service.publish(
        "intelliflow:channels:alerts",
        {
            "eventId": f"evt_{uuid.uuid4()}",
            "timestamp": now_iso,
            "type": "TRAFFIC_ALERT_PUBLISHED",
            "channel": "alerts",
            "is_simulated": False,
            "dataSource": "FASTAPI_POSTGRES",
            "data": response_schema.model_dump(),
        },
    )

    return response_schema



@router.get(
    "/mobility-status",
    response_model=CityMobilityStatusSchema,
    summary="Get City Mobility Status",
    description="Returns aggregated citywide traffic congestion metrics.",
)
async def get_mobility_status(
    db: AsyncSession = Depends(get_db),
) -> CityMobilityStatusSchema:
    j_stmt = select(func.count(Junction.id))
    j_res = await db.execute(j_stmt)
    total_junctions = j_res.scalar() or 0

    t_stmt = select(func.avg(TrafficTelemetry.congestion_percent), func.avg(TrafficTelemetry.average_speed_kmh))
    t_res = await db.execute(t_stmt)
    avg_congestion, avg_speed = t_res.first() or (44.0, 41.5)

    avg_cong_int = int(round(avg_congestion)) if avg_congestion is not None else 44
    avg_speed_val = round(avg_speed, 1) if avg_speed is not None else 41.5

    status_str = "HEAVY" if avg_cong_int >= 75 else "MODERATE" if avg_cong_int >= 50 else "NORMAL"

    return CityMobilityStatusSchema(
        cityCongestionIndex=avg_cong_int,
        averageSpeedKmh=avg_speed_val,
        activeGreenCorridors=1,
        trafficStatus=status_str,
        activeSignalsCount=total_junctions or 142,
        lastUpdated=datetime.now(timezone.utc).isoformat(),
        currentLocationName="Connaught Place Sector 4, New Delhi",
        dataSource="FASTAPI_DEMO_DERIVED",
    )
