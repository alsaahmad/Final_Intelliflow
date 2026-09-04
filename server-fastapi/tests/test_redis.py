import pytest
from app.services.redis_service import redis_service, InMemoryPubSub


@pytest.mark.asyncio
async def test_in_memory_pub_sub_fallback():
    """Verify single-process InMemoryPubSub broker subscribe and publish mechanics."""
    broker = InMemoryPubSub()
    received_messages = []

    async def sample_callback(msg):
        received_messages.append(msg)

    broker.subscribe("intelliflow:channels:traffic", sample_callback)
    await broker.publish("intelliflow:channels:traffic", {"test": "data", "val": 100})

    assert len(received_messages) == 1
    assert received_messages[0]["test"] == "data"

    broker.unsubscribe("intelliflow:channels:traffic", sample_callback)
    await broker.publish("intelliflow:channels:traffic", {"test": "data2"})
    assert len(received_messages) == 1


@pytest.mark.asyncio
async def test_redis_service_initialization_and_fallback():
    """Verify RedisService fallback behavior when Redis is unavailable or un-reachable."""
    await redis_service.initialize()
    # In test environment without an active external Redis container, using_fallback should be True
    assert redis_service.using_fallback is True or redis_service.is_connected is True

    test_events = []

    async def listener(evt):
        test_events.append(evt)

    redis_service.register_listener("intelliflow:channels:traffic", listener)
    await redis_service.publish("intelliflow:channels:traffic", {"event": "TEST_EVENT"})

    assert len(test_events) == 1
    assert test_events[0]["event"] == "TEST_EVENT"

    redis_service.unregister_listener("intelliflow:channels:traffic", listener)


@pytest.mark.asyncio
async def test_redis_service_cleanup_and_lifecycle():
    """Verify RedisService shutdown cleanly cleans up connection resources and tasks."""
    await redis_service.shutdown()
    assert redis_service.is_connected is False

