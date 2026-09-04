import api from './authClient';

export interface AdminUserDTO {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface AdminAuditLogDTO {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  resource?: string;
  details?: string;
  timestamp: string;
}

export const DEMO_ADMIN_USERS: AdminUserDTO[] = [
  {
    id: 101,
    name: 'Rahul Sharma',
    email: 'citizen@intelliflow.ai',
    role: 'CITIZEN',
    is_active: true,
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 102,
    name: 'Insp. Rajesh Varma',
    email: 'police@intelliflow.ai',
    role: 'TRAFFIC_POLICE',
    is_active: true,
    created_at: '2026-08-10T14:30:00Z',
  },
  {
    id: 103,
    name: 'Eng. Sunita Rao',
    email: 'municipal@intelliflow.ai',
    role: 'CITY_OPERATIONS',
    is_active: true,
    created_at: '2026-08-01T09:15:00Z',
  },
  {
    id: 100,
    name: 'Super Admin',
    email: 'admin@intelliflow.ai',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-07-20T08:00:00Z',
  },
];

export const DEMO_AUDIT_LOGS: AdminAuditLogDTO[] = [
  {
    id: 1,
    user_id: 102,
    user_name: 'Insp. Rajesh Varma',
    action: 'SIGNAL_OVERRIDE_APPLIED',
    resource: '/api/v1/traffic-police/signal-override',
    details: 'Manual green time extension to 60s at J14',
    timestamp: '2026-09-01T15:30:00Z',
  },
  {
    id: 2,
    user_id: 103,
    user_name: 'Eng. Sunita Rao',
    action: 'ROAD_APPROVAL_DECISION',
    resource: '/api/v1/infrastructure/approvals/1/decision',
    details: 'Approved closure request for utility works',
    timestamp: '2026-09-01T14:15:00Z',
  },
  {
    id: 3,
    user_id: 101,
    user_name: 'Rahul Sharma',
    action: 'EMERGENCY_SOS_TRIGGERED',
    resource: '/api/v1/emergency/sos',
    details: '112 SOS beacon triggered at Connaught Sector 4',
    timestamp: '2026-09-01T12:00:00Z',
  },
];

export const adminApiClient = {
  async getUsers(): Promise<{ users: AdminUserDTO[]; dataSource: string }> {
    try {
      const res = await api.get('/api/v1/admin/users');
      return {
        users: res.data.users || [],
        dataSource: 'FASTAPI_POSTGRES',
      };
    } catch (err) {
      console.warn('FastAPI unavailable, using DEMO_OFFLINE_FALLBACK for admin users');
      return {
        users: DEMO_ADMIN_USERS,
        dataSource: 'DEMO_OFFLINE_FALLBACK',
      };
    }
  },

  async updateUserRole(userId: number | string, newRole: string): Promise<AdminUserDTO> {
    try {
      const res = await api.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      return res.data;
    } catch (err) {
      console.warn('FastAPI unavailable, returning DEMO_OFFLINE_FALLBACK role update');
      const target = DEMO_ADMIN_USERS.find((u) => String(u.id) === String(userId));
      if (target) {
        target.role = newRole;
        return { ...target };
      }
      return {
        id: Number(userId),
        name: 'Demo User',
        email: 'user@intelliflow.ai',
        role: newRole,
        is_active: true,
      };
    }
  },

  async toggleUserStatus(userId: number | string, currentStatus: boolean): Promise<AdminUserDTO> {
    try {
      const res = await api.patch(`/api/v1/admin/users/${userId}/status`, { is_active: !currentStatus });
      return res.data;
    } catch (err) {
      console.warn('FastAPI unavailable, returning DEMO_OFFLINE_FALLBACK status toggle');
      const target = DEMO_ADMIN_USERS.find((u) => String(u.id) === String(userId));
      if (target) {
        target.is_active = !currentStatus;
        return { ...target };
      }
      return {
        id: Number(userId),
        name: 'Demo User',
        email: 'user@intelliflow.ai',
        role: 'CITIZEN',
        is_active: !currentStatus,
      };
    }
  },

  async getAuditLogs(): Promise<{ logs: AdminAuditLogDTO[]; dataSource: string }> {
    try {
      const res = await api.get('/api/v1/admin/audit-logs');
      return {
        logs: res.data.logs || [],
        dataSource: 'FASTAPI_POSTGRES',
      };
    } catch (err) {
      console.warn('FastAPI unavailable, using DEMO_OFFLINE_FALLBACK for audit logs');
      return {
        logs: DEMO_AUDIT_LOGS,
        dataSource: 'DEMO_OFFLINE_FALLBACK',
      };
    }
  },
};
