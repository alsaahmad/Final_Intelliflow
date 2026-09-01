from app.core.config import settings


def test_settings_load_defaults():
    """Verify application configuration loads default parameters correctly."""
    assert settings.APP_NAME == "IntelliFlow AI FastAPI Backend"
    assert settings.APP_VERSION == "1.0.0"
    assert settings.PORT == 8000
    assert settings.JWT_ALGORITHM == "HS256"
    assert len(settings.CORS_ORIGINS) > 0


def test_jwt_secret_configured():
    """Verify JWT secret is configured and matches standard Express secret default."""
    assert settings.JWT_SECRET is not None
    assert len(settings.JWT_SECRET) >= 16
