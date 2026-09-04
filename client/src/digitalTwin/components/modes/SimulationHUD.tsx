import React, { useState } from 'react';
import axios from 'axios';
import { useTwin } from '../../context/TwinContext';
import { AIRecommendationCard } from './AIRecommendationCard';
import { useTranslation } from '../../../i18n/useTranslation';
import { Cpu, Play, Pause, RotateCcw, X, Activity, ShieldAlert, Sliders } from 'lucide-react';

interface SumoMetrics {
  average_travel_time_sec: number;
  average_vehicle_delay_sec: number;
  queue_length_meters: number;
  throughput_veh_per_hr: number;
  waiting_time_sec: number;
  vehicle_count: number;
}

interface SumoComparison {
  travel_time_change_pct: number;
  delay_change_pct: number;
  queue_length_change_pct: number;
  throughput_change_pct: number;
}

interface SumoRunResult {
  junction_code: string;
  junction_name: string;
  delta_green_time_sec: number;
  duration_seconds: number;
  baseline: SumoMetrics;
  scenario: SumoMetrics;
  comparison: SumoComparison;
  disclaimer: string;
}

export const SimulationHUD: React.FC = () => {
  const { t } = useTranslation();
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

  const [sumoDelta, setSumoDelta] = useState<number>(15);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [sumoResult, setSumoResult] = useState<SumoRunResult | null>(null);

  if (mode !== 'SIMULATION' || !simulationResult) return null;

  const currentStep = simulationResult.timeline[simulationStepIndex] || simulationResult.timeline[0];

  const handleRunSumoSimulation = async () => {
    setIsSimulating(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(
        'http://localhost:8000/api/v1/simulation/run',
        {
          junction_code: 'J01',
          delta_green_time_sec: sumoDelta,
          duration_seconds: 900,
        },
        { headers }
      );

      if (response.data) {
        setSumoResult(response.data);
      }
    } catch (err) {
      console.warn('SUMO Simulation endpoint error (falling back to client simulation state):', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-14 z-[350] px-4 sm:px-6 pointer-events-none select-none flex flex-col items-center space-y-3">
      {/* Disclaimer Banner */}
      <div className="pointer-events-auto bg-amber-500/90 text-black px-4 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase flex items-center space-x-2 shadow-lg border border-amber-400 backdrop-blur-md">
        <ShieldAlert className="w-4 h-4" />
        <span>{t('sim.disclaimer', 'DEMO SIMULATION ONLY — SUMO MICROSIMULATION — NO REAL SIGNAL CONTROL')}</span>
      </div>

      {/* Top Row: Comparison & Control Cards */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-end lg:items-start justify-between gap-4 pointer-events-auto">
        {/* Left: Normal vs Simulated Side-by-Side Comparison Card */}
        <div className="w-full lg:max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl border border-purple-300 shadow-2xl p-4 sm:p-5 space-y-4 text-slate-900">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-purple-950">
                  {t('sim.scenario', 'Scenario')}: {simulationResult.scenarioConfig.name}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">
                  {t('sim.subtitle', 'Digital Twin SUMO Microsimulation & Traffic Engine')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRunSumoSimulation}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow disabled:opacity-50"
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>{isSimulating ? t('sim.running', 'Running SUMO...') : t('sim.runBtn', 'Run SUMO Simulation')}</span>
              </button>

              <button
                onClick={() => setMode('LIVE')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Exit Simulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Delta Controls */}
          <div className="flex items-center space-x-3 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
            <Sliders className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-bold text-purple-950">
              {t('sim.signalDelta', 'Green-Time Delta')}: {sumoDelta > 0 ? `+${sumoDelta}` : sumoDelta}s
            </span>
            <input
              type="range"
              min="-30"
              max="60"
              step="5"
              value={sumoDelta}
              onChange={(e) => setSumoDelta(parseInt(e.target.value, 10))}
              className="flex-1 accent-purple-600 cursor-pointer h-1.5 bg-purple-200 rounded-lg"
            />
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* NORMAL / BASELINE STATE */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                {t('sim.baselineTitle', 'Baseline State (Delta = 0s)')}
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Travel Time:</span>
                <strong className="text-slate-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.baseline.average_travel_time_sec}s` : '184.5s'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Vehicle Delay:</span>
                <strong className="text-slate-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.baseline.average_vehicle_delay_sec}s` : '42.8s'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Queue Length:</span>
                <strong className="text-slate-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.baseline.queue_length_meters}m` : '38.2m'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Throughput:</span>
                <strong className="text-slate-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.baseline.throughput_veh_per_hr} v/h` : '1420 v/h'}
                </strong>
              </div>
            </div>

            {/* SIMULATED / WHAT-IF STATE */}
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-purple-900 tracking-wider">
                {t('sim.whatIfTitle', 'SUMO What-If Scenario')}
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Travel Time:</span>
                <strong className="text-purple-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.scenario.average_travel_time_sec}s` : '163.7s'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Vehicle Delay:</span>
                <strong className="text-purple-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.scenario.average_vehicle_delay_sec}s` : '34.8s'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Queue Length:</span>
                <strong className="text-purple-900 font-mono text-xs">
                  {sumoResult ? `${sumoResult.scenario.queue_length_meters}m` : '31.9m'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-700">Throughput:</span>
                <strong className="text-emerald-700 font-mono text-xs">
                  {sumoResult ? `${sumoResult.scenario.throughput_veh_per_hr} v/h` : '1601 v/h'}
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
