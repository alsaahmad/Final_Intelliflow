import math
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models.junction import TrafficTelemetry
from app.schemas.ai import (
    TrafficPredictionSchema,
    FactorContributionSchema,
    JunctionPredictionDetailSchema,
    WhatIfRequestSchema,
    WhatIfResponseSchema,
    RecommendationSchema,
)



def compute_risk_level(congestion: int) -> str:
    """Classify traffic risk level based on congestion percentage."""
    if congestion >= 85:
        return "CRITICAL"
    if congestion >= 70:
        return "HIGH"
    if congestion >= 45:
        return "MODERATE"
    return "LOW"


def clamp(val: float, min_val: float, max_val: float) -> float:
    """Utility to clamp numerical value within bounds."""
    return max(min_val, min(max_val, val))


class TrafficPredictor:
    """Analytical traffic prediction engine using Holt's Double Exponential Smoothing."""

    @staticmethod
    def analyze_history_sufficiency(
        records: List[TrafficTelemetry],
    ) -> Tuple[bool, float, float]:
        """Evaluates whether historical observations meet count, time span, and gap rules.

        Returns:
            (is_sufficient, time_span_minutes, trend_velocity)
        """
        if not records or len(records) < 3:
            return False, 0.0, 0.0

        # Sort ascending by timestamp
        sorted_recs = sorted(records, key=lambda r: r.timestamp)
        oldest_ts = sorted_recs[0].timestamp
        newest_ts = sorted_recs[-1].timestamp

        time_span_minutes = (newest_ts - oldest_ts).total_seconds() / 60.0

        # Time span rule: must cover at least 15 minutes
        if time_span_minutes < 15.0:
            return False, time_span_minutes, 0.0

        # Timestamp gap rule: no gap between consecutive points > 15 minutes
        for i in range(len(sorted_recs) - 1):
            gap_sec = (sorted_recs[i + 1].timestamp - sorted_recs[i].timestamp).total_seconds()
            if gap_sec > 900.0:  # 15 minutes
                return False, time_span_minutes, 0.0

        return True, time_span_minutes, 0.0

    @classmethod
    def predict(
        self,
        junction_code: str,
        junction_name: str,
        records: List[TrafficTelemetry],
        current_green_time: int,
        default_cycle_time: int,
        horizon_minutes: int = 15,
    ) -> Tuple[TrafficPredictionSchema, float]:
        """Runs Double Exponential Smoothing forecast over historical telemetry.

        Returns:
            (TrafficPredictionSchema, trend_velocity)
        """
        is_sufficient, time_span_minutes, _ = self.analyze_history_sufficiency(records)

        # Baseline defaults if no records exist
        if not records:
            curr_cong = 35
            curr_speed = 40.0
            curr_queue = 20.0
            sample_count = 0
        else:
            sorted_recs = sorted(records, key=lambda r: r.timestamp)
            latest = sorted_recs[-1]
            curr_cong = latest.congestion_percent
            curr_speed = latest.average_speed_kmh
            curr_queue = latest.queue_length_meters
            sample_count = len(sorted_recs)

        trend_velocity = 0.0

        if is_sufficient:
            sorted_recs = sorted(records, key=lambda r: r.timestamp)
            c_values = [float(r.congestion_percent) for r in sorted_recs]

            # Holt's Double Exponential Smoothing initialization
            alpha = 0.4
            beta = 0.2

            level = c_values[0]
            trend = c_values[1] - c_values[0] if len(c_values) > 1 else 0.0

            for t in range(1, len(c_values)):
                prev_level = level
                level = alpha * c_values[t] + (1 - alpha) * (level + trend)
                trend = beta * (level - prev_level) + (1 - beta) * trend

            trend_velocity = trend

            # Steps ahead forecast (assuming ~5 min nominal sample intervals)
            h_steps = horizon_minutes / 5.0
            pred_cong_raw = level + h_steps * trend_velocity
            pred_cong = int(round(clamp(pred_cong_raw, 5.0, 98.0)))

            pred_speed = round(clamp(curr_speed - 0.25 * trend_velocity * h_steps, 5.0, 80.0), 1)
            pred_queue = round(max(0.0, curr_queue + 1.2 * trend_velocity * h_steps), 1)
        else:
            # Deterministic fallback for insufficient history
            pred_cong = curr_cong
            pred_speed = curr_speed
            pred_queue = curr_queue
            trend_velocity = 0.0

        if trend_velocity > 0.5:
            trend_str = "INCREASING"
        elif trend_velocity < -0.5:
            trend_str = "DECREASING"
        else:
            trend_str = "STABLE"

        risk = compute_risk_level(pred_cong)

        schema = TrafficPredictionSchema(
            junction_code=junction_code,
            junction_name=junction_name,
            current_congestion_percent=curr_cong,
            predicted_congestion_percent=pred_cong,
            current_speed_kmh=curr_speed,
            predicted_speed_kmh=pred_speed,
            current_queue_length_meters=curr_queue,
            predicted_queue_length_meters=pred_queue,
            prediction_horizon_minutes=horizon_minutes,
            congestion_trend=trend_str,
            risk_level=risk,
            telemetry_sample_count=sample_count,
            time_span_minutes=round(time_span_minutes, 1),
            is_insufficient_history=not is_sufficient,
            is_simulated=True,
            dataSource="FASTAPI_AI_ENGINE",
            data_origin="POSTGRESQL_TELEMETRY",
        )

        return schema, trend_velocity


