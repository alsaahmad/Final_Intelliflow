from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.parking import ParkingFacilityModel, ParkingSlotModel
from app.schemas.parking import ParkingFacilitySchema, ParkingSlotSchema

router = APIRouter()


def map_slot_to_schema(slot: ParkingSlotModel) -> ParkingSlotSchema:
    return ParkingSlotSchema(
        id=f"slot-{slot.facility_id}-{slot.slot_code}",
        code=slot.slot_code,
        row=slot.row_name,
        col=slot.col_number,
        status=slot.status,
        type=slot.slot_type,
        level=slot.level,
        hourlyRate=slot.hourly_rate,
        features=slot.features or [],
    )


def map_facility_to_schema(facility: ParkingFacilityModel) -> ParkingFacilitySchema:
    coords = [facility.latitude or 28.6139, facility.longitude or 77.209]
    slots_schema = [map_slot_to_schema(s) for s in (facility.slots or [])]
    return ParkingFacilitySchema(
        id=f"gar-0{facility.id}" if facility.id < 10 else f"gar-{facility.id}",
        name=facility.name,
        code=facility.code,
        address=facility.address,
        distanceKm=facility.distance_km,
        distanceDisplay=facility.distance_display,
        coordinates=coords,
        dijkstraNodeId=facility.dijkstra_node_id,
        totalSlots=facility.total_slots,
        availableSlots=facility.available_slots,
        occupiedSlots=facility.occupied_slots,
        reservedSlots=facility.reserved_slots,
        disabledSlots=facility.disabled_slots,
        occupancyPercent=facility.occupancy_percent,
        hourlyRateInr=facility.hourly_rate_inr,
        operatingHours=facility.operating_hours,
        evChargingAvailable=facility.ev_charging_available,
        evSlotsAvailable=facility.ev_slots_available,
        accessibleSlotsAvailable=facility.accessible_slots_available,
        levels=facility.levels,
        currentLevel=facility.current_level,
        slots=slots_schema,
        dataSource="FASTAPI_POSTGRES",
    )


@router.get(
    "/facilities",
    response_model=List[ParkingFacilitySchema],
    summary="List Nearby Parking Facilities",
    description="Returns parking facilities populated with live PostgreSQL data.",
)
async def get_facilities(
    ev_only: Optional[bool] = Query(False, description="Filter facilities with EV charging available"),
    max_distance_km: Optional[float] = Query(None, description="Max distance in KM filter"),
    db: AsyncSession = Depends(get_db),
) -> List[ParkingFacilitySchema]:
    stmt = select(ParkingFacilityModel).options(selectinload(ParkingFacilityModel.slots))
    if ev_only:
        stmt = stmt.where(
            ParkingFacilityModel.ev_charging_available == True,
            ParkingFacilityModel.ev_slots_available > 0,
        )
    if max_distance_km is not None:
        stmt = stmt.where(ParkingFacilityModel.distance_km <= max_distance_km)

    result = await db.execute(stmt)
    facilities = result.scalars().all()
    return [map_facility_to_schema(f) for f in facilities]


@router.get(
    "/facilities/{facility_id}",
    response_model=ParkingFacilitySchema,
    summary="Get Parking Facility Detail",
    description="Fetch single parking facility detail including all slot configurations.",
)
async def get_facility_detail(
    facility_id: str,
    db: AsyncSession = Depends(get_db),
) -> ParkingFacilitySchema:
    # Handle both string ID formats like 'gar-01' or numeric ID '1' or facility code 'PKG-CP-01'
    numeric_id: Optional[int] = None
    if facility_id.startswith("gar-"):
        try:
            numeric_id = int(facility_id.replace("gar-", "").lstrip("0") or "0")
        except ValueError:
            numeric_id = None
    elif facility_id.isdigit():
        numeric_id = int(facility_id)

    stmt = select(ParkingFacilityModel).options(selectinload(ParkingFacilityModel.slots))
    if numeric_id is not None:
        stmt = stmt.where(ParkingFacilityModel.id == numeric_id)
    else:
        stmt = stmt.where(ParkingFacilityModel.code == facility_id)

    result = await db.execute(stmt)
    facility = result.scalar_one_or_none()

    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "FACILITY_NOT_FOUND",
                "message": f"Parking facility with ID or Code '{facility_id}' not found.",
            },
        )
    return map_facility_to_schema(facility)


@router.get(
    "/facilities/{facility_id}/slots",
    response_model=List[ParkingSlotSchema],
    summary="Get Parking Facility Slots",
    description="Fetch slot grid layout for a specific facility and level.",
)
async def get_facility_slots(
    facility_id: str,
    level: Optional[int] = Query(1, ge=1, le=5, description="Floor level"),
    db: AsyncSession = Depends(get_db),
) -> List[ParkingSlotSchema]:
    numeric_id: Optional[int] = None
    if facility_id.startswith("gar-"):
        try:
            numeric_id = int(facility_id.replace("gar-", "").lstrip("0") or "0")
        except ValueError:
            numeric_id = None
    elif facility_id.isdigit():
        numeric_id = int(facility_id)

    stmt = select(ParkingFacilityModel).options(selectinload(ParkingFacilityModel.slots))
    if numeric_id is not None:
        stmt = stmt.where(ParkingFacilityModel.id == numeric_id)
    else:
        stmt = stmt.where(ParkingFacilityModel.code == facility_id)

    result = await db.execute(stmt)
    facility = result.scalar_one_or_none()

    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "FACILITY_NOT_FOUND",
                "message": f"Parking facility with ID or Code '{facility_id}' not found.",
            },
        )

    slots = [s for s in facility.slots if s.level == level]
    return [map_slot_to_schema(s) for s in slots]
