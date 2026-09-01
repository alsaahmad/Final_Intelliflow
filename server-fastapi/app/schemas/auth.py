from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class JwtPayloadSchema(BaseModel):
    """Pydantic model representing shared Express JWT payload structure."""

    id: int = Field(..., json_schema_extra={"example": 1})
    name: str = Field(..., json_schema_extra={"example": "Alex Rivera"})
    email: EmailStr = Field(..., json_schema_extra={"example": "citizen@intelliflow.ai"})
    role: str = Field(..., json_schema_extra={"example": "CITIZEN"})


class UserDTO(BaseModel):
    """User Data Transfer Object matching Express API user schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    badge_number: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
