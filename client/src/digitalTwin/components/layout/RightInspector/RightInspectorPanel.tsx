import React from 'react';
import { useTwin } from '../../../context/TwinContext';
import { RoadInspector } from './RoadInspector';
import { JunctionInspector } from './JunctionInspector';
import { HospitalInspector } from './HospitalInspector';
import { AmbulanceInspector } from './AmbulanceInspector';
import { CCTVInspector } from './CCTVInspector';
import { IncidentInspector } from './IncidentInspector';
import { X, Layers, MousePointerClick, ShieldCheck, HeartPulse, Activity, Car } from 'lucide-react';

export const RightInspectorPanel: React.FC = () => {
  const { selectedEntity, setSelectedEntity, roads, junctions, ambulances, resilienceScore, openAnalytics } = useTwin();

  if (!selectedEntity) {
    return (
      <aside className="w-80 xl:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-sm flex flex-col justify-between p-5 space-y-6 z-20 select-none overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Object Inspector</h2>
              <span className="text-[10px] text-slate-500 font-medium">Click any asset on map</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center mx-auto shadow-sm border border-slate-200">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Digital Twin Telemetry</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select any road segment, traffic junction, hospital hub, ambulance, CCTV camera, or incident marker on the map to inspect real-time metrics and trigger actions.
            </p>
          </div>

          {/* Quick Select Quicklinks */}
          <div className="space-y-2">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Featured Network Assets</div>

            <button
              onClick={() => {
                const road = roads.find((r) => r.code === 'R102') || roads[0];
                setSelectedEntity({ type: 'ROAD', data: road });
              }}
              className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">Road R102 (Central Arterial)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">78% Traffic</span>
            </button>

            <button
              onClick={() => {
                const jnc = junctions.find((j) => j.code === 'J14') || junctions[0];
                setSelectedEntity({ type: 'JUNCTION', data: jnc });
              }}
              className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800">Junction J14 (Central Blvd)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">32s Signal</span>
            </button>

            <button
              onClick={() => {
                const amb = ambulances.find((a) => a.unitCode === 'AMB-07') || ambulances[0];
                setSelectedEntity({ type: 'AMBULANCE', data: amb });
              }}
              className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-slate-800">Ambulance AMB-07 (ALS)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">DISPATCHED</span>
            </button>
          </div>
        </div>

        {/* City Resilience Quick Glance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-xs tracking-wider uppercase">City Resilience</span>
            </div>
            <span className="font-mono text-base font-black text-emerald-400">{resilienceScore.overall} / 100</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between text-[11px]">
              <span>Emergency Readiness</span>
              <strong className="text-white">{resilienceScore.emergencyReadiness}%</strong>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${resilienceScore.emergencyReadiness}%` }} />
            </div>

            <div className="flex justify-between text-[11px] pt-1">
              <span>Hospital Capacity</span>
              <strong className="text-white">{resilienceScore.hospitalCapacityScore}%</strong>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${resilienceScore.hospitalCapacityScore}%` }} />
            </div>
          </div>

          <button
            onClick={openAnalytics}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            View Full City Analytics
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 xl:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-sm flex flex-col justify-between p-5 space-y-4 z-20 overflow-y-auto select-none">
      {/* Top Header & Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
          Selected {selectedEntity.type} Asset
        </div>
        <button
          onClick={() => setSelectedEntity(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Deselect Asset"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Render Dynamic Inspector based on entity type */}
      <div className="flex-1">
        {selectedEntity.type === 'ROAD' && <RoadInspector road={selectedEntity.data} />}
        {selectedEntity.type === 'JUNCTION' && <JunctionInspector junction={selectedEntity.data} />}
        {selectedEntity.type === 'HOSPITAL' && <HospitalInspector hospital={selectedEntity.data} />}
        {selectedEntity.type === 'AMBULANCE' && <AmbulanceInspector ambulance={selectedEntity.data} />}
        {selectedEntity.type === 'CCTV' && <CCTVInspector cctv={selectedEntity.data} />}
        {selectedEntity.type === 'INCIDENT' && <IncidentInspector incident={selectedEntity.data} />}
      </div>
    </aside>
  );
};
