from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class SimulationRequestSchema(BaseModel):
    """Schema for SUMO microsimulation execution request."""
    junction_code: str = Field(
        ...,
        description="Target junction identifier (e.g., 'J01', 'J14', or OSM node ID)",
        example="J01",
    )
    delta_green_time_sec: int = Field(
        default=15,
        ge=-30,
        le=60,
        description="Signal green time modification delta in seconds (-30 to +60)",
        example=15,
    )
    duration_seconds: int = Field(
        default=900,
        ge=300,
        le=3600,
        description="Simulation horizon in simulated seconds (300 to 3600)",
        example=900,
    )


class SimulationMetricsSchema(BaseModel):
    """Schema representing SUMO-measured micro-simulation traffic metrics."""
    average_travel_time_sec: float = Field(..., description="Average vehicle travel time across corridor in seconds")
    average_vehicle_delay_sec: float = Field(..., description="Average vehicle delay per intersection approach in seconds")
    queue_length_meters: float = Field(..., description="Average queue length in meters")
    throughput_veh_per_hr: float = Field(..., description="Network vehicle throughput per hour")
    waiting_time_sec: float = Field(..., description="Total accumulated vehicle waiting time in seconds")
    vehicle_count: int = Field(..., description="Total simulated vehicles in scenario")


class SimulationComparisonMetricsSchema(BaseModel):
    """Schema representing delta improvements between Baseline (delta=0) and Scenario (delta=N)."""
    travel_time_change_pct: float = Field(..., description="Percentage change in average travel time (negative indicates improvement)")
    delay_change_pct: float = Field(..., description="Percentage change in vehicle delay (negative indicates improvement)")
    queue_length_change_pct: float = Field(..., description="Percentage change in queue length (negative indicates reduction)")
    throughput_change_pct: float = Field(..., description="Percentage change in network throughput (positive indicates improvement)")


class SimulationResultResponseSchema(BaseModel):
    """Comparative SUMO microsimulation results payload."""
    success: bool = True
    junction_code: str
    junction_name: str
    latitude: float
    longitude: float
    osm_node_id: str
    sumo_junction_id: str
    delta_green_time_sec: int
    duration_seconds: int
    is_simulated: bool = True
    dataSource: str = "SUMO_MICROSIMULATION"
    disclaimer: str = "DEMO SIMULATION ONLY — NO REAL SIGNAL CONTROL"
    baseline: SimulationMetricsSchema
    scenario: SimulationMetricsSchema
    comparison: SimulationComparisonMetricsSchema
