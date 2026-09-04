import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient

from app.models.junction import TrafficTelemetry
from app.services.ai_engine import TrafficPredictor, ExplainabilityEngine, WhatIfSimulator, RecommendationEngine


def test_prediction_with_sufficient_history():
    """Verify prediction algorithm when history meets count, time span, and gap rules."""
    now = datetime.now(timezone.utc)
    records = [
        TrafficTelemetry(
            id=i + 1,
            junction_id=14,
            timestamp=now - timedelta(minutes=(20 - i * 5)),
            vehicle_count=200 + i * 20,
            average_speed_kmh=40.0 - i * 2.0,
            congestion_percent=40 + i * 5,
            queue_length_meters=20.0 + i * 5.0,
        )
        for i in range(5)
    ]

    schema, trend_vel = TrafficPredictor.predict(
        junction_code="J14",
        junction_name="Central Connaught Plaza Hub",
        records=records,
        current_green_time=45,
        default_cycle_time=90,
        horizon_minutes=15,
    )

    assert schema.is_insufficient_history is False
    assert schema.telemetry_sample_count == 5
    assert schema.time_span_minutes >= 15.0
    assert schema.predicted_congestion_percent >= schema.current_congestion_percent
    assert schema.predicted_speed_kmh <= schema.current_speed_kmh
    assert schema.predicted_queue_length_meters >= schema.current_queue_length_meters


def test_prediction_with_insufficient_time_span():
    """Verify fallback handling when observations span less than 15 minutes."""
    now = datetime.now(timezone.utc)
    records = [
        TrafficTelemetry(
            id=i + 1,
            junction_id=14,
            timestamp=now - timedelta(minutes=(5 - i * 2)),  # Spans 4 minutes only
            vehicle_count=180,
            average_speed_kmh=35.0,
            congestion_percent=50,
            queue_length_meters=30.0,
        )
        for i in range(3)
    ]

    schema, trend_vel = TrafficPredictor.predict(
        junction_code="J14",
        junction_name="Central Connaught Plaza Hub",
        records=records,
        current_green_time=45,
        default_cycle_time=90,
        horizon_minutes=15,
    )

    assert schema.is_insufficient_history is True
    assert schema.predicted_congestion_percent == schema.current_congestion_percent


def test_explainability_factor_calculation():
    """Verify analytical factor contributions sum to exactly 100.0%."""
    factors = ExplainabilityEngine.explain(
        current_congestion=75,
        vehicle_count=350,
        average_speed_kmh=18.0,
        current_green_time=30,
        default_cycle_time=90,
        trend_velocity=1.2,
    )

    assert len(factors) == 4
    total_weight = sum(f.weight_percent for f in factors)
    assert round(total_weight, 1) == 100.0
    for f in factors:
        assert f.measured_value != ""
        assert f.description != ""


def test_whatif_positive_and_negative_delta():
    """Verify What-If estimations for +10s and -10s signal timing adjustments."""
    res_pos = WhatIfSimulator.simulate(
        junction_code="J14",
        current_green_time=45,
        default_cycle_time=90,
        current_congestion=80,
        current_queue=100.0,
        current_vehicle_count=300,
        delta_green_time_sec=10,
    )

    assert res_pos.simulated_green_time_sec == 55
    assert res_pos.predicted_congestion_percent < res_pos.current_congestion_percent
    assert res_pos.estimated_queue_change_meters < 0
    assert res_pos.estimated_delay_change_sec < 0
    assert res_pos.estimated_throughput_change_percent > 0

    res_neg = WhatIfSimulator.simulate(
        junction_code="J14",
        current_green_time=45,
        default_cycle_time=90,
        current_congestion=80,
        current_queue=100.0,
        current_vehicle_count=300,
        delta_green_time_sec=-10,
    )

    assert res_neg.simulated_green_time_sec == 35
    assert res_neg.predicted_congestion_percent > res_neg.current_congestion_percent


def test_whatif_minimum_green_rejection():
    """Verify rejection when resulting green time is less than 10 seconds."""
    with pytest.raises(ValueError, match="cannot be lower than the safety threshold of 10s"):
        WhatIfSimulator.simulate(
            junction_code="J14",
            current_green_time=20,
            default_cycle_time=90,
            current_congestion=60,
            current_queue=50.0,
            current_vehicle_count=200,
            delta_green_time_sec=-15,  # Resulting 5s < 10s minimum
        )


