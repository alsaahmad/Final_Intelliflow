from fastapi import APIRouter
from app.api.v1.endpoints import health, traffic, parking, complaints

api_v1_router = APIRouter()

# Include health check endpoints
api_v1_router.include_router(health.router, tags=["Health Checks"])

# Include traffic domain endpoints
api_v1_router.include_router(traffic.router, prefix="/traffic", tags=["Traffic Domain"])

# Include smart parking domain endpoints
api_v1_router.include_router(parking.router, prefix="/parking", tags=["Smart Parking Domain"])

# Include citizen complaints domain endpoints
api_v1_router.include_router(complaints.router, prefix="/complaints", tags=["Citizen Complaints Domain"])

