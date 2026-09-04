import api from './authClient';

export interface FactorContributionDTO {
  factor_name: string;
  impact: string;
  weight_percent: number;
  measured_value: string;
  description: string;
}

export interface TrafficPredictionDTO {
  junction_code: string;
  junction_name: string;
  current_congestion_percent: number;
  predicted_congestion_percent: number;
  current_speed_kmh: number;
  predicted_speed_kmh: number;
  current_queue_length_meters: number;
  predicted_queue_length_meters: number;
  prediction_horizon_minutes: number;
  congestion_trend: string;
  risk_level: string;
  telemetry_sample_count: number;
  time_span_minutes: number;
  is_insufficient_history: boolean;
  is_simulated: boolean;
  dataSource: string;
  data_origin: string;
}

export interface JunctionPredictionDetailDTO {
  prediction: TrafficPredictionDTO;
  analytical_factor_contributions: FactorContributionDTO[];
}

export interface WhatIfResponseDTO {
  junction_code: string;
  current_green_time_sec: number;
  simulated_green_time_sec: number;
  delta_green_time_sec: number;
  current_congestion_percent: number;
  predicted_congestion_percent: number;
  estimated_queue_change_meters: number;
  estimated_delay_change_sec: number;
  estimated_throughput_change_percent: number;
  summary_advisory: string;
  is_simulated: boolean;
  dataSource: string;
}

export const DEMO_PREDICTIONS: TrafficPredictionDTO[] = [
  {
    junction_code: 'J14',
    junction_name: 'Central Connaught Plaza Hub',
    current_congestion_percent: 78,
    predicted_congestion_percent: 84,
    current_speed_kmh: 18.0,
    predicted_speed_kmh: 15.5,
    current_queue_length_meters: 110.0,
    predicted_queue_length_meters: 125.0,
    prediction_horizon_minutes: 15,
    congestion_trend: 'INCREASING',
    risk_level: 'HIGH',
    telemetry_sample_count: 12,
    time_span_minutes: 25.0,
    is_insufficient_history: false,
    is_simulated: true,
    dataSource: 'DEMO_OFFLINE_FALLBACK',
    data_origin: 'FASTAPI_AI_ENGINE',
  },
  {
    junction_code: 'J15',
    junction_name: 'Metro Ring Expressway Toll',
    current_congestion_percent: 54,
    predicted_congestion_percent: 52,
    current_speed_kmh: 36.0,
    predicted_speed_kmh: 37.5,
    current_queue_length_meters: 45.0,
    predicted_queue_length_meters: 42.0,
    prediction_horizon_minutes: 15,
    congestion_trend: 'STABLE',
    risk_level: 'MODERATE',
    telemetry_sample_count: 10,
    time_span_minutes: 20.0,
    is_insufficient_history: false,
    is_simulated: true,
    dataSource: 'DEMO_OFFLINE_FALLBACK',
    data_origin: 'FASTAPI_AI_ENGINE',
  },
];

