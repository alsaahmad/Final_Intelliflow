export const UserRole = {
  CITIZEN: 'CITIZEN',
  TRAFFIC_POLICE: 'TRAFFIC_POLICE',
  MUNICIPAL_CORP: 'MUNICIPAL_CORP',
  MUNICIPAL_CORPORATION: 'MUNICIPAL_CORP', // Alias
  MUNICIPAL_ENGINEER: 'MUNICIPAL_CORP', // Alias
  AMBULANCE_RESPONDER: 'AMBULANCE_RESPONDER',
  HOSPITAL: 'HOSPITAL',
  COMMAND_CENTER: 'COMMAND_CENTER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole] | 'MUNICIPAL_CORP' | 'MUNICIPAL_CORPORATION';

export const RoleCategory = {
  CITIZEN: 'CITIZEN',
  GOVERNMENT: 'GOVERNMENT',
  COMMAND: 'COMMAND',
  ADMIN: 'ADMIN',
} as const;

export type RoleCategory = (typeof RoleCategory)[keyof typeof RoleCategory];

export const Permissions = {
  // Common / City
  CITY_READ: 'city.read',
  PROFILE_READ: 'profile.read',
  
  // Citizen
  PARKING_READ: 'parking.read',
  PARKING_RESERVE: 'parking.reserve',
  INCIDENT_CREATE: 'incident.create',
  SOS_CREATE: 'sos.create',
  GRIEVANCE_CREATE: 'grievance.create',

  // Traffic Police
  TRAFFIC_READ: 'traffic.read',
  TRAFFIC_CONTROL: 'traffic.control',
  TRAFFIC_ANALYZE: 'traffic.analyze',
  GREEN_CORRIDOR_MANAGE: 'green_corridor.manage',
  VIOLATIONS_MANAGE: 'violations.manage',

  // Municipal Corporation
  PLANNING_READ: 'planning.read',
  PLANNING_CREATE_SCENARIO: 'planning.create_scenario',
  PARKING_ANALYTICS: 'parking.analytics',
  INFRASTRUCTURE_READ: 'infrastructure.read',
  INFRASTRUCTURE_MANAGE: 'infrastructure.manage',
  GRIEVANCE_RESOLVE: 'grievance.resolve',
  DIGITAL_TWIN_READ: 'digital_twin.read',
  DIGITAL_TWIN_SIMULATE: 'digital_twin.simulate',

  // Ambulance / First Responder
  DISPATCH_READ: 'dispatch.read',
  DISPATCH_ACCEPT: 'dispatch.accept',
  GREEN_CORRIDOR_REQUEST: 'green_corridor.request',
  TRIAGE_SUBMIT: 'triage.submit',

  // Hospital
  BEDS_READ: 'beds.read',
  BEDS_MANAGE: 'beds.manage',
  INCOMING_TRAUMA_READ: 'incoming_trauma.read',
  TRIAGE_RECEIVE: 'triage.receive',

  // Command Center
  INCIDENT_READ: 'incident.read',
  INCIDENT_DISPATCH: 'incident.dispatch',
  EMERGENCY_READ: 'emergency.read',
  EMERGENCY_COORDINATE: 'emergency.coordinate',
  CCTV_READ: 'cctv.read',
  CRISIS_BROADCAST: 'crisis.broadcast',

  // Admin
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  SYSTEM_MANAGE: 'system.manage',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CITIZEN: [
    Permissions.CITY_READ,
    Permissions.PARKING_READ,
    Permissions.PARKING_RESERVE,
    Permissions.INCIDENT_CREATE,
    Permissions.SOS_CREATE,
    Permissions.GRIEVANCE_CREATE,
    Permissions.PROFILE_READ,
  ],
  TRAFFIC_POLICE: [
    Permissions.CITY_READ,
    Permissions.TRAFFIC_READ,
    Permissions.TRAFFIC_CONTROL,
    Permissions.TRAFFIC_ANALYZE,
    Permissions.GREEN_CORRIDOR_MANAGE,
    Permissions.VIOLATIONS_MANAGE,
    Permissions.INCIDENT_READ,
    Permissions.PROFILE_READ,
  ],
  MUNICIPAL_CORP: [
    Permissions.CITY_READ,
    Permissions.DIGITAL_TWIN_READ,
    Permissions.DIGITAL_TWIN_SIMULATE,
    Permissions.PLANNING_READ,
    Permissions.PLANNING_CREATE_SCENARIO,
    Permissions.PARKING_ANALYTICS,
    Permissions.INFRASTRUCTURE_READ,
    Permissions.INFRASTRUCTURE_MANAGE,
    Permissions.GRIEVANCE_RESOLVE,
    Permissions.PROFILE_READ,
  ],
  MUNICIPAL_CORPORATION: [
    Permissions.CITY_READ,
    Permissions.DIGITAL_TWIN_READ,
    Permissions.DIGITAL_TWIN_SIMULATE,
    Permissions.PLANNING_READ,
    Permissions.PLANNING_CREATE_SCENARIO,
    Permissions.PARKING_ANALYTICS,
    Permissions.INFRASTRUCTURE_READ,
    Permissions.INFRASTRUCTURE_MANAGE,
    Permissions.GRIEVANCE_RESOLVE,
    Permissions.PROFILE_READ,
  ],
  COMMAND_CENTER: [
    Permissions.CITY_READ,
    Permissions.TRAFFIC_READ,
    Permissions.TRAFFIC_ANALYZE,
    Permissions.INCIDENT_READ,
    Permissions.INCIDENT_DISPATCH,
    Permissions.EMERGENCY_READ,
    Permissions.EMERGENCY_COORDINATE,
    Permissions.CCTV_READ,
    Permissions.CRISIS_BROADCAST,
    Permissions.DIGITAL_TWIN_READ,
    Permissions.DIGITAL_TWIN_SIMULATE,
    Permissions.GREEN_CORRIDOR_MANAGE,
    Permissions.PROFILE_READ,
  ],
  ADMIN: [
    Permissions.USERS_MANAGE,
    Permissions.ROLES_MANAGE,
    Permissions.SYSTEM_MANAGE,
    Permissions.CITY_READ,
    Permissions.PROFILE_READ,
    Permissions.TRAFFIC_READ,
    Permissions.DIGITAL_TWIN_READ,
    Permissions.PLANNING_READ,
    Permissions.INCIDENT_READ,
    Permissions.EMERGENCY_READ,
    Permissions.BEDS_READ,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getRolePortalPath(role: string): string {
  switch (role) {
    case 'CITIZEN':
      return '/citizen';
    case 'TRAFFIC_POLICE':
      return '/traffic-police';
    case 'MUNICIPAL_CORP':
    case 'MUNICIPAL_CORPORATION':
    case 'MUNICIPAL_ENGINEER':
      return '/municipal';
    case 'COMMAND_CENTER':
      return '/command-center';
    case 'ADMIN':
      return '/admin';
    default:
      return '/unauthorized';
  }
}
