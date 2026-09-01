from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decodes and verifies a JWT token using shared Express secret and algorithm.

    Raises PyJWT exceptions if invalid or expired.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
    )
    return payload


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Safe helper to verify a JWT token without raising exceptions."""
    try:
        return decode_jwt_token(token)
    except jwt.PyJWTError:
        return None


async def get_current_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> Dict[str, Any]:
    """Dependency: Extracts and verifies JWT payload from Authorization Bearer token header."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "UNAUTHORIZED",
                "message": "Access denied. No authentication token provided in Authorization header.",
            },
        )

    try:
        payload = decode_jwt_token(credentials.credentials)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "TOKEN_EXPIRED",
                "message": "Authentication token has expired. Please sign in again.",
            },
        )
    except jwt.PyJWTError as err:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Invalid authentication token: {str(err)}",
            },
        )
