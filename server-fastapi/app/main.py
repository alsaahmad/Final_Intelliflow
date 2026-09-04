import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.services.redis_service import redis_service
from app.services.websocket_manager import websocket_manager
from app.services.simulator import simulator

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intelliflow.fastapi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan Manager for process-level Redis, WebSocket ping, and Simulator tasks."""
    logger.info("Initializing process-level services (Redis & WebSocket Manager)...")
    await redis_service.initialize()

    # Wire process-level Redis Pub/Sub channels to WebSocket broadcast manager
    redis_service.register_listener("intelliflow:channels:traffic", lambda msg: websocket_manager.broadcast_event("traffic", msg))
    redis_service.register_listener("intelliflow:channels:alerts", lambda msg: websocket_manager.broadcast_event("alerts", msg))
    redis_service.register_listener("intelliflow:channels:emergency", lambda msg: websocket_manager.broadcast_event("emergency", msg))

    # Start WebSocket ping heartbeat & real-time simulator
    await websocket_manager.start_ping_loop()
    simulator.start()

    yield

    logger.info("Shutting down process-level services...")
    await simulator.stop()
    await websocket_manager.stop_ping_loop()
    await redis_service.shutdown()


def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="IntelliFlow AI Smart City Platform - Common Backend Foundation (Phase 3F Real-Time)",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )


    # Configure CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Mount API v1 Router
    app.include_router(api_v1_router, prefix="/api/v1")

    # Root /health convenience endpoint
    from app.api.v1.endpoints.health import get_app_health
    app.get("/health", include_in_schema=False)(get_app_health)


    # Structured Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict):
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": "HTTP_ERROR",
                "message": exc.detail,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": "Request payload validation failed.",
                "details": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
            },
        )

    return app


app = create_application()
