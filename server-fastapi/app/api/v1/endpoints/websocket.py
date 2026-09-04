import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import websocket_manager

logger = logging.getLogger("intelliflow.websocket_endpoint")
router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT Bearer Token for connection authentication"),
):
    """Unified WebSocket Endpoint for IntelliFlow Real-Time Event Stream.

    URL: ws://localhost:8000/api/v1/ws/live?token=<jwt>

    Security Enforcement:
    - Pre-handshake JWT verification (signature & expiration).
    - Unauthenticated connections are closed with code 1008 (Policy Violation).
    - Tokens and full URLs are NEVER printed to log outputs.
    """
    state = await websocket_manager.authenticate_and_accept(websocket, token)
    if not state:
        return

    try:
        while True:
            raw_text = await websocket.receive_text()
            await websocket_manager.handle_message(websocket, raw_text)
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)
    except Exception as err:
        logger.error(f"WebSocket client error: {err}")
        await websocket_manager.disconnect(websocket)
