import time
from typing import AsyncGenerator, Dict, Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

# Create SQLAlchemy 2.0 AsyncEngine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# AsyncSession factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: Yields an async SQLAlchemy database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_health() -> Dict[str, Any]:
    """Perform a live SELECT 1 health check query against PostgreSQL."""
    start_time = time.time()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            latency_ms = round((time.time() - start_time) * 1000, 2)
            if val == 1:
                return {
                    "healthy": True,
                    "engine": "PostgreSQL (asyncpg)",
                    "latency_ms": latency_ms,
                    "error": None,
                }
            return {
                "healthy": False,
                "engine": "PostgreSQL (asyncpg)",
                "latency_ms": latency_ms,
                "error": "Unexpected scalar query result",
            }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "healthy": False,
            "engine": "PostgreSQL (asyncpg)",
            "latency_ms": latency_ms,
            "error": str(e),
        }