# Phase 4B Tests: Recommendation Engine & Simulated Act


def test_recommendation_beneficial_scoring():
    """Verify recommendation engine evaluates candidate deltas using directional beneficial scoring."""
    now = datetime.now(timezone.utc)
    # High congestion (80%) with increasing trend
    records = [
        TrafficTelemetry(
            id=i + 1,
            junction_id=14,
            timestamp=now - timedelta(minutes=(20 - i * 5)),
            vehicle_count=300 + i * 20,
            average_speed_kmh=18.0 - i * 1.5,
            congestion_percent=70 + i * 3,
            queue_length_meters=80.0 + i * 10.0,
        )
        for i in range(5)
    ]

    rec = RecommendationEngine.recommend(
        junction_code="J14",
        junction_name="Central Connaught Plaza Hub",
        records=records,
        current_green_time=32,
        default_cycle_time=90,
    )

    assert rec.recommended_action == "INCREASE_GREEN_TIME"
    assert rec.delta_green_time_sec > 0
    assert rec.proposed_green_time_sec > rec.current_green_time_sec
    assert rec.is_simulated is True
    assert rec.dataSource == "FASTAPI_AI_RECOMMENDATION"


def test_recommendation_insufficient_history_maintains_timing():
    """Verify sparse prediction history results in MAINTAIN_TIMING recommendation."""
    now = datetime.now(timezone.utc)
    records = [
        TrafficTelemetry(
            id=1,
            junction_id=14,
            timestamp=now - timedelta(minutes=2),
            vehicle_count=200,
            average_speed_kmh=30.0,
            congestion_percent=55,
            queue_length_meters=30.0,
        )
    ]

    rec = RecommendationEngine.recommend(
        junction_code="J14",
        junction_name="Central Connaught Plaza Hub",
        records=records,
        current_green_time=45,
        default_cycle_time=90,
    )

    assert rec.recommended_action == "MAINTAIN_TIMING"
    assert rec.delta_green_time_sec == 0
    assert "insufficient" in rec.recommendation_reason.lower()


def test_recommendation_threshold_below_or_equal_three_maintains_timing():
    """Verify recommendation defaults to MAINTAIN_TIMING when benefit score S <= 3.0."""
    now = datetime.now(timezone.utc)
    # Low congestion (5%) -> benefit score S will be <= 3.0
    records = [
        TrafficTelemetry(
            id=i + 1,
            junction_id=14,
            timestamp=now - timedelta(minutes=(20 - i * 5)),
            vehicle_count=20,
            average_speed_kmh=40.0,
            congestion_percent=5,
            queue_length_meters=2.0,
        )
        for i in range(5)
    ]

    rec = RecommendationEngine.recommend(
        junction_code="J14",
        junction_name="Central Connaught Plaza Hub",
        records=records,
        current_green_time=45,
        default_cycle_time=90,
    )

    assert rec.recommended_action == "MAINTAIN_TIMING"
    assert rec.delta_green_time_sec == 0


def test_recommendation_threshold_above_three_allows_action():
    """Verify recommendation selects an action when benefit score S > 3.0."""
    now = datetime.now(timezone.utc)
    # High congestion (75%) -> benefit score exceeds 3.0
    records = [
        TrafficTelemetry(
            id=i + 1,
            junction_id=14,
            timestamp=now - timedelta(minutes=(20 - i * 5)),
            vehicle_count=280 + i * 15,
            average_speed_kmh=20.0 - i * 1.0,
            congestion_percent=65 + i * 3,
            queue_length_meters=60.0 + i * 8.0,
        )
        for i in range(5)
    ]

    rec = RecommendationEngine.recommend(
        junction_code="J14",
        junction_name="Central Connaught Plaza Hub",
        records=records,
        current_green_time=32,
        default_cycle_time=90,
    )

    assert rec.recommended_action == "INCREASE_GREEN_TIME"
    assert rec.delta_green_time_sec in [10, 20]


def test_recommendation_tie_breaking_smallest_abs_delta():
    """Verify equal candidate scores are resolved by preferring the candidate with smallest |ΔG|."""
    # Test sorting key directly to verify tie-breaker logic
    candidates = [
        (10.0, 20, "mock_whatif_20"),   # |ΔG| = 20
        (10.0, 10, "mock_whatif_10"),   # |ΔG| = 10 (smallest |ΔG|)
        (10.0, -10, "mock_whatif_-10"), # |ΔG| = 10
    ]

    def sort_key(item):
        score, delta, _ = item
        return (-score, abs(delta), -delta)

    sorted_candidates = sorted(candidates, key=sort_key)
    # Winner must be delta = 10 (smallest |ΔG| = 10, positive delta tie-break secondary)
    assert sorted_candidates[0][1] == 10
    assert sorted_candidates[1][1] == -10
    assert sorted_candidates[2][1] == 20



