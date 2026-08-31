import React from 'react';
import { useTwin } from '../../context/TwinContext';
import {
  BarChart3,
  X,
  ShieldCheck,
  Activity,
  HeartPulse,
  PhoneCall,
  Video,
} from 'lucide-react';

export const CityAnalyticsModal: React.FC = () => {
  const { analyticsModalOpen, closeAnalytics, resilienceScore, roads, hospitals, ambulances, cctvs } = useTwin();

  if (!analyticsModalOpen) return null;

  const avgSpeed = Math.round(
    roads.reduce((acc, r) => acc + r.currentSpeedKmh, 0) / (roads.length || 1)
  );

  const avgCongestion = Math.round(
    roads.reduce((acc, r) => acc + r.congestionPercent, 0) / (roads.length || 1)
  );

  const totalBeds = hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Metropolitan Resilience & Flow Analytics</h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive multi-agency digital twin performance telemetry
              </p>
            </div>
          </div>
          <button
            onClick={closeAnalytics}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master City Resilience Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CITY RESILIENCE BENCHMARK</span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">High Readiness & Emergency Stability</h3>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {resilienceScore.overall} / 100
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold">Overall Resilience Index</span>
            </div>
          </div>

          {/* 4 Core Pillar Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">Traffic Flow & Signal Efficiency</span>
                <strong className="text-emerald-400">{resilienceScore.trafficReadiness}%</strong>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${resilienceScore.trafficReadiness}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">Emergency Readiness & Dispatch</span>
                <strong className="text-blue-400">{resilienceScore.emergencyReadiness}%</strong>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${resilienceScore.emergencyReadiness}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">Hospital Bed & ICU Capacity</span>
                <strong className="text-indigo-400">{resilienceScore.hospitalCapacityScore}%</strong>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${resilienceScore.hospitalCapacityScore}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-semibold">Infrastructure & CCTV Integrity</span>
                <strong className="text-teal-400">{resilienceScore.infrastructureScore}%</strong>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${resilienceScore.infrastructureScore}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Multi-Agency Operational Metric Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Panel 1: Traffic Telemetry */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Traffic Flow & Speed</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                OPTIMAL
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">AVG NETWORK SPEED</span>
                <strong className="text-base text-slate-900">{avgSpeed} km/h</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">AVG CONGESTION</span>
                <strong className="text-base text-slate-900">{avgCongestion}%</strong>
              </div>
            </div>
          </div>

          {/* Panel 2: Emergency Response */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <PhoneCall className="w-4 h-4 text-indigo-600" />
                <span>Emergency 108 Operations</span>
              </div>
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[10px]">
                {ambulances.length} UNITS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">AVG RESPONSE ETA</span>
                <strong className="text-base text-slate-900">6.4 mins</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">ACTIVE GREEN WAVES</span>
                <strong className="text-base text-emerald-600">2 Corridors</strong>
              </div>
            </div>
          </div>

          {/* Panel 3: Hospital ICU Capacity */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Hospital Network Status</span>
              </div>
              <span className="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                {hospitals.length} HOSPITALS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">EMERGENCY BEDS</span>
                <strong className="text-base text-slate-900">
                  {availableBeds} / {totalBeds} Free
                </strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">VENTILATORS FREE</span>
                <strong className="text-base text-slate-900">21 Units</strong>
              </div>
            </div>
          </div>

          {/* Panel 4: Surveillance AI */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>AI Surveillance Feeds</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                100% ONLINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">CCTV FEEDS ACTIVE</span>
                <strong className="text-base text-slate-900">{cctvs.length} Feeds</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold">AI EVENT ACCURACY</span>
                <strong className="text-base text-slate-900">97.8%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={closeAnalytics}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Analytics Report
          </button>
        </div>
      </div>
    </div>
  );
};
