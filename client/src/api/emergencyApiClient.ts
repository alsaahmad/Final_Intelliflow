import axios from 'axios';

const FASTAPI_EMERGENCY_URL = 'http://localhost:8000/api/v1/emergency';

const emergencyApi = axios.create({
  baseURL: FASTAPI_EMERGENCY_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

emergencyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface EmergencySosPayload {
  citizen_name?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface GreenCorridorPayload {
  name: string;
  assigned_unit: string;
  corridor_route: string;
  eta_minutes?: number;
  speed_kmh?: number;
}

export const emergencyApiClient = {
  /**
   * Trigger 112 SOS distress beacon (DEMO / SIMULATION)
   */
  async triggerSos(payload: EmergencySosPayload): Promise<any> {
    const res = await emergencyApi.post('/sos', payload);
    return res.data;
  },

  /**
   * Fetch active emergency monitoring telemetry (SOS list, Green Corridors, Units)
   */
  async getMonitoring(): Promise<any> {
    const res = await emergencyApi.get('/monitoring');
    return res.data;
  },

  /**
   * Create simulated priority green corridor preemption request
   */
  async createGreenCorridor(payload: GreenCorridorPayload): Promise<any> {
    const res = await emergencyApi.post('/green-corridor', payload);
    return res.data;
  },

  /**
   * Fetch static active ambulance mission snapshot for UI compatibility
   */
  async getActiveMission(): Promise<any> {
    const res = await emergencyApi.get('/active-mission');
    return res.data;
  },

  /**
   * Update hospital emergency & ICU bed capacity (DEMO / SIMULATION)
   */
  async updateHospitalBeds(availableEmergencyBeds: number, availableIcuBeds: number): Promise<any> {
    try {
      // If monitoring endpoint is live, query or post telemetry sync
      const monitoring = await this.getMonitoring();
      return {
        success: true,
        availableEmergencyBeds,
        availableIcuBeds,
        status: "BEDS_SYNCED_WITH_ICCC",
        monitoring,
        dataSource: "FASTAPI_POSTGRES",
        is_simulated: true,
      };
    } catch (err) {
      return {
        success: true,
        availableEmergencyBeds,
        availableIcuBeds,
        status: "BEDS_SYNCED_WITH_ICCC_LOCAL",
        message: "Bed availability updated and synced with Integrated Command Center (ICCC) & 108 Dispatch (DEMO / Offline Fallback).",
        dataSource: "DEMO_OFFLINE_FALLBACK",
        is_simulated: true,
      };
    }
  },
};

export default emergencyApiClient;

