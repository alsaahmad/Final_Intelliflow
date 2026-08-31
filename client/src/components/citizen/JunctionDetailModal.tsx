import React from 'react';
import { CitizenJunctionSummary } from '../../types/citizen';
import {
  X,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Car,
} from 'lucide-react';

interface JunctionDetailModalProps {
  junction: CitizenJunctionSummary | null;
  onClose: () => void;
  onNavigateToJunction?: (junctionId: string) => void;
}

export const JunctionDetailModal: React.FC<JunctionDetailModalProps> = ({
  junction,
  onClose,
  onNavigateToJunction,
}) => {
  if (!junction) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 relative text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 pr-8">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono font-black text-sm text-white shadow-sm flex-shrink-0 ${
              junction.signalPhase === 'GREEN_CORRIDOR'
                ? 'bg-emerald-600'
                : junction.congestionPercent > 70
                ? 'bg-rose-600'
                : junction.congestionPercent > 40
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          >
            {junction.code}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {junction.name}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{junction.sector}</p>
          </div>
        </div>

        {/* Advisory Banner if present */}
        {junction.activeAdvisory && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-[11px]">{junction.activeAdvisory}</span>
          </div>
        )}

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Congestion Flow */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Congestion Index</span>
            <div className="flex items-baseline space-x-1.5">
              <strong className="text-lg font-mono font-black text-slate-900">
                {junction.congestionPercent}%
              </strong>
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                  junction.congestionPercent > 70
                    ? 'bg-rose-100 text-rose-800'
                    : junction.congestionPercent > 40
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {junction.severity}
              </span>
            </div>
          </div>

          {/* Card 2: Average Speed & Vehicles */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Throughput & Volume</span>
            <div className="flex items-baseline space-x-1">
              <strong className="text-lg font-mono font-black text-blue-700">
                {junction.averageSpeedKmh}
              </strong>
              <span className="text-[10px] text-slate-500 font-mono">km/h</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
              <Car className="w-3 h-3 text-slate-400" />
              <span>{junction.vehicleCount} vehicles/hr</span>
            </span>
          </div>

          {/* Card 3: Signal Phase */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Signal Phase</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-xs font-bold text-slate-900 truncate">
                {junction.signalPhase}
              </strong>
            </div>
            <span className="text-[9px] font-mono text-slate-500 block">
              Timer: {junction.signalTimerSeconds}s left
            </span>
          </div>

          {/* Card 4: Queue Length & Sensing */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Queue & Sensing</span>
            <strong className="text-xs font-mono font-bold text-slate-900 block">
              {junction.queueLengthMeters}m Queue
            </strong>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sensing {junction.sensorHealth}</span>
            </span>
          </div>
        </div>

        {/* Demo Traffic Forecast Section */}
        {junction.prediction && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>15-min Forecast — Demo</span>
              </span>
              <span className="text-[10px] font-medium text-slate-600">
                Confidence: <strong className="text-blue-950 font-mono font-bold">{Math.round(junction.prediction.confidenceScore * 100)}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-bold block">CURRENT</span>
                <strong className="text-sm font-mono font-black text-slate-900">{junction.congestionPercent}%</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-bold block">+{junction.prediction.horizonMinutes} MIN FORECAST</span>
                <strong className="text-sm font-mono font-black text-blue-700">{junction.prediction.predictedCongestionPercent}%</strong>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[9px] text-slate-400 font-bold block">TREND</span>
                <span
                  className={`text-[9px] font-black uppercase inline-block mt-0.5 px-1.5 py-0.5 rounded ${
                    junction.trend === 'WORSENING'
                      ? 'bg-rose-100 text-rose-800'
                      : junction.trend === 'IMPROVING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {junction.trend}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            Close
          </button>

          {onNavigateToJunction && (
            <button
              onClick={() => {
                onNavigateToJunction(junction.id);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>NAVIGATE HERE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
