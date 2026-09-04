from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class UserManagementDTO(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    success: bool = True
    users: List[UserManagementDTO]


class UserRoleUpdate(BaseModel):
    role: str


class UserStatusUpdate(BaseModel):
    is_active: bool


class SystemAuditLogSchema(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = "System User"
    action: str
    resource: Optional[str] = "SYSTEM"
    details: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)



class AuditLogListResponse(BaseModel):
    success: bool = True
    logs: List[SystemAuditLogSchema]
