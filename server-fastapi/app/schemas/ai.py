from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class FactorContributionSchema(BaseModel):
    """Schema for individual analytical factor contribution."""

    factor_name: str = Field(..., json_schema_extra={"example": "Traffic Volume Demand"})
    impact: str = Field(..., json_schema_extra={"example": "HIGH"})
    weight_percent: float = Field(..., json_schema_extra={"example": 35.0})
    measured_value: str = Field(..., json_schema_extra={"example": "340 vehicles"})
    description: str = Field(
        ...,
        json_schema_extra={"example": "Vehicle volume of 340 exceeds baseline 250 capacity threshold."},
    )


class TrafficPredictionSchema(BaseModel):
    """Schema for short-term analytical traffic prediction output."""

    model_config = ConfigDict(from_attributes=True)

    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    junction_name: str = Field(..., json_schema_extra={"example": "Central Connaught Plaza Hub"})
    current_congestion_percent: int = Field(..., json_schema_extra={"example": 78})
    predicted_congestion_percent: int = Field(..., json_schema_extra={"example": 84})
    current_speed_kmh: float = Field(..., json_schema_extra={"example": 18.0})
    predicted_speed_kmh: float = Field(..., json_schema_extra={"example": 15.5})
    current_queue_length_meters: float = Field(..., json_schema_extra={"example": 110.0})
    predicted_queue_length_meters: float = Field(..., json_schema_extra={"example": 125.0})
    prediction_horizon_minutes: int = Field(15, json_schema_extra={"example": 15})
    congestion_trend: str = Field(..., json_schema_extra={"example": "INCREASING"})
    risk_level: str = Field(..., json_schema_extra={"example": "HIGH"})
    telemetry_sample_count: int = Field(..., json_schema_extra={"example": 10})
    time_span_minutes: float = Field(..., json_schema_extra={"example": 25.5})
    is_insufficient_history: bool = Field(False, json_schema_extra={"example": False})
    is_simulated: bool = Field(True, json_schema_extra={"example": True})
    dataSource: str = Field("FASTAPI_AI_ENGINE", json_schema_extra={"example": "FASTAPI_AI_ENGINE"})
    data_origin: str = Field("POSTGRESQL_TELEMETRY", json_schema_extra={"example": "POSTGRESQL_TELEMETRY"})


class JunctionPredictionDetailSchema(BaseModel):
    """Combined response schema containing prediction details and analytical factor contributions."""

    prediction: TrafficPredictionSchema
    analytical_factor_contributions: List[FactorContributionSchema]


class WhatIfRequestSchema(BaseModel):
    """Payload for transient What-If signal timing adjustment simulation."""

    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    delta_green_time_sec: int = Field(
        ...,
        ge=-30,
        le=60,
        description="Signal green time change in seconds (-30 to +60)",
        json_schema_extra={"example": 10},
    )


class WhatIfResponseSchema(BaseModel):
    """Output schema for transient What-If analytical simulation."""

    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    current_green_time_sec: int = Field(..., json_schema_extra={"example": 45})
    simulated_green_time_sec: int = Field(..., json_schema_extra={"example": 55})
    delta_green_time_sec: int = Field(..., json_schema_extra={"example": 10})
    current_congestion_percent: int = Field(..., json_schema_extra={"example": 78})
    predicted_congestion_percent: int = Field(..., json_schema_extra={"example": 70})
    estimated_queue_change_meters: float = Field(..., json_schema_extra={"example": -15.5})
    estimated_delay_change_sec: float = Field(..., json_schema_extra={"example": -4.6})
    estimated_throughput_change_percent: float = Field(..., json_schema_extra={"example": 6.7})
    summary_advisory: str = Field(
        ...,
        json_schema_extra={
            "example": "Adding 10s green time is estimated to reduce congestion by 8 percentage points."
        },
    )
    is_simulated: bool = Field(True, json_schema_extra={"example": True})
    dataSource: str = Field("FASTAPI_AI_ENGINE", json_schema_extra={"example": "FASTAPI_AI_ENGINE"})


# Phase 4B Schemas: Recommend -> Simulated Act


