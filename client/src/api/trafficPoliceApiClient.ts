import api from './authClient';

export interface PoliceJunctionSummaryDTO {
  junction_code: string;
  name: string;

  congestion_percent: number;
  severity: string;
  speed_kmh: number;
  signal_phase: string;
  signal_timer_sec: number;
}

export interface PoliceOverviewDTO {
  success: boolean;
  active_junctions_count: number;
  worsening_junctions_count: number;
  city_average_speed_kmh: number;
  system_status: string;
  monitored_junctions: PoliceJunctionSummaryDTO[];
  stats?: {
    activeJunctionsCount: number;
    worseningJunctionsCount: number;
    cityAverageSpeedKmh: number;
    systemStatus: string;
    congestionIndex?: number;
    activeGreenCorridors?: number;
  };

  junctions?: PoliceJunctionSummaryDTO[];
  dataSource?: string;
}


export interface SignalOverrideResponseDTO {
  success: boolean;
  junction_code: string;
  new_green_time_sec: number;
  mode: string;
  status: string;
  message: string;
  is_simulated: boolean;
  dataSource?: string;
}

export const DEMO_POLICE_OVERVIEW: PoliceOverviewDTO = {
  success: true,
  active_junctions_count: 14,
  worsening_junctions_count: 2,
  city_average_speed_kmh: 38.4,
  system_status: 'OPTIMAL_PATROL',
  stats: {
    activeJunctionsCount: 14,
    worseningJunctionsCount: 2,
    cityAverageSpeedKmh: 38.4,
    systemStatus: 'OPTIMAL_PATROL',
    congestionIndex: 44,
    activeGreenCorridors: 1,
  },

  monitored_junctions: [
    {
      junction_code: 'J14',
      name: 'Central Connaught Plaza Hub',
      congestion_percent: 78,
      severity: 'HEAVY',
      speed_kmh: 18.0,
      signal_phase: 'NORTH_SOUTH',
      signal_timer_sec: 32,
    },
    {
      junction_code: 'J15',
      name: 'Metro Ring Expressway Toll',
      congestion_percent: 54,
      severity: 'MODERATE',
      speed_kmh: 36.0,
      signal_phase: 'EAST_WEST',
      signal_timer_sec: 48,
    },
    {
      junction_code: 'J16',
      name: 'Hospital Trauma Corridor Gateway',
      congestion_percent: 26,
      severity: 'CLEAR',
      speed_kmh: 45.0,
      signal_phase: 'ALL_GREEN',
      signal_timer_sec: 60,
    },
  ],
  junctions: [
    {
      junction_code: 'J14',
      name: 'Central Connaught Plaza Hub',
      congestion_percent: 78,
      severity: 'HEAVY',
      speed_kmh: 18.0,
      signal_phase: 'NORTH_SOUTH',
      signal_timer_sec: 32,
    },
    {
      junction_code: 'J15',
      name: 'Metro Ring Expressway Toll',
      congestion_percent: 54,
      severity: 'MODERATE',
      speed_kmh: 36.0,
      signal_phase: 'EAST_WEST',
      signal_timer_sec: 48,
    },
  ],
  dataSource: 'DEMO_OFFLINE_FALLBACK',
};

export const trafficPoliceApiClient = {
  async getPoliceOverview(): Promise<PoliceOverviewDTO> {
    try {
      const res = await api.get('/api/v1/traffic-police/overview');
      const data = res.data;
      return {
        ...data,
        stats: {
          activeJunctionsCount: data.active_junctions_count || 14,
          worseningJunctionsCount: data.worsening_junctions_count || 2,
          cityAverageSpeedKmh: data.city_average_speed_kmh || 38.4,
          systemStatus: data.system_status || 'OPTIMAL_PATROL',
        },
        junctions: data.monitored_junctions || [],
        dataSource: 'FASTAPI_POSTGRES',
      };
    } catch (err) {
      console.warn('FastAPI unavailable, using DEMO_OFFLINE_FALLBACK for traffic police overview');
      return DEMO_POLICE_OVERVIEW;
    }
  },


  async applySignalOverride(junctionCode: string, newGreenTimeSec: number): Promise<SignalOverrideResponseDTO> {
    try {
      const res = await api.post('/api/v1/traffic-police/signal-override', {
        junctionCode,
        newGreenTimeSec,
        mode: 'MANUAL_OVERRIDE',
      });
      return {
        ...res.data,
        dataSource: 'FASTAPI_POSTGRES',
      };
    } catch (err) {
      console.warn('FastAPI unavailable, returning DEMO_OFFLINE_FALLBACK for signal override');
      return {
        success: true,
        junction_code: junctionCode,
        new_green_time_sec: newGreenTimeSec,
        mode: 'MANUAL_OVERRIDE',
        status: 'SIMULATED_OVERRIDE_ACTIVE',
        message: `Simulated green signal override of ${newGreenTimeSec}s applied to junction ${junctionCode} (DEMO / Offline Fallback).`,
        is_simulated: true,
        dataSource: 'DEMO_OFFLINE_FALLBACK',
      };
    }
  },
};
