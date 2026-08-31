import React from 'react';
import { TwinProvider, useTwin } from './context/TwinContext';
import { TopNavigation } from './components/layout/TopNavigation';
import { LeftLayerPanel } from './components/layout/LeftLayerPanel';
import { RightInspectorPanel } from './components/layout/RightInspector/RightInspectorPanel';
import { BottomStatusBar } from './components/layout/BottomStatusBar';
import { DigitalTwinMap } from './components/map/DigitalTwinMap';
import { PredictionHUD } from './components/modes/PredictionHUD';
import { SimulationHUD } from './components/modes/SimulationHUD';
import { TwinBuilderToolbar } from './components/modes/TwinBuilderToolbar';
import { TwinBuilderModal } from './components/modes/TwinBuilderModal';
import { ScenarioBuilderModal } from './components/modes/ScenarioBuilderModal';
import { CityAnalyticsModal } from './components/analytics/CityAnalyticsModal';
import { CCTVCamModal } from './components/layout/RightInspector/CCTVCamModal';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import './digitalTwin.css';

const DigitalTwinContent: React.FC = () => {
  const { toast, hideToast } = useTwin();

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 text-slate-900 font-sans select-none">
      {/* 1. Master Top Navigation Bar */}
      <TopNavigation />

      {/* 2. Main Center Body: Left Layers + Hero Map + Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Spatial Layer Panel */}
        <LeftLayerPanel />

        {/* Hero Digital Twin Center Map (70-80% Visual Attention) */}
        <main className="flex-1 relative h-full w-full overflow-hidden bg-slate-200">
          <DigitalTwinMap />

          {/* Mode Floating Overlays */}
          <PredictionHUD />
          <SimulationHUD />
          <TwinBuilderToolbar />
        </main>

        {/* Right Object Inspector Drawer */}
        <RightInspectorPanel />
      </div>

      {/* 3. Bottom Live Telemetry Status Bar */}
      <BottomStatusBar />

      {/* 4. Global Modals & Dialogs */}
      <CCTVCamModal />
      <ScenarioBuilderModal />
      <TwinBuilderModal />
      <CityAnalyticsModal />

      {/* 5. Floating Toast Notification Pill */}
      {toast && (
        <div className="fixed bottom-16 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-2.5 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toast.type === 'warning'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={hideToast} className="ml-2 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DigitalTwinDashboard: React.FC = () => {
  return (
    <TwinProvider>
      <DigitalTwinContent />
    </TwinProvider>
  );
};

export default DigitalTwinDashboard;
