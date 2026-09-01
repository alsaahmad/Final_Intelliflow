export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TrafficSeverity = 'CLEAR' | 'MODERATE' | 'HEAVY' | 'CONGESTED';
export type CongestionTrend = 'IMPROVING' | 'STABLE' | 'WORSENING';
export type SensorHealth = 'OPTIMAL' | 'DEGRADED' | 'OFFLINE';

export interface TrafficPrediction {
  horizonMinutes: number; // e.g. 15, 30
  predictedCongestionPercent: number;
  confidenceScore: number; // 0.0 - 1.0 (e.g. 0.88 = 88%)
}

export interface TrafficAlert {
  id: string;
  code: string;
  incidentId?: string;
  junctionId?: string; // Explicit foreign key linking to CitizenJunctionSummary.id
  title: string;
  severity: AlertSeverity;
  category: 'ACCIDENT' | 'WATERLOGGING' | 'ROADWORK' | 'CONGESTION' | 'GREEN_CORRIDOR';
  location: string;
  coordinates: [number, number];
  description: string;
  timestamp: string; // ISO 8601 string
  estimatedDelayMinutes?: number;
  alternateRouteSuggested?: string;
  verifiedAdvisory: boolean;
  affectedLanes?: string;
}

export interface CitizenJunctionSummary {
  id: string;
  code: string;
  name: string;
  sector: string;
  location: [number, number];
  congestionPercent: number;
  severity: TrafficSeverity;
  trend: CongestionTrend;
  averageSpeedKmh: number;
  queueLengthMeters: number;
  vehicleCount: number;
  signalPhase: 'NORTH_SOUTH' | 'EAST_WEST' | 'LEFT_TURNS' | 'ALL_RED' | 'GREEN_CORRIDOR';
  signalTimerSeconds: number;
  sensorHealth: SensorHealth;
  activeAdvisory?: string;
  prediction?: TrafficPrediction;
  lastUpdated: string; // ISO 8601 string
}

export interface CitizenNotification {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS' | 'WARNING';
  timestamp: string;
  read: boolean;
  linkTab?: 'NAVIGATION' | 'PARKING' | 'REPORT' | 'SOS' | 'DASHBOARD';
}

export interface CityMobilityStatus {
  cityCongestionIndex: number;
  averageSpeedKmh: number;
  activeGreenCorridors: number;
  trafficStatus: 'NORMAL' | 'MODERATE' | 'HEAVY';
  activeSignalsCount: number;
  lastUpdated: string; // ISO 8601 string or dynamic time
  currentLocationName: string;
}

export interface CitizenDataQueryFilters {
  severity?: AlertSeverity | 'ALL';
  sector?: string;
  limit?: number;
}

// ==========================================
// 🅿️ SMART PARKING DOMAIN TYPES (PHASE 2D)
// ==========================================

export type ParkingSlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DISABLED';
export type ParkingSlotType = 'STANDARD' | 'EV_CHARGING' | 'ACCESSIBLE' | 'VIP_EMERGENCY';

export interface ParkingSlot {
  id: string;
  code: string; // e.g. "A1", "A2", "B4"
  row: string; // "A", "B", "C", "D"
  col: number; // 1, 2, 3, 4, 5, 6
  status: ParkingSlotStatus;
  type: ParkingSlotType;
  level: number; // 1 (Ground), 2 (Upper Deck)
  hourlyRate: number; // Tariff in INR (₹)
  features?: string[];
}

export interface ParkingFacility {
  id: string;
  name: string;
  code: string;
  address: string;
  distanceKm: number;
  distanceDisplay: string;
  coordinates: [number, number];
  dijkstraNodeId: string; // Linking to Dijkstra routing graph
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  disabledSlots: number;
  occupancyPercent: number;
  hourlyRateInr: number;
  operatingHours: string;
  evChargingAvailable: boolean;
  evSlotsAvailable: number;
  accessibleSlotsAvailable: number;
  levels: number;
  currentLevel: number;
  slots: ParkingSlot[];
}

