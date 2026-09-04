import React, { useState } from 'react';
import { WhatIfResponseDTO, aiApiClient } from '../../api/aiApiClient';
import { Sliders, Info } from 'lucide-react';

interface WhatIfSimulationCardProps {
  junctionCode: string;
  initialGreenTimeSec?: number;
}

export const WhatIfSimulationCard: React.FC<WhatIfSimulationCardProps> = ({
  junctionCode,
}) => {
  const [deltaSec, setDeltaSec] = useState<number>(10);
  const [simulationResult, setSimulationResult] = useState<WhatIfResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSimulate = async (delta: number) => {
    setDeltaSec(delta);
    setLoading(true);
    try {
      const result = await aiApiClient.simulateWhatIf(junctionCode, delta);
      setSimulationResult(result);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            What-If Simulation Engine
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/50 text-cyan-300">
          Transient Analytical Model
        </span>
      </div>

      <div className="mb-4">
        <label className="text-xs text-slate-300 block mb-2 font-medium">
          Signal Timing Adjustment ($\Delta G$ Seconds)
        </label>

        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={() => handleSimulate(-10)}
            disabled={loading}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              deltaSec === -10
                ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            -10s
          </button>
          <button
            onClick={() => handleSimulate(10)}
            disabled={loading}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              deltaSec === 10
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            +10s
          </button>
          <button
            onClick={() => handleSimulate(20)}
            disabled={loading}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              deltaSec === 20
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            +20s
          </button>
        </div>
      </div>

      {simulationResult && (
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400">Green Time Change:</span>
            <span className="font-mono font-bold text-slate-100">
              {simulationResult.current_green_time_sec}s → {simulationResult.simulated_green_time_sec}s ({simulationResult.delta_green_time_sec > 0 ? '+' : ''}{simulationResult.delta_green_time_sec}s)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Estimated delay change</span>
              <span className="font-mono font-bold text-emerald-400">
                {simulationResult.estimated_delay_change_sec > 0 ? '+' : ''}{simulationResult.estimated_delay_change_sec} seconds
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Estimated throughput change (%)</span>
              <span className="font-mono font-bold text-cyan-400">
                {simulationResult.estimated_throughput_change_percent > 0 ? '+' : ''}{simulationResult.estimated_throughput_change_percent}%
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Estimated queue change</span>
              <span className="font-mono font-bold text-indigo-400">
                {simulationResult.estimated_queue_change_meters > 0 ? '+' : ''}{simulationResult.estimated_queue_change_meters} meters
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Predicted congestion</span>
              <span className="font-mono font-bold text-slate-100">
                {simulationResult.current_congestion_percent}% → {simulationResult.predicted_congestion_percent}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic bg-indigo-950/30 p-2 rounded border border-indigo-900/40">
            {simulationResult.summary_advisory}
          </p>
        </div>
      )}

      {/* Analytical Estimate Disclaimer Badge */}
      <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60">
        <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
        <span>Analytical Estimate — Prototype Model (Phase 4A). Transient simulation does not alter signal hardware or database state.</span>
      </div>
    </div>
  );
};
