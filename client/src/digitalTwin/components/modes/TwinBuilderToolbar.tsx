import React from 'react';
import { useTwin } from '../../context/TwinContext';
import { BuilderTool } from '../../types';
import {
  Activity,
  RefreshCw,
  HeartPulse,
  PhoneCall,
  Video,
  AlertTriangle,
  Hammer,
  X,
  Crosshair,
} from 'lucide-react';

export const TwinBuilderToolbar: React.FC = () => {
  const { mode, builderTool, setBuilderTool, setMode } = useTwin();

  if (mode !== 'BUILD') return null;

  const tools: { id: BuilderTool; label: string; icon: any; color: string }[] = [
    { id: 'ADD_ROAD', label: '+ Road', icon: Activity, color: 'text-blue-600' },
    { id: 'ADD_JUNCTION', label: '+ Junction', icon: RefreshCw, color: 'text-indigo-600' },
    { id: 'ADD_HOSPITAL', label: '+ Hospital', icon: HeartPulse, color: 'text-emerald-600' },
    { id: 'ADD_AMBULANCE', label: '+ Ambulance', icon: PhoneCall, color: 'text-rose-600' },
    { id: 'ADD_CCTV', label: '+ CCTV', icon: Video, color: 'text-emerald-600' },
    { id: 'ADD_INCIDENT', label: '+ Incident', icon: AlertTriangle, color: 'text-amber-600' },
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[350] max-w-2xl w-full px-4 select-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200 shadow-2xl p-3 space-y-2 text-slate-900">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Digital Twin Builder & Spatial Editor
              </span>
              <p className="text-[10px] text-slate-500 font-medium">Select tool and click on map to spawn assets</p>
            </div>
          </div>

          <button
            onClick={() => {
              setBuilderTool('NONE');
              setMode('LIVE');
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Exit Builder Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tools Palette */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tools.map((t) => {
            const Icon = t.icon;
            const isSelected = builderTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setBuilderTool(isSelected ? 'NONE' : t.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : t.color}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tool Help Banner */}
        {builderTool !== 'NONE' && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center space-x-1.5">
            <Crosshair className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Targeting Mode: Click any point on the map to place this asset.</span>
          </div>
        )}
      </div>
    </div>
  );
};
