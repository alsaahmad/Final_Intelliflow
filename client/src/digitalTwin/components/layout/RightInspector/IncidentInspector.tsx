import React from 'react';
import { Incident } from '../../../types';
import { useTwin } from '../../../context/TwinContext';
import { AlertTriangle, PhoneCall, HeartPulse, Zap, Clock } from 'lucide-react';

interface IncidentInspectorProps {
  incident: Incident;
}

export const IncidentInspector: React.FC<IncidentInspectorProps> = ({ incident }) => {
  const { dispatchAmbulance, runScenario, showToast } = useTwin();

  const handleDispatch = () => {
    dispatchAmbulance(incident.id);
  };

  const handleSimulateImpact = () => {
    runScenario({
      id: `sc-${incident.code}`,
      name: `Impact Simulation: ${incident.title}`,
      event: incident.type,
      locationTarget: {
        type: 'JUNCTION',
        id: incident.junctionId || 'j-14',
        name: incident.locationName,
      },
      severity: incident.severity,
      durationMinutes: 30,
      blockageExtent: incident.roadStatus === 'COMPLETELY_BLOCKED' ? 'COMPLETE' : 'PARTIAL',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            {incident.code}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
              incident.severity === 'CRITICAL' || incident.severity === 'HIGH'
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {incident.severity} SEVERITY
          </span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{incident.title}</h3>
        <p className="text-xs text-slate-500 font-medium">{incident.locationName}</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>Reported At</span>
          </div>
          <div className="text-lg font-black text-slate-900">{incident.timeReported}</div>
          <span className="text-[10px] text-slate-500">{incident.status}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Road Status</span>
          </div>
          <div className="text-xs font-black text-rose-600 truncate">{incident.roadStatus.replace(/_/g, ' ')}</div>
          <span className="text-[10px] text-slate-500">Flow compromised</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Detected By</div>
          <div className="text-xs font-bold text-slate-900 truncate">{incident.detectedBy}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">AI Automated</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Affected Vehicles</div>
          <div className="text-lg font-black text-slate-900">{incident.affectedVehiclesCount}</div>
          <span className="text-[10px] text-slate-500">Inbound queue</span>
        </div>
      </div>

      {/* Incident Description */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase">Telemetry Summary:</div>
        <p className="text-slate-700 leading-relaxed font-medium">{incident.description}</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">Emergency Tactical Actions</div>

        <button
          onClick={handleDispatch}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Dispatch Nearest Ambulance</span>
        </button>

        <button
          onClick={handleSimulateImpact}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>Simulate What-If Network Impact</span>
        </button>

        <button
          onClick={() => showToast('Nearest trauma bay ICU capacity confirmed with City General.', 'success')}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
          <span>Find Best Hospital & Trauma Bed</span>
        </button>
      </div>
    </div>
  );
};
