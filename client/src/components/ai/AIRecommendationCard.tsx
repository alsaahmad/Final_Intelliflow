import React, { useState, useEffect } from 'react';
import { RecommendationDTO, SimulatedActResponseDTO, aiApiClient } from '../../api/aiApiClient';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { Lightbulb, ShieldAlert, CheckCircle2, AlertTriangle, Play, Lock, Info } from 'lucide-react';

interface AIRecommendationCardProps {
  junctionCode: string;
  onActionExecuted?: (res: SimulatedActResponseDTO) => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  junctionCode,
  onActionExecuted,
}) => {
  const { user } = useAuth();
  const { t, translateGlossary } = useTranslation();
  const [recommendation, setRecommendation] = useState<RecommendationDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [actResponse, setActResponse] = useState<SimulatedActResponseDTO | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRecommendation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const detail = await aiApiClient.getRecommendationDetail(junctionCode);
      setRecommendation(detail.recommendation);
    } catch (err: any) {
      console.error('Failed to fetch AI recommendation:', err);
      setErrorMsg('Failed to load AI recommendation for junction.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, [junctionCode]);

  const isTrafficPolice = user?.role === 'TRAFFIC_POLICE';

  const handleExecuteAction = async () => {
    if (!recommendation) return;
    setExecuting(true);
    setErrorMsg(null);
    setActResponse(null);

    try {
      const response = await aiApiClient.executeSimulatedAct(
        recommendation.junction_code,
        recommendation.recommended_action
      );
      setActResponse(response);
      if (onActionExecuted) {
        onActionExecuted(response);
      }
    } catch (err: any) {
      console.error('Failed to execute simulated action:', err);
      const serverDetail = err.response?.data?.detail;
      if (typeof serverDetail === 'object' && serverDetail?.message) {
        setErrorMsg(`Execution Failed: ${serverDetail.message}`);
      } else if (typeof serverDetail === 'string') {
        setErrorMsg(`Execution Failed: ${serverDetail}`);
      } else {
        setErrorMsg(err.message || 'Execution failed due to authorization or validation error.');
      }
    } finally {
      setExecuting(false);
    }
  };

  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'INCREASE_GREEN_TIME':
        return 'bg-emerald-900/60 border-emerald-500/80 text-emerald-200';
      case 'DECREASE_GREEN_TIME':
        return 'bg-amber-900/60 border-amber-500/80 text-amber-200';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-900/60 rounded-xl p-5 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            {t('ai.recommendationTitle', 'Deterministic AI Recommendation Engine')}
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
          Phase 4B • Simulated Act
        </span>
      </div>

      {/* Prominent Prototype Warning */}
      <div className="mb-4 bg-amber-950/70 border border-amber-600/80 p-3 rounded-lg flex items-center space-x-3 text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div className="text-xs font-bold tracking-wide">
          {t('PROTOTYPE SIMULATED ACTION — NO REAL SIGNAL CONTROL', 'PROTOTYPE SIMULATED ACTION — NO REAL SIGNAL CONTROL')}
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
          {t('common.loading', 'Computing deterministic AI signal recommendations...')}
        </div>
      ) : recommendation ? (
        <div className="space-y-4">
          {/* Main Recommendation Banner */}
          <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">{t('ai.recommendedDecision', 'Recommended Decision')}</span>
                <span
                  className={`inline-block px-3 py-1 mt-1 rounded-md text-xs font-mono font-bold border ${getActionBadgeStyle(
                    recommendation.recommended_action
                  )}`}
                >
                  {translateGlossary(recommendation.recommended_action)}
                  {recommendation.green_time_delta_sec !== 0 &&
                    ` (${recommendation.green_time_delta_sec > 0 ? '+' : ''}${
                      recommendation.green_time_delta_sec
                    }s)`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">{t('ai.proposedGreenTime', 'Proposed Green Time')}</span>
                <span className="text-sm font-mono font-bold text-slate-100">
                  {recommendation.current_green_time_sec}s → {recommendation.proposed_green_time_sec}s
                </span>
              </div>
            </div>

            {/* Metrics Impact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t('ai.expectedDelay', 'Expected Delay')}</span>
                <span className="font-mono font-bold text-emerald-400">
                  {recommendation.estimated_delay_change_sec > 0 ? '+' : ''}
                  {recommendation.estimated_delay_change_sec}s
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t('ai.expectedCongestion', 'Expected Congestion')}</span>
                <span className="font-mono font-bold text-cyan-400">
                  {recommendation.estimated_congestion_change_percent > 0 ? '+' : ''}
                  {recommendation.estimated_congestion_change_percent}%
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t('ai.expectedQueue', 'Expected Queue')}</span>
                <span className="font-mono font-bold text-indigo-400">
                  {recommendation.estimated_queue_change_meters > 0 ? '+' : ''}
                  {recommendation.estimated_queue_change_meters}m
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{t('ai.expectedThroughput', 'Expected Throughput')}</span>
                <span className="font-mono font-bold text-blue-400">
                  {recommendation.estimated_throughput_change_percent > 0 ? '+' : ''}
                  {recommendation.estimated_throughput_change_percent}%
                </span>
              </div>
            </div>

            {/* Rationale */}
            <div className="text-xs text-slate-300 bg-indigo-950/40 p-2.5 rounded border border-indigo-900/50">
              <span className="font-semibold text-indigo-300 block mb-0.5">{t('ai.analyticalRationale', 'Analytical Rationale')}:</span>
              {recommendation.analytical_rationale}
            </div>

            {/* Safety Constraints */}
            {recommendation.safety_constraints && recommendation.safety_constraints.length > 0 && (
              <div className="text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">Validated Safety Bounds:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  {recommendation.safety_constraints.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="bg-rose-950/70 border border-rose-600 p-3 rounded-lg text-xs text-rose-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Execution Response Banner */}
          {actResponse && (
            <div className="bg-emerald-950/80 border border-emerald-500 p-4 rounded-lg text-xs text-emerald-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simulated Traffic Action Executed (Server Authoritative)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-100 bg-emerald-900/40 p-2 rounded">
                <div>Action ID: <span className="font-bold text-white">{actResponse.action_id}</span></div>
                <div>Audit ID: <span className="font-bold text-white">{actResponse.audit_log_id}</span></div>
                <div>Applied Green: <span className="font-bold text-white">{actResponse.applied_green_time_sec}s</span></div>
                <div>Delta: <span className="font-bold text-white">{actResponse.applied_delta_sec > 0 ? '+' : ''}{actResponse.applied_delta_sec}s</span></div>
              </div>
              <p className="text-[11px] italic text-emerald-300">{actResponse.server_generated_rationale}</p>
            </div>
          )}

          {/* Role-Based Execution Control */}
          <div className="pt-2">
            {isTrafficPolice ? (
              <button
                onClick={handleExecuteAction}
                disabled={executing}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all"
              >
                <Play className="w-4 h-4" />
                <span>{executing ? t('ai.executingSimulatedAct', 'Executing Simulated Act...') : t('ai.executeSimulatedAction', 'Execute Simulated Action')}</span>
              </button>
            ) : (
              <div className="flex items-center justify-center space-x-2 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('View Only — Execution Restricted to Traffic Police', 'View Only — Execution Restricted to Traffic Police')}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-slate-400">
          No recommendation available.
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-3 flex items-center space-x-1.5 text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
        <Info className="w-3 h-3 text-indigo-400 flex-shrink-0" />
        <span>Server-Authoritative RBAC Enforcement. All actions produce synchronous SystemAuditLog entries.</span>
      </div>
    </div>
  );
};

export default AIRecommendationCard;
