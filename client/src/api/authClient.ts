import axios from 'axios';
import { User, UserRole, AuthResponse } from '../types/auth';

const api = axios.create({
  baseURL: '', // Handled by Vite proxy (/api and /auth)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('intelliflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  /**
   * Register a new user account with selected role
   */
  async register(name: string, email: string, password: string, role: UserRole): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/register', { name, email, password, role });
    return res.data;
  },

  /**
   * Authenticate user credentials and retrieve JWT (with optional target role)
   */
  async login(email: string, password: string, role?: UserRole): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', { email, password, role });
    return res.data;
  },

  /**
   * Fetch current authenticated profile using JWT
   */
  async getMe(): Promise<{ authenticated: boolean; user: User | null }> {
    try {
      const res = await api.get('/api/auth/me');
      return { authenticated: true, user: res.data.user };
    } catch {
      return { authenticated: false, user: null };
    }
  },

  /**
   * Check which roles an email has registered
   */
  async getRolesForEmail(email: string): Promise<UserRole[]> {
    try {
      const res = await api.get('/api/auth/roles-for-email', { params: { email } });
      return res.data.roles || [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch demo quick accounts
   */
  async getDemoAccounts(): Promise<any[]> {
    try {
      const res = await api.get('/api/auth/demo-accounts');
      return res.data.accounts || [];
    } catch {
      return [];
    }
  },
};

export default api;