class ExplainabilityEngine:
    """Analytical factor contribution decomposition engine."""

    @staticmethod
    def explain(
        current_congestion: int,
        vehicle_count: int,
        average_speed_kmh: float,
        current_green_time: int,
        default_cycle_time: int,
        trend_velocity: float,
    ) -> List[FactorContributionSchema]:
        """Calculates normalized analytical factor contributions summing to 100%."""
        try:
            cycle = int(default_cycle_time) if default_cycle_time is not None else 90
        except (TypeError, ValueError):
            cycle = 90

        try:
            green = int(current_green_time) if current_green_time is not None else 45
        except (TypeError, ValueError):
            green = 45

        # Raw factor contribution magnitude evaluations
        raw_vol = (vehicle_count / 300.0) * 35.0
        raw_trend = trend_velocity * 20.0
        raw_speed = (max(0.0, 40.0 - average_speed_kmh) / 40.0) * 25.0

        green_ratio = green / float(cycle if cycle > 0 else 90)
        demand_ratio = current_congestion / 100.0
        raw_signal = (demand_ratio - green_ratio) * 20.0

        w_vol = abs(raw_vol)
        w_trend = abs(raw_trend)
        w_speed = abs(raw_speed)
        w_signal = abs(raw_signal)

        total_weight = w_vol + w_trend + w_speed + w_signal
        if total_weight == 0.0:
            total_weight = 1.0

        pct_vol = round((w_vol / total_weight) * 100.0, 1)
        pct_trend = round((w_trend / total_weight) * 100.0, 1)
        pct_speed = round((w_speed / total_weight) * 100.0, 1)
        pct_signal = round((w_signal / total_weight) * 100.0, 1)

        # Normalize sum to exactly 100.0%
        sum_pct = pct_vol + pct_trend + pct_speed + pct_signal
        diff = round(100.0 - sum_pct, 1)
        pct_vol = round(pct_vol + diff, 1)

        factors = [
            FactorContributionSchema(
                factor_name="Traffic Volume Demand",
                impact="HIGH" if vehicle_count > 250 else "MODERATE",
                weight_percent=pct_vol,
                measured_value=f"{vehicle_count} vehicles",
                description=f"Vehicle count of {vehicle_count} relative to nominal 300 capacity baseline.",
            ),
            FactorContributionSchema(
                factor_name="Congestion Growth Rate",
                impact="INCREASING" if trend_velocity > 0 else ("DECREASING" if trend_velocity < 0 else "STABLE"),
                weight_percent=pct_trend,
                measured_value=f"{trend_velocity:+.2f} %/step",
                description=f"Rate of congestion change per observation step is {trend_velocity:+.2f}%.",
            ),
            FactorContributionSchema(
                factor_name="Road Speed Degradation",
                impact="HIGH" if average_speed_kmh < 25.0 else "LOW",
                weight_percent=pct_speed,
                measured_value=f"{average_speed_kmh:.1f} km/h",
                description=f"Average travel speed of {average_speed_kmh:.1f} km/h against free-flow 40.0 km/h baseline.",
            ),
            FactorContributionSchema(
                factor_name="Signal Allocation vs Demand",
                impact="RESTRICTIVE" if raw_signal > 0 else "BALANCED",
                weight_percent=pct_signal,
                measured_value=f"{current_green_time}s / {cycle}s cycle",
                description=f"Green time allocation ({current_green_time}s) relative to current {current_congestion}% congestion demand.",
            ),
        ]

        return factors


