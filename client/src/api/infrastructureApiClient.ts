import axios from 'axios';

const FASTAPI_INFRASTRUCTURE_URL = 'http://localhost:8000/api/v1/infrastructure';

const infrastructureApi = axios.create({
  baseURL: FASTAPI_INFRASTRUCTURE_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

infrastructureApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface RoadClosureSimPayload {
  road_segment: string;
  closure_type: string;
  duration_days: number;
  peak_hour_traffic_vph?: number;
}

export const infrastructureApiClient = {
  /**
   * Fetch municipal capital works overview stats, active projects, and road approvals
   */
  async getOverview(): Promise<any> {
    const res = await infrastructureApi.get('/overview');
    return res.data;
  },

  /**
   * List active capital infrastructure construction projects
   */
  async getProjects(): Promise<any[]> {
    const res = await infrastructureApi.get('/projects');
    return res.data;
  },

  /**
   * List pending road work permit and utility closure approval requests
   */
  async getApprovals(): Promise<any[]> {
    const res = await infrastructureApi.get('/approvals');
    return res.data;
  },

  /**
   * Submit an Approve/Reject decision on a road permit request
   */
  async submitApprovalDecision(approvalId: number, decision: 'APPROVED' | 'REJECTED', comments?: string): Promise<any> {
    const res = await infrastructureApi.post(`/approvals/${approvalId}/decision`, {
      decision,
      comments,
    });
    return res.data;
  },

  /**
   * Run traffic impact simulation for proposed road closures
   */
  async runClosureSimulation(payload: RoadClosureSimPayload): Promise<any> {
    const res = await infrastructureApi.post('/closure-simulation', payload);
    return res.data;
  },
};

export default infrastructureApiClient;
