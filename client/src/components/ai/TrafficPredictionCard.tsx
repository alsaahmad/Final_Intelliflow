import React from 'react';
import { TrafficPredictionDTO } from '../../api/aiApiClient';
import { useTranslation } from '../../i18n/useTranslation';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Cpu } from 'lucide-react';

interface TrafficPredictionCardProps {
  prediction: TrafficPredictionDTO;
}

export const TrafficPredictionCard: React.FC<TrafficPredictionCardProps> = ({ prediction }) => {
  const { t } = useTranslation();
  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === 'INCREASING') return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (trend === 'DECREASING') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            {t('ai.predictionTitle', 'Traffic Prediction')} ({prediction.prediction_horizon_minutes} {t('ai.minHorizon', 'Min Horizon')})
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-300">
            {t('ai.engineLabel', 'AI Analytical Engine — Phase 4A')}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300">
            {t('ai.demoLabel', 'Simulated / Demo')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-slate-400 block">Target Junction</span>
          <span className="text-base font-bold text-slate-100">{prediction.junction_name}</span>
          <span className="text-xs font-mono text-slate-400 ml-2">({prediction.junction_code})</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeColor(prediction.risk_level)}`}>
          Risk: {prediction.risk_level}
        </div>
      </div>

      {prediction.is_insufficient_history && (
        <div className="mb-4 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center space-x-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Insufficient History ({prediction.telemetry_sample_count} samples, {prediction.time_span_minutes}m span) — Returning baseline forecast.</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/40">
          <span className="text-[11px] text-slate-400 block mb-1">Congestion</span>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-sm text-slate-400 line-through">{prediction.current_congestion_percent}%</span>
            <span className="text-lg font-bold text-slate-100">→ {prediction.predicted_congestion_percent}%</span>
          </div>
          <div className="flex items-center justify-center mt-1 space-x-1 text-xs">
            {renderTrendIcon(prediction.congestion_trend)}
            <span className="text-[10px] text-slate-300 font-mono">{prediction.congestion_trend}</span>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/40">
          <span className="text-[11px] text-slate-400 block mb-1">Predicted Speed</span>
          <span className="text-lg font-bold text-slate-100">{prediction.predicted_speed_kmh} <span className="text-xs font-normal text-slate-400">km/h</span></span>
          <span className="text-[10px] text-slate-400 block mt-1">Current: {prediction.current_speed_kmh} km/h</span>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/40">
          <span className="text-[11px] text-slate-400 block mb-1">Predicted Queue</span>
          <span className="text-lg font-bold text-slate-100">{prediction.predicted_queue_length_meters} <span className="text-xs font-normal text-slate-400">m</span></span>
          <span className="text-[10px] text-slate-400 block mt-1">Current: {prediction.current_queue_length_meters} m</span>
        </div>
      </div>
    </div>
  );
};
