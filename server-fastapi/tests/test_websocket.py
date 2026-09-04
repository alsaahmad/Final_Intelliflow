import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app


def test_websocket_missing_token_rejection():
    """Verify WebSocket connection without query token is rejected with 1008 policy violation."""
    client = TestClient(app)
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/ws/live"):
            pass


def test_websocket_invalid_token_rejection():
    """Verify WebSocket connection with invalid JWT token is rejected."""
    client = TestClient(app)
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/ws/live?token=invalid_token_string"):
            pass


def test_websocket_expired_token_rejection():
    """Verify WebSocket connection with expired JWT token is rejected."""
    import time
    from app.core.config import settings
    payload = {
        "sub": "user_expired",
        "role": "CITIZEN",
        "exp": int(time.time()) - 3600,
    }
    expired_token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    client = TestClient(app)
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/live?token={expired_token}"):
            pass



def test_websocket_valid_handshake_and_subscriptions(valid_jwt_token):
    """Verify WebSocket handshake with valid JWT and channel subscription flow."""
    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/live?token={valid_jwt_token}") as websocket:
        # Subscribe request frame for permitted channels
        websocket.send_json({"type": "SUBSCRIBE", "channels": ["traffic", "alerts"]})
        data = websocket.receive_json()
        assert data["type"] == "SUBSCRIBED"
        assert "traffic" in data["channels"]
        assert "alerts" in data["channels"]

        # Test UNSUBSCRIBE
        websocket.send_json({"type": "UNSUBSCRIBE", "channels": ["alerts"]})
        unsub_data = websocket.receive_json()
        assert unsub_data["type"] == "UNSUBSCRIBED"
        assert "alerts" in unsub_data["channels"]

        # Test PONG response to PING or standalone control message
        websocket.send_json({"type": "PONG"})


def test_websocket_unauthorized_channel_rejection(valid_jwt_token):
    """Verify CITIZEN role connection is denied access to sensitive 'emergency' channel."""
    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/live?token={valid_jwt_token}") as websocket:
        websocket.send_json({"type": "SUBSCRIBE", "channels": ["emergency"]})
        data = websocket.receive_json()
        assert data["type"] == "ERROR"
        assert "Access denied" in data["message"]


def test_websocket_police_channel_authorization(police_jwt_token):
    """Verify TRAFFIC_POLICE role is granted access to 'emergency' channel."""
    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/live?token={police_jwt_token}") as websocket:
        websocket.send_json({"type": "SUBSCRIBE", "channels": ["emergency"]})
        data = websocket.receive_json()
        assert data["type"] == "SUBSCRIBED"
        assert "emergency" in data["channels"]