class WhatIfSimulator:
    """Transient analytical What-If signal timing adjustment simulator."""

    @staticmethod
    def simulate(
        junction_code: str,
        current_green_time: int,
        default_cycle_time: int,
        current_congestion: int,
        current_queue: float,
        current_vehicle_count: int,
        delta_green_time_sec: int,
    ) -> WhatIfResponseSchema:
        """Computes transient What-If estimates. ZERO database mutation."""
        if delta_green_time_sec < -30 or delta_green_time_sec > 60:
            raise ValueError("delta_green_time_sec must be between -30 and +60 seconds.")

        simulated_green = current_green_time + delta_green_time_sec
        if simulated_green < 10:
            raise ValueError(
                f"Resulting green time ({simulated_green}s) cannot be lower than the safety threshold of 10s."
            )

        g_curr = max(10, current_green_time)
        delta_ratio = delta_green_time_sec / float(g_curr)

        # Analytical estimations
        delta_c = round(-0.35 * delta_ratio * current_congestion, 1)
        pred_c = int(round(clamp(current_congestion + delta_c, 5.0, 95.0)))

        delta_q = round(-0.40 * delta_green_time_sec * (current_congestion / 100.0), 1)
        delta_d = round(clamp(-0.60 * delta_green_time_sec * (current_congestion / 100.0), -40.0, 30.0), 1)
        delta_t = round(clamp(0.30 * delta_ratio * 100.0, -30.0, 30.0), 1)

        if delta_green_time_sec > 0:
            advisory = (
                f"Adding {delta_green_time_sec}s green time is estimated to reduce congestion by "
                f"{abs(delta_c)} percentage points and delay by {abs(delta_d)} seconds."
            )
        elif delta_green_time_sec < 0:
            advisory = (
                f"Reducing green time by {abs(delta_green_time_sec)}s is estimated to increase congestion by "
                f"{abs(delta_c)} percentage points."
            )
        else:
            advisory = "No signal green time adjustment selected. Baseline metrics maintained."

        return WhatIfResponseSchema(
            junction_code=junction_code,
            current_green_time_sec=current_green_time,
            simulated_green_time_sec=simulated_green,
            delta_green_time_sec=delta_green_time_sec,
            current_congestion_percent=current_congestion,
            predicted_congestion_percent=pred_c,
            estimated_queue_change_meters=delta_q,
            estimated_delay_change_sec=delta_d,
            estimated_throughput_change_percent=delta_t,
            summary_advisory=advisory,
            is_simulated=True,
            dataSource="FASTAPI_AI_ENGINE",
        )


