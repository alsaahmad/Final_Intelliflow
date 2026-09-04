import axios from 'axios';

const FASTAPI_NAVIGATION_URL =
  import.meta.env.VITE_FASTAPI_NAVIGATION_URL ||
  (import.meta.env.VITE_FASTAPI_BASE_URL
    ? `${import.meta.env.VITE_FASTAPI_BASE_URL}/navigation`
    : 'http://localhost:8000/api/v1/navigation');

const navigationApi = axios.create({
  baseURL: FASTAPI_NAVIGATION_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

navigationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token') || localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface RouteRequestPayload {
  origin: LatLngPoint;
  destination: LatLngPoint;
  route_preference?: 'FASTEST' | 'SHORTEST';
  include_alternatives?: boolean;
}

export interface RouteStep {
  street_name: string;
  highway_type: string;
  distance_meters: number;
  duration_seconds: number;
  instruction: string;
}

export interface RouteOption {
  route_type: string;
  distance_meters: number;
  duration_seconds: number;
  formatted_eta: string;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat]
  };
  steps: RouteStep[];
}

export interface RouteResponseData {
  success: boolean;
  route_id: string;
  origin: LatLngPoint;
  snapped_origin: LatLngPoint & { osm_node_id: string; distance_to_road_meters: number };
  destination: LatLngPoint;
  snapped_destination: LatLngPoint & { osm_node_id: string; distance_to_road_meters: number };
  selected_preference: string;
  routes: RouteOption[];
  data_source: string;
  is_simulated: boolean;
  data_origin: string;
}

export const navigationApiClient = {
  /**
   * Request OSM road network route optimization
   */
  async calculateRoute(payload: RouteRequestPayload): Promise<RouteResponseData> {
    const res = await navigationApi.post('/route', payload);
    return res.data;
  },
};
