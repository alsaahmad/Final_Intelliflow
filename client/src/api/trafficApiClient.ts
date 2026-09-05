import axios from 'axios';
import {
  CitizenJunctionSummary,
  TrafficAlert,
  CityMobilityStatus,
} from '../types/citizen';

const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL || 'http://localhost:8000/api/v1';
const FASTAPI_TRAFFIC_URL = `${FASTAPI_BASE_URL}/traffic`;

const trafficApi = axios.create({
  baseURL: FASTAPI_TRAFFIC_URL,
  timeout: 3000, // 3s timeout for fast fallback if server is offline
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to all outgoing requests
trafficApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const trafficApiClient = {
  /**
   * Fetch junctions list from FastAPI backend
   */
  async getJunctions(sector?: string, limit?: number): Promise<CitizenJunctionSummary[]> {
    const res = await trafficApi.get<CitizenJunctionSummary[]>('/junctions', {
      params: { sector, limit },
    });
    return res.data;
  },

  /**
   * Fetch specific junction detail by ID or code
   */
  async getJunctionById(idOrCode: string): Promise<CitizenJunctionSummary | null> {
    const res = await trafficApi.get<{ junction: CitizenJunctionSummary }>(`/junctions/${idOrCode}`);
    return res.data.junction;
  },

  /**
   * Fetch active traffic alerts from FastAPI backend
   */
  async getTrafficAlerts(severity?: string): Promise<TrafficAlert[]> {
    const res = await trafficApi.get<TrafficAlert[]>('/alerts', {
      params: { severity: severity === 'ALL' ? undefined : severity },
    });
    return res.data;
  },

  /**
   * Fetch citywide mobility status from FastAPI backend
   */
  async getMobilityStatus(): Promise<CityMobilityStatus> {
    const res = await trafficApi.get<CityMobilityStatus>('/mobility-status');
    return res.data;
  },

  /**
   * Ingest new traffic telemetry observation (Traffic Police / Ops only)
   */
  async ingestTelemetry(payload: {
    junction_code: string;
    vehicle_count: number;
    average_speed_kmh: number;
    congestion_percent: number;
    queue_length_meters: number;
  }): Promise<any> {
    const res = await trafficApi.post('/telemetry', payload);
    return res.data;
  },

  /**
   * Publish new verified traffic alert (Traffic Police / Ops only)
   */
  async createAlert(payload: any): Promise<TrafficAlert> {
    const res = await trafficApi.post<TrafficAlert>('/alerts', payload);
    return res.data;
  },
};

export default trafficApiClient;