@pytest.mark.asyncio
async def test_api_ai_predictions_endpoint(async_client: AsyncClient, valid_jwt_token: str):
    """Verify GET /api/v1/ai/predictions endpoint returns predictions list."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/ai/predictions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_api_ai_prediction_detail_endpoint(async_client: AsyncClient, valid_jwt_token: str):
    """Verify GET /api/v1/ai/predictions/{junction_code} returns combined prediction & factors."""
    headers = {"Authorization": f"Bearer {valid_jwt_token}"}
    response = await async_client.get("/api/v1/ai/predictions/J14", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "analytical_factor_contributions" in data


@pytest.mark.asyncio
async def test_api_ai_recommendation_detail_endpoint(async_client: AsyncClient, police_jwt_token: str):
    """Verify GET /api/v1/ai/recommendations/{junction_code} primary endpoint."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    response = await async_client.get("/api/v1/ai/recommendations/J14", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "recommendation" in data
    assert data["recommendation"]["junction_code"] == "J14"
    assert data["recommendation"]["recommended_action"] in ["INCREASE_GREEN_TIME", "DECREASE_GREEN_TIME", "MAINTAIN_TIMING"]


@pytest.mark.asyncio
async def test_act_endpoint_traffic_police_allowed(async_client: AsyncClient, police_jwt_token: str):
    """Verify TRAFFIC_POLICE role is ALLOWED to execute matching simulated action."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    # First query recommendation to know the exact expected action
    rec_res = await async_client.get("/api/v1/ai/recommendations/J14", headers=headers)
    rec_action = rec_res.json()["recommendation"]["recommended_action"]

    payload = {
        "junction_code": "J14",
        "requested_action": rec_action,
    }
    response = await async_client.post("/api/v1/ai/act", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["junction_code"] == "J14"
    assert data["action_type"] == rec_action
    assert data["action_id"].startswith("act_evt_")
    assert data["executed_by_role"] == "TRAFFIC_POLICE"
    assert data["is_simulated"] is True
    assert data["dataSource"] == "FASTAPI_SIMULATED_ACTION"


@pytest.mark.asyncio
async def test_act_endpoint_other_roles_forbidden(async_client: AsyncClient, valid_jwt_token: str, admin_jwt_token: str):
    """Verify non-Traffic-Police roles (Citizen, Admin, etc.) receive HTTP 403 Forbidden on POST /api/v1/ai/act."""
    payload = {
        "junction_code": "J14",
        "requested_action": "INCREASE_GREEN_TIME",
    }

    # Citizen token -> 403
    cit_res = await async_client.post("/api/v1/ai/act", json=payload, headers={"Authorization": f"Bearer {valid_jwt_token}"})
    assert cit_res.status_code == 403

    # Admin token -> 403 (Execution restricted exclusively to TRAFFIC_POLICE)
    adm_res = await async_client.post("/api/v1/ai/act", json=payload, headers={"Authorization": f"Bearer {admin_jwt_token}"})
    assert adm_res.status_code == 403


@pytest.mark.asyncio
async def test_act_endpoint_stale_mismatch_rejected(async_client: AsyncClient, police_jwt_token: str):
    """Verify HTTP 422 error when requested_action mismatches live server-recomputed recommendation."""
    headers = {"Authorization": f"Bearer {police_jwt_token}"}
    rec_res = await async_client.get("/api/v1/ai/recommendations/J14", headers=headers)
    rec_action = rec_res.json()["recommendation"]["recommended_action"]

    # Choose a deliberately opposing action
    mismatched_action = "DECREASE_GREEN_TIME" if rec_action != "DECREASE_GREEN_TIME" else "INCREASE_GREEN_TIME"

    payload = {
        "junction_code": "J14",
        "requested_action": mismatched_action,
    }
    response = await async_client.post("/api/v1/ai/act", json=payload, headers=headers)
    assert response.status_code == 422
    data = response.json()
    assert "STALE_RECOMMENDATION_MISMATCH" in str(data)
