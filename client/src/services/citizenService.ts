import {
  TrafficAlert,
  CitizenJunctionSummary,
  CitizenNotification,
  CityMobilityStatus,
  CitizenDataQueryFilters,
  ParkingFacility,
  ParkingSlot,
  ParkingSlotStatus,
  ParkingSlotType,
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

// =========================================================================
// 🅿️ DEMO PARKING DATA & SERVICE LAYER (PHASE 2D - FASTAPI READY)
// =========================================================================

interface SlotSpec {
  code: string;
  row: string;
  col: number;
  status: ParkingSlotStatus;
  type: ParkingSlotType;
  level: number;
  rate: number;
  features: string[];
}

const buildFacilitySlots = (prefix: string, specs: SlotSpec[]): ParkingSlot[] => {
  return specs.map((s) => ({
    id: `slot-${prefix}-${s.code}`,
    code: s.code,
    row: s.row,
    col: s.col,
    status: s.status,
    type: s.type,
    level: s.level,
    hourlyRate: s.rate,
    features: s.features,
  }));
};

// Facility 1: Connaught Central Multi-Level Car Park (Total: 24 | Avail: 13, Occ: 8, Res: 2, Dis: 1)
const GAR_01_SLOTS = buildFacilitySlots('CP', [
  // Floor 1 (Row A & B)
  { code: 'A1', row: 'A', col: 1, status: 'AVAILABLE', type: 'EV_CHARGING', level: 1, rate: 40, features: ['60kW Fast DC Charging', 'Covered Bay'] },
  { code: 'A2', row: 'A', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 40, features: ['Standard Sedan Bay'] },
  { code: 'A3', row: 'A', col: 3, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 40, features: ['CCTV Monitored', 'Close to Elevator 1'] },
  { code: 'A4', row: 'A', col: 4, status: 'RESERVED', type: 'STANDARD', level: 1, rate: 40, features: ['Corporate Reserved'] },
  { code: 'A5', row: 'A', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 40, features: ['Extra Width SUV Bay'] },
  { code: 'A6', row: 'A', col: 6, status: 'AVAILABLE', type: 'EV_CHARGING', level: 1, rate: 40, features: ['Type-2 AC 22kW', 'Solar Powered'] },

  { code: 'B1', row: 'B', col: 1, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 40, features: ['Standard Car Bay'] },
  { code: 'B2', row: 'B', col: 2, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 40, features: ['Standard Car Bay'] },
  { code: 'B3', row: 'B', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 40, features: ['Occupied by DL-01-AB-1234'] },
  { code: 'B4', row: 'B', col: 4, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 40, features: ['Occupied by HR-26-CC-8821'] },
  { code: 'B5', row: 'B', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 40, features: ['Standard Car Bay'] },
  { code: 'B6', row: 'B', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 40, features: ['Occupied by DL-03-XY-9901'] },

  // Floor 2 (Row C & D)
  { code: 'C1', row: 'C', col: 1, status: 'DISABLED', type: 'ACCESSIBLE', level: 2, rate: 40, features: ['Maintenance / Sensor Calibration'] },
  { code: 'C2', row: 'C', col: 2, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 40, features: ['Standard Car Bay'] },
  { code: 'C3', row: 'C', col: 3, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 40, features: ['Standard Car Bay'] },
  { code: 'C4', row: 'C', col: 4, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 40, features: ['Occupied by UP-16-ZZ-4411'] },
  { code: 'C5', row: 'C', col: 5, status: 'RESERVED', type: 'STANDARD', level: 2, rate: 40, features: ['Staff Reserved Bay'] },
  { code: 'C6', row: 'C', col: 6, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 40, features: ['Standard Car Bay'] },

  { code: 'D1', row: 'D', col: 1, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 40, features: ['Standard Car Bay'] },
  { code: 'D2', row: 'D', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 40, features: ['Occupied by DL-08-QR-5566'] },
  { code: 'D3', row: 'D', col: 3, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 40, features: ['Standard Car Bay'] },
  { code: 'D4', row: 'D', col: 4, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 40, features: ['Standard Car Bay'] },
  { code: 'D5', row: 'D', col: 5, status: 'AVAILABLE', type: 'EV_CHARGING', level: 2, rate: 40, features: ['Fast EV 50kW Charger'] },
  { code: 'D6', row: 'D', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 40, features: ['Occupied by DL-04-MM-7788'] },
]);

// Facility 2: Metro Tech Hub Underground Garage (Total: 24 | Avail: 10, Occ: 11, Res: 2, Dis: 1)
const GAR_02_SLOTS = buildFacilitySlots('MTH', [
  // Floor 1
  { code: 'A1', row: 'A', col: 1, status: 'AVAILABLE', type: 'EV_CHARGING', level: 1, rate: 30, features: ['Type-2 Fast AC Plug'] },
  { code: 'A2', row: 'A', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'A3', row: 'A', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'A4', row: 'A', col: 4, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 30, features: ['Near Metro Gate 3 Exit'] },
  { code: 'A5', row: 'A', col: 5, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'A6', row: 'A', col: 6, status: 'AVAILABLE', type: 'EV_CHARGING', level: 1, rate: 30, features: ['60kW Fast DC Plug'] },

  { code: 'B1', row: 'B', col: 1, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'B2', row: 'B', col: 2, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'B3', row: 'B', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'B4', row: 'B', col: 4, status: 'RESERVED', type: 'STANDARD', level: 1, rate: 30, features: ['Metro Transit Reserved'] },
  { code: 'B5', row: 'B', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'B6', row: 'B', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 30, features: ['Standard Sedan Bay'] },

  // Floor 2
  { code: 'C1', row: 'C', col: 1, status: 'AVAILABLE', type: 'ACCESSIBLE', level: 2, rate: 30, features: ['Wide Ramped Accessible Bay'] },
  { code: 'C2', row: 'C', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'C3', row: 'C', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'C4', row: 'C', col: 4, status: 'RESERVED', type: 'STANDARD', level: 2, rate: 30, features: ['Cyber Hub Permit Holder'] },
  { code: 'C5', row: 'C', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'C6', row: 'C', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },

  { code: 'D1', row: 'D', col: 1, status: 'DISABLED', type: 'STANDARD', level: 2, rate: 30, features: ['Underground Drainage Work'] },
  { code: 'D2', row: 'D', col: 2, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'D3', row: 'D', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'D4', row: 'D', col: 4, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'D5', row: 'D', col: 5, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
  { code: 'D6', row: 'D', col: 6, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 30, features: ['Standard Sedan Bay'] },
]);

// Facility 3: City General Trauma Plaza Parking Deck (Total: 24 | Avail: 16, Occ: 6, Res: 2, Dis: 0)
const GAR_03_SLOTS = buildFacilitySlots('CGT', [
  // Floor 1
  { code: 'A1', row: 'A', col: 1, status: 'AVAILABLE', type: 'VIP_EMERGENCY', level: 1, rate: 20, features: ['Emergency Direct Trauma Access'] },
  { code: 'A2', row: 'A', col: 2, status: 'AVAILABLE', type: 'VIP_EMERGENCY', level: 1, rate: 20, features: ['Emergency Doctor Priority Bay'] },
  { code: 'A3', row: 'A', col: 3, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'A4', row: 'A', col: 4, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 20, features: ['Visitor Bay Occupied'] },
  { code: 'A5', row: 'A', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'A6', row: 'A', col: 6, status: 'AVAILABLE', type: 'EV_CHARGING', level: 1, rate: 20, features: ['Hospital EV Fleet Fast Plug'] },

  { code: 'B1', row: 'B', col: 1, status: 'AVAILABLE', type: 'ACCESSIBLE', level: 1, rate: 20, features: ['Wheelchair Level Hospital Bay'] },
  { code: 'B2', row: 'B', col: 2, status: 'AVAILABLE', type: 'ACCESSIBLE', level: 1, rate: 20, features: ['Wheelchair Level Hospital Bay'] },
  { code: 'B3', row: 'B', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 20, features: ['Visitor Bay Occupied'] },
  { code: 'B4', row: 'B', col: 4, status: 'RESERVED', type: 'STANDARD', level: 1, rate: 20, features: ['Surgeon On-Call Reserved'] },
  { code: 'B5', row: 'B', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'B6', row: 'B', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 20, features: ['Visitor Bay Occupied'] },

  // Floor 2
  { code: 'C1', row: 'C', col: 1, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'C2', row: 'C', col: 2, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'C3', row: 'C', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Bay Occupied'] },
  { code: 'C4', row: 'C', col: 4, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'C5', row: 'C', col: 5, status: 'RESERVED', type: 'STANDARD', level: 2, rate: 20, features: ['Medical Staff Reserved'] },
  { code: 'C6', row: 'C', col: 6, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },

  { code: 'D1', row: 'D', col: 1, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'D2', row: 'D', col: 2, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'D3', row: 'D', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Bay Occupied'] },
  { code: 'D4', row: 'D', col: 4, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
  { code: 'D5', row: 'D', col: 5, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Bay Occupied'] },
  { code: 'D6', row: 'D', col: 6, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 20, features: ['Visitor Car Bay'] },
]);

// Facility 4: Municipal Civic Secretariat Visitor Parking (Total: 24 | Avail: 8, Occ: 13, Res: 2, Dis: 1)
const GAR_04_SLOTS = buildFacilitySlots('CIVIC', [
  // Floor 1
  { code: 'A1', row: 'A', col: 1, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Government Fleet Bay'] },
  { code: 'A2', row: 'A', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Government Fleet Bay'] },
  { code: 'A3', row: 'A', col: 3, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 25, features: ['Public Citizen Visitor Bay'] },
  { code: 'A4', row: 'A', col: 4, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Public Visitor Bay'] },
  { code: 'A5', row: 'A', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 1, rate: 25, features: ['Public Citizen Visitor Bay'] },
  { code: 'A6', row: 'A', col: 6, status: 'AVAILABLE', type: 'EV_CHARGING', level: 1, rate: 25, features: ['Civic EV Public Charger'] },

  { code: 'B1', row: 'B', col: 1, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Official Duty Bay'] },
  { code: 'B2', row: 'B', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Official Duty Bay'] },
  { code: 'B3', row: 'B', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Official Duty Bay'] },
  { code: 'B4', row: 'B', col: 4, status: 'RESERVED', type: 'STANDARD', level: 1, rate: 25, features: ['Mayor Office Protocol Reserved'] },
  { code: 'B5', row: 'B', col: 5, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Visitor Bay Occupied'] },
  { code: 'B6', row: 'B', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 1, rate: 25, features: ['Visitor Bay Occupied'] },

  // Floor 2
  { code: 'C1', row: 'C', col: 1, status: 'AVAILABLE', type: 'ACCESSIBLE', level: 2, rate: 25, features: ['Universal Access Ramped Bay'] },
  { code: 'C2', row: 'C', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 25, features: ['Public Visitor Bay'] },
  { code: 'C3', row: 'C', col: 3, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 25, features: ['Public Visitor Bay'] },
  { code: 'C4', row: 'C', col: 4, status: 'RESERVED', type: 'STANDARD', level: 2, rate: 25, features: ['Commissioner Staff Reserved'] },
  { code: 'C5', row: 'C', col: 5, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 25, features: ['Public Citizen Visitor Bay'] },
  { code: 'C6', row: 'C', col: 6, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 25, features: ['Public Citizen Visitor Bay'] },

  { code: 'D1', row: 'D', col: 1, status: 'DISABLED', type: 'STANDARD', level: 2, rate: 25, features: ['Pavement Resurfacing Work'] },
  { code: 'D2', row: 'D', col: 2, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 25, features: ['Public Visitor Bay'] },
  { code: 'D3', row: 'D', col: 3, status: 'AVAILABLE', type: 'STANDARD', level: 2, rate: 25, features: ['Public Citizen Visitor Bay'] },
  { code: 'D4', row: 'D', col: 4, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 25, features: ['Public Visitor Bay'] },
  { code: 'D5', row: 'D', col: 5, status: 'AVAILABLE', type: 'EV_CHARGING', level: 2, rate: 25, features: ['Fast EV Charger 50kW'] },
  { code: 'D6', row: 'D', col: 6, status: 'OCCUPIED', type: 'STANDARD', level: 2, rate: 25, features: ['Public Visitor Bay'] },
]);

export const MOCK_PARKING_FACILITIES: ParkingFacility[] = [
  {
    id: 'gar-01',
    name: 'Connaught Central Multi-Level Car Park',
    code: 'PKG-CP-01',
    address: 'Block B, Inner Circle, Connaught Center',
    distanceKm: 0.45,
    distanceDisplay: '450 m away',
    coordinates: [28.6139, 77.209],
    dijkstraNodeId: 'node-cp',
    totalSlots: 24,
    availableSlots: 13,
    occupiedSlots: 8,
    reservedSlots: 2,
    disabledSlots: 1,
    occupancyPercent: 42,
    hourlyRateInr: 40,
    operatingHours: '24/7 Open',
    evChargingAvailable: true,
    evSlotsAvailable: 3,
    accessibleSlotsAvailable: 1,
    levels: 2,
    currentLevel: 1,
    slots: GAR_01_SLOTS,
  },
  {
    id: 'gar-02',
    name: 'Metro Tech Hub Underground Smart Garage',
    code: 'PKG-MTH-02',
    address: 'Gate 3, Cyber Tech Complex, Metro Ring Road',
    distanceKm: 1.2,
    distanceDisplay: '1.2 km away',
    coordinates: [28.6195, 77.2145],
    dijkstraNodeId: 'node-metro',
    totalSlots: 24,
    availableSlots: 10,
    occupiedSlots: 11,
    reservedSlots: 2,
    disabledSlots: 1,
    occupancyPercent: 54,
    hourlyRateInr: 30,
    operatingHours: '06:00 AM - 11:30 PM',
    evChargingAvailable: true,
    evSlotsAvailable: 2,
    accessibleSlotsAvailable: 1,
    levels: 2,
    currentLevel: 1,
    slots: GAR_02_SLOTS,
  },
  {
    id: 'gar-03',
    name: 'City General Trauma Plaza Parking Deck',
    code: 'PKG-CGT-03',
    address: 'Hospital Access Boulevard, Medical Emergency Zone',
    distanceKm: 2.1,
    distanceDisplay: '2.1 km away',
    coordinates: [28.6255, 77.2185],
    dijkstraNodeId: 'node-hosp1',
    totalSlots: 24,
    availableSlots: 16,
    occupiedSlots: 6,
    reservedSlots: 2,
    disabledSlots: 0,
    occupancyPercent: 33,
    hourlyRateInr: 20,
    operatingHours: '24/7 Priority Open',
    evChargingAvailable: true,
    evSlotsAvailable: 1,
    accessibleSlotsAvailable: 2,
    levels: 2,
    currentLevel: 1,
    slots: GAR_03_SLOTS,
  },
  {
    id: 'gar-04',
    name: 'Municipal Civic Secretariat Visitor Parking',
    code: 'PKG-CIVIC-04',
    address: 'Gate 2, Municipal Civic Secretariat Complex',
    distanceKm: 1.8,
    distanceDisplay: '1.8 km away',
    coordinates: [28.616, 77.222],
    dijkstraNodeId: 'node-civic',
    totalSlots: 24,
    availableSlots: 8,
    occupiedSlots: 13,
    reservedSlots: 2,
    disabledSlots: 1,
    occupancyPercent: 63,
    hourlyRateInr: 25,
    operatingHours: '08:00 AM - 08:00 PM',
    evChargingAvailable: true,
    evSlotsAvailable: 2,
    accessibleSlotsAvailable: 1,
    levels: 2,
    currentLevel: 1,
    slots: GAR_04_SLOTS,
  },
];

/**
 * 🅿️ Citizen Smart Parking Service Layer (Async & FastAPI-ready)
 */
export const citizenParkingService = {
  /**
   * Fetch nearby parking facilities with optional criteria
   */
  async getNearbyParkingFacilities(filters?: { evOnly?: boolean; maxDistanceKm?: number }): Promise<ParkingFacility[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...MOCK_PARKING_FACILITIES];
        if (filters?.evOnly) {
          results = results.filter((f) => f.evChargingAvailable && f.evSlotsAvailable > 0);
        }
        if (filters?.maxDistanceKm) {
          results = results.filter((f) => f.distanceKm <= filters.maxDistanceKm!);
        }
        resolve(results);
      }, 150);
    });
  },

  /**
   * Lookup a parking facility by its unique ID
   */
  async getParkingFacilityById(facilityId: string): Promise<ParkingFacility | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = MOCK_PARKING_FACILITIES.find((f) => f.id === facilityId) || null;
        resolve(found);
      }, 80);
    });
  },

  /**
   * Fetch slot layout for a parking facility and level
   */
  async getFacilitySlots(facilityId: string, level = 1): Promise<ParkingSlot[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const facility = MOCK_PARKING_FACILITIES.find((f) => f.id === facilityId);
        if (!facility) {
          resolve([]);
          return;
        }
        const filtered = facility.slots.filter((s) => s.level === level);
        resolve(filtered);
      }, 100);
    });
  },
};

