export type TwinMode = 'LIVE' | 'PREDICTION' | 'SIMULATION' | 'BUILD';

export type TrafficLevel = 'LOW' | 'MODERATE' | 'HEAVY' | 'CRITICAL' | 'BLOCKED';

export type RoadType = 'ARTERIAL' | 'EXPRESSWAY' | 'COLLECTOR' | 'LOCAL' | 'EMERGENCY_CORRIDOR';

export type RoadStatus = 'OPEN' | 'PARTIALLY_BLOCKED' | 'BLOCKED' | 'CONSTRUCTION' | 'GREEN_WAVE';

export interface RoadCoordinates {
  lat: number;
  lng: number;
}

export interface Road {
  id: string;
  code: string;
  name: string;
  type: RoadType;
  coordinates: [number, number][]; // Polyline coords [[lat, lng], ...]
  lengthKm: number;
  lanes: number;
  speedLimitKmh: number;
  currentSpeedKmh: number;
  capacityVehPerHour: number;
  currentVolumeVehPerHour: number;
  congestionPercent: number;
  trafficLevel: TrafficLevel;
  status: RoadStatus;
  fromJunctionId: string;
  toJunctionId: string;
  prediction15MinCongestion: number;
  prediction30MinCongestion: number;
  lastUpdated: string;
  isEmergencyCorridor?: boolean;
}

export interface Junction {
  id: string;
  code: string;
  name: string;
  sector: string;
  location: [number, number]; // [lat, lng]
  trafficFlowPercent: number;
  queueLengthMeters: number;
  averageSpeedKmh: number;
  currentSignalPhase: 'NORTH_SOUTH' | 'EAST_WEST' | 'LEFT_TURNS' | 'ALL_RED' | 'GREEN_CORRIDOR';
  signalTimerSeconds: number;
  cycleLengthSeconds: number;
  cctvOnline: boolean;
  cctvId?: string;
  activeIncidentsCount: number;
  congestionIndex: number;
  connectedRoadIds: string[];
}

export interface Hospital {
  id: string;
  code: string;
  name: string;
  location: [number, number]; // [lat, lng]
  address: string;
  emergencyStatus: 'OPERATIONAL' | 'HIGH_ALERT' | 'CRITICAL_CAPACITY' | 'DIVERTING';
  totalBeds: number;
  availableBeds: number;
  totalIcu: number;
  availableIcu: number;
  ventilatorsFree: number;
  oxygenBufferHours: number;
  capacityPercent: number;
  nearbyAmbulancesCount: number;
  averageEtaMinutes: number;
  traumaLevel: 'LEVEL_1_LEAD' | 'LEVEL_2' | 'COMMUNITY';
  contactPhone: string;
}

export type AmbulanceStatus = 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED' | 'RETURNING' | 'MAINTENANCE';

export interface Ambulance {
  id: string;
  unitCode: string;
  type: 'ADVANCED_LIFE_SUPPORT' | 'BASIC_LIFE_SUPPORT' | 'NEONATAL_ICU';
  status: AmbulanceStatus;
  location: [number, number]; // [lat, lng]
  speedKmh: number;
  heading: number; // 0 - 360 deg
  nearestJunction: string;
  assignedIncidentId?: string;
  assignedHospitalId?: string;
  destinationHospitalName?: string;
  etaMinutes: number;
  routeCoordinates?: [number, number][];
  routeJunctionSequence?: string[];
  paramedicLead: string;
  batteryOrFuelPercent: number;
  vitalsTelemetry?: {
    heartRateBpm: number;
    spO2Percent: number;
    bloodPressure: string;
    ecgStatus: string;
  };
}

export type CCTVEventTag = 
  | 'ACCIDENT_DETECTED' 
  | 'STOPPED_VEHICLE' 
  | 'ROAD_BLOCKAGE' 
  | 'TRAFFIC_CONGESTION' 
  | 'WRONG_WAY_VEHICLE' 
  | 'FIRE_OR_SMOKE' 
  | 'CROWD_FORMATION' 
  | 'NORMAL';

export interface CCTVCamera {
  id: string;
  code: string;
  name: string;
  location: [number, number]; // [lat, lng]
  junctionId?: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  azimuthHeading: number; // FOV direction
  fovAngle: number;
  vehiclesDetectedCount: number;
  pedestriansCount: number;
  trafficDensity: 'LOW' | 'MODERATE' | 'HIGH' | 'CONGESTED';
  aiDetectionActive: boolean;
  latestEvent: CCTVEventTag;
  detectionConfidence: number; // 0 - 100%
  sampleStreamUrl: string;
  lastSnapshotTime: string;
}

