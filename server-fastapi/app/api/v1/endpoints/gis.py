import os
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user_payload

router = APIRouter()

# Approved GIS directory relative to repository root
GIS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../GIS"))
APPROVED_KML_PATH = os.path.join(GIS_DIR, "sector_boundary.kml")

ALLOWED_GIS_ROLES = {
    "CITIZEN",
    "TRAFFIC_POLICE",
    "CITY_OPERATIONS",
    "MUNICIPAL_CORP",
    "COMMAND_CENTER",
    "ADMIN",
}


def parse_kml_to_geojson(kml_path: str) -> Dict[str, Any]:
    """Parses user-supplied KML file into a normalized GeoJSON FeatureCollection."""
    if not os.path.exists(kml_path):
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, "HTTP_444_NOT_FOUND") else 404,
            detail={
                "success": False,
                "error": "GIS_DATASET_NOT_FOUND",
                "message": f"KML file not found at path: {os.path.basename(kml_path)}",
            },
        )

    try:
        tree = ET.parse(kml_path)
        root = tree.getroot()
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "KML_PARSE_ERROR",
                "message": f"Failed to parse KML dataset: {str(err)}",
            },
        )

    # KML namespaces
    ns = {"kml": "http://www.opengis.net/kml/2.2"}
    
    features: List[Dict[str, Any]] = []

    # Find Placemarks with Polygons or LineStrings
    placemarks = root.findall(".//kml:Placemark", ns)
    if not placemarks:
        # Try finding without namespace prefix if default ns omitted
        placemarks = root.findall(".//Placemark")

    for idx, pm in enumerate(placemarks):
        name_elem = pm.find("kml:name", ns) if pm.find("kml:name", ns) is not None else pm.find("name")
        pm_name = name_elem.text.strip() if name_elem is not None and name_elem.text else f"KML Layer {idx+1}"

        # Polygon coordinates
        coord_elem = pm.find(".//kml:coordinates", ns)
        if coord_elem is None:
            coord_elem = pm.find(".//coordinates")

        if coord_elem is not None and coord_elem.text:
            raw_coords = coord_elem.text.strip().split()
            geojson_ring: List[List[float]] = []
            for token in raw_coords:
                parts = token.split(",")
                if len(parts) >= 2:
                    try:
                        lon = float(parts[0])
                        lat = float(parts[1])
                        geojson_ring.append([lon, lat])
                    except ValueError:
                        continue
            
            if geojson_ring:
                features.append({
                    "type": "Feature",
                    "properties": {
                        "id": f"sector_boundary_{idx+1}",
                        "name": pm_name,
                        "layerType": "SECTOR_BOUNDARY",
                        "source": "KML_USER_DATASET",
                        "isSimulated": False,
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [geojson_ring],
                    },
                })

    return {
        "success": True,
        "type": "FeatureCollection",
        "features": features,
    }


@router.get(
    "/layers",
    summary="Get GIS Boundary Layers",
    description="Returns authorized GeoJSON sector boundary layers converted from user KML dataset.",
)
async def get_gis_layers(
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
) -> Dict[str, Any]:
    """Retrieves GIS sector boundary layer in normalized GeoJSON format."""
    user_role = user_payload.get("role", "CITIZEN").upper()
    if user_role not in ALLOWED_GIS_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": f"Role '{user_role}' is not authorized to access GIS layer endpoints.",
            },
        )

    # Strictly access approved GIS directory
    if not os.path.exists(APPROVED_KML_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": "FILE_NOT_FOUND",
                "message": "Approved GIS sector boundary dataset missing.",
            },
        )

    return parse_kml_to_geojson(APPROVED_KML_PATH)
