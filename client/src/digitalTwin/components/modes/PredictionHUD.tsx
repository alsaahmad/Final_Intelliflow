import React from 'react';
import { useTwin } from '../../context/TwinContext';
import { TrendingUp, AlertTriangle, Clock, Activity } from 'lucide-react';

export const PredictionHUD: React.FC = () => {
  const { mode, predictionHorizon, setPredictionHorizon, roads } = useTwin();

  if (mode !== 'PREDICTION') return null;

  const horizons: ('+5m' | '+10m' | '+15m' | '+30m')[] = ['+5m', '+10m', '+15m', '+30m'];

  // Prediction calculations
  const avgPredCongestion = Math.round(
    roads.reduce((acc, r) => {
      const pred = predictionHorizon === '+30m' ? r.prediction30MinCongestion : r.prediction15MinCongestion;
      return acc + pred;
    }, 0) / (roads.length || 1)
  );

  const congestedCount = roads.filter((r) => {
    const pred = predictionHorizon === '+30m' ? r.prediction30MinCongestion : r.prediction15MinCongestion;
    return pred > 75;
  }).length;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[350] max-w-xl w-full px-4 select-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-blue-200/90 shadow-2xl p-4 space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xs text-slate-900">AI Predictive Horizon</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-black uppercase">
                  FORECAST ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Neural graph multi-horizon congestion & bottleneck prediction
              </p>
            </div>
          </div>

          {/* Time Horizon Selector Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            {horizons.map((h) => (
              <button
                key={h}
                onClick={() => setPredictionHorizon(h)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black transition-all ${
                  predictionHorizon === h
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Prediction Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
              <Activity className="w-3 h-3 text-blue-500" />
              <span>Forecast Congestion</span>
            </div>
            <div className="text-xl font-black text-rose-600">{avgPredCongestion}%</div>
            <span className="text-[10px] text-slate-500">Arterial network average</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Bottleneck Corridors</span>
            </div>
            <div className="text-xl font-black text-amber-600">{congestedCount} Roads</div>
            <span className="text-[10px] text-slate-500">&gt; 75% Congestion risk</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Emergency Delay Risk</span>
            </div>
            <div className="text-xl font-black text-indigo-600">+4.8 mins</div>
            <span className="text-[10px] text-slate-500">Without intervention</span>
          </div>
        </div>
      </div>
    </div>
  );
};
