import React, { useState } from 'react';
import { TrafficAlert, AlertSeverity } from '../../types/citizen';
import { formatTimeAgo } from '../../services/citizenService';
import {
  AlertTriangle,
  Clock,
  MapPin,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface CitizenAlertsFeedProps {
  alerts: TrafficAlert[];
  onSelectAlert?: (alert: TrafficAlert) => void;
  onNavigateAlternate?: (route: string) => void;
  isLoading?: boolean;
}

export const CitizenAlertsFeed: React.FC<CitizenAlertsFeedProps> = ({
  alerts,
  onSelectAlert,
  onNavigateAlternate,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black tracking-wide border border-rose-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
            HIGH SEVERITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">
            MODERATE
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
            ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col space-y-3.5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Traffic Alerts Around You
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                {alerts.length} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time road closures, emergency green corridors, and delay advisories
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-[10px] font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'CRITICAL' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilter('HIGH')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'HIGH' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            High
          </button>
          <button
            onClick={() => setFilter('MEDIUM')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'MEDIUM' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Medium
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 animate-pulse space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">No active alerts in this category.</p>
            <p className="text-[11px] text-slate-500">Corridors in your perimeter are flowing normally.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onSelectAlert && onSelectAlert(alert)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 space-y-2 cursor-pointer ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                  : alert.severity === 'HIGH'
                  ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Alert Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-black text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {alert.code}
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                      {alert.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{alert.location}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(alert.timestamp)}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                {alert.description}
              </p>

              {/* Footer Meta & Alternate Route */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                <div className="flex items-center space-x-2">
                  {alert.verifiedAdvisory && (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Traffic Advisory</span>
                    </span>
                  )}
                  {alert.affectedLanes && (
                    <span className="text-slate-500 font-medium text-[10px]">
                      • {alert.affectedLanes}
                    </span>
                  )}
                </div>

                {alert.estimatedDelayMinutes ? (
                  <span className="font-mono text-rose-700 font-bold text-[10px] bg-rose-100/70 px-2 py-0.5 rounded">
                    +{alert.estimatedDelayMinutes} min delay
                  </span>
                ) : null}
              </div>

              {/* Alternate Route Suggestion Pill */}
              {alert.alternateRouteSuggested && (
                <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-[11px] text-blue-900 font-medium">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Alt: <strong>{alert.alternateRouteSuggested}</strong></span>
                  </div>
                  {onNavigateAlternate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateAlternate(alert.alternateRouteSuggested!);
                      }}
                      className="text-blue-600 font-bold hover:underline flex items-center space-x-0.5 flex-shrink-0 ml-2"
                    >
                      <span>Route</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
