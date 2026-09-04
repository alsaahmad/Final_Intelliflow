from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class EmergencySosCreate(BaseModel):
    """Schema for creating a 112 distress SOS beacon request (DEMO/SIMULATION)."""

    citizen_name: Optional[str] = Field(
        default="Verified Citizen (DEMO - Masked)",
        description="Masked display name for privacy protection.",
    )
    location: str = Field(..., description="Incident location description.")
    latitude: Optional[float] = Field(default=None, description="Optional GPS latitude.")
    longitude: Optional[float] = Field(default=None, description="Optional GPS longitude.")


class EmergencySosResponse(BaseModel):
    """Response schema for triggered SOS distress beacon."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    citizen_name: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: str
    assigned_unit: str
    destination_hospital: str
    eta_minutes: float
    status: str
    is_simulated: bool
    created_at: datetime


class GreenCorridorCreate(BaseModel):
    """Schema for requesting a priority emergency green corridor (DEMO/SIMULATION)."""

    name: str = Field(..., description="Corridor designation name.")
    assigned_unit: str = Field(..., description="Emergency vehicle unit ID.")
    corridor_route: str = Field(..., description="Corridor route description.")
    eta_minutes: Optional[int] = Field(default=6, description="Estimated transit minutes.")
    speed_kmh: Optional[int] = Field(default=68, description="Target cruise speed km/h.")


class GreenCorridorResponse(BaseModel):
    """Response schema for green corridor request."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    assigned_unit: str
    corridor_route: str
    status: str
    eta_minutes: int
    signals_cleared: str
    speed_kmh: int
    is_simulated: bool
    created_at: datetime


class EmergencyUnitTelemetry(BaseModel):
    """Static demo emergency unit location and status snapshot."""

    unit_id: str
    type: str
    status: str
    speed_kmh: int
    gps: str


class EmergencyMonitoringResponse(BaseModel):
    """Aggregated live emergency monitoring response (DEMO/SIMULATION)."""

    success: bool = True
    active_sos: List[EmergencySosResponse]
    green_corridors: List[GreenCorridorResponse]
    emergency_units: List[EmergencyUnitTelemetry]


class AmbulanceMissionResponse(BaseModel):
    """STATIC demo ambulance active mission snapshot for UI compatibility."""

    status: str = "success"
    unit_id: str = "EMS-ALPHA-108"
    driver: Optional[str] = "Command Center Dispatcher (DEMO)"
    paramedic_status: str = "EN_ROUTE_TO_PATIENT"
    assigned_incident: dict = Field(
        default_factory=lambda: {
            "id": "INC-8890",
            "call_type": "Cardiac Emergency / Acute Trauma (DEMO)",
            "priority": "CODE_RED",
            "patient_location": "Building 4B, Metro Tech Zone",
            "destination_hospital": "City General Trauma Center (ICU Bed 4 reserved)",
            "eta_minutes": 3.5,
            "gps_coordinates": {"lat": 28.6139, "lng": 77.2090},
        }
    )
    green_corridor_status: dict = Field(
        default_factory=lambda: {
            "active": True,
            "corridor_id": "GC-901",
            "signals_upcoming": [
                {"name": "4th Avenue Junction", "state": "HELD_GREEN (SIMULATED)", "distance_meters": 400},
                {"name": "Hospital Access Slip Road", "state": "HELD_GREEN (SIMULATED)", "distance_meters": 1100},
            ],
        }
    )
    vital_telemetry_stream: dict = Field(
        default_factory=lambda: {
            "heart_rate_bpm": 104,
            "spo2_percent": 96,
            "blood_pressure": "135/88",
            "ecg_sync_live": True,
        }
    )
    is_simulated: bool = True
