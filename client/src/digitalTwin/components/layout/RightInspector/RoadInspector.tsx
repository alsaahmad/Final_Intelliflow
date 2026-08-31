import React from 'react';
import { Road } from '../../../types';
import { useTwin } from '../../../context/TwinContext';
import { Activity, Gauge, TrendingUp, Zap, CheckCircle2, XCircle } from 'lucide-react';

interface RoadInspectorProps {
  road: Road;
}

export const RoadInspector: React.FC<RoadInspectorProps> = ({ road }) => {
  const { toggleRoadBlock, simulateClosure, openAnalytics } = useTwin();

  const getStatusBadge = () => {
    switch (road.status) {
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase">BLOCKED</span>;
      case 'PARTIALLY_BLOCKED':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">PARTIALLY BLOCKED</span>;
      case 'GREEN_WAVE':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">GREEN WAVE ACTIVE</span>;
      case 'OPEN':
      default:
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">OPEN / FLOWING</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            ROAD {road.code}
          </span>
          {getStatusBadge()}
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{road.name}</h3>
        <p className="text-xs text-slate-500 font-medium">Type: {road.type} • {road.lanes} Active Lanes</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Activity className="w-3 h-3 text-blue-500" />
            <span>Congestion</span>
          </div>
          <div className={`text-xl font-black ${road.congestionPercent > 75 ? 'text-rose-600' : 'text-slate-900'}`}>
            {road.congestionPercent}%
          </div>
          <span className="text-[10px] text-slate-500">{road.trafficLevel} Volume</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Gauge className="w-3 h-3 text-emerald-500" />
            <span>Current Speed</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {road.currentSpeedKmh} <span className="text-xs font-semibold text-slate-500">km/h</span>
          </div>
          <span className="text-[10px] text-slate-500">Limit: {road.speedLimitKmh} km/h</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Length</div>
          <div className="text-lg font-black text-slate-900">{road.lengthKm} km</div>
          <span className="text-[10px] text-slate-500">{road.lanes} Lanes Arterial</span>
        </div>

        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-0.5">
          <div className="text-[10px] text-purple-700 font-bold uppercase flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-purple-600" />
            <span>AI Prediction</span>
          </div>
          <div className="text-lg font-black text-purple-900">{road.prediction15MinCongestion}%</div>
          <span className="text-[10px] text-purple-700 font-medium">In 15 minutes</span>
        </div>
      </div>

      {/* Hourly Flow Capacity */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1 text-xs">
        <div className="flex justify-between text-slate-600 font-medium text-[11px]">
          <span>Vehicle Density:</span>
          <strong>{road.currentVolumeVehPerHour} / {road.capacityVehPerHour} veh/hr</strong>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              road.congestionPercent > 75 ? 'bg-rose-500' : road.congestionPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, road.congestionPercent)}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">Available Operational Actions</div>

        <button
          onClick={openAnalytics}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>View Road Flow Analytics</span>
        </button>

        <button
          onClick={() => simulateClosure(road.id)}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>Simulate What-If Closure</span>
        </button>

        <button
          onClick={() => toggleRoadBlock(road.id)}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 ${
            road.status === 'BLOCKED'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
          }`}
        >
          {road.status === 'BLOCKED' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Road OPEN</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark Road BLOCKED</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
