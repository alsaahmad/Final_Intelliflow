import React, { useState } from 'react';
import { useTwin } from '../../context/TwinContext';
import {
  Layers,
  Activity,
  Video,
  HeartPulse,
  PhoneCall,
  Shield,
  Flame,
  TrendingUp,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { LayerVisibility } from '../../types';

export const LeftLayerPanel: React.FC = () => {
  const {
    layerVisibility,
    toggleLayer,
    roads,
    junctions,
    cctvs,
    hospitals,
    ambulances,
    runScenario,
    mode,
    setMode,
    resetToDefaultCity,
  } = useTwin();

  const [collapsed, setCollapsed] = useState(false);

  const layersList: {
    key: keyof LayerVisibility;
    label: string;
    count: number | string;
    icon: any;
    color: string;
    dotColor: string;
  }[] = [
    { key: 'roads', label: 'Roads Network', count: `${roads.length}`, icon: Activity, color: 'text-blue-600', dotColor: 'bg-blue-500' },
    { key: 'traffic', label: 'Live Traffic Flow', count: 'Realtime', icon: Zap, color: 'text-amber-600', dotColor: 'bg-amber-500' },
    { key: 'junctions', label: 'Smart Junctions', count: `${junctions.length}`, icon: RefreshCw, color: 'text-indigo-600', dotColor: 'bg-indigo-500' },
    { key: 'cctv', label: 'CCTV & AI Vision', count: `${cctvs.length}`, icon: Video, color: 'text-emerald-600', dotColor: 'bg-emerald-500' },
    { key: 'hospitals', label: 'Hospitals & ICU', count: `${hospitals.length}`, icon: HeartPulse, color: 'text-rose-600', dotColor: 'bg-rose-500' },
    { key: 'ambulances', label: 'EMS Ambulances', count: `${ambulances.length}`, icon: PhoneCall, color: 'text-blue-600', dotColor: 'bg-blue-500' },
    { key: 'police', label: 'Police Stations', count: '2', icon: Shield, color: 'text-indigo-600', dotColor: 'bg-indigo-700' },
    { key: 'fire', label: 'Fire & Hazmat', count: '2', icon: Flame, color: 'text-orange-600', dotColor: 'bg-orange-500' },
    { key: 'predictions', label: 'AI Congestion Forecast', count: '+15m', icon: TrendingUp, color: 'text-cyan-600', dotColor: 'bg-cyan-500' },
    { key: 'simulations', label: 'Scenario Overlays', count: 'Active', icon: Cpu, color: 'text-purple-600', dotColor: 'bg-purple-500' },
  ];

  return (
    <aside
      className={`relative z-20 bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Map Layers</h2>
              <span className="text-[10px] text-slate-500 font-medium">Digital Twin Spatial Feeds</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors mx-auto"
          title={collapsed ? 'Expand Layer Panel' : 'Collapse Layer Panel'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Layer Toggles List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[calc(100vh-220px)]">
        {layersList.map((item) => {
          const isEnabled = layerVisibility[item.key];
          const Icon = item.icon;

          if (collapsed) {
            return (
              <button
                key={item.key}
                onClick={() => toggleLayer(item.key)}
                title={`${item.label} (${isEnabled ? 'Visible' : 'Hidden'})`}
                className={`w-full h-10 rounded-xl flex items-center justify-center transition-all ${
                  isEnabled
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-400 hover:bg-slate-100 opacity-60'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          }

          return (
            <div
              key={item.key}
              onClick={() => toggleLayer(item.key)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                isEnabled
                  ? 'bg-slate-50/80 border-slate-200/90 text-slate-900 shadow-sm'
                  : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => {}} // Handled by container onClick
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <Icon className={`w-4 h-4 ${isEnabled ? item.color : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">{item.label}</span>
              </div>

              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isEnabled ? 'bg-white text-slate-700 border border-slate-200' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Demo Scenarios & Quick Launch */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-purple-900 font-extrabold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Demo Incident Scenario</span>
              </div>
              <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                HERO DEMO
              </span>
            </div>
            <p className="text-[11px] text-purple-800 leading-snug">
              "Major Accident — J14": Simulate R102 blockage, timeline replay, and AI decision response.
            </p>
            <button
              onClick={() => runScenario()}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs shadow-md shadow-purple-500/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>RUN WHAT-IF SIMULATION</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetToDefaultCity}
              className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-[11px] border border-slate-200 transition-colors"
            >
              Reset Twin State
            </button>
            <button
              onClick={() => setMode(mode === 'BUILD' ? 'LIVE' : 'BUILD')}
              className={`flex-1 py-2 rounded-xl font-bold text-[11px] border transition-colors ${
                mode === 'BUILD'
                  ? 'bg-amber-600 text-white border-amber-600 shadow'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {mode === 'BUILD' ? 'Exit Builder' : '+ Edit Twin'}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
