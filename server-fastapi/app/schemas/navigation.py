from typing import List, Optional
from pydantic import BaseModel, Field


class LatLngSchema(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in WGS84 decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in WGS84 decimal degrees")


class SnappedPointSchema(LatLngSchema):
    osm_node_id: Optional[str] = Field(None, description="Snapped OSM node ID")
    distance_to_road_meters: Optional[float] = Field(None, description="Distance from original point to snapped road node")


class RouteStepSchema(BaseModel):
    street_name: str = Field(..., description="Name of the street segment")
    highway_type: str = Field("unclassified", description="OSM highway classification")
    distance_meters: float = Field(..., ge=0.0, description="Segment distance in meters")
    duration_seconds: float = Field(..., ge=0.0, description="Segment travel time in seconds")
    instruction: str = Field(..., description="Human readable turn maneuver instruction")


class GeoJSONLineStringSchema(BaseModel):
    type: str = Field("LineString", description="GeoJSON geometry type")
    coordinates: List[List[float]] = Field(..., description="Array of [lon, lat] coordinate pairs")


class RouteOptionSchema(BaseModel):
    route_type: str = Field(..., description="Type of route option e.g., PRIMARY_FASTEST, PRIMARY_SHORTEST, ALTERNATIVE")
    distance_meters: float = Field(..., ge=0.0, description="Total route distance in meters")
    duration_seconds: float = Field(..., ge=0.0, description="Total estimated duration in seconds")
    formatted_eta: str = Field(..., description="Human readable formatted ETA e.g. '2 min 15 sec'")
    geometry: GeoJSONLineStringSchema = Field(..., description="GeoJSON LineString geometry following actual roads")
    steps: List[RouteStepSchema] = Field(default_factory=list, description="Turn-by-turn navigation steps")


class RouteRequestSchema(BaseModel):
    origin: LatLngSchema = Field(..., description="Origin coordinates")
    destination: LatLngSchema = Field(..., description="Destination coordinates")
    route_preference: str = Field("FASTEST", description="Routing preference: 'FASTEST' or 'SHORTEST'")
    include_alternatives: bool = Field(True, description="Whether to include alternative route options if available")


class RouteResponseSchema(BaseModel):
    success: bool = Field(True, description="Response status indicator")
    route_id: str = Field(..., description="Unique generated route ID")
    origin: LatLngSchema = Field(..., description="Requested origin coordinates")
    snapped_origin: SnappedPointSchema = Field(..., description="Snapped origin road node")
    destination: LatLngSchema = Field(..., description="Requested destination coordinates")
    snapped_destination: SnappedPointSchema = Field(..., description="Snapped destination road node")
    selected_preference: str = Field(..., description="Active routing preference")
    routes: List[RouteOptionSchema] = Field(..., description="List of generated route options")
    data_source: str = Field("OPENSTREETMAP_SECTOR_A", description="Data source identifier")
    is_simulated: bool = Field(False, description="Flag indicating synthetic operational data")
    data_origin: str = Field("REAL_OSM_NETWORK", description="Origin of physical network graph")
