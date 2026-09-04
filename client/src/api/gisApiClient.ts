import axios from 'axios';

const FASTAPI_GIS_URL = import.meta.env.VITE_FASTAPI_GIS_URL || 'http://localhost:8000/api/v1/gis';

const gisApi = axios.create({
  baseURL: FASTAPI_GIS_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

gisApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token') || localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface GeoJsonFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeoJsonFeatureCollection {
  success?: boolean;
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export const gisApiClient = {
  /**
   * Retrieves GIS sector boundary layer converted from sector_boundary.kml
   */
  async getSectorBoundary(): Promise<GeoJsonFeatureCollection> {
    const res = await gisApi.get('/layers');
    return res.data;
  },

  /**
   * Retrieves GeoJSON representation of the OSM routable road network
   */
  async getRoadNetwork(): Promise<GeoJsonFeatureCollection> {
    const res = await gisApi.get('/roads');
    return res.data;
  },
};

export default gisApiClient;
