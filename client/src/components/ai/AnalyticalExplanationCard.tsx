import React from 'react';
import { FactorContributionDTO } from '../../api/aiApiClient';
import { HelpCircle } from 'lucide-react';

interface AnalyticalExplanationCardProps {
  factors: FactorContributionDTO[];
}

export const AnalyticalExplanationCard: React.FC<AnalyticalExplanationCardProps> = ({ factors }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Analytical Contributing Factors (Why?)
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-300">
          Normalized Contribution Weights
        </span>
      </div>

      <div className="space-y-3.5">
        {factors.map((factor, index) => (
          <div key={index} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">{factor.factor_name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-mono text-[11px]">[{factor.measured_value}]</span>
                <span className="font-bold text-indigo-400 font-mono">{factor.weight_percent.toFixed(1)}%</span>
              </div>
            </div>

            {/* Contribution weight progress bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, factor.weight_percent))}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">{factor.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
