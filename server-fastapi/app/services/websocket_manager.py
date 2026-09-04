import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, status
from app.core.security import decode_jwt_token, jwt

logger = logging.getLogger("intelliflow.websocket_manager")

# Defined channel permission map
ROLE_CHANNEL_PERMISSIONS: Dict[str, Set[str]] = {
    "CITIZEN": {"traffic", "alerts"},
    "TRAFFIC_POLICE": {"traffic", "alerts", "emergency"},
    "CITY_OPERATIONS": {"traffic", "alerts", "emergency"},
    "COMMAND_CENTER": {"traffic", "alerts", "emergency"},
    "MUNICIPAL_CORP": {"traffic", "alerts"},
    "MUNICIPAL_CORPORATION": {"traffic", "alerts"},
    "MUNICIPAL_ENGINEER": {"traffic", "alerts"},
    "AMBULANCE_RESPONDER": {"emergency"},
    "HOSPITAL": {"emergency"},
    "ADMIN": {"traffic", "alerts", "emergency", "system"},
}


class ConnectionState:
    """State wrapper for a single active WebSocket client connection."""

    def __init__(self, websocket: WebSocket, user_payload: Dict[str, Any]):
        self.websocket = websocket
        self.user_payload = user_payload
        self.user_id = user_payload.get("sub") or user_payload.get("id") or "anonymous"
        self.role = user_payload.get("role", "CITIZEN").upper()
        self.subscriptions: Set[str] = set()
        self.last_pong_time: float = asyncio.get_event_loop().time()


class WebSocketManager:
    """Manages WebSocket connections, channel subscriptions, and event routing."""

    def __init__(self):
        self._active_connections: Dict[WebSocket, ConnectionState] = {}
        self._lock = asyncio.Lock()
        self._ping_task: Optional[asyncio.Task] = None

    async def authenticate_and_accept(self, websocket: WebSocket, token: Optional[str]) -> Optional[ConnectionState]:
        """Validates JWT signature and expiration BEFORE accepting WebSocket connection.

        SECURITY RULE: Token string MUST NOT be printed to logs.
        """
        if not token:
            logger.warning("WebSocket connection attempt rejected: Missing token query parameter.")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None

        try:
            payload = decode_jwt_token(token)
        except jwt.ExpiredSignatureError:
            logger.warning("WebSocket connection attempt rejected: JWT token expired.")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        except jwt.PyJWTError:
            logger.warning("WebSocket connection attempt rejected: Invalid JWT signature.")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None

        # Accept connection after verification
        await websocket.accept()
        state = ConnectionState(websocket, payload)

        # Default initial subscriptions based on role
        allowed_channels = ROLE_CHANNEL_PERMISSIONS.get(state.role, {"traffic", "alerts"})
        state.subscriptions = allowed_channels.copy()

        async with self._lock:
            self._active_connections[websocket] = state

        logger.info(f"WebSocket client connected successfully [User ID: {state.user_id}, Role: {state.role}]")
        return state

    async def disconnect(self, websocket: WebSocket):
        """Removes a client connection from active tracking."""
        async with self._lock:
            if websocket in self._active_connections:
                state = self._active_connections.pop(websocket)
                logger.info(f"WebSocket client disconnected [User ID: {state.user_id}]")

    def is_authorized(self, role: str, channel: str) -> bool:
        """Checks if a user role has clearance for a target channel."""
        allowed = ROLE_CHANNEL_PERMISSIONS.get(role.upper(), {"traffic", "alerts"})
        return channel in allowed

    async def handle_message(self, websocket: WebSocket, raw_text: str):
        """Processes protocol control frames from client (SUBSCRIBE, UNSUBSCRIBE, PONG)."""
        async with self._lock:
            state = self._active_connections.get(websocket)

        if not state:
            return

        try:
            payload = json.loads(raw_text)
            msg_type = payload.get("type", "").upper()

            if msg_type == "PONG":
                state.last_pong_time = asyncio.get_event_loop().time()

            elif msg_type == "SUBSCRIBE":
                requested_channels = payload.get("channels", [])
                approved = []
                denied = []

                for ch in requested_channels:
                    if self.is_authorized(state.role, ch):
                        state.subscriptions.add(ch)
                        approved.append(ch)
                    else:
                        denied.append(ch)

                if approved:
                    await websocket.send_json({
                        "type": "SUBSCRIBED",
                        "channels": approved,
                    })

                if denied:
                    await websocket.send_json({
                        "type": "ERROR",
                        "message": f"Access denied. Role '{state.role}' is not authorized to subscribe to channel(s): {denied}",
                    })

            elif msg_type == "UNSUBSCRIBE":
                channels_to_remove = payload.get("channels", [])
                for ch in channels_to_remove:
                    state.subscriptions.discard(ch)

                await websocket.send_json({
                    "type": "UNSUBSCRIBED",
                    "channels": channels_to_remove,
                })

        except json.JSONDecodeError:
            await websocket.send_json({
                "type": "ERROR",
                "message": "Invalid JSON frame received.",
            })

    async def broadcast_event(self, channel: str, event_payload: Dict[str, Any]):
        """Dispatches an event frame to all active connections authorized and subscribed to the channel."""
        async with self._lock:
            connections = list(self._active_connections.values())

        if not connections:
            return

        for state in connections:
            if channel in state.subscriptions and self.is_authorized(state.role, channel):
                try:
                    # Emergency data privacy scoping for Citizen role
                    scoped_payload = self._scope_event_for_role(event_payload, state.role)
                    await state.websocket.send_json(scoped_payload)
                except Exception as err:
                    logger.error(f"Error broadcasting event to User {state.user_id}: {err}")

    def _scope_event_for_role(self, event_payload: Dict[str, Any], role: str) -> Dict[str, Any]:
        """Masks or filters sensitive emergency PII fields for Citizen roles."""
        if role == "CITIZEN" and event_payload.get("channel") == "emergency":
            # Mask citizen PII and hide admin vitals
            data_copy = dict(event_payload.get("data", {}))
            if "citizen_name" in data_copy:
                data_copy["citizen_name"] = "Citizen (Masked)"
            if "vitals" in data_copy:
                del data_copy["vitals"]
            return {**event_payload, "data": data_copy}
        return event_payload

    async def start_ping_loop(self):
        """Starts 30-second heartbeat ping loop."""
        self._ping_task = asyncio.create_task(self._ping_loop())

    async def stop_ping_loop(self):
        """Stops heartbeat loop cleanly."""
        if self._ping_task:
            self._ping_task.cancel()
            try:
                await self._ping_task
            except asyncio.CancelledError:
                pass

    async def _ping_loop(self):
        """Periodic loop sending PING frame every 30 seconds."""
        try:
            while True:
                await asyncio.sleep(30.0)
                async with self._lock:
                    connections = list(self._active_connections.values())

                from datetime import datetime, timezone
                now_iso = datetime.now(timezone.utc).isoformat()
                ping_frame = {"type": "PING", "timestamp": now_iso}

                for state in connections:
                    try:
                        await state.websocket.send_json(ping_frame)
                    except Exception:
                        pass
        except asyncio.CancelledError:
            pass


# Global WebSocketManager Instance
websocket_manager = WebSocketManager()
