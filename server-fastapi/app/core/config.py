import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Configuration using pydantic-settings."""

    APP_NAME: str = "IntelliFlow AI FastAPI Backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # PostgreSQL Database Connection (SQLAlchemy 2.x asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/intelliflow_db"

    # Redis Connection URL (Phase 3F Real-Time Broker)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Real-Time Telemetry Simulator
    ENABLE_SIMULATOR: bool = True
    SIMULATOR_INTERVAL_SECONDS: float = 6.0

    # JWT Security Configuration (Shared with Express backend on port 5000)
    JWT_SECRET: str = "intelliflow_ai_jwt_secret_key_2026_smart_city_platform"
    JWT_ALGORITHM: str = "HS256"

    # Optional Google Cloud Translation API Key
    GOOGLE_TRANSLATION_API_KEY: str = ""


    # CORS Allowed Client Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://localhost:5000",
        ]
        parsed: List[str] = []
        if isinstance(v, str):
            try:
                res = json.loads(v)
                if isinstance(res, list):
                    parsed = [str(i).strip() for i in res if str(i).strip()]
                elif isinstance(res, str):
                    parsed = [i.strip() for i in res.split(",") if i.strip()]
            except Exception:
                parsed = [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            parsed = [str(i).strip() for i in v if str(i).strip()]

        filtered = [i for i in parsed if i != "*"]
        combined = list(dict.fromkeys(defaults + filtered))
        return combined if combined else defaults

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
