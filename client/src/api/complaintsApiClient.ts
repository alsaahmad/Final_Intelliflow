import axios from 'axios';
import { CitizenComplaint } from '../context/CitySyncContext';

const FASTAPI_COMPLAINTS_URL = 'http://localhost:8000/api/v1/complaints';

const complaintsApi = axios.create({
  baseURL: FASTAPI_COMPLAINTS_URL,
  timeout: 3000, // 3s timeout for fast fallback if server is offline
  headers: {
    'Content-Type': 'application/json',
  },
});

complaintsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const complaintsApiClient = {
  /**
   * Fetch citizen complaints from FastAPI backend
   */
  async getComplaints(filters?: { status?: string; category?: string; myReportsOnly?: boolean }): Promise<CitizenComplaint[]> {
    const res = await complaintsApi.get<CitizenComplaint[]>('', {
      params: {
        status: filters?.status,
        category: filters?.category,
        my_reports_only: filters?.myReportsOnly,
      },
    });
    return res.data;
  },

  /**
   * Submit a new citizen complaint
   */
  async createComplaint(payload: {
    title: string;

    category: string;
    location: string;
    urgency: string;
    description: string;
    latitude?: number;
    longitude?: number;
  }): Promise<CitizenComplaint> {
    const res = await complaintsApi.post<CitizenComplaint>('', payload);
    return res.data;
  },

  /**
   * Fetch single complaint by ID or code
   */
  async getComplaintById(id: string): Promise<CitizenComplaint> {
    const res = await complaintsApi.get<CitizenComplaint>(`/${id}`);
    return res.data;
  },

  /**
   * Update complaint status and resolution remarks (Municipal / Operations staff)
   */
  async updateComplaintStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED', remarks?: string): Promise<CitizenComplaint> {
    const res = await complaintsApi.patch<CitizenComplaint>(`/${id}/status`, {
      status,
      remarks,
    });
    return res.data;
  },
};

export default complaintsApiClient;
