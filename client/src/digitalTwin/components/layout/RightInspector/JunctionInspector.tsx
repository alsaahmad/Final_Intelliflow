import React from 'react';
import { Junction } from '../../../types';
import { useTwin } from '../../../context/TwinContext';
import { Video, AlertTriangle, Zap, Sliders, Activity, Clock } from 'lucide-react';

interface JunctionInspectorProps {
  junction: Junction;
}

export const JunctionInspector: React.FC<JunctionInspectorProps> = ({ junction }) => {
  const { optimizeSignal, cctvs, openCameraFeed, runScenario } = useTwin();

  const connectedCCTV = cctvs.find((c) => c.junctionId === junction.id || c.code === junction.cctvId);

  const handleSimulateJunction = () => {
    runScenario({
      id: `sc-jnc-${junction.code}`,
      name: `${junction.name} Gridlock Simulation`,
      event: 'ACCIDENT',
      locationTarget: {
        type: 'JUNCTION',
        id: junction.id,
        name: junction.name,
      },
      severity: 'HIGH',
      durationMinutes: 30,
      blockageExtent: 'COMPLETE',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            JUNCTION {junction.code}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              junction.congestionIndex > 75
                ? 'bg-rose-100 text-rose-800'
                : junction.congestionIndex > 50
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {junction.congestionIndex > 75 ? 'HEAVY CONGESTION' : junction.congestionIndex > 50 ? 'MODERATE' : 'OPTIMAL'}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{junction.name}</h3>
        <p className="text-xs text-slate-500 font-medium">{junction.sector}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Activity className="w-3 h-3 text-blue-500" />
            <span>Traffic Flow</span>
          </div>
          <div className="text-xl font-black text-slate-900">{junction.trafficFlowPercent}%</div>
          <span className="text-[10px] text-slate-500">Throughput Index</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Queue Length</span>
          </div>
          <div className="text-xl font-black text-slate-900">{junction.queueLengthMeters} m</div>
          <span className="text-[10px] text-slate-500">Backlog tail</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Average Speed</div>
          <div className="text-lg font-black text-slate-900">{junction.averageSpeedKmh} km/h</div>
          <span className="text-[10px] text-slate-500">Intersection crossing</span>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-0.5">
          <div className="text-[10px] text-indigo-700 font-bold uppercase flex items-center space-x-1">
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>Signal Timer</span>
          </div>
          <div className="text-lg font-black text-indigo-900 font-mono">{junction.signalTimerSeconds}s</div>
          <span className="text-[10px] text-indigo-700 font-medium">{junction.currentSignalPhase}</span>
        </div>
      </div>

      {/* CCTV & Incident Status Capsule */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">CCTV AI Surveillance:</span>
          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Active Incidents:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              junction.activeIncidentsCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {junction.activeIncidentsCount} Active
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">Junction Management Actions</div>

        <button
          onClick={() => optimizeSignal(junction.id, 15)}
          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Optimize Signal (+15s Green Wave)</span>
        </button>

        <button
          onClick={handleSimulateJunction}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>Simulate Junction Closure</span>
        </button>

        {connectedCCTV && (
          <button
            onClick={() => openCameraFeed(connectedCCTV)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <Video className="w-3.5 h-3.5 text-emerald-600" />
            <span>View CCTV Live AI Feed</span>
          </button>
        )}
      </div>
    </div>
  );
};
