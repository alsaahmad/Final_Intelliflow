import React from 'react';
import { Ambulance } from '../../../types';
import { useTwin } from '../../../context/TwinContext';
import { HeartPulse, Activity, Zap, Navigation, BatteryCharging, Gauge } from 'lucide-react';

interface AmbulanceInspectorProps {
  ambulance: Ambulance;
}

export const AmbulanceInspector: React.FC<AmbulanceInspectorProps> = ({ ambulance }) => {
  const { showToast } = useTwin();

  const getStatusColor = () => {
    switch (ambulance.status) {
      case 'EN_ROUTE':
      case 'DISPATCHED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ARRIVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'AVAILABLE':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const handleActivateCorridor = () => {
    showToast(`✓ Priority Green Corridor activated for ${ambulance.unitCode}! Signal preemption synchronized.`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            AMBULANCE {ambulance.unitCode}
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusColor()}`}>
            {ambulance.status}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{ambulance.paramedicLead}</h3>
        <p className="text-xs text-slate-500 font-medium">Type: {ambulance.type.replace(/_/g, ' ')}</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Gauge className="w-3 h-3 text-blue-500" />
            <span>Speed</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {ambulance.speedKmh} <span className="text-xs font-semibold text-slate-500">km/h</span>
          </div>
          <span className="text-[10px] text-slate-500">Heading: {ambulance.heading}°</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <HeartPulse className="w-3 h-3 text-rose-500" />
            <span>Hospital ETA</span>
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">{ambulance.etaMinutes} mins</div>
          <span className="text-[10px] text-slate-500">To Destination</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Nearest Node</div>
          <div className="text-xs font-bold text-slate-900 truncate">{ambulance.nearestJunction}</div>
          <span className="text-[10px] text-slate-500">Grid Sector A</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <BatteryCharging className="w-3 h-3 text-emerald-500" />
            <span>EV / Fuel</span>
          </div>
          <div className="text-lg font-black text-emerald-600">{ambulance.batteryOrFuelPercent}%</div>
          <span className="text-[10px] text-slate-500">Operational</span>
        </div>
      </div>

      {/* Assigned Route Sequence */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs">
        <div className="font-bold text-blue-900 flex items-center space-x-1.5">
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Transit Corridor Sequence:</span>
        </div>
        <div className="font-mono text-[11px] font-bold text-blue-800 bg-white p-2 rounded-lg border border-blue-200">
          {ambulance.routeJunctionSequence?.join(' ➔ ') || 'J14 ➔ R105 ➔ R108 ➔ H01'}
        </div>
        <div className="text-[11px] text-slate-600">
          Destination: <strong>{ambulance.destinationHospitalName || 'City General Trauma Center'}</strong>
        </div>
      </div>

      {/* Live Bio-Telemetry Stream */}
      {ambulance.vitalsTelemetry && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-slate-900 flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>In-Transit Patient Bio-Telemetry</span>
            </span>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              LIVE ECG
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[9px] text-slate-500 font-bold">HEART RATE</div>
              <div className="font-black text-rose-600 text-sm">{ambulance.vitalsTelemetry.heartRateBpm} BPM</div>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[9px] text-slate-500 font-bold">SpO2</div>
              <div className="font-black text-emerald-600 text-sm">{ambulance.vitalsTelemetry.spO2Percent}%</div>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[9px] text-slate-500 font-bold">BLOOD PRESS.</div>
              <div className="font-black text-slate-900 text-xs mt-0.5">{ambulance.vitalsTelemetry.bloodPressure}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">Emergency Dispatch Actions</div>

        <button
          onClick={handleActivateCorridor}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Activate Green Wave Corridor</span>
        </button>

        <button
          onClick={() => showToast(`Live GPS tracking beacon locked on ${ambulance.unitCode}.`, 'info')}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>Track Ambulance Live Path</span>
        </button>
      </div>
    </div>
  );
};