export type IncidentType = 
  | 'ACCIDENT' 
  | 'ROAD_CLOSURE' 
  | 'FIRE' 
  | 'FLOOD' 
  | 'MASS_GATHERING' 
  | 'MEDICAL_EMERGENCY';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Incident {
  id: string;
  code: string;
  title: string;
  type: IncidentType;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  junctionId?: string;
  roadId?: string;
  detectedBy: string; // e.g. "CCTV-142 (AI Vision)", "Citizen 112 SOS"
  severity: IncidentSeverity;
  status: 'DETECTED' | 'VERIFIED' | 'RESPONDING' | 'CONTAINED' | 'RESOLVED';
  timeReported: string;
  roadStatus: 'CLEAR' | 'PARTIALLY_BLOCKED' | 'COMPLETELY_BLOCKED';
  affectedVehiclesCount: number;
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  description: string;
}

export interface PoliceStation {
  id: string;
  name: string;
  location: [number, number];
  sector: string;
  patrolUnitsAvailable: number;
  officerInCharge: string;
}

export interface FireStation {
  id: string;
  name: string;
  location: [number, number];
  sector: string;
  tendersAvailable: number;
  hazmatReady: boolean;
}

export interface CityResilienceScore {
  overall: number; // 0 - 100
  trafficReadiness: number;
  emergencyReadiness: number;
  hospitalCapacityScore: number;
  infrastructureScore: number;
  activeIncidentsPenalty: number;
}

export interface PredictionState {
  timeHorizon: '+5m' | '+10m' | '+15m' | '+30m';
  cityAverageCongestion: number;
  predictedCongestionDelta: number;
  predictedEmergencyDelayMins: number;
  escalationRiskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  topCongestedRoads: { roadCode: string; name: string; current: number; predicted: number }[];
  hospitalStrainPercent: number;
}

export interface SimulationScenarioConfig {
  id: string;
  name: string;
  event: IncidentType;
  locationTarget: {
    type: 'JUNCTION' | 'ROAD';
    id: string;
    name: string;
  };
  severity: IncidentSeverity;
  durationMinutes: number;
  blockageExtent: 'PARTIAL' | 'COMPLETE';
}

export interface SimulationTimelineStep {
  timeLabel: string;
  timestampMinutes: number;
  eventTitle: string;
  description: string;
  trafficCongestion: number;
  activeAction?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  scenarioImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  expectedEtaImprovementPercent: number;
  expectedThroughputGainVehPerHr: number;
  affectedRoadsToClose: string[];
  diversionRoutes: { from: string; to: string; via: string }[];
  signalAdjustments: { junctionCode: string; deltaGreenSec: number }[];
  recommendedHospitalId: string;
  confidenceScore: string;
  reasoning: string;
}

export interface SimulationResult {
  scenarioConfig: SimulationScenarioConfig;
  normalState: {
    averageTrafficPercent: number;
    averageEtaMinutes: number;
    affectedRoadsCount: number;
    affectedHospitalsCount: number;
    cityResilience: number;
  };
  simulatedState: {
    averageTrafficPercent: number;
    averageEtaMinutes: number;
    affectedRoadsCount: number;
    affectedHospitalsCount: number;
    ambulanceDelayMinutes: number;
    cityResilience: number;
  };
  timeline: SimulationTimelineStep[];
  aiRecommendation: AIRecommendation;
  affectedRoadIds: string[];
  affectedJunctionIds: string[];
}

export type BuilderTool = 
  | 'NONE'
  | 'ADD_ROAD' 
  | 'ADD_JUNCTION' 
  | 'ADD_HOSPITAL' 
  | 'ADD_AMBULANCE' 
  | 'ADD_CCTV' 
  | 'ADD_POLICE' 
  | 'ADD_FIRE' 
  | 'ADD_INCIDENT';

export interface LayerVisibility {
  roads: boolean;
  traffic: boolean;
  junctions: boolean;
  cctv: boolean;
  hospitals: boolean;
  ambulances: boolean;
  police: boolean;
  fire: boolean;
  predictions: boolean;
  simulations: boolean;
}

export type SelectedEntity = 
  | { type: 'ROAD'; data: Road }
  | { type: 'JUNCTION'; data: Junction }
  | { type: 'HOSPITAL'; data: Hospital }
  | { type: 'AMBULANCE'; data: Ambulance }
  | { type: 'CCTV'; data: CCTVCamera }
  | { type: 'INCIDENT'; data: Incident }
  | null;
