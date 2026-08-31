import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CityMobilityStatus } from '../../types/citizen';
import { formatTimeAgo } from '../../services/citizenService';
import {
  MapPin,
  Sparkles,
  Zap,
  Gauge,
  HeartPulse,
  RefreshCw,
} from 'lucide-react';

interface CitizenGreetingProps {
  status: CityMobilityStatus;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const CitizenGreeting: React.FC<CitizenGreetingProps> = ({
  status,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user } = useAuth();

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  return (
    <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-7 shadow-lg relative overflow-hidden">
      {/* Subtle geometric glowing backdrop elements */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Left Side: Greeting, Civic Mobility Message, Location */}
        <div className="space-y-2.5 max-w-2xl">
          {/* Location Badge & Subtle Refresh Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-100 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <MapPin className="w-3.5 h-3.5 text-blue-300" />
              <span className="font-semibold">{status.currentLocationName}</span>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all border border-white/15 text-xs text-blue-100 font-medium cursor-pointer"
                title="Refresh traffic intelligence feed"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-300' : 'text-blue-300'}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Traffic'}</span>
              </button>
            )}

            <span className="text-[11px] text-blue-200/75 font-medium ml-1">
              Updated {formatTimeAgo(status.lastUpdated)}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{getGreeting()}, {user?.name?.split(' ')[0] || 'Rahul'}</span>
            <Sparkles className="w-5 h-5 text-amber-300 hidden sm:inline" />
          </h1>

          {/* Civic mobility statement */}
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Metropolitan corridors are operating with <strong className="text-white font-semibold">normal flow ({status.cityCongestionIndex}% index)</strong>. {status.activeGreenCorridors > 0 ? `${status.activeGreenCorridors} active Green Wave priority corridor in progress for emergency units.` : 'No critical gridlocks detected in your sector.'}
          </p>
        </div>

        {/* Right Side: Quick Telemetry Chips */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Chip 1: Congestion */}
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-[10px] text-blue-200 uppercase font-bold tracking-wider mb-0.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Grid Flow</span>
            </div>
            <strong className="text-lg sm:text-xl font-mono font-black text-white">
              {status.cityCongestionIndex}%
            </strong>
            <span className="text-[9px] text-emerald-300 font-bold">Optimal Flow</span>
          </div>

          {/* Chip 2: Speed */}
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-[10px] text-blue-200 uppercase font-bold tracking-wider mb-0.5">
              <Gauge className="w-3 h-3 text-blue-300" />
              <span>Avg Speed</span>
            </div>
            <strong className="text-lg sm:text-xl font-mono font-black text-white">
              {status.averageSpeedKmh}
            </strong>
            <span className="text-[9px] text-slate-300 font-mono">km/h</span>
          </div>

          {/* Chip 3: Emergency Corridor */}
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center flex flex-col items-center justify-center">
            <div className="flex items-center space-x-1 text-[10px] text-rose-200 uppercase font-bold tracking-wider mb-0.5">
              <HeartPulse className="w-3 h-3 text-rose-400" />
              <span>Green Wave</span>
            </div>
            <strong className="text-lg sm:text-xl font-mono font-black text-rose-300">
              {status.activeGreenCorridors}
            </strong>
            <span className="text-[9px] text-rose-300 font-bold">Hospital Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};
