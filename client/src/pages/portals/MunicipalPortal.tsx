import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/authClient';
import {
  Building2,
  HardHat,
  CheckSquare,
  Cpu,
  LogOut,
  MapPin,
  Play,
  CheckCircle2,
  XCircle,
  Menu,
  X,
} from 'lucide-react';

export const MunicipalPortal: React.FC = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'approvals'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  // Closure simulation states
  const [selectedRoad, setSelectedRoad] = useState('Western Arterial Expressway (KM 4 - 8)');
  const [closureType, setClosureType] = useState('FULL_CLOSURE');
  const durationDays = 3;
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Approval decision state
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchMunicipalData = async () => {
    try {
      const [projRes, appRes] = await Promise.all([
        api.get('/api/municipal/projects'),
        api.get('/api/municipal/approvals'),
      ]);
      setProjects(projRes.data.projects || []);
      setApprovals(appRes.data.approvals || []);
    } catch (err) {
      console.error('Failed to load municipal data:', err);
    }
  };

  useEffect(() => {
    fetchMunicipalData();
  }, []);

  const handleRunClosureSimulation = async () => {
    setSimulating(true);
    try {
      const res = await api.post('/api/municipal/closure-simulation', {
        roadSegment: selectedRoad,
        closureType,
        durationDays,
      });
      setSimResult(res.data.simulation);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Simulation execution failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleDecision = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post(`/api/municipal/approvals/${id}/decision`, {
        decision,
        comments: `Decision verified by ${user?.name}`,
      });
      setActionFeedback(`Road Plan #${id} has been marked as ${decision}.`);
      fetchMunicipalData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update approval decision.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900">IntelliFlow AI</span>
            <span className="text-[10px] text-teal-700 font-semibold block">Municipal Corp Portal</span>
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
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">IntelliFlow</span>
                <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[10px] font-black uppercase">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Municipal Works</span>
            </div>
          </div>

          {/* Officer Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider">
              Urban Planning Directorate
            </div>
            <div className="font-bold text-xs text-slate-900 truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-500 truncate">Badge #{user?.badge_number || 'MC-1088'}</div>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'overview'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>City Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('infrastructure');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'infrastructure'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Infrastructure</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('approvals');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'approvals'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Approvals</span>
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
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>MUNICIPAL INFRASTRUCTURE & URBAN PLANNING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Municipal Corporation Directorate
            </h1>
            <p className="text-xs text-slate-500">
              Civil capital projects tracking, road closure approval workflows, and traffic diversion simulations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Active Projects</div>
              <div className="text-lg font-black text-teal-700">{projects.length} Works</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Pending Approvals</div>
              <div className="text-lg font-black text-amber-600">
                {approvals.filter((a) => a.status === 'PENDING').length} Plans
              </div>
            </div>
          </div>
        </div>

        {actionFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-emerald-700 font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* 1. Feature: Traffic Impact Simulation on Proposed Road Closures */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Traffic Impact Simulation on Road Closures</h2>
              <p className="text-[11px] text-slate-500">
                Simulate network diversion volume, secondary bottleneck risks, and estimated delays
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Road Corridor</label>
              <select
                value={selectedRoad}
                onChange={(e) => setSelectedRoad(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Western Arterial Expressway (KM 4 - 8)">
                  Western Arterial Expressway (KM 4 - 8)
                </option>
                <option value="Central Boulevard Underpass Corridor">Central Boulevard Underpass Corridor</option>
                <option value="Sector 7 Market Cross Road">Sector 7 Market Cross Road</option>
                <option value="Tech Park Flyover Slip Road">Tech Park Flyover Slip Road</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Closure Configuration</label>
              <select
                value={closureType}
                onChange={(e) => setClosureType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="FULL_CLOSURE">Full Road Closure (Both Directions)</option>
                <option value="SINGLE_LANE">Single Lane Partial Closure</option>
                <option value="NIGHT_ONLY">Night Window Only (01:00 AM - 06:00 AM)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRunClosureSimulation}
                disabled={simulating}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{simulating ? 'Running Simulation...' : 'Run Traffic Impact Simulation'}</span>
              </button>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-xs text-slate-900">
                  Simulation Outcome: {simResult.roadSegment}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                    simResult.impactScore === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {simResult.impactScore} TRAFFIC IMPACT
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Diverted Volume</span>
                  <span className="text-base font-black text-rose-600">
                    +{simResult.divertedVehiclesPerHour} veh/hr
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Estimated Commute Delay</span>
                  <span className="text-base font-black text-amber-600">
                    +{simResult.estimatedAverageDelayMins} Mins
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Secondary Grid Load</span>
                  <span className="text-base font-black text-slate-900">
                    {simResult.secondaryCorridorCongestionPct}% Peak
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Detours Available</span>
                  <span className="text-base font-black text-teal-700">
                    {simResult.suggestedDetours?.length || 2} Corridors
                  </span>
                </div>
              </div>

              {/* Detour corridors */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">Recommended Detour Corridors:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {simResult.suggestedDetours?.map((det: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{det.routeName}</div>
                        <div className="text-[11px] text-slate-500">
                          +{det.extraDistanceKm} km • ETA added: {det.etaAddedMins}m
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        {det.capacityPct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Cards showing "Active Construction Projects" */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <HardHat className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Construction Projects</h2>
                <p className="text-[11px] text-slate-500">Capital works, timelines, contractors, and progress</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">{projects.length} Monitored</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {proj.project_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        proj.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{proj.name}</h3>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{proj.location}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Contractor: <strong className="text-slate-800">{proj.contractor}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-teal-700">{proj.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Budget: ₹{proj.budget_crores} Cr</span>
                    <span>Target: {proj.estimated_completion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Cards showing "Pending Road Plan Approvals" */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Pending Road Plan Approvals</h2>
                <p className="text-[11px] text-slate-500">Review infrastructure modification requests</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {approvals.filter((a) => a.status === 'PENDING').length} Awaiting Action
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Plan Proposal</th>
                  <th className="pb-2">Proposed Agency</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Traffic Impact</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-bold text-slate-500">#{app.id}</td>
                    <td className="py-3 font-bold text-slate-900">{app.title}</td>
                    <td className="py-3 text-slate-600">{app.proposed_by}</td>
                    <td className="py-3 text-slate-600">{app.location}</td>
                    <td className="py-3 font-medium text-slate-700">{app.closure_duration}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.traffic_impact_level === 'HIGH' || app.traffic_impact_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {app.traffic_impact_level}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDecision(app.id, 'APPROVED')}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleDecision(app.id, 'REJECTED')}
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-bold text-xs transition-colors flex items-center space-x-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Decision Recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
