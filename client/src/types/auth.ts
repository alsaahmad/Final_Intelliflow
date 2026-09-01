export type UserRole =
  | 'CITIZEN'
  | 'TRAFFIC_POLICE'
  | 'CITY_OPERATIONS'
  | 'MUNICIPAL_CORP'
  | 'COMMAND_CENTER'
  | 'MUNICIPAL_CORPORATION'
  | 'MUNICIPAL_ENGINEER'
  | 'AMBULANCE_RESPONDER'
  | 'HOSPITAL'
  | 'ADMIN';

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  badge_number?: string | null;
  department?: string | null;
  phone_number?: string | null;
  profile_image?: string | null;
  oauth_provider?: string | null;
  is_active?: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
  requiresRoleSelection?: boolean;
  availableRoles?: UserRole[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  permissions?: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  devLogin?: (role: UserRole) => Promise<void>;
  devSwitchRole?: (newRole: UserRole) => Promise<void>;
  getPortalPath: (roleOverride?: UserRole | null) => string;
}
