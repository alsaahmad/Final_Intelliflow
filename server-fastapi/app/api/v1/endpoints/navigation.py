from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user_payload
from app.schemas.navigation import RouteRequestSchema, RouteResponseSchema
from app.services.navigation_service import navigation_service

router = APIRouter()

ALLOWED_NAVIGATION_ROLES = {
    "CITIZEN",
    "TRAFFIC_POLICE",
    "CITY_OPERATIONS",
    "MUNICIPAL_CORP",
    "COMMAND_CENTER",
    "ADMIN",
}


@router.post(
    "/route",
    response_model=RouteResponseSchema,
    summary="Calculate OSM Road Network Route",
    description="Calculates fastest or shortest road network route following real OSM street geometries and one-way constraints.",
)
async def calculate_route(
    payload: RouteRequestSchema,
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
) -> RouteResponseSchema:
    """Calculates route optimization over sector_a OSM network."""
    user_role = user_payload.get("role", "CITIZEN").upper()
    if user_role not in ALLOWED_NAVIGATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access navigation routing services.",
            },
        )

    # Execute route calculation via NavigationService
    result = navigation_service.calculate_route(
        origin_lat=payload.origin.latitude,
        origin_lon=payload.origin.longitude,
        dest_lat=payload.destination.latitude,
        dest_lon=payload.destination.longitude,
        preference=payload.route_preference,
        include_alternatives=payload.include_alternatives,
    )

    return RouteResponseSchema(**result)
