from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TelemetryIngestionSchema(BaseModel):
    """Payload for ingesting real-time traffic sensor observations."""

    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    vehicle_count: int = Field(..., ge=0, json_schema_extra={"example": 382})
    average_speed_kmh: float = Field(..., gt=0.0, json_schema_extra={"example": 18.5})
    congestion_percent: int = Field(..., ge=0, le=100, json_schema_extra={"example": 78})
    queue_length_meters: float = Field(..., ge=0.0, json_schema_extra={"example": 140.0})


class TelemetryResponseSchema(BaseModel):
    """Response model for a persisted telemetry observation."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    junction_id: int
    vehicle_count: int
    average_speed_kmh: float
    congestion_percent: int
    queue_length_meters: float


class CitizenJunctionSummarySchema(BaseModel):
    """Junction summary response model compatible with Citizen UI CitizenJunctionSummary."""

    id: str = Field(..., json_schema_extra={"example": "j-14"})
    code: str = Field(..., json_schema_extra={"example": "J14"})
    name: str = Field(..., json_schema_extra={"example": "Central Connaught Plaza Hub"})
    sector: str = Field(..., json_schema_extra={"example": "Sector A - Central Core"})
    location: List[float] = Field(..., json_schema_extra={"example": [28.6139, 77.209]})
    congestionPercent: int = Field(..., json_schema_extra={"example": 78})
    severity: str = Field(..., json_schema_extra={"example": "HEAVY"})
    trend: str = Field(..., json_schema_extra={"example": "STABLE"})
    averageSpeedKmh: float = Field(..., json_schema_extra={"example": 18.0})
    queueLengthMeters: float = Field(..., json_schema_extra={"example": 140.0})
    vehicleCount: int = Field(..., json_schema_extra={"example": 382})
    signalPhase: str = Field(..., json_schema_extra={"example": "NORTH_SOUTH"})
    signalTimerSeconds: int = Field(..., json_schema_extra={"example": 32})
    sensorHealth: str = Field(..., json_schema_extra={"example": "OPTIMAL"})
    activeAdvisory: Optional[str] = Field(None, json_schema_extra={"example": "Lane 2 cleared"})
    lastUpdated: str = Field(..., json_schema_extra={"example": "2026-09-01T15:00:00.000Z"})
    dataSource: str = Field("FASTAPI_DEMO_POSTGRESQL", json_schema_extra={"example": "FASTAPI_DEMO_POSTGRESQL"})


class CitizenJunctionDetailSchema(BaseModel):
    """Detailed junction view including recent historical observations."""

    junction: CitizenJunctionSummarySchema
    recentTelemetry: List[TelemetryResponseSchema]


class CreateTrafficAlertSchema(BaseModel):
    """Payload for publishing a verified traffic alert."""

    code: str = Field(..., json_schema_extra={"example": "ALT-405"})
    junction_code: Optional[str] = Field(None, json_schema_extra={"example": "J14"})
    incident_id: Optional[int] = Field(None, json_schema_extra={"example": 9812})
    title: str = Field(..., json_schema_extra={"example": "Main Street Obstruction"})
    severity: str = Field(..., json_schema_extra={"example": "HIGH"})  # LOW, MEDIUM, HIGH, CRITICAL
    category: str = Field(..., json_schema_extra={"example": "ACCIDENT"})
    location: str = Field(..., json_schema_extra={"example": "Central Boulevard Sector 4"})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 28.6139})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 77.209})
    description: str = Field(..., json_schema_extra={"example": "Lane 2 blocked due to minor breakdown."})
    estimated_delay_minutes: int = Field(0, ge=0, json_schema_extra={"example": 15})
    alternate_route_suggested: Optional[str] = Field(None, json_schema_extra={"example": "Use Ring Road"})
    verified_advisory: bool = Field(True, json_schema_extra={"example": True})
    affected_lanes: Optional[str] = Field(None, json_schema_extra={"example": "Northbound Lane 2"})


class TrafficAlertSchema(BaseModel):
    """Traffic alert response model compatible with Citizen UI TrafficAlert interface."""

    id: str = Field(..., json_schema_extra={"example": "alt-01"})
    code: str = Field(..., json_schema_extra={"example": "ALT-401"})
    incidentId: Optional[str] = Field(None, json_schema_extra={"example": "inc-9812"})
    junctionId: Optional[str] = Field(None, json_schema_extra={"example": "j-14"})
    title: str = Field(..., json_schema_extra={"example": "Multi-Vehicle Obstruction"})
    severity: str = Field(..., json_schema_extra={"example": "HIGH"})
    category: str = Field(..., json_schema_extra={"example": "ACCIDENT"})
    location: str = Field(..., json_schema_extra={"example": "Junction J14"})
    coordinates: List[float] = Field(..., json_schema_extra={"example": [28.6139, 77.209]})
    description: str = Field(..., json_schema_extra={"example": "Obstruction clearing in progress."})
    timestamp: str = Field(..., json_schema_extra={"example": "2026-09-01T15:00:00.000Z"})
    estimatedDelayMinutes: int = Field(0, json_schema_extra={"example": 14})
    alternateRouteSuggested: Optional[str] = Field(None, json_schema_extra={"example": "Outer Ring Road"})
    verifiedAdvisory: bool = Field(True, json_schema_extra={"example": True})
    affectedLanes: Optional[str] = Field(None, json_schema_extra={"example": "Lane 2"})
    dataSource: str = Field("FASTAPI_DEMO_POSTGRESQL", json_schema_extra={"example": "FASTAPI_DEMO_POSTGRESQL"})


class CityMobilityStatusSchema(BaseModel):
    """Citywide mobility overview status schema."""

    cityCongestionIndex: int = Field(..., json_schema_extra={"example": 44})
    averageSpeedKmh: float = Field(..., json_schema_extra={"example": 41.5})
    activeGreenCorridors: int = Field(..., json_schema_extra={"example": 1})
    trafficStatus: str = Field(..., json_schema_extra={"example": "NORMAL"})
    activeSignalsCount: int = Field(..., json_schema_extra={"example": 142})
    lastUpdated: str = Field(..., json_schema_extra={"example": "2026-09-01T15:00:00.000Z"})
    currentLocationName: str = Field(..., json_schema_extra={"example": "Connaught Place Sector 4"})
    dataSource: str = Field("FASTAPI_DEMO_DERIVED", json_schema_extra={"example": "FASTAPI_DEMO_DERIVED"})
