import React, { useState } from 'react';
import { useTwin } from '../../context/TwinContext';
import { Sparkles, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export const AIRecommendationCard: React.FC = () => {
  const { simulationResult, applySimulationToLive, mode } = useTwin();
  const [showReasoning, setShowReasoning] = useState(false);

  if (mode !== 'SIMULATION' || !simulationResult) return null;

  const { aiRecommendation } = simulationResult;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-purple-300 shadow-2xl p-4 sm:p-5 space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner */}
      <div className="flex items-start justify-between border-b border-purple-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs text-purple-950">AI RESPONSE RECOMMENDATION</span>
              <span className="px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                {aiRecommendation.scenarioImpact} IMPACT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Multi-modal graph decision engine calculated response
            </p>
          </div>
        </div>

        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Confidence: 95.8%
        </span>
      </div>

      {/* Recommended Action Items */}
      <div className="space-y-2">
        <div className="text-[10px] font-extrabold uppercase text-slate-400">Synthesized Strategy Checklist:</div>
        <div className="space-y-1.5">
          {aiRecommendation.recommendedActions.map((action, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2.5 text-xs"
            >
              <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <span className="text-slate-800 font-semibold leading-snug">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Improvement Highlight Pill */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-xs font-extrabold text-emerald-950">Expected Network Gain:</div>
            <div className="text-[11px] text-emerald-800 font-medium">Throughput: +{aiRecommendation.expectedThroughputGainVehPerHr} vehicles/hr</div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-black text-emerald-600 font-mono">
            ETA ↓ {aiRecommendation.expectedEtaImprovementPercent}%
          </span>
          <span className="text-[10px] text-emerald-700 block font-semibold">Hospital Transit Gain</span>
        </div>
      </div>

      {/* Reasoning Collapsible */}
      {showReasoning && (
        <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-1 animate-in fade-in duration-150">
          <span className="text-[10px] font-extrabold uppercase text-purple-900">Decision Engine Rationale:</span>
          <p className="text-slate-700 leading-relaxed font-medium text-[11px]">{aiRecommendation.reasoning}</p>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
        >
          <span>{showReasoning ? 'Hide Reasoning' : 'View Reasoning'}</span>
          {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={applySimulationToLive}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
        >
          <Zap className="w-4 h-4 text-emerald-200" />
          <span>APPLY TO LIVE TWIN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
