import React from 'react';
import { Hospital } from '../../../types';
import { useTwin } from '../../../context/TwinContext';
import { HeartPulse, Bed, Activity, PhoneCall, Navigation, Clock } from 'lucide-react';

interface HospitalInspectorProps {
  hospital: Hospital;
}

export const HospitalInspector: React.FC<HospitalInspectorProps> = ({ hospital }) => {
  const { dispatchAmbulance, incidents, showToast } = useTwin();

  const handleDispatchToHospital = () => {
    const targetIncident = incidents[0];
    if (targetIncident) {
      dispatchAmbulance(targetIncident.id, undefined, hospital.id);
    } else {
      showToast(`Nearest available ambulance routed to ${hospital.name}.`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            HOSPITAL {hospital.code}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
            {hospital.emergencyStatus}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{hospital.name}</h3>
        <p className="text-xs text-slate-500 font-medium">{hospital.address}</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <HeartPulse className="w-3 h-3 text-emerald-500" />
            <span>Capacity</span>
          </div>
          <div className="text-xl font-black text-slate-900">{hospital.capacityPercent}%</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Trauma Ready</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>Average ETA</span>
          </div>
          <div className="text-xl font-black text-slate-900">{hospital.averageEtaMinutes} mins</div>
          <span className="text-[10px] text-slate-500">From Central Core</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Bed className="w-3 h-3 text-indigo-500" />
            <span>Emergency Beds</span>
          </div>
          <div className="text-lg font-black text-emerald-600">
            {hospital.availableBeds} <span className="text-xs font-semibold text-slate-400">/ {hospital.totalBeds}</span>
          </div>
          <span className="text-[10px] text-slate-500">Available</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Activity className="w-3 h-3 text-rose-500" />
            <span>ICU Beds</span>
          </div>
          <div className="text-lg font-black text-rose-600">
            {hospital.availableIcu} <span className="text-xs font-semibold text-slate-400">/ {hospital.totalIcu}</span>
          </div>
          <span className="text-[10px] text-slate-500">Ventilator ready: {hospital.ventilatorsFree}</span>
        </div>
      </div>

      {/* Oxygen Buffer & Ambulance Fleet */}
      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1 text-xs">
        <div className="flex justify-between items-center text-emerald-900 font-medium">
          <span>Oxygen Buffer Reserve:</span>
          <strong>{hospital.oxygenBufferHours} Hours Guaranteed</strong>
        </div>
        <div className="flex justify-between items-center text-emerald-800 text-[11px]">
          <span>Nearby Fleet Units:</span>
          <strong>{hospital.nearbyAmbulancesCount} EMS Ambulances in Sector</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">Hospital Medical Actions</div>

        <button
          onClick={handleDispatchToHospital}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Dispatch Ambulance Unit to Hospital</span>
        </button>

        <button
          onClick={() => showToast(`Optimal green wave route to ${hospital.name} locked on telemetry.`, 'info')}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>Find Best Emergency Route</span>
        </button>
      </div>
    </div>
  );
};
