import {
  TrafficAlert,
  CitizenJunctionSummary,
  CitizenNotification,
  CityMobilityStatus,
  CitizenDataQueryFilters,
} from '../types/citizen';

/**
 * Format ISO timestamp into a human-readable relative time string.
 */
export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

// Generate base ISO timestamps for mock relative timing
const nowTime = Date.now();
const minutesAgo = (mins: number) => new Date(nowTime - mins * 60 * 1000).toISOString();

// Centralized Seed Junctions
export const MOCK_JUNCTIONS: CitizenJunctionSummary[] = [
  {
    id: 'j-14',
    code: 'J14',
    name: 'Central Connaught Plaza Hub',
    sector: 'Sector A - Central Core',
    location: [28.6139, 77.209],
    congestionPercent: 78,
    severity: 'HEAVY',
    trend: 'WORSENING',
    averageSpeedKmh: 18,
    queueLengthMeters: 140,
    vehicleCount: 382,
    signalPhase: 'NORTH_SOUTH',
    signalTimerSeconds: 32,
    sensorHealth: 'OPTIMAL',
    activeAdvisory: 'Lane 2 blockage cleared by patrol team',
    prediction: {
      horizonMinutes: 15,
      predictedCongestionPercent: 82,
      confidenceScore: 0.88,
    },
    lastUpdated: minutesAgo(1),
  },
  {
    id: 'j-15',
    code: 'J15',
    name: 'Metro Ring Expressway Toll',
    sector: 'Sector B - Transit Hub',
    location: [28.625, 77.218],
    congestionPercent: 54,
    severity: 'MODERATE',
    trend: 'STABLE',
    averageSpeedKmh: 36,
    queueLengthMeters: 45,
    vehicleCount: 245,
    signalPhase: 'EAST_WEST',
    signalTimerSeconds: 48,
    sensorHealth: 'OPTIMAL',
    prediction: {
      horizonMinutes: 15,
      predictedCongestionPercent: 50,
      confidenceScore: 0.91,
    },
    lastUpdated: minutesAgo(2),
  },
  {
    id: 'j-16',
    code: 'J16',
    name: 'Hospital Trauma Corridor Gateway',
    sector: 'Sector C - Medical Enclave',
    location: [28.601, 77.225],
    congestionPercent: 26,
    severity: 'CLEAR',
    trend: 'IMPROVING',
    averageSpeedKmh: 45,
    queueLengthMeters: 15,
    vehicleCount: 118,
    signalPhase: 'GREEN_CORRIDOR',
    signalTimerSeconds: 75,
    sensorHealth: 'OPTIMAL',
    activeAdvisory: 'Emergency Green Wave Priority Active',
    prediction: {
      horizonMinutes: 15,
      predictedCongestionPercent: 22,
      confidenceScore: 0.95,
    },
    lastUpdated: minutesAgo(1),
  },
  {
    id: 'j-17',
    code: 'J17',
    name: 'Tech Park North Ring Cross',
    sector: 'Sector D - Innovation Corridor',
    location: [28.638, 77.234],
    congestionPercent: 32,
    severity: 'CLEAR',
    trend: 'STABLE',
    averageSpeedKmh: 48,
    queueLengthMeters: 20,
    vehicleCount: 160,
    signalPhase: 'NORTH_SOUTH',
    signalTimerSeconds: 42,
    sensorHealth: 'OPTIMAL',
    prediction: {
      horizonMinutes: 15,
      predictedCongestionPercent: 35,
      confidenceScore: 0.86,
    },
    lastUpdated: minutesAgo(4),
  },
  {
    id: 'j-18',
    code: 'J18',
    name: 'Western Bypass Interchange',
    sector: 'Sector A - West Zone',
    location: [28.618, 77.195],
    congestionPercent: 42,
    severity: 'CLEAR',
    trend: 'IMPROVING',
    averageSpeedKmh: 42,
    queueLengthMeters: 30,
    vehicleCount: 205,
    signalPhase: 'EAST_WEST',
    signalTimerSeconds: 50,
    sensorHealth: 'OPTIMAL',
    prediction: {
      horizonMinutes: 15,
      predictedCongestionPercent: 38,
      confidenceScore: 0.89,
    },
    lastUpdated: minutesAgo(3),
  },
  {
    id: 'j-19',
    code: 'J19',
    name: 'Outer Ring South Underpass',
    sector: 'Sector C - South Belt',
    location: [28.592, 77.215],
    congestionPercent: 68,
    severity: 'MODERATE',
    trend: 'WORSENING',
    averageSpeedKmh: 28,
    queueLengthMeters: 85,
    vehicleCount: 310,
    signalPhase: 'NORTH_SOUTH',
    signalTimerSeconds: 35,
    sensorHealth: 'OPTIMAL',
    activeAdvisory: 'Drainage suction pumps deployed',
    prediction: {
      horizonMinutes: 15,
      predictedCongestionPercent: 74,
      confidenceScore: 0.84,
    },
    lastUpdated: minutesAgo(2),
  },
];

