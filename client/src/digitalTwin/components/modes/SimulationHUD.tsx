import React from 'react';
import { useTwin } from '../../context/TwinContext';
import { AIRecommendationCard } from './AIRecommendationCard';
import { Cpu, Play, Pause, RotateCcw, X } from 'lucide-react';

export const SimulationHUD: React.FC = () => {
  const {
    mode,
    setMode,
    simulationResult,
    simulationStepIndex,
    setSimulationStepIndex,
    isSimPlaying,
    playSimulation,
    pauseSimulation,
    resetSimulation,
  } = useTwin();

  if (mode !== 'SIMULATION' || !simulationResult) return null;

  const currentStep = simulationResult.timeline[simulationStepIndex] || simulationResult.timeline[0];

  return (
    <div className="absolute inset-x-0 bottom-14 z-[350] px-4 sm:px-6 pointer-events-none select-none flex flex-col items-center space-y-3">
      {/* Top Row: AI Decision Recommendation Card (Floating Right) & Comparison Banner (Center/Left) */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-end lg:items-start justify-between gap-4 pointer-events-auto">
        {/* Left: Normal vs Simulated Side-by-Side Comparison Card */}
        <div className="w-full lg:max-w-xl bg-white/95 backdrop-blur-md rounded-2xl border border-purple-300 shadow-2xl p-4 sm:p-5 space-y-4 text-slate-900">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-purple-950">
                  Scenario: {simulationResult.scenarioConfig.name}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">Digital Twin Mathematical Simulation Copy</p>
              </div>
            </div>

            <button
              onClick={() => setMode('LIVE')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Exit Simulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* NORMAL STATE */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Normal Baseline State
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Traffic Congestion:</span>
                <strong className="text-emerald-600 font-mono text-xs">
                  {simulationResult.normalState.averageTrafficPercent}%
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Average ETA:</span>
                <strong className="text-slate-900 font-mono text-xs">
                  {simulationResult.normalState.averageEtaMinutes} mins
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Affected Roads:</span>
                <strong className="text-slate-900 font-mono text-xs">
                  {simulationResult.normalState.affectedRoadsCount}
                </strong>
              </div>
            </div>

            {/* SIMULATED STATE */}
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-purple-900 tracking-wider">
                Simulated State
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Traffic Congestion:</span>
                <strong className="text-rose-600 font-mono text-xs">
                  {simulationResult.simulatedState.averageTrafficPercent}%
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Average ETA:</span>
                <strong className="text-rose-600 font-mono text-xs">
                  {simulationResult.simulatedState.averageEtaMinutes} mins
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Affected Roads:</span>
                <strong className="text-purple-900 font-mono text-xs">
                  {simulationResult.simulatedState.affectedRoadsCount}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-0.5 border-t border-purple-200/60">
                <span className="text-rose-700 font-bold">EMS Delay:</span>
                <strong className="text-rose-600 font-mono text-xs">
                  +{simulationResult.simulatedState.ambulanceDelayMinutes} mins
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Recommendation Card */}
        <div className="w-full lg:max-w-md">
          <AIRecommendationCard />
        </div>
      </div>

      {/* Bottom Timeline Scrubber Card */}
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 sm:p-4 space-y-3 pointer-events-auto text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={isSimPlaying ? pauseSimulation : playSimulation}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                isSimPlaying
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              }`}
            >
              {isSimPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimPlaying ? 'Pause Simulation' : 'Play Timeline'}</span>
            </button>

            <button
              onClick={resetSimulation}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              title="Reset Timeline to 09:40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Step Title & Telemetry */}
          <div className="flex items-center space-x-2">
            <span className="font-mono font-black text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {currentStep.timeLabel}
            </span>
            <span className="text-xs font-extrabold text-slate-900">{currentStep.eventTitle}</span>
            <span className="text-xs text-slate-500 font-mono">({currentStep.trafficCongestion}% Traffic)</span>
          </div>
        </div>

        {/* Timeline Interactive Step Scrubber */}
        <div className="grid grid-cols-6 gap-1 sm:gap-2 pt-1">
          {simulationResult.timeline.map((step, idx) => {
            const isCurrent = idx === simulationStepIndex;
            const isPassed = idx < simulationStepIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  pauseSimulation();
                  setSimulationStepIndex(idx);
                }}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105 z-10'
                    : isPassed
                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-mono font-black text-[10px] leading-none mb-1">{step.timeLabel}</div>
                <div className="text-[9px] font-bold truncate">{step.eventTitle}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