class RecommendationEngine:
    """Deterministic analytical recommendation engine using Phase 4A outputs."""

    @classmethod
    def recommend(
        cls,
        junction_code: str,
        junction_name: str,
        records: List[TrafficTelemetry],
        current_green_time: int,
        default_cycle_time: int,
        horizon_minutes: int = 15,
    ) -> RecommendationSchema:
        """Evaluates candidate green time adjustments and selects safe, optimal recommendation."""
        # 1. Obtain Phase 4A prediction
        prediction, trend_velocity = TrafficPredictor.predict(
            junction_code=junction_code,
            junction_name=junction_name,
            records=records,
            current_green_time=current_green_time,
            default_cycle_time=default_cycle_time,
            horizon_minutes=horizon_minutes,
        )

        try:
            g_curr = int(current_green_time) if current_green_time is not None else 45
        except (TypeError, ValueError):
            g_curr = 45

        try:
            cycle = int(default_cycle_time) if default_cycle_time is not None else 90
        except (TypeError, ValueError):
            cycle = 90

        # Safety constraints tracking
        safety_constraints = [
            "Green time constrained to 10s-120s safety window",
            "Directional beneficial reduction score requirement (> 3.0)",
        ]

        # Handle sparse/insufficient history fallback
        if prediction.is_insufficient_history:
            safety_constraints.append("Insufficient history rule activated (zero trend velocity)")
            return RecommendationSchema(
                junction_code=junction_code,
                junction_name=junction_name,
                recommended_action="MAINTAIN_TIMING",
                current_green_time_sec=g_curr,
                proposed_green_time_sec=g_curr,
                delta_green_time_sec=0,
                expected_congestion_change=0.0,
                expected_queue_change_meters=0.0,
                expected_delay_change_sec=0.0,
                expected_throughput_change_percent=0.0,
                recommendation_reason="Telemetry history is insufficient; maintaining current timing for safety.",
                safety_constraints_applied=safety_constraints,
                is_simulated=True,
                dataSource="FASTAPI_AI_RECOMMENDATION",
                data_origin="POSTGRESQL_TELEMETRY",
            )

        latest = records[0] if records else None
        curr_cong = latest.congestion_percent if latest else 35
        curr_queue = latest.queue_length_meters if latest else 20.0
        curr_veh = latest.vehicle_count if latest else 150

        # Evaluate candidate deltas: -10s, 0s, +10s, +20s
        candidate_deltas = [-10, 0, 10, 20]
        scored_candidates: List[Tuple[float, int, WhatIfResponseSchema]] = []

        for delta in candidate_deltas:
            proposed = g_curr + delta
            if proposed < 10 or proposed > 120:
                continue

            whatif_res = WhatIfSimulator.simulate(
                junction_code=junction_code,
                current_green_time=g_curr,
                default_cycle_time=cycle,
                current_congestion=curr_cong,
                current_queue=curr_queue,
                current_vehicle_count=curr_veh,
                delta_green_time_sec=delta,
            )

            # Directional beneficial reductions ONLY (No abs!)
            delay_reduction = max(0.0, -whatif_res.estimated_delay_change_sec)
            congestion_reduction = max(0.0, float(whatif_res.current_congestion_percent - whatif_res.predicted_congestion_percent))
            queue_reduction = max(0.0, -whatif_res.estimated_queue_change_meters)

            score = (2.0 * delay_reduction) + (1.5 * congestion_reduction) + (0.5 * queue_reduction)
            scored_candidates.append((score, delta, whatif_res))

        # Sort candidates deterministically:
        # 1. Score DESC (highest benefit score first)
        # 2. abs(delta) ASC (smallest absolute green-time change |ΔG| first as primary tie-breaker)
        # 3. delta DESC (positive delta +10s preferred over -10s as secondary tie-breaker)
        def sort_key(item: Tuple[float, int, WhatIfResponseSchema]):
            score, delta, _ = item
            return (-score, abs(delta), -delta)

        scored_candidates.sort(key=sort_key)

        if not scored_candidates or scored_candidates[0][0] <= 3.0 or scored_candidates[0][1] == 0:
            rec_action = "MAINTAIN_TIMING"
            best_delta = 0
            best_whatif = WhatIfSimulator.simulate(
                junction_code=junction_code,
                current_green_time=g_curr,
                default_cycle_time=cycle,
                current_congestion=curr_cong,
                current_queue=curr_queue,
                current_vehicle_count=curr_veh,
                delta_green_time_sec=0,
            )
            reason = f"Current signal allocation ({g_curr}s) is optimal for current {curr_cong}% congestion demand."
        else:
            best_score, best_delta, best_whatif = scored_candidates[0]
            if best_delta > 0:
                rec_action = "INCREASE_GREEN_TIME"
                reason = (
                    f"High {curr_cong}% congestion demand and {prediction.congestion_trend.lower()} trend. "
                    f"Increasing green time by {best_delta}s is estimated to reduce delay by {abs(best_whatif.estimated_delay_change_sec)}s."
                )
            else:
                rec_action = "DECREASE_GREEN_TIME"
                reason = (
                    f"Low {curr_cong}% congestion demand. Reducing green time by {abs(best_delta)}s "
                    f"reallocates phase capacity while maintaining flow."
                )

        return RecommendationSchema(
            junction_code=junction_code,
            junction_name=junction_name,
            recommended_action=rec_action,
            current_green_time_sec=g_curr,
            proposed_green_time_sec=g_curr + best_delta,
            delta_green_time_sec=best_delta,
            expected_congestion_change=round(float(best_whatif.predicted_congestion_percent - best_whatif.current_congestion_percent), 1),
            expected_queue_change_meters=best_whatif.estimated_queue_change_meters,
            expected_delay_change_sec=best_whatif.estimated_delay_change_sec,
            expected_throughput_change_percent=best_whatif.estimated_throughput_change_percent,
            recommendation_reason=reason,
            safety_constraints_applied=safety_constraints,
            is_simulated=True,
            dataSource="FASTAPI_AI_RECOMMENDATION",
            data_origin="POSTGRESQL_TELEMETRY",
        )

