from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CreateComplaintSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    category: str = Field(..., description="POTHOLE, TRAFFIC_LIGHT_FAILURE, WATERLOGGING, ROAD_HAZARD, ILLEGAL_PARKING")
    location: str = Field(..., min_length=3, max_length=255)
    urgency: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, EMERGENCY")
    description: str = Field(..., min_length=5, max_length=1000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UpdateComplaintStatusSchema(BaseModel):
    status: str = Field(..., description="PENDING, IN_PROGRESS, RESOLVED")
    remarks: Optional[str] = Field(None, max_length=1000)


class CitizenComplaintSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    title: str
    category: str
    location: str
    urgency: str
    status: str
    timestamp: str
    assignedDepartment: str
    reportedBy: str
    description: str
    estimatedResolutionHours: int
    remarks: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    dataSource: Optional[str] = "FASTAPI_POSTGRES"
