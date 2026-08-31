import React from 'react';
import { useTwin } from '../../context/TwinContext';
import {
  Activity,
  HeartPulse,
  PhoneCall,
  Video,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export const BottomStatusBar: React.FC = () => {
  const {
    mode,
    roads,
    incidents,
    ambulances,
    hospitals,
    cctvs,
    resilienceScore,
    openAnalytics,
  } = useTwin();

  // Average city traffic congestion
  const avgTraffic = Math.round(
    roads.reduce((acc, r) => acc + r.congestionPercent, 0) / (roads.length || 1)
  );

  const activeIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const availableAmbulancesCount = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const onlineCctvCount = cctvs.filter((c) => c.status === 'ONLINE').length;

  return (
    <footer className="h-12 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 sm:px-6 flex items-center justify-between text-xs z-30 shadow-md">
      {/* Left: Mode Status Pill & City Stats */}
      <div className="flex items-center space-x-4 sm:space-x-6 overflow-x-auto py-1">
        {/* Live / Mode Indicator */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              mode === 'LIVE'
                ? 'bg-emerald-500 animate-pulse'
                : mode === 'PREDICTION'
                ? 'bg-blue-500'
                : mode === 'SIMULATION'
                ? 'bg-purple-600 animate-ping'
                : 'bg-amber-500'
            }`}
          />
          <span className="font-mono font-black text-slate-900 uppercase tracking-wider text-[11px]">
            ● {mode}
          </span>
        </div>

        {/* 1. Traffic Congestion */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500 font-medium">Traffic:</span>
          <span
            className={`font-mono font-black ${
              avgTraffic > 75 ? 'text-rose-600' : avgTraffic > 50 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {avgTraffic}%
          </span>
        </div>

        {/* 2. Active Incidents */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-slate-500 font-medium">Incidents:</span>
          <span className="font-mono font-black text-slate-900">{activeIncidentsCount}</span>
        </div>

        {/* 3. Ambulances */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-500 font-medium">Ambulances:</span>
          <span className="font-mono font-black text-slate-900">
            {availableAmbulancesCount} / {ambulances.length}
          </span>
        </div>

        {/* 4. Hospitals */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500 font-medium">Hospitals:</span>
          <span className="font-mono font-black text-slate-900">{hospitals.length} Active</span>
        </div>

        {/* 5. CCTV Feeds */}
        <div className="hidden md:flex items-center space-x-1.5 flex-shrink-0">
          <Video className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500 font-medium">CCTV:</span>
          <span className="font-mono font-black text-slate-900">
            {onlineCctvCount} / {cctvs.length}
          </span>
        </div>
      </div>

      {/* Right: City Resilience Score Capsule */}
      <div
        onClick={openAnalytics}
        className="flex items-center space-x-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0 select-none"
        title="Click to view detailed Resilience & Capacity breakdown"
      >
        <div className="hidden lg:flex items-center space-x-2 text-[10px] font-bold text-slate-500">
          <span>Traffic {resilienceScore.trafficReadiness}%</span>
          <span>•</span>
          <span>Emergency {resilienceScore.emergencyReadiness}%</span>
          <span>•</span>
          <span>Hospital {resilienceScore.hospitalCapacityScore}%</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 text-white shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Resilience:</span>
          <span className="font-mono font-black text-emerald-400 text-xs">{resilienceScore.overall} / 100</span>
        </div>
      </div>
    </footer>
  );
};
