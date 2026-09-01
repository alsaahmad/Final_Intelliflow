from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ParkingSlotSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    row: str
    col: int
    status: str
    type: str
    level: int
    hourlyRate: float
    features: Optional[List[str]] = []


class ParkingFacilitySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    address: str
    distanceKm: float
    distanceDisplay: str
    coordinates: List[float]
    dijkstraNodeId: str
    totalSlots: int
    availableSlots: int
    occupiedSlots: int
    reservedSlots: int
    disabledSlots: int
    occupancyPercent: int
    hourlyRateInr: float
    operatingHours: str
    evChargingAvailable: bool
    evSlotsAvailable: int
    accessibleSlotsAvailable: int
    levels: int
    currentLevel: int
    slots: List[ParkingSlotSchema] = []
    dataSource: Optional[str] = "FASTAPI_POSTGRES"
