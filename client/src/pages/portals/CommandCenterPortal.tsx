import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { emergencyApiClient } from '../../api/emergencyApiClient';
import { infrastructureApiClient } from '../../api/infrastructureApiClient';
import {
  Activity,
  Radio,
  Clock,
  HeartPulse,
  AlertTriangle,
  FileText,
  LogOut,
  TrendingDown,
  Zap,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';

export const CommandCenterPortal: React.FC = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'emergency' | 'logs'>('analytics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // New Green Corridor dispatch modal state
  const [corridorModalOpen, setCorridorModalOpen] = useState(false);
  const [corridorName, setCorridorName] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('EMS Ambulance Alpha-108');
  const [corridorRoute, setCorridorRoute] = useState('Junction A -> Hospital Trauma Corridor');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const fetchCommandData = async () => {
    try {
      const [monitoring, infraOverview] = await Promise.all([
        emergencyApiClient.getMonitoring().catch(() => ({
          active_sos: [
            { code: 'SOS-112-9182', citizen_name: 'Rahul S. (DEMO - Masked)', location: 'Connaught Center', priority: 'CODE_RED_112', status: 'DISPATCHED', is_simulated: true }
          ],
          green_corridors: [
            { name: 'Trauma Priority Wave 01', assigned_unit: 'EMS-ALPHA-108', corridor_route: 'Junction A -> Hospital', status: 'ACTIVE', is_simulated: true }
          ],
          emergency_units: [
            { unit_id: 'EMS-ALPHA-108', type: 'Advanced Cardiac Ambulance', status: 'IN_TRANSIT', speed_kmh: 68, gps: 'Sector C' }
          ]
        })),
        infrastructureApiClient.getOverview().catch(() => ({
          summary: { totalProjects: 3, activeProjects: 2, totalBudgetCrores: 34.5, pendingApprovals: 1 }
        }))
      ]);

      setEmergencyData(monitoring);
      setOverview({
        activeIncidents: monitoring.active_sos?.length || 2,
        activeGreenCorridors: monitoring.green_corridors?.length || 1,
        totalRespondersInField: 18,
        averageEmergencyResponseTimeMins: 4.2,
        infraOverview: infraOverview.summary,
      });
      setLogs([
        { id: 1, event: 'GREEN_CORRIDOR_CREATED', details: 'Corridor Trauma Priority Wave 01 activated', timestamp: 'Just now' },
        { id: 2, event: 'SOS_BEACON_DISPATCHED', details: 'Unit EMS-ALPHA-07 dispatched to Sector 4', timestamp: '5 mins ago' }
      ]);
    } catch (err) {
      console.error('Failed to load command center data:', err);
    }
  };

  useEffect(() => {
    fetchCommandData();
  }, []);

  const handleCreateGreenCorridor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await emergencyApiClient.createGreenCorridor({
        name: corridorName,
        assigned_unit: assignedUnit,
        corridor_route: corridorRoute,
        eta_minutes: 6,
        speed_kmh: 68,
      });
      setDispatchSuccess(`Priority Green Corridor "${corridorName}" activated across signals [SIMULATED].`);
      setCorridorModalOpen(false);
      setCorridorName('');
      fetchCommandData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch green corridor.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-sm">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900">IntelliFlow AI</span>
            <span className="text-[10px] text-amber-800 font-semibold block">Integrated Command Center</span>
          </div>
        </div>
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
          {/* Logo */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">IntelliFlow</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Command & Control</span>
            </div>
          </div>

          {/* Commander Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
              ICCC Commanding Officer
            </div>
            <div className="font-bold text-xs text-slate-900 truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-500 truncate">Badge #{user?.badge_number || 'ICCC-01'}</div>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('analytics');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'analytics'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>City Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('emergency');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'emergency'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>Emergency Monitoring</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('logs');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'logs'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Logs</span>
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
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top High-Level City Overview Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>INTEGRATED COMMAND & CONTROL CENTER (ICCC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Metropolitan High-Level Overview
            </h1>
            <p className="text-xs text-slate-500">
              Citywide arterial flow status, priority emergency wave preemption, and multi-agency response.
            </p>
          </div>

          <div>
            <button
              onClick={() => setCorridorModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition-all flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Activate Green Corridor</span>
            </button>
          </div>
        </div>

        {dispatchSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{dispatchSuccess}</span>
            </div>
            <button onClick={() => setDispatchSuccess(null)} className="text-emerald-700 font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* 3 Core Metric Cards: "Average Travel Time", "Active Green Corridors", "System Alerts" */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* 1. Average Travel Time */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3" />
                <span>12.8%</span>
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Travel Time</span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                {overview?.metrics?.averageTravelTime?.value || '18.4 mins'}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              {overview?.metrics?.averageTravelTime?.comparison || '-12.8% vs last week average'}
            </p>
          </div>

          {/* 2. Active Green Corridors */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 space-y-3 bg-gradient-to-b from-rose-50/30 to-white">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase animate-pulse">
                PRIORITY ACTIVE
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Green Corridors</span>
              <div className="text-3xl font-black text-rose-600 tracking-tight mt-1">
                {overview?.metrics?.activeGreenCorridors?.value || '2 Active'}
              </div>
            </div>

            <p className="text-[11px] text-rose-700 font-semibold">
              {overview?.metrics?.activeGreenCorridors?.details || 'Emergency Priority Signal Waves Enabled'}
            </p>
          </div>

          {/* 3. System Alerts */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-3 bg-gradient-to-b from-amber-50/30 to-white">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                MONITORING
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Alerts</span>
              <div className="text-3xl font-black text-amber-700 tracking-tight mt-1">
                {overview?.metrics?.systemAlerts?.value || '4 Alerts'}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium">
              Active SOS alerts and critical civic bottleneck notifications
            </p>
          </div>
        </div>

        {/* Live Emergency Monitoring Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Green Corridor Priority Tracking</h2>
                <p className="text-[11px] text-slate-500">Real-time green light hold & vehicle speed synchronization</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {emergencyData?.greenCorridors?.length || 0} Total Corridors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyData?.greenCorridors?.map((gc: any) => (
              <div key={gc.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      CORRIDOR #{gc.id}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{gc.name}</h3>
                    <p className="text-xs text-slate-600">{gc.assigned_unit}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-600 font-mono">{gc.eta_minutes}m ETA</span>
                    <span className="text-[10px] text-slate-500 block">Speed: {gc.speed_kmh} km/h</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs text-slate-700 flex items-center justify-between">
                  <span>Route: <strong>{gc.corridor_route}</strong></span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    Signals: {gc.signals_cleared}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time System Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Metropolitan System Activity Logs</h2>
                <p className="text-[11px] text-slate-500">Audit trail of logins, overrides, and emergency alerts</p>
              </div>
            </div>
            <button
              onClick={fetchCommandData}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Refresh Telemetry
            </button>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Details</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">User / Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 text-slate-400">#{log.id}</td>
                    <td className="py-2.5 text-slate-500 text-[11px] font-sans">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 font-sans">{log.action}</td>
                    <td className="py-2.5 text-slate-600 font-sans max-w-xs truncate">{log.details}</td>
                    <td className="py-2.5 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : log.severity === 'WARN'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 font-sans text-[11px]">
                      {log.user_name || 'System Auto'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Activate Green Corridor Modal */}
      {corridorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <HeartPulse className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Activate Emergency Green Corridor</h3>
              </div>
              <button
                onClick={() => setCorridorModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGreenCorridor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corridor Name</label>
                <input
                  type="text"
                  required
                  value={corridorName}
                  onChange={(e) => setCorridorName(e.target.value)}
                  placeholder="e.g. Trauma Wave 03 (Cardiac Distress)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Emergency Unit</label>
                <input
                  type="text"
                  required
                  value={assignedUnit}
                  onChange={(e) => setAssignedUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corridor Route</label>
                <input
                  type="text"
                  required
                  value={corridorRoute}
                  onChange={(e) => setCorridorRoute(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorridorModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
                >
                  Confirm & Preempt Signals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
