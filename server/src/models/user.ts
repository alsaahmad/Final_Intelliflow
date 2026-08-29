export type UserRole = 'CITIZEN' | 'TRAFFIC_POLICE' | 'MUNICIPAL_CORP' | 'COMMAND_CENTER';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  badge_number?: string | null;
  department?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  badge_number?: string | null;
  department?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export function sanitizeUser(user: any): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    badge_number: user.badge_number,
    department: user.department,
    phone_number: user.phone_number,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
  };
}
