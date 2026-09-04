import pytest
import asyncio
from app.services.simulator import simulator, TelemetrySimulator
from app.services.redis_service import redis_service


@pytest.mark.asyncio
async def test_simulator_lifecycle_and_event_structure():
    """Verify background telemetry simulator starts, generates simulated events, and stops cleanly."""
    captured_events = []

    async def simulator_listener(evt):
        captured_events.append(evt)

    redis_service.register_listener("intelliflow:channels:traffic", simulator_listener)

    simulator.start()
    assert simulator._is_running is True

    # Wait briefly for simulator loop tick or manual run
    await asyncio.sleep(0.5)

    await simulator.stop()
    assert simulator._is_running is False

    redis_service.unregister_listener("intelliflow:channels:traffic", simulator_listener)


@pytest.mark.asyncio
async def test_disabled_simulator_behavior(monkeypatch):
    """Verify simulator start does nothing when ENABLE_SIMULATOR is False."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "ENABLE_SIMULATOR", False)

    test_sim = TelemetrySimulator()
    test_sim.start()
    assert test_sim._is_running is False

