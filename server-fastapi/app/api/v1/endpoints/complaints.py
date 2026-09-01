import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.complaint import CitizenComplaintModel
from app.schemas.complaint import (
    CitizenComplaintSchema,
    CreateComplaintSchema,
    UpdateComplaintStatusSchema,
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

VALID_STATUSES = {"PENDING", "IN_PROGRESS", "RESOLVED"}
VALID_CATEGORIES = {
    "POTHOLE",
    "TRAFFIC_LIGHT_FAILURE",
    "WATERLOGGING",
    "ROAD_HAZARD",
    "ILLEGAL_PARKING",
}


def map_complaint_to_schema(c: CitizenComplaintModel) -> CitizenComplaintSchema:
    time_str = c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "Recently"
    return CitizenComplaintSchema(
        id=f"cmp-{c.id}",
        code=c.code,
        title=c.title,
        category=c.category,
        location=c.location,
        urgency=c.urgency,
        status=c.status,
        timestamp=time_str,
        assignedDepartment=c.assigned_department,
        reportedBy=c.reported_by_name,
        description=c.description,
        estimatedResolutionHours=c.estimated_resolution_hours,
        remarks=c.remarks,
        latitude=c.latitude,
        longitude=c.longitude,
        dataSource="FASTAPI_POSTGRES",
    )


@router.post(
    "",
    response_model=CitizenComplaintSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Citizen Civic Complaint",
    description="Logs a new citizen complaint in PostgreSQL.",
)
async def create_complaint(
    payload: CreateComplaintSchema,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user_payload),
) -> CitizenComplaintSchema:
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "success": False,
                "error": "INVALID_CATEGORY",
                "message": f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}",
            },
        )

    # Department Assignment logic
    if payload.category in ["POTHOLE", "ROAD_HAZARD"]:
        assigned_dept = "Road Maintenance & Infrastructure"
    elif payload.category == "TRAFFIC_LIGHT_FAILURE":
        assigned_dept = "Traffic Police Electrical Wing"
    elif payload.category == "WATERLOGGING":
        assigned_dept = "Storm Water Drainage & Sewage"
    else:
        assigned_dept = "Urban Enforcement Bureau"

    est_hours = 4 if payload.urgency == "EMERGENCY" else (12 if payload.urgency == "HIGH" else 24)
    code_num = random.randint(9000, 9999)

    reported_by_id = user.get("id") if isinstance(user.get("id"), int) else None
    reported_by_name = user.get("name") or user.get("email") or "Verified Citizen"

    complaint = CitizenComplaintModel(
        code=f"CIVIC-{code_num}",
        title=payload.title,
        category=payload.category,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        urgency=payload.urgency,
        status="PENDING",
        assigned_department=assigned_dept,
        reported_by_id=reported_by_id,
        reported_by_name=reported_by_name,
        description=payload.description,
        estimated_resolution_hours=est_hours,
    )

    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)

    return map_complaint_to_schema(complaint)


@router.get(
    "",
    response_model=List[CitizenComplaintSchema],
    summary="List Citizen Complaints",
    description="Fetch civic complaints from PostgreSQL database with optional filtering.",
)
async def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (PENDING, IN_PROGRESS, RESOLVED)"),
    category_filter: Optional[str] = Query(None, alias="category", description="Filter by category"),
    my_reports_only: Optional[bool] = Query(False, description="Filter only complaints submitted by authenticated user"),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user_payload),
) -> List[CitizenComplaintSchema]:
    stmt = select(CitizenComplaintModel).order_by(desc(CitizenComplaintModel.created_at))

    if status_filter:
        stmt = stmt.where(CitizenComplaintModel.status == status_filter.upper())
    if category_filter:
        stmt = stmt.where(CitizenComplaintModel.category == category_filter.upper())
    if my_reports_only:
        user_id = user.get("id")
        if user_id:
            stmt = stmt.where(CitizenComplaintModel.reported_by_id == user_id)

    result = await db.execute(stmt)
    complaints = result.scalars().all()
    return [map_complaint_to_schema(c) for c in complaints]


@router.get(
    "/{complaint_id}",
    response_model=CitizenComplaintSchema,
    summary="Get Complaint Detail",
    description="Fetch single complaint by ID or code.",
)
async def get_complaint_detail(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(get_current_user_payload),
) -> CitizenComplaintSchema:
    numeric_id: Optional[int] = None
    if complaint_id.startswith("cmp-"):
        try:
            numeric_id = int(complaint_id.replace("cmp-", ""))
        except ValueError:
            numeric_id = None
    elif complaint_id.isdigit():
        numeric_id = int(complaint_id)

    stmt = select(CitizenComplaintModel)
    if numeric_id is not None:
        stmt = stmt.where(CitizenComplaintModel.id == numeric_id)
    else:
        stmt = stmt.where(CitizenComplaintModel.code == complaint_id)

    result = await db.execute(stmt)
    complaint = result.scalar_one_or_none()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "COMPLAINT_NOT_FOUND",
                "message": f"Complaint with ID or Code '{complaint_id}' not found.",
            },
        )
    return map_complaint_to_schema(complaint)


@router.patch(
    "/{complaint_id}/status",
    response_model=CitizenComplaintSchema,
    summary="Update Complaint Status & Remarks",
    description="Updates complaint workflow status (PENDING -> IN_PROGRESS -> RESOLVED) and appends resolution remarks.",
)
async def update_complaint_status(
    complaint_id: str,
    payload: UpdateComplaintStatusSchema,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user_payload),
) -> CitizenComplaintSchema:
    user_role = (user.get("role") or "").upper()
    if user_role not in ALLOWED_MUNICIPAL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": "Only municipal operations officers can update complaint status.",
            },
        )

    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": "INVALID_STATUS",
                "message": f"Status must be one of: {', '.join(sorted(VALID_STATUSES))}",
            },
        )

    numeric_id: Optional[int] = None
    if complaint_id.startswith("cmp-"):
        try:
            numeric_id = int(complaint_id.replace("cmp-", ""))
        except ValueError:
            numeric_id = None
    elif complaint_id.isdigit():
        numeric_id = int(complaint_id)

    stmt = select(CitizenComplaintModel)
    if numeric_id is not None:
        stmt = stmt.where(CitizenComplaintModel.id == numeric_id)
    else:
        stmt = stmt.where(CitizenComplaintModel.code == complaint_id)

    result = await db.execute(stmt)
    complaint = result.scalar_one_or_none()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "COMPLAINT_NOT_FOUND",
                "message": f"Complaint with ID or Code '{complaint_id}' not found.",
            },
        )

    complaint.status = payload.status
    if payload.remarks:
        complaint.remarks = payload.remarks
    if payload.status == "RESOLVED":
        complaint.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(complaint)

    return map_complaint_to_schema(complaint)