// Centralized Seed Traffic Alerts with explicit junctionId foreign keys
export const MOCK_TRAFFIC_ALERTS: TrafficAlert[] = [
  {
    id: 'alt-01',
    code: 'ALT-401',
    incidentId: 'inc-9812',
    junctionId: 'j-14', // Links directly to Central Connaught Plaza Hub (J14)
    title: 'Multi-Vehicle Obstruction on Central Boulevard',
    severity: 'HIGH',
    category: 'ACCIDENT',
    location: 'Junction J14 (Central Boulevard & 4th Ave)',
    coordinates: [28.6139, 77.209],
    description: 'Minor collision blocking lane 2. Traffic management on-site; expect 12-15 min slowdown.',
    timestamp: minutesAgo(8),
    estimatedDelayMinutes: 14,
    alternateRouteSuggested: 'Outer Ring Road East Connector',
    verifiedAdvisory: true,
    affectedLanes: 'Northbound Lane 2',
  },
  {
    id: 'alt-02',
    code: 'ALT-402',
    incidentId: 'inc-9813',
    junctionId: 'j-16', // Links directly to Hospital Trauma Gateway (J16)
    title: 'Active Green Corridor for Emergency Response',
    severity: 'CRITICAL',
    category: 'GREEN_CORRIDOR',
    location: 'Junction J16 (Hospital Trauma Gateway)',
    coordinates: [28.601, 77.225],
    description: 'Priority signal green wave active for emergency ambulance unit heading to City General Trauma.',
    timestamp: minutesAgo(3),
    estimatedDelayMinutes: 0,
    verifiedAdvisory: true,
  },
  {
    id: 'alt-03',
    code: 'ALT-403',
    incidentId: 'inc-9814',
    junctionId: 'j-19', // Links directly to Outer Ring South Underpass (J19)
    title: 'Monsoon Waterlogging Drainage Works',
    severity: 'MEDIUM',
    category: 'WATERLOGGING',
    location: 'Junction J19 South Belt Underpass',
    coordinates: [28.592, 77.215],
    description: 'Municipal de-watering suction pumps active. Single lane operational; drive with caution.',
    timestamp: minutesAgo(25),
    estimatedDelayMinutes: 8,
    alternateRouteSuggested: 'South-West Connector Link',
    verifiedAdvisory: true,
    affectedLanes: 'Left Service Lane',
  },
  {
    id: 'alt-04',
    code: 'ALT-404',
    incidentId: 'inc-9815',
    junctionId: 'j-17', // Links directly to Tech Park North Ring (J17)
    title: 'Peak Tech Park Inflow Bottleneck',
    severity: 'LOW',
    category: 'CONGESTION',
    location: 'Junction J17 (Tech Park North Ring)',
    coordinates: [28.638, 77.234],
    description: 'Moderate rush-hour accumulation. Adaptive signal timing extended +15s.',
    timestamp: minutesAgo(40),
    estimatedDelayMinutes: 5,
    verifiedAdvisory: false,
  },
];

