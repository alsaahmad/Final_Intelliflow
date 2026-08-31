import React, { useState } from 'react';
import { useTwin } from '../../context/TwinContext';
import { IncidentType, IncidentSeverity, SimulationScenarioConfig } from '../../types';
import { PlayCircle, X, Cpu, AlertTriangle, Flame, Droplets, Users, ShieldAlert, Car, Clock } from 'lucide-react';

export const ScenarioBuilderModal: React.FC = () => {
  const { scenarioModalOpen, closeScenarioModal, runScenario, junctions, roads } = useTwin();

  const [name, setName] = useState('J14 Arterial Collision Simulation');
  const [event, setEvent] = useState<IncidentType>('ACCIDENT');
  const [targetType, setTargetType] = useState<'JUNCTION' | 'ROAD'>('JUNCTION');
  const [targetId, setTargetId] = useState('j-14');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [blockageExtent, setBlockageExtent] = useState<'PARTIAL' | 'COMPLETE'>('COMPLETE');

  if (!scenarioModalOpen) return null;

  const eventTypes: { id: IncidentType; label: string; icon: any }[] = [
    { id: 'ACCIDENT', label: 'Accident', icon: Car },
    { id: 'ROAD_CLOSURE', label: 'Road Closure', icon: AlertTriangle },
    { id: 'FIRE', label: 'Fire Hazard', icon: Flame },
    { id: 'FLOOD', label: 'Waterlogging / Flood', icon: Droplets },
    { id: 'MASS_GATHERING', label: 'Mass Gathering', icon: Users },
    { id: 'MEDICAL_EMERGENCY', label: 'Mass Medical SOS', icon: ShieldAlert },
  ];

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    const targetName =
      targetType === 'JUNCTION'
        ? junctions.find((j) => j.id === targetId)?.name || 'Junction J14'
        : roads.find((r) => r.id === targetId)?.name || 'Road R102';

    const scenario: SimulationScenarioConfig = {
      id: `sc-${Date.now()}`,
      name,
      event,
      locationTarget: {
        type: targetType,
        id: targetId,
        name: targetName,
      },
      severity,
      durationMinutes,
      blockageExtent,
    };

    runScenario(scenario);
    closeScenarioModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Create What-If Scenario</h2>
              <p className="text-xs text-slate-500 font-medium">Model crisis propagation before physical impact</p>
            </div>
          </div>
          <button
            onClick={closeScenarioModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRun} className="space-y-4 text-xs">
          {/* Scenario Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Scenario Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Incident Type Grid */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Crisis Event Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eventTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = event === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEvent(item.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Location Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Asset Type</label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as any);
                  setTargetId(e.target.value === 'JUNCTION' ? junctions[0].id : roads[0].id);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="JUNCTION">Smart Junction</option>
                <option value="ROAD">Road Segment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Location Target</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {targetType === 'JUNCTION'
                  ? junctions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.code} - {j.name}
                      </option>
                    ))
                  : roads.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Severity & Extent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Severity</label>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      severity === sev
                        ? 'bg-purple-600 text-white border-purple-600 shadow'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sev[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Blockage Extent</label>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBlockageExtent('PARTIAL')}
                  className={`py-1.5 rounded-lg border text-center transition-all ${
                    blockageExtent === 'PARTIAL'
                      ? 'bg-purple-50 border-purple-400 text-purple-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Partial
                </button>
                <button
                  type="button"
                  onClick={() => setBlockageExtent('COMPLETE')}
                  className={`py-1.5 rounded-lg border text-center transition-all ${
                    blockageExtent === 'COMPLETE'
                      ? 'bg-purple-600 text-white border-purple-600 shadow'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Complete
                </button>
              </div>
            </div>
          </div>

          {/* Duration in Minutes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Simulation Horizon / Duration</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-1.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    durationMinutes === mins
                      ? 'bg-purple-600 text-white border-purple-600 shadow'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mins} mins
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeScenarioModal}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              <span>RUN SIMULATION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
