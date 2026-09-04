import axios from 'axios';

const FASTAPI_SIMULATION_URL =
  import.meta.env.VITE_FASTAPI_SIMULATION_URL ||
  (import.meta.env.VITE_FASTAPI_BASE_URL
    ? `${import.meta.env.VITE_FASTAPI_BASE_URL}/simulation`
    : 'http://localhost:8000/api/v1/simulation');

const simulationApi = axios.create({
  baseURL: FASTAPI_SIMULATION_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

simulationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token') || localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface SumoMetrics {
  average_travel_time_sec: number;
  average_vehicle_delay_sec: number;
  queue_length_meters: number;
  throughput_veh_per_hr: number;
  waiting_time_sec: number;
  vehicle_count: number;
}

export interface SumoComparison {
  travel_time_change_pct: number;
  delay_change_pct: number;
  queue_length_change_pct: number;
  throughput_change_pct: number;
}

export interface SimulationRunResponse {
  success: boolean;
  junction_code: string;
  junction_name: string;
  latitude: number;
  longitude: number;
  osm_node_id: string;
  sumo_junction_id: string;
  delta_green_time_sec: number;
  duration_seconds: number;
  is_simulated: boolean;
  dataSource: string;
  disclaimer: string;
  baseline: SumoMetrics;
  scenario: SumoMetrics;
  comparison: SumoComparison;
}

export const simulationApiClient = {
  /**
   * Run SUMO microsimulation comparing baseline vs scenario
   */
  async runSimulation(payload: {
    junction_code: string;
    delta_green_time_sec: number;
    duration_seconds?: number;
  }): Promise<SimulationRunResponse> {
    const res = await simulationApi.post('/run', {
      duration_seconds: 900,
      ...payload,
    });
    return res.data;
  },
};

export default simulationApiClient;
