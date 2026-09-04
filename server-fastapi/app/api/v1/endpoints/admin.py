from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.auth import User
from app.models.audit import SystemAuditLog
from app.schemas.admin import (
    UserManagementDTO,
    UserListResponse,
    UserRoleUpdate,
    UserStatusUpdate,
    SystemAuditLogSchema,
    AuditLogListResponse,
)

router = APIRouter()


@router.get("/users", response_model=UserListResponse)
async def list_users(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """List system users (ADMIN only)."""
    if user_payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": "Only ADMIN users can access user management.",
            },
        )

    stmt = select(User).order_by(User.id)
    result = await db.execute(stmt)
    users_db = result.scalars().all()

    user_dtos = [
        UserManagementDTO(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users_db
    ]

    return UserListResponse(success=True, users=user_dtos)


@router.patch("/users/{user_id}/role", response_model=UserManagementDTO)
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Update user role (ADMIN only)."""
    if user_payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": "Only ADMIN users can update user roles.",
            },
        )

    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"User {user_id} not found."},
        )

    target_user.role = payload.role
    db.add(target_user)
    await db.commit()
    await db.refresh(target_user)

    return UserManagementDTO(
        id=target_user.id,
        email=target_user.email,
        name=target_user.name,
        role=target_user.role,
        is_active=target_user.is_active,
        created_at=target_user.created_at,
    )


@router.patch("/users/{user_id}/status", response_model=UserManagementDTO)
async def toggle_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Toggle user active status (ADMIN only)."""
    if user_payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": "Only ADMIN users can update user active status.",
            },
        )

    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"User {user_id} not found."},
        )

    target_user.is_active = payload.is_active
    db.add(target_user)
    await db.commit()
    await db.refresh(target_user)

    return UserManagementDTO(
        id=target_user.id,
        email=target_user.email,
        name=target_user.name,
        role=target_user.role,
        is_active=target_user.is_active,
        created_at=target_user.created_at,
    )


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(get_current_user_payload),
):
    """Fetch system audit logs (ADMIN only)."""
    if user_payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": "Only ADMIN users can access audit logs.",
            },
        )

    stmt = select(SystemAuditLog).order_by(desc(SystemAuditLog.timestamp)).limit(50)
    res = await db.execute(stmt)
    logs_db = res.scalars().all()

    log_dtos = [
        SystemAuditLogSchema(
            id=log.id,
            user_id=log.user_id,
            user_name=log.user.name if getattr(log, "user", None) else "Verified User",
            action=log.action,
            resource=getattr(log, "resource", "SYSTEM_API"),
            details=log.details,
            timestamp=log.timestamp,
        )
        for log in logs_db
    ]

    return AuditLogListResponse(success=True, logs=log_dtos)