export const aiApiClient = {
  /**
   * Fetch short-term predictions for monitored junctions from FastAPI backend
   */
  async getPredictions(sector?: string, horizonMinutes: number = 15): Promise<TrafficPredictionDTO[]> {
    try {
      const res = await api.get<TrafficPredictionDTO[]>('/api/v1/ai/predictions', {
        params: { sector, horizon_minutes: horizonMinutes },
      });
      return res.data;
    } catch (err) {
      console.warn('FastAPI AI predictions unavailable, using DEMO_OFFLINE_FALLBACK');
      return DEMO_PREDICTIONS;
    }
  },

  /**
   * Fetch combined prediction and analytical factor explanation for a specific junction
   */
  async getJunctionPredictionDetail(
    junctionCode: string,
    horizonMinutes: number = 15
  ): Promise<JunctionPredictionDetailDTO> {
    try {
      const res = await api.get<JunctionPredictionDetailDTO>(`/api/v1/ai/predictions/${junctionCode}`, {
        params: { horizon_minutes: horizonMinutes },
      });
      return res.data;
    } catch (err) {
      console.warn('FastAPI AI detail unavailable, using DEMO_OFFLINE_FALLBACK');
      return {
        prediction: DEMO_PREDICTIONS[0],
        analytical_factor_contributions: [
          {
            factor_name: 'Traffic Volume Demand',
            impact: 'HIGH',
            weight_percent: 38.5,
            measured_value: '340 vehicles',
            description: 'Vehicle count of 340 exceeds nominal 300 capacity threshold.',
          },
          {
            factor_name: 'Congestion Growth Rate',
            impact: 'INCREASING',
            weight_percent: 24.2,
            measured_value: '+1.20 %/step',
            description: 'Rate of congestion change per observation step is +1.20%.',
          },
          {
            factor_name: 'Road Speed Degradation',
            impact: 'HIGH',
            weight_percent: 22.1,
            measured_value: '18.0 km/h',
            description: 'Average travel speed of 18.0 km/h against free-flow 40.0 km/h baseline.',
          },
          {
            factor_name: 'Signal Allocation vs Demand',
            impact: 'RESTRICTIVE',
            weight_percent: 15.2,
            measured_value: '32s / 90s cycle',
            description: 'Green time allocation (32s) relative to current 78% congestion demand.',
          },
        ],
      };
    }
  },

  /**
   * Run transient What-If comparative signal timing simulation
   */
  async simulateWhatIf(junctionCode: string, deltaGreenTimeSec: number): Promise<WhatIfResponseDTO> {
    try {
      const res = await api.post<WhatIfResponseDTO>('/api/v1/ai/simulate', {
        junction_code: junctionCode,
        delta_green_time_sec: deltaGreenTimeSec,
      });
      return res.data;
    } catch (err) {
      console.warn('FastAPI What-If simulator unavailable, returning DEMO_OFFLINE_FALLBACK');
      const simulatedGreen = 45 + deltaGreenTimeSec;
      const deltaC = Math.round(-0.35 * (deltaGreenTimeSec / 45.0) * 78.0 * 10) / 10;
      const deltaD = Math.round(-0.60 * deltaGreenTimeSec * 0.78 * 10) / 10;
      const deltaT = Math.round(0.30 * (deltaGreenTimeSec / 45.0) * 100.0 * 10) / 10;

      return {
        junction_code: junctionCode,
        current_green_time_sec: 45,
        simulated_green_time_sec: simulatedGreen,
        delta_green_time_sec: deltaGreenTimeSec,
        current_congestion_percent: 78,
        predicted_congestion_percent: Math.max(5, Math.min(95, 78 + Math.round(deltaC))),
        estimated_queue_change_meters: -12.5,
        estimated_delay_change_sec: deltaD,
        estimated_throughput_change_percent: deltaT,
        summary_advisory: `Adding ${deltaGreenTimeSec}s green time is estimated to reduce congestion by ${Math.abs(deltaC)} percentage points.`,
        is_simulated: true,
        dataSource: 'DEMO_OFFLINE_FALLBACK',
      };
    }
  },

  /**
   * Fetch AI signal recommendations for all monitored junctions
   */
  async getRecommendations(sector?: string): Promise<RecommendationDTO[]> {
    try {
      const res = await api.get<RecommendationDTO[]>('/api/v1/ai/recommendations', {
        params: { sector },
      });
      return res.data;
    } catch (err) {
      console.warn('FastAPI recommendations endpoint unavailable, returning DEMO_OFFLINE_FALLBACK');
      return [
        {
          junction_code: 'J14',
          junction_name: 'Central Connaught Plaza Hub',
          current_green_time_sec: 45,
          proposed_green_time_sec: 65,
          recommended_action: 'INCREASE_GREEN_TIME',
          green_time_delta_sec: 20,
          estimated_delay_change_sec: -9.4,
          estimated_congestion_change_percent: -4.2,
          estimated_queue_change_meters: -14.2,
          estimated_throughput_change_percent: 4.5,
          benefit_score: 25.1,
          analytical_rationale: 'High congestion (78%) with high volume demand warrants green time increase of +20s.',
          safety_constraints: ['Green time within bounds (10s - 120s)', 'Cycle min green respected'],
          is_insufficient_history: false,
          is_simulated: true,
          dataSource: 'DEMO_OFFLINE_FALLBACK',
        },
      ];
    }
  },

  /**
   * Fetch detailed AI signal recommendation for a specific junction
   */
  async getRecommendationDetail(junctionCode: string): Promise<RecommendationDetailDTO> {
    try {
      const res = await api.get<RecommendationDetailDTO>(`/api/v1/ai/recommendations/${junctionCode}`);
      return res.data;
    } catch (err) {
      console.warn('FastAPI recommendation detail unavailable, returning DEMO_OFFLINE_FALLBACK');
      return {
        recommendation: {
          junction_code: junctionCode,
          junction_name: junctionCode === 'J14' ? 'Central Connaught Plaza Hub' : `Junction ${junctionCode}`,
          current_green_time_sec: 45,
          proposed_green_time_sec: 65,
          recommended_action: 'INCREASE_GREEN_TIME',
          green_time_delta_sec: 20,
          estimated_delay_change_sec: -9.4,
          estimated_congestion_change_percent: -4.2,
          estimated_queue_change_meters: -14.2,
          estimated_throughput_change_percent: 4.5,
          benefit_score: 25.1,
          analytical_rationale: 'High congestion (78%) with high volume demand warrants green time increase of +20s.',
          safety_constraints: ['Green time within bounds (10s - 120s)', 'Cycle min green respected'],
          is_insufficient_history: false,
          is_simulated: true,
          dataSource: 'DEMO_OFFLINE_FALLBACK',
        },
        prediction: DEMO_PREDICTIONS[0],
        analytical_factor_contributions: [
          {
            factor_name: 'Traffic Volume Demand',
            impact: 'HIGH',
            weight_percent: 38.5,
            measured_value: '340 vehicles',
            description: 'Vehicle count of 340 exceeds nominal 300 capacity threshold.',
          },
        ],
      };
    }
  },

  /**
   * Execute server-authoritative simulated traffic action (Traffic Police ONLY)
   */
  async executeSimulatedAct(junctionCode: string, requestedAction: string): Promise<SimulatedActResponseDTO> {
    const res = await api.post<SimulatedActResponseDTO>('/api/v1/ai/act', {
      junction_code: junctionCode,
      requested_action: requestedAction,
    });
    return res.data;
  },
};

export interface RecommendationDTO {
  junction_code: string;
  junction_name: string;
  current_green_time_sec: number;
  proposed_green_time_sec: number;
  recommended_action: string;
  green_time_delta_sec: number;
  estimated_delay_change_sec: number;
  estimated_congestion_change_percent: number;
  estimated_queue_change_meters: number;
  estimated_throughput_change_percent: number;
  benefit_score: number;
  analytical_rationale: string;
  safety_constraints: string[];
  is_insufficient_history: boolean;
  is_simulated: boolean;
  dataSource: string;
}

export interface RecommendationDetailDTO {
  recommendation: RecommendationDTO;
  prediction: TrafficPredictionDTO;
  analytical_factor_contributions: FactorContributionDTO[];
}

export interface SimulatedActRequestDTO {
  junction_code: string;
  requested_action: string;
}

export interface SimulatedActResponseDTO {
  success: boolean;
  action_id: string;
  junction_code: string;
  requested_action: string;
  applied_green_time_sec: number;
  applied_delta_sec: number;
  previous_green_time_sec: number;
  server_generated_rationale: string;
  audit_log_id: number | null;
  timestamp: string;
  is_simulated: boolean;
  dataSource: string;
}

export default aiApiClient;
