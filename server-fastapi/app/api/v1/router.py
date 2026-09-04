from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    traffic,
    parking,
    complaints,
    emergency,
    infrastructure,
    admin,
    police,
    websocket,
    ai,
    translate,
    gis,
    simulation,
    navigation,
)

api_v1_router = APIRouter()



# Include health check endpoints
api_v1_router.include_router(health.router, tags=["Health Checks"])

# Include traffic domain endpoints
api_v1_router.include_router(traffic.router, prefix="/traffic", tags=["Traffic Domain"])

# Include smart parking domain endpoints
api_v1_router.include_router(parking.router, prefix="/parking", tags=["Smart Parking Domain"])

# Include citizen complaints domain endpoints
api_v1_router.include_router(complaints.router, prefix="/complaints", tags=["Citizen Complaints Domain"])

# Include emergency domain endpoints
api_v1_router.include_router(emergency.router, prefix="/emergency", tags=["Emergency Domain"])

# Include municipal infrastructure domain endpoints
api_v1_router.include_router(infrastructure.router, prefix="/infrastructure", tags=["Infrastructure Domain"])

# Include admin domain endpoints
api_v1_router.include_router(admin.router, prefix="/admin", tags=["Admin Domain"])

# Include traffic police domain endpoints
api_v1_router.include_router(police.router, prefix="/traffic-police", tags=["Traffic Police Domain"])

# Include real-time WebSocket endpoints
api_v1_router.include_router(websocket.router, tags=["Real-Time WebSockets"])

# Include Phase 4A AI Intelligence endpoints
api_v1_router.include_router(ai.router, prefix="/ai", tags=["AI Intelligence Domain (Phase 4A)"])

# Include Phase 4C Multilingual Translation endpoint
api_v1_router.include_router(translate.router, tags=["Multilingual Translation Domain (Phase 4C)"])

# Include Phase 5 GIS Boundary endpoints
api_v1_router.include_router(gis.router, prefix="/gis", tags=["GIS Boundary Domain (Phase 5)"])

# Include Phase 5 SUMO Microsimulation endpoints
api_v1_router.include_router(simulation.router, prefix="/simulation", tags=["SUMO Microsimulation Domain (Phase 5)"])

# Include Phase 5.1 OSM Navigation & Route Optimization endpoints
api_v1_router.include_router(navigation.router, prefix="/navigation", tags=["Navigation Domain (Phase 5.1)"])