class RecommendationSchema(BaseModel):
    """Schema for deterministic AI recommendation output."""

    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    junction_name: str = Field(..., json_schema_extra={"example": "Central Connaught Plaza Hub"})
    recommended_action: str = Field(
        ...,
        json_schema_extra={"example": "INCREASE_GREEN_TIME"},
        description="INCREASE_GREEN_TIME, DECREASE_GREEN_TIME, or MAINTAIN_TIMING",
    )
    current_green_time_sec: int = Field(..., json_schema_extra={"example": 45})
    proposed_green_time_sec: int = Field(..., json_schema_extra={"example": 55})
    delta_green_time_sec: int = Field(..., json_schema_extra={"example": 10})
    expected_congestion_change: float = Field(..., json_schema_extra={"example": -8.0})
    expected_queue_change_meters: float = Field(..., json_schema_extra={"example": -12.5})
    expected_delay_change_sec: float = Field(..., json_schema_extra={"example": -4.6})
    expected_throughput_change_percent: float = Field(..., json_schema_extra={"example": 6.7})
    recommendation_reason: str = Field(
        ...,
        json_schema_extra={
            "example": "High 78% congestion demand and increasing velocity. Increasing green time by 10s is optimal."
        },
    )
    safety_constraints_applied: List[str] = Field(
        ...,
        json_schema_extra={"example": ["Green time constrained to 10s-120s safety window", "Directional benefit score > 3.0"]},
    )
    is_simulated: bool = Field(True, json_schema_extra={"example": True})
    dataSource: str = Field("FASTAPI_AI_RECOMMENDATION", json_schema_extra={"example": "FASTAPI_AI_RECOMMENDATION"})
    data_origin: str = Field("POSTGRESQL_TELEMETRY", json_schema_extra={"example": "POSTGRESQL_TELEMETRY"})


class RecommendationDetailSchema(BaseModel):
    """Combined response schema containing recommendation, prediction, and factor breakdown."""

    recommendation: RecommendationSchema
    prediction: TrafficPredictionSchema
    analytical_factor_contributions: List[FactorContributionSchema]


class SimulatedActRequestSchema(BaseModel):
    """Request payload for server-authoritative simulated action execution (TRAFFIC_POLICE only)."""

    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    requested_action: str = Field(
        ...,
        json_schema_extra={"example": "INCREASE_GREEN_TIME"},
        description="Must match live server-recomputed recommendation (INCREASE_GREEN_TIME, DECREASE_GREEN_TIME, MAINTAIN_TIMING).",
    )
    requested_delta_green_time_sec: Optional[int] = Field(
        None,
        ge=-30,
        le=60,
        json_schema_extra={"example": 10},
        description="Optional client delta query. Server recomputes authoritative delta.",
    )


class SimulatedActResponseSchema(BaseModel):
    """Output schema for server-authoritative simulated action execution."""

    success: bool = Field(True, json_schema_extra={"example": True})
    action_id: str = Field(..., json_schema_extra={"example": "act_evt_9b1a82f3-4c5e-412d-901a-8f4b237c011e"})
    junction_code: str = Field(..., json_schema_extra={"example": "J14"})
    action_type: str = Field(..., json_schema_extra={"example": "INCREASE_GREEN_TIME"})
    previous_green_time_sec: int = Field(..., json_schema_extra={"example": 45})
    simulated_green_time_sec: int = Field(..., json_schema_extra={"example": 55})
    delta_green_time_sec: int = Field(..., json_schema_extra={"example": 10})
    recommendation_reason: str = Field(
        ...,
        json_schema_extra={"example": "High 78% congestion demand and increasing velocity. Server recomputed and validated action."}
    )
    execution_timestamp: str = Field(..., json_schema_extra={"example": "2026-09-04T13:30:00.000Z"})
    executed_by_role: str = Field("TRAFFIC_POLICE", json_schema_extra={"example": "TRAFFIC_POLICE"})
    status: str = Field("SIMULATED_ACTION_EXECUTED", json_schema_extra={"example": "SIMULATED_ACTION_EXECUTED"})
    confirmation_message: str = Field(
        "Simulated traffic signal adjustment successfully recorded. NO real physical hardware was altered.",
        json_schema_extra={
            "example": "Simulated traffic signal adjustment successfully recorded. NO real physical hardware was altered."
        },
    )
    is_simulated: bool = Field(True, json_schema_extra={"example": True})
    dataSource: str = Field("FASTAPI_SIMULATED_ACTION", json_schema_extra={"example": "FASTAPI_SIMULATED_ACTION"})
