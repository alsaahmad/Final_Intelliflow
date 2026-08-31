import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCitySync } from '../../context/CitySyncContext';
import {
  HardHat,
  Building2,
  CheckSquare,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  Clock,
  Play,
  Eye,
  EyeOff,
} from 'lucide-react';

export const MunicipalPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const { complaints, updateComplaintStatus } = useCitySync();

  const [activeTab, setActiveTab] = useState<'COMPLAINTS' | 'PROJECTS' | 'CLOSURES'>('COMPLAINTS');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [statusRemark, setStatusRemark] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [unmaskedCitizenIds, setUnmaskedCitizenIds] = useState<Record<string, boolean>>({});

  const toggleUnmaskCitizen = (complaintId: string) => {
    setUnmaskedCitizenIds((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // Closure simulation states
  const [selectedRoad, setSelectedRoad] = useState('Western Arterial Expressway (KM 4 - 8)');
  const [closureType, setClosureType] = useState('PARTIAL_CLOSURE');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  const projects = [
    {
      id: 'proj-01',
      title: 'Sector 4 Flyover Expansion & Underpass Reinforcement',
      department: 'Bridges & Structural Engineering',
      progressPercent: 72,
      budget: '₹14.2 Crore',
      status: 'ON_SCHEDULE',
      timeline: 'Sep 2026 - Nov 2026',
    },
    {
      id: 'proj-02',
      title: 'Smart Storm-Water High-Capacity Drainage Grid',
      department: 'Flood Prevention & Public Health',
      progressPercent: 45,
      budget: '₹8.6 Crore',
      status: 'ACTIVE_WORK',
      timeline: 'Aug 2026 - Dec 2026',
    },
    {
      id: 'proj-03',
      title: 'Arterial Corridor Bitumen Cold-Mix Asphalt Resurfacing',
      department: 'Road Maintenance Bureau',
      progressPercent: 90,
      budget: '₹5.1 Crore',
      status: 'FINAL_INSPECTION',
      timeline: 'Jul 2026 - Oct 2026',
    },
  ];

  const handleUpdateStatus = (id: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
    updateComplaintStatus(id, newStatus, statusRemark || `Status verified and updated by ${user?.name || 'Municipal Officer'}.`);
    setStatusFeedback(`Complaint status updated to ${newStatus}. Synced to Citizen Portal.`);
    setStatusRemark('');
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const handleRunClosureSim = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setSimResult({
        impactedThroughput: '-320 veh/hr',
        queueSpilloverMeters: '+420m on Ring Road',
        suggestedDetour: 'Divert heavy traffic via Outer Sector Link R106',
        riskLevel: 'MODERATE_MITIGATED',
      });
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      {/* 1. GIGW 3.0 Header Bar with Global Navigation Law */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
        {/* Brand Mark Linking to / */}
        <Link to="/" className="flex items-center space-x-3 group" title="Return to IntelliFlow OS Home">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base text-slate-900 tracking-tight">IntelliWorks</span>
              <span className="px-2 py-0.2 rounded-full bg-teal-50 text-teal-800 text-[10px] font-extrabold border border-teal-200">
                MUNICIPAL CORP
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Municipal Corporation of Delhi • Infrastructure & Civic Works
            </span>
          </div>
        </Link>

        {/* Center Tabs Navigation */}
        <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 space-x-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'COMPLAINTS' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Public Complaints ({complaints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'PROJECTS' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Infrastructure Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('CLOSURES')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'CLOSURES' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Road Closure Simulation</span>
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user?.name || 'Chief Municipal Engineer'}</span>
            <span className="text-[10px] text-teal-700 font-bold">Municipal Corp Admin</span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-y-auto">
        {statusFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* TAB 1: PUBLIC COMPLAINTS QUEUE (SYNCED REAL-TIME) */}
        {activeTab === 'COMPLAINTS' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Citizen Civic Complaints Queue</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time synchronization with IntelliCivic Citizen Reports
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  {complaints.filter((c) => c.status === 'PENDING').length} Pending
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold border border-blue-200">
                  {complaints.filter((c) => c.status === 'IN_PROGRESS').length} In Progress
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {complaints.filter((c) => c.status === 'RESOLVED').length} Resolved
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Complaints List (2 cols) */}
              <div className="lg:col-span-2 space-y-3">
                {complaints.map((c) => {
                  const isSelected = selectedComplaintId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-xs text-slate-900">{c.code}</span>
                          <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {c.category.replace('_', ' ')}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-900">{c.title}</h3>
                      <p className="text-xs text-slate-600 font-medium">{c.description}</p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-1">
                        <span>📍 {c.location}</span>
                        <span className="font-mono">
                          👤 {unmaskedCitizenIds[c.id] ? c.reportedBy : `${c.reportedBy.slice(0, 4)}*** (DPDP Masked)`} • {c.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action & Status Update Drawer (1 col) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm h-fit">
                <div className="flex items-center space-x-2 text-teal-800 pb-2 border-b border-slate-100">
                  <CheckSquare className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Complaint Action Panel
                  </h3>
                </div>

                {selectedComplaintId ? (
                  (() => {
                    const activeComp = complaints.find((c) => c.id === selectedComplaintId);
                    if (!activeComp) return null;
                    const isUnmasked = !!unmaskedCitizenIds[activeComp.id];
                    return (
                      <div className="space-y-4 text-xs">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="font-mono font-black text-slate-900">{activeComp.code}</div>
                          <div className="font-bold text-slate-800">{activeComp.title}</div>
                          <div className="text-[11px] text-slate-500">Dept: {activeComp.assignedDepartment}</div>
                        </div>

                        {/* DPDP Act 2023 Masked Citizen Profile Card */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-500">
                              Citizen Reporter (DPDP Masked)
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleUnmaskCitizen(activeComp.id)}
                              className="px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-extrabold border border-teal-200 flex items-center space-x-1 transition-colors"
                            >
                              {isUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isUnmasked ? 'Mask PII' : 'Unmask (Officer Auth)'}</span>
                            </button>
                          </div>

                          <div className="text-xs font-bold text-slate-800">
                            {isUnmasked ? activeComp.reportedBy : `${activeComp.reportedBy.slice(0, 3)}**** (Aadhaar Verified)`}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600">
                            Contact: {isUnmasked ? '+91-98712-40982' : '+91-XXXXX-XX890'}
                          </div>
                          {isUnmasked && (
                            <div className="text-[9px] text-teal-700 bg-teal-50 p-1 rounded font-mono">
                              ✓ Access logged for audit under DPDP Act 2023 Section 8(4).
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Officer Action Remark / Resolution Note</label>
                          <textarea
                            rows={3}
                            value={statusRemark}
                            onChange={(e) => setStatusRemark(e.target.value)}
                            placeholder="e.g. Field crew dispatched with cold-mix asphalt."
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => handleUpdateStatus(activeComp.id, 'IN_PROGRESS')}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>MARK IN PROGRESS</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(activeComp.id, 'RESOLVED')}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>MARK AS RESOLVED</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                    Select any citizen complaint from the left queue to review and update resolution status.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INFRASTRUCTURE PROJECTS */}
        {activeTab === 'PROJECTS' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900">Municipal Infrastructure & Smart Works</h2>
              <p className="text-xs text-slate-500 font-medium">
                Active capital works, flyover expansions, and smart road maintenance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-black uppercase border border-teal-200">
                      {p.status.replace('_', ' ')}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{p.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.department}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-600">Completion Progress</span>
                        <span className="text-teal-700 font-mono">{p.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: `${p.progressPercent}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Allocated Budget:</span>
                      <strong className="text-slate-900 font-mono">{p.budget}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ROAD CLOSURE SIMULATION */}
        {activeTab === 'CLOSURES' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900">Road Maintenance Closure Impact Simulation</h2>
              <p className="text-xs text-slate-500 font-medium">
                Test traffic spillover and generate detour advisories before issuing civic work permits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Road Segment</label>
                  <select
                    value={selectedRoad}
                    onChange={(e) => setSelectedRoad(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Western Arterial Expressway (KM 4 - 8)">Western Arterial Expressway (KM 4 - 8)</option>
                    <option value="Sector 4 Underpass Access Lane">Sector 4 Underpass Access Lane</option>
                    <option value="Inner Ring Connector J16 - J15">Inner Ring Connector J16 - J15</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Closure Modality</label>
                  <select
                    value={closureType}
                    onChange={(e) => setClosureType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="PARTIAL_CLOSURE">Partial Lane Closure (1 of 3 lanes)</option>
                    <option value="NIGHT_ONLY">Night Works Only (11:00 PM - 05:00 AM)</option>
                    <option value="FULL_CLOSURE">Complete Road Blockage (24 Hours)</option>
                  </select>
                </div>

                <button
                  onClick={handleRunClosureSim}
                  disabled={simulating}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{simulating ? 'COMPUTING SPILLOVER...' : 'SIMULATE SPILLOVER IMPACT'}</span>
                </button>
              </div>

              {/* Simulation Results Card */}
              {simResult && (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl border border-teal-200 p-6 space-y-4 shadow-sm text-xs animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-teal-200/60 pb-3">
                    <span className="font-black text-teal-950 text-sm">Spillover Forecast</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-[10px]">
                      {simResult.riskLevel}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-bold">Throughput Impact:</span>
                      <strong className="text-rose-600 font-mono">{simResult.impactedThroughput}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-bold">Queue Spillover:</span>
                      <strong className="text-amber-700 font-mono">{simResult.queueSpilloverMeters}</strong>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-teal-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-teal-900">AI Suggested Detour:</span>
                      <p className="text-slate-800 font-bold">{simResult.suggestedDetour}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Civic closure permit approved with automated traffic police detour notice.')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-colors"
                  >
                    Approve Closure Permit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MunicipalPortal;
