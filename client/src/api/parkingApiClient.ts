import axios from 'axios';
import { ParkingFacility, ParkingSlot } from '../types/citizen';

const FASTAPI_PARKING_URL = 'http://localhost:8000/api/v1/parking';

const parkingApi = axios.create({
  baseURL: FASTAPI_PARKING_URL,
  timeout: 3000, // 3s timeout for fast fallback if server is offline
  headers: {
    'Content-Type': 'application/json',
  },
});

parkingApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const parkingApiClient = {
  /**
   * Fetch nearby parking facilities from FastAPI backend
   */
  async getNearbyParkingFacilities(filters?: { evOnly?: boolean; maxDistanceKm?: number }): Promise<ParkingFacility[]> {
    const res = await parkingApi.get<ParkingFacility[]>('/facilities', {
      params: {
        ev_only: filters?.evOnly,
        max_distance_km: filters?.maxDistanceKm,
      },
    });
    return res.data;
  },

  /**
   * Lookup a parking facility by its unique ID
   */
  async getParkingFacilityById(facilityId: string): Promise<ParkingFacility> {
    const res = await parkingApi.get<ParkingFacility>(`/facilities/${facilityId}`);
    return res.data;
  },

  /**
   * Fetch slot layout for a parking facility and level
   */
  async getFacilitySlots(facilityId: string, level = 1): Promise<ParkingSlot[]> {
    const res = await parkingApi.get<ParkingSlot[]>(`/facilities/${facilityId}/slots`, {
      params: { level },
    });
    return res.data;
  },
};

export default parkingApiClient;
