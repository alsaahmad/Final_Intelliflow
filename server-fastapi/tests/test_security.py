import pytest
import jwt
from app.core.config import settings
from app.core.security import decode_jwt_token, verify_jwt_token


def test_jwt_decoding_compatibility(valid_jwt_token: str):
    """Verify PyJWT decodes token created with Express JWT secret and payload format."""
    payload = decode_jwt_token(valid_jwt_token)
    assert payload["id"] == 101
    assert payload["name"] == "Alex Rivera"
    assert payload["email"] == "citizen@intelliflow.ai"
    assert payload["role"] == "CITIZEN"


def test_jwt_role_parsing(police_jwt_token: str):
    """Verify Traffic Police JWT payload parsing."""
    payload = decode_jwt_token(police_jwt_token)
    assert payload["role"] == "TRAFFIC_POLICE"
    assert payload["email"] == "police@intelliflow.ai"


def test_invalid_jwt_rejection():
    """Verify malformed JWT is rejected."""
    invalid_token = "invalid.bearer.token"
    res = verify_jwt_token(invalid_token)
    assert res is None


def test_wrong_secret_jwt_rejection():
    """Verify token signed with wrong secret is rejected."""
    bad_token = jwt.encode({"user": "hacker"}, "wrong_secret_key_123", algorithm="HS256")
    res = verify_jwt_token(bad_token)
    assert res is None
