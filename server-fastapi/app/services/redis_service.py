import asyncio
import json
import logging
from typing import Dict, Set, Callable, Awaitable, Any, Optional
from app.core.config import settings

logger = logging.getLogger("intelliflow.redis_service")


class InMemoryPubSub:
    """Single-Process In-Memory Pub/Sub Fallback Broker.

    IMPORTANT ARCHITECTURAL NOTICE:
    This class is explicitly SINGLE-PROCESS, NON-DISTRIBUTED, and NOT PRODUCTION-SCALABLE.
    It exists solely as a zero-dependency development and offline demo fallback when a Redis server
    is not reachable.
    """

    def __init__(self):
        self._subscribers: Dict[str, Set[Callable[[Dict[str, Any]], Awaitable[None]]]] = {
            "intelliflow:channels:traffic": set(),
            "intelliflow:channels:alerts": set(),
            "intelliflow:channels:emergency": set(),
        }

    def subscribe(self, channel: str, callback: Callable[[Dict[str, Any]], Awaitable[None]]):
        if channel not in self._subscribers:
            self._subscribers[channel] = set()
        self._subscribers[channel].add(callback)

    def unsubscribe(self, channel: str, callback: Callable[[Dict[str, Any]], Awaitable[None]]):
        if channel in self._subscribers:
            self._subscribers[channel].discard(callback)

    async def publish(self, channel: str, message: Dict[str, Any]):
        subscribers = self._subscribers.get(channel, set()).copy()
        for callback in subscribers:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(message)
                else:
                    callback(message)
            except Exception as err:
                logger.error(f"InMemoryPubSub dispatch error on channel '{channel}': {err}")


class RedisService:
    """Process-Level Redis Manager with InMemoryPubSub Fallback.

    Manages a single shared process-level Redis connection pool or in-memory broker.
    Individual WebSockets MUST NOT open their own Redis client connections.
    """

    def __init__(self):
        self.is_connected: bool = False
        self.using_fallback: bool = False
        self._redis_client = None
        self._pubsub_client = None
        self._in_memory = InMemoryPubSub()
        self._listeners: Dict[str, Set[Callable[[Dict[str, Any]], Awaitable[None]]]] = {
            "intelliflow:channels:traffic": set(),
            "intelliflow:channels:alerts": set(),
            "intelliflow:channels:emergency": set(),
        }
        self._listen_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Initializes the process-level Redis pool or gracefully activates InMemoryPubSub."""
        try:
            import redis.asyncio as aioredis
            self._redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            # Ping test
            await self._redis_client.ping()
            self.is_connected = True
            self.using_fallback = False
            logger.info(f"Successfully connected to process-level Redis broker at {settings.REDIS_URL}")

            # Setup process-level subscriber listener
            self._pubsub_client = self._redis_client.pubsub()
            await self._pubsub_client.subscribe(
                "intelliflow:channels:traffic",
                "intelliflow:channels:alerts",
                "intelliflow:channels:emergency",
            )
            self._listen_task = asyncio.create_task(self._redis_listener_loop())

        except Exception as err:
            logger.warning(
                f"Redis unavailable ({err}). Activating single-process InMemoryPubSub fallback (DEV/DEMO ONLY)."
            )
            self.is_connected = False
            self.using_fallback = True
            self._redis_client = None

    async def _redis_listener_loop(self):
        """Background process loop routing Redis Pub/Sub messages to registered handlers."""
        try:
            while self.is_connected and self._pubsub_client:
                message = await self._pubsub_client.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("type") == "message":
                    channel = message.get("channel")
                    raw_data = message.get("data")
                    try:
                        parsed = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                        listeners = self._listeners.get(channel, set()).copy()
                        for callback in listeners:
                            try:
                                await callback(parsed)
                            except Exception as cb_err:
                                logger.error(f"Listener callback error on '{channel}': {cb_err}")
                    except Exception as parse_err:
                        logger.error(f"Failed to parse Redis message on '{channel}': {parse_err}")
                await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            pass
        except Exception as loop_err:
            logger.error(f"Error in Redis listener loop: {loop_err}")

    def register_listener(self, channel: str, callback: Callable[[Dict[str, Any]], Awaitable[None]]):
        """Registers a process-level callback to receive messages from a channel."""
        if channel not in self._listeners:
            self._listeners[channel] = set()
        self._listeners[channel].add(callback)
        # Register on fallback as well
        self._in_memory.subscribe(channel, callback)

    def unregister_listener(self, channel: str, callback: Callable[[Dict[str, Any]], Awaitable[None]]):
        """Unregisters a process-level channel listener callback."""
        if channel in self._listeners:
            self._listeners[channel].discard(callback)
        self._in_memory.unsubscribe(channel, callback)

    async def publish(self, channel: str, message: Dict[str, Any]):
        """Publishes an event frame to the process broker (Redis or InMemoryPubSub)."""
        if self.is_connected and self._redis_client:
            try:
                payload_str = json.dumps(message)
                await self._redis_client.publish(channel, payload_str)
            except Exception as err:
                logger.error(f"Failed to publish to Redis on '{channel}', falling back to InMemoryPubSub: {err}")
                await self._in_memory.publish(channel, message)
        else:
            await self._in_memory.publish(channel, message)

    async def shutdown(self):
        """Cleanly shuts down process-level Redis connection pool and background tasks."""
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
        if self._pubsub_client:
            try:
                await self._pubsub_client.unsubscribe()
                await self._pubsub_client.close()
            except Exception:
                pass
        if self._redis_client:
            try:
                await self._redis_client.close()
            except Exception:
                pass
        self.is_connected = False
        logger.info("Process-level RedisService shut down cleanly.")


# Global Process-Level RedisService Instance
redis_service = RedisService()
