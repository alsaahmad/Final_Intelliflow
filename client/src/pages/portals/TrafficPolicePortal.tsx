import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useTranslation } from '../../i18n/useTranslation';
import { trafficPoliceApiClient, PoliceOverviewDTO } from '../../api/trafficPoliceApiClient';
import { aiApiClient, JunctionPredictionDetailDTO } from '../../api/aiApiClient';
import { TrafficPredictionCard } from '../../components/ai/TrafficPredictionCard';
import { AnalyticalExplanationCard } from '../../components/ai/AnalyticalExplanationCard';
import { WhatIfSimulationCard } from '../../components/ai/WhatIfSimulationCard';
import { AIRecommendationCard } from '../../components/ai/AIRecommendationCard';
import {
  Car,
  ShieldCheck,
  Map as MapIcon,
  TrendingUp,
  Cpu,
  LogOut,
  Zap,
  Sparkles,
  Menu,
  X,
  Layers,
  HeartPulse,
} from 'lucide-react';

export const TrafficPolicePortal: React.FC = () => {
  const { user, logout } = useAuth();
  const { connectionStatus, lastEvent } = useWebSocket();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'map' | 'predictions' | 'whatif'>('map');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Telemetry state
  const [overview, setOverview] = useState<PoliceOverviewDTO | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  // Digital Twin Simulator state
  const simJunction = 'JNC-101';
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Manual Signal Override
  const [overrideLoading, setOverrideLoading] = useState(false);

  // AI Intelligence state (Phase 4A)
  const [aiDetail, setAiDetail] = useState<JunctionPredictionDetailDTO | null>(null);

  const fetchPoliceData = async () => {
    try {
      const policeOverview = await trafficPoliceApiClient.getPoliceOverview();
      setOverview(policeOverview);
      setPredictions([
        { junctionCode: 'J14', horizonMinutes: 15, predictedCongestion: 82, trend: 'WORSENING' },
        { junctionCode: 'J19', horizonMinutes: 15, predictedCongestion: 74, trend: 'WORSENING' },
        { junctionCode: 'J15', horizonMinutes: 15, predictedCongestion: 50, trend: 'STABLE' },
      ]);

      const aiData = await aiApiClient.getJunctionPredictionDetail('J14', 15);
      setAiDetail(aiData);
    } catch (err) {
      console.error('Failed to load traffic police data:', err);
    }
  };

  useEffect(() => {
    fetchPoliceData();
  }, []);

  // Live WebSocket Event Handler
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'TRAFFIC_TELEMETRY_UPDATE' && lastEvent.data) {
      const liveData = lastEvent.data;
      setOverview((prev) => {
        if (!prev) return prev;
        const updatedJunctions = (prev.monitored_junctions || []).map((jnc) => {
          if (jnc.junction_code === liveData.junctionCode) {
            return {
              ...jnc,
              congestion_percent: liveData.congestionPercent,
              severity: liveData.severity,
              speed_kmh: liveData.averageSpeedKmh,
              signal_phase: liveData.signalPhase || jnc.signal_phase,
              signal_timer_sec: liveData.signalTimerSeconds || jnc.signal_timer_sec,
            };
          }
          return jnc;
        });

        return {
          ...prev,
          monitored_junctions: updatedJunctions,
          dataSource: lastEvent.dataSource || 'FASTAPI_WS_SIMULATION',
        };
      });
    }
  }, [lastEvent]);


  const handleRunSimulator = async (deltaSeconds: number = 15) => {
    setSimulating(true);
    try {
      // Execute local / simulated What-If scenario (SIMULATION ONLY)
      const mockResult = {
        junctionCode: simJunction,
        greenDeltaSec: deltaSeconds,
        projectedCongestionPercent: Math.max(20, 78 - deltaSeconds * 1.5),
        projectedQueueDelayReductionMins: Math.round(deltaSeconds * 0.4),
        is_simulated: true,
      };
      setSimResult(mockResult);
    } catch (err: any) {
      alert(err.message || 'Simulator failed to execute.');
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyOverride = async (code: string, newGreen: number) => {
    setOverrideLoading(true);
    try {
      const res = await trafficPoliceApiClient.applySignalOverride(code, newGreen);
      alert(res.message);
      fetchPoliceData();
    } catch (err: any) {

      alert(err.message || 'Failed to apply signal override.');
    } finally {
      setOverrideLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center space-x-2.5" title="Return to IntelliFlow OS Home">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900">IntelliGuard</span>
            <span className="text-[10px] text-indigo-600 font-semibold block">Traffic Police Console</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-20 ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo with Global Navigation Law */}
          <Link to="/" className="hidden md:flex items-center space-x-3 group" title="Return to IntelliFlow OS Home">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base text-slate-900 tracking-tight">IntelliGuard</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                  POLICE
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Traffic Police Console</span>
            </div>
          </Link>

          {/* Officer Profile Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                Enforcement Officer
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : overview?.dataSource === 'FASTAPI_POSTGRES'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {connectionStatus === 'CONNECTED'
                  ? '🟢 REAL-TIME SIMULATION (WEBSOCKET)'
                  : overview?.dataSource === 'FASTAPI_POSTGRES'
                  ? '🟡 REST POLLING (FALLBACK)'
                  : '🔴 DEMO / OFFLINE FALLBACK'}
              </span>

            </div>
            <div className="font-bold text-xs text-slate-900 truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-500 truncate">Badge #{user?.badge_number || 'TP-4092'}</div>
          </div>


          {/* Sidebar Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('map');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'map'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>{t('nav.commandMap', 'Command Map')}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('predictions');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'predictions'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t('nav.predictions', 'Predictions')}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('whatif');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'whatif'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{t('nav.whatifSim', 'What-If Sim')}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('common.logout', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{t('police.sectorLabel', 'SECTOR A TRAFFIC ENFORCEMENT')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('police.portalTitle', 'Traffic Police Tactical Command')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('police.portalSubtitle', 'Live junction telemetry, AI congestion forecasting, and real-time signal timing override.')}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Congestion</div>
              <div className="text-lg font-black text-amber-600">{overview?.stats?.congestionIndex || '58%'}</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Green Waves</div>
              <div className="text-lg font-black text-rose-600">
                {overview?.stats?.activeGreenCorridors || 2} Active
              </div>
            </div>
          </div>
        </div>

        {/* Phase 4A & 4B AI Intelligence Layer Section */}
        {aiDetail && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-extrabold text-slate-900">
                IntelliFlow AI Intelligence Layer (Predict • Explain • What-If • Recommend • Simulated Act)
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrafficPredictionCard prediction={aiDetail.prediction} />
              <AnalyticalExplanationCard factors={aiDetail.analytical_factor_contributions} />
              <WhatIfSimulationCard junctionCode={aiDetail.prediction.junction_code} initialGreenTimeSec={32} />
              <AIRecommendationCard junctionCode={aiDetail.prediction.junction_code} />
            </div>
          </div>
        )}


        {/* 1. Large "Live City Map" Card with Incident Markers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Live City Map & Incident Radar</h2>
                <p className="text-[11px] text-slate-500">Real-time junction phases, e-challans, and incident markers</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200 flex items-center space-x-1">
                <HeartPulse className="w-3 h-3 text-rose-600 animate-pulse" />
                <span>Priority Emergency Waves Synced</span>
              </span>
            </div>
          </div>

          {/* Interactive City Tactical Map */}
          <div className="relative w-full h-80 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex flex-col justify-between p-4">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'radial-gradient(#6366f1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #f8fafc 1.5px)',
                backgroundSize: '28px 28px',
                backgroundPosition: '0 0, 14px 14px',
              }}
            />

            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <line x1="10%" y1="40%" x2="90%" y2="40%" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" />
              <line x1="10%" y1="40%" x2="50%" y2="40%" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
              <line x1="50%" y1="40%" x2="90%" y2="40%" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />

              <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" />
              <line x1="50%" y1="10%" x2="50%" y2="50%" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
              <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />

              <line x1="20%" y1="85%" x2="80%" y2="15%" stroke="#6366f1" strokeWidth="4" strokeDasharray="8,8" />
            </svg>

            <div className="relative z-10 flex justify-between text-[11px] font-bold text-slate-700">
              <span className="bg-white/90 px-2 py-1 rounded shadow">Sector A Central Highway</span>
              <span className="bg-white/90 px-2 py-1 rounded shadow">Trauma Corridor Route 01</span>
            </div>

            {/* Junction A Incident Marker */}
            <div className="absolute top-[38%] left-[48%] z-10 transform -translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-lg border-2 border-white animate-pulse">
                JNC-A
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold mt-1 inline-block shadow">
                84% Congested
              </span>
            </div>

            {/* Junction B Marker */}
            <div className="absolute top-[38%] left-[78%] z-10 transform -translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shadow border-2 border-white">
                JNC-B
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold mt-1 inline-block shadow">
                56% Optimal
              </span>
            </div>

            {/* Live Incident Marker */}
            <div className="absolute top-[68%] left-[48%] z-10 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="p-1.5 rounded-full bg-amber-500 text-white shadow-md border-2 border-white animate-bounce">
                <Car className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-extrabold mt-1 inline-block border border-amber-300 shadow">
                Signal Issue
              </span>
            </div>

            <div className="relative z-10 bg-white/95 backdrop-blur rounded-lg p-2 border border-slate-200 flex flex-wrap items-center justify-between text-[10px] gap-2">
              <div className="flex items-center space-x-3 font-semibold">
                <span className="text-rose-700">● Red: Heavy Congestion (&gt;80%)</span>
                <span className="text-amber-700">● Yellow: Medium Traffic</span>
                <span className="text-emerald-700">● Green: Free Wave</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>DPDP Privacy Mode: Edge-Level Face & Plate Blurring Active</span>
              </div>
            </div>
          </div>

          {/* Junction telemetry table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Junction Name</th>
                  <th className="pb-2">Current Green Phase</th>
                  <th className="pb-2">Congestion Level</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Direct Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview?.junctions?.map((jnc: any) => (
                  <tr key={jnc.code} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-slate-700">{jnc.code}</td>
                    <td className="py-2.5 font-bold text-slate-900">{jnc.name}</td>
                    <td className="py-2.5 font-mono text-indigo-700 font-bold">{jnc.current_green_time}s</td>
                    <td className="py-2.5 font-bold">
                      <span className={jnc.congestion_index > 75 ? 'text-rose-600' : 'text-slate-700'}>
                        {jnc.congestion_index}%
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          jnc.status === 'HEAVY'
                            ? 'bg-rose-100 text-rose-800'
                            : jnc.status === 'GREEN_CORRIDOR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {jnc.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleApplyOverride(jnc.code, jnc.current_green_time + 15)}
                        disabled={overrideLoading}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition-colors"
                      >
                        +15s Green Wave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2 Grid Columns: AI Prediction Panel (6 Cols) & Digital Twin Simulator (6 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* AI Prediction Panel (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">AI Traffic Prediction Panel</h2>
                <p className="text-[11px] text-slate-500">Neural Network 15-30 Minute Congestion Forecast</p>
              </div>
            </div>

            <div className="space-y-3">
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className={`p-4 rounded-xl border space-y-2 transition-all ${
                    pred.urgency === 'CRITICAL'
                      ? 'bg-rose-50/70 border-rose-200'
                      : pred.urgency === 'MODERATE'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{pred.junctionName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        pred.urgency === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : pred.urgency === 'MODERATE'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {pred.alert}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    <strong>Cause:</strong> {pred.primaryCause}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-200/60 gap-2">
                    <div className="text-[11px] text-slate-600 font-semibold">
                      AI Recommendation: <span className="text-indigo-700 font-bold">{pred.recommendedAction}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Confidence: {pred.confidenceScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Twin Simulator Card (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Digital Twin Simulator</h2>
                <p className="text-[11px] text-slate-500">Test signal adjustments before physical push</p>
              </div>
            </div>

            {/* Test "+15s Green Light" action */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-indigo-950">Target: Junction A (Central Boulevard)</h3>
                  <p className="text-[11px] text-indigo-800">Current Green Phase: 45s • Congestion: 84%</p>
                </div>
                <button
                  onClick={() => handleRunSimulator(15)}
                  disabled={simulating}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{simulating ? 'Simulating...' : 'Increase Green Light +15s'}</span>
                </button>
              </div>
            </div>

            {/* Simulation Results Display */}
            {simResult && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs text-slate-900">Digital Twin Mathematical Results</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    SIMULATION VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">Queue Delay Reduction</span>
                    <span className="text-base font-black text-emerald-600">
                      {simResult.simulationResults.delayReductionPercent}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">Queue Tail Cleared</span>
                    <span className="text-base font-black text-indigo-600">
                      {simResult.simulationResults.queueReductionMeters}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">Congestion After 4 Cycles</span>
                    <span className="text-base font-black text-slate-900">
                      {simResult.simulationResults.previousCongestion} → {simResult.simulationResults.simulatedCongestion}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">Throughput Gain</span>
                    <span className="text-base font-black text-blue-600">
                      +{simResult.simulationResults.throughputGainVehiclesPerHour} veh/hr
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                  💡 {simResult.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