// Seed Citizen Notifications
export const MOCK_NOTIFICATIONS: CitizenNotification[] = [
  {
    id: 'notif-01',
    title: 'Green Corridor Alert',
    message: 'Hospital Link Corridor prioritized for emergency response unit. Please yield to emergency vehicles.',
    type: 'ALERT',
    timestamp: minutesAgo(4),
    read: false,
    linkTab: 'SOS',
  },
  {
    id: 'notif-02',
    title: 'Civic Complaint Update',
    message: 'Your report CIVIC-9023 (Waterlogging on Expressway Flyover) marked resolved by Municipal Team.',
    type: 'SUCCESS',
    timestamp: minutesAgo(120),
    read: false,
    linkTab: 'REPORT',
  },
  {
    id: 'notif-03',
    title: 'EV Parking Slot Available',
    message: '15 slots open at Connaught Central Car Park with 4 EV Fast Chargers ready.',
    type: 'INFO',
    timestamp: minutesAgo(300),
    read: true,
    linkTab: 'PARKING',
  },
  {
    id: 'notif-04',
    title: 'Data Retention Notice (Demo Mode)',
    message: 'Telemetry logs older than 30 days are scheduled for auto-purge in simulation mode.',
    type: 'INFO',
    timestamp: minutesAgo(1440),
    read: true,
  },
];

// Seed City Mobility Status
export const MOCK_CITY_STATUS: CityMobilityStatus = {
  cityCongestionIndex: 44,
  averageSpeedKmh: 41.5,
  activeGreenCorridors: 1,
  trafficStatus: 'NORMAL',
  activeSignalsCount: 142,
  lastUpdated: new Date().toISOString(),
  currentLocationName: 'Connaught Place Sector 4, New Delhi',
};

/**
 * Service Layer: Provides data to the Citizen portal.
 * Designed to easily switch to FastAPI endpoint calls in production.
 */
export const citizenService = {
  /**
   * Fetch active traffic alerts with optional severity filtering
   */
  async getTrafficAlerts(filters?: CitizenDataQueryFilters): Promise<TrafficAlert[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...MOCK_TRAFFIC_ALERTS];
        if (filters?.severity && filters.severity !== 'ALL') {
          results = results.filter((a) => a.severity === filters.severity);
        }
        if (filters?.limit) {
          results = results.slice(0, filters.limit);
        }
        resolve(results);
      }, 150);
    });
  },

  /**
   * Fetch nearby traffic junctions and live status
   */
  async getNearbyJunctions(filters?: CitizenDataQueryFilters): Promise<CitizenJunctionSummary[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...MOCK_JUNCTIONS];
        if (filters?.sector) {
          results = results.filter((j) => j.sector.toLowerCase().includes(filters.sector!.toLowerCase()));
        }
        if (filters?.limit) {
          results = results.slice(0, filters.limit);
        }
        resolve(results);
      }, 180);
    });
  },

  /**
   * Lookup a specific junction by its unique ID
   */
  async getJunctionById(id: string): Promise<CitizenJunctionSummary | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = MOCK_JUNCTIONS.find((j) => j.id === id) || null;
        resolve(found);
      }, 80);
    });
  },

  /**
   * Fetch citywide mobility index and telemetry
   */
  async getCityMobilityStatus(): Promise<CityMobilityStatus> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...MOCK_CITY_STATUS,
          lastUpdated: new Date().toISOString(),
        });
      }, 100);
    });
  },

  /**
   * Fetch user notifications
   */
  async getNotifications(): Promise<CitizenNotification[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_NOTIFICATIONS]), 80);
    });
  },
};
