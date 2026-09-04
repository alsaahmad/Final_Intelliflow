import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.services.redis_service import redis_service

logger = logging.getLogger("intelliflow.simulator")

SIMULATED_JUNCTIONS: List[Dict[str, Any]] = [
    {
        "code": "J14",
        "name": "Central Connaught Plaza Hub",
        "base_congestion": 78,
        "base_speed": 18.0,
        "base_queue": 110,
        "base_vehicles": 340,
        "signal_phase": "NORTH_SOUTH",
    },
    {
        "code": "J15",
        "name": "Metro Ring Expressway Toll",
        "base_congestion": 54,
        "base_speed": 36.0,
        "base_queue": 45,
        "base_vehicles": 220,
        "signal_phase": "EAST_WEST",
    },
    {
        "code": "J16",
        "name": "Hospital Trauma Corridor Gateway",
        "base_congestion": 26,
        "base_speed": 45.0,
        "base_queue": 15,
        "base_vehicles": 95,
        "signal_phase": "ALL_GREEN",
    },
    {
        "code": "J19",
        "name": "Outer Ring South Underpass",
        "base_congestion": 68,
        "base_speed": 28.0,
        "base_queue": 85,
        "base_vehicles": 310,
        "signal_phase": "NORTH_SOUTH",
    },
]


def compute_severity(congestion: int) -> str:
    if congestion >= 75:
        return "HEAVY"
    if congestion >= 50:
        return "MODERATE"
    return "CLEAR"


class TelemetrySimulator:
    """Configurable background telemetry generator task.

    Generates transient real-time simulation events for demo UI dynamic updates.
    Does NOT write transient ticks into PostgreSQL.
    """

    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._is_running: bool = False

    def start(self):
        """Starts the simulator background task if enabled in configuration."""
        if not settings.ENABLE_SIMULATOR:
            logger.info("Real-time telemetry simulator is disabled in configuration.")
            return

        if self._is_running:
            return

        self._is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(
            f"Started Real-Time Telemetry Simulator (Interval: {settings.SIMULATOR_INTERVAL_SECONDS}s)"
        )

    async def stop(self):
        """Stops the simulator background task cleanly during application shutdown."""
        if not self._is_running:
            return

        self._is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Real-Time Telemetry Simulator stopped cleanly.")

    async def _simulation_loop(self):
        """Background loop broadcasting simulated telemetry jitter to Redis Pub/Sub."""
        try:
            while self._is_running:
                await asyncio.sleep(settings.SIMULATOR_INTERVAL_SECONDS)
                jnc = random.choice(SIMULATED_JUNCTIONS)

                # Realistic random jitter
                cong_delta = random.randint(-4, 4)
                new_congestion = max(10, min(95, jnc["base_congestion"] + cong_delta))

                speed_delta = round(random.uniform(-2.5, 2.5), 1)
                new_speed = max(8.0, min(80.0, round(jnc["base_speed"] + speed_delta, 1)))

                queue_delta = random.randint(-5, 5)
                new_queue = max(5, jnc["base_queue"] + queue_delta)

                vehicle_delta = random.randint(-15, 15)
                new_vehicles = max(20, jnc["base_vehicles"] + vehicle_delta)

                now_iso = datetime.now(timezone.utc).isoformat()
                event_id = f"evt_{uuid.uuid4()}"

                event_payload = {
                    "eventId": event_id,
                    "timestamp": now_iso,
                    "type": "TRAFFIC_TELEMETRY_UPDATE",
                    "channel": "traffic",
                    "is_simulated": True,
                    "dataSource": "FASTAPI_WS_SIMULATION",
                    "data": {
                        "junctionCode": jnc["code"],
                        "junctionName": jnc["name"],
                        "congestionPercent": new_congestion,
                        "severity": compute_severity(new_congestion),
                        "averageSpeedKmh": new_speed,
                        "queueLengthMeters": new_queue,
                        "vehicleCount": new_vehicles,
                        "signalPhase": jnc["signal_phase"],
                        "signalTimerSeconds": random.randint(15, 60),
                    },
                }

                # Publish to Redis broker channel
                await redis_service.publish("intelliflow:channels:traffic", event_payload)

        except asyncio.CancelledError:
            pass
        except Exception as err:
            logger.error(f"Telemetry simulator loop error: {err}")


# Global Simulator Instance
simulator = TelemetrySimulator()
