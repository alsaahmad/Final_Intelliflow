import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/authClient';
import {
  Home,
  AlertTriangle,
  LogOut,
  PhoneCall,
  MapPin,
  Send,
  CheckCircle2,
  Layers,
  Activity,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const { user, logout } = useAuth();

  // Active view in sidebar
  const [activeTab, setActiveTab] = useState<'home' | 'report'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SOS Emergency Modal State
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosEta] = useState(4);
  const [sosLoading, setSosLoading] = useState(false);

  // Form State for "Report Public Problem"
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('POTHOLE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Map & Incidents state
  const [myReports, setMyReports] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const fetchCitizenData = async () => {
    try {
      const overviewRes = await api.get('/api/citizen/incidents');
      setMyReports(overviewRes.data.myReports || []);
    } catch (err) {
      console.error('Failed to load citizen data:', err);
    }
  };

  useEffect(() => {
    fetchCitizenData();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess(null);
    try {
      await api.post('/api/citizen/incidents', {
        title,
        category,
        location,
        description,
        severity,
      });
      setFormSuccess('Public problem report submitted successfully! Civic authorities notified.');
      setTitle('');
      setLocation('');
      setDescription('');
      fetchCitizenData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit problem report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerSOS = async () => {
    setSosLoading(true);
    try {
      await api.post('/api/citizen/sos', {
        location: 'Current Citizen Location (Sector 4 GPS)',
        emergencyType: '112_GENERAL_DISTRESS',
      });
      setSosTriggered(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to trigger SOS.');
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900">IntelliFlow AI</span>
            <span className="text-[10px] text-blue-600 font-semibold block">Citizen Portal</span>
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
          {/* Platform Logo */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">IntelliFlow</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  AI
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Citizen Services</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">Verified Resident</div>
            <div className="font-bold text-xs text-slate-900 truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'home'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('report');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'report'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Incident</span>
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
        {/* Top Greeting & Prominent 112 SOS Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>CITIZEN DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hello, {user?.name || 'Citizen'}
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Access real-time municipal traffic telemetry, report civic hazards, and broadcast distress beacons directly to emergency services.
            </p>
          </div>

          {/* Prominent Red 112 SOS Emergency Button */}
          <div className="w-full md:w-auto">
            <button
              onClick={() => {
                setSosModalOpen(true);
                setSosTriggered(false);
              }}
              className="w-full md:w-auto px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-3 transition-all animate-pulse"
            >
              <PhoneCall className="w-6 h-6 animate-bounce" />
              <span>112 SOS EMERGENCY</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Live Traffic Map Card & Quick Problem Report Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live Traffic Map Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Live Traffic Map</h2>
                  <p className="text-[11px] text-slate-500">Metropolitan Road Sensors & Incident Pins</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  ● Live Telemetry
                </span>
              </div>
            </div>

            {/* Interactive SVG / Canvas Map Visualization */}
            <div className="relative w-full h-80 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex flex-col justify-between p-4">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'radial-gradient(#94a3b8 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #f8fafc 1.5px)',
                  backgroundSize: '24px 24px',
                  backgroundPosition: '0 0, 12px 12px',
                }}
              />

              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <line x1="10%" y1="35%" x2="90%" y2="35%" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <line x1="10%" y1="35%" x2="50%" y2="35%" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
                <line x1="50%" y1="35%" x2="90%" y2="35%" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />

                <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <line x1="50%" y1="10%" x2="50%" y2="60%" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                <line x1="50%" y1="60%" x2="50%" y2="90%" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />

                <line x1="15%" y1="80%" x2="85%" y2="20%" stroke="#3b82f6" strokeWidth="4" strokeDasharray="6,6" />
              </svg>

              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded bg-white/90 shadow text-slate-700 font-bold text-[10px]">
                  Sector A: Central Ring
                </span>
                <span className="px-2 py-1 rounded bg-white/90 shadow text-slate-700 font-bold text-[10px]">
                  Sector D: Tech Zone
                </span>
              </div>

              {/* Junction A Pin */}
              <div
                onClick={() =>
                  setSelectedIncident({
                    name: 'Junction A (Central Blvd)',
                    status: 'HEAVY CONGESTION (84%)',
                    details: 'Predicted Delay: +18m due to peak commute',
                  })
                }
                className="absolute top-[32%] left-[47%] z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 animate-ping absolute" />
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white">
                    A
                  </div>
                </div>
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-lg">
                  Junction A: Severe Congestion
                </div>
              </div>

              {/* Junction B Pin */}
              <div
                onClick={() =>
                  setSelectedIncident({
                    name: 'Junction B (Metro Toll)',
                    status: 'MODERATE (56%)',
                    details: 'Traffic moving steadily at 32 km/h',
                  })
                }
                className="absolute top-[32%] left-[75%] z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white">
                  B
                </div>
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-lg">
                  Junction B: Flow Clear
                </div>
              </div>

              {/* Pothole Incident Marker */}
              <div
                onClick={() =>
                  setSelectedIncident({
                    name: 'Civic Report #1',
                    status: 'POTHOLE HAZARD',
                    details: 'Sector 4 right lane hazard. Crew dispatched.',
                  })
                }
                className="absolute top-[65%] left-[48%] z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
              >
                <div className="p-1 rounded-full bg-amber-500 text-white shadow-md border border-white">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-lg">
                  Hazard: Pothole Reported
                </div>
              </div>

              {/* Bottom Legend */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 text-[10px]">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> <span>Optimal (&lt;40%)</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> <span>Moderate (40-70%)</span>
                  </span>
                  <span className="flex items-center space-x-1 text-rose-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> <span>Heavy (&gt;70%)</span>
                  </span>
                </div>
                <span className="text-slate-500 font-medium">Click nodes to inspect details</span>
              </div>
            </div>

            {/* Selected Node Details Box */}
            {selectedIncident && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-blue-900">{selectedIncident.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                    {selectedIncident.status}
                  </span>
                  <p className="text-slate-600 text-[11px] mt-0.5">{selectedIncident.details}</p>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Quick Form: "Report Public Problem" (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Report Public Problem</h2>
                <p className="text-[11px] text-slate-500">Potholes, Signal Malfunctions, Waterlogging</p>
              </div>
            </div>

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hazard Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="POTHOLE">Pothole / Road Damage</option>
                  <option value="SIGNAL_FAILURE">Traffic Signal Failure / Blinking Amber</option>
                  <option value="WATERLOGGING">Monsoon Waterlogging / Flooded Street</option>
                  <option value="ACCIDENT">Traffic Accident / Blocked Lane</option>
                  <option value="OTHER">Other Civic Obstruction</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep crater near signal cross"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / Landmark</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Central Boulevard Sector 4 near Metro"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-1.5 rounded-lg border text-center transition-all ${
                        severity === lvl
                          ? lvl === 'HIGH'
                            ? 'bg-rose-50 border-rose-400 text-rose-800'
                            : 'bg-blue-50 border-blue-400 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any specific lane details, traffic blockage severity..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Report...' : 'Submit Incident Report'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* My Reported Grievances History Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">My Submitted Problem Reports</h3>
            <span className="text-xs text-slate-500">{myReports.length} Total Reports</span>
          </div>

          {myReports.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No problem reports filed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Hazard Title</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Severity</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Assigned Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-slate-500">#{report.id}</td>
                      <td className="py-2.5 font-bold text-slate-900">{report.title}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {report.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{report.location}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            report.severity === 'CRITICAL' || report.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : report.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {report.severity}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            report.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 text-[11px]">{report.assigned_department || 'Municipal Corp'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 112 SOS Emergency Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-rose-300 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 text-center">
            {!sosTriggered ? (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase">
                    National Emergency Service
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">Broadcast 112 SOS Distress Signal?</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This will immediately broadcast your exact GPS coordinates to the Metropolitan Police Command, 108 Emergency Medical Services, and Fire Control.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSosModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTriggerSOS}
                    disabled={sosLoading}
                    className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                  >
                    {sosLoading ? 'Broadcasting...' : 'CONFIRM SOS (112)'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
                    SOS ACTIVE • UNITS DISPATCHED
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">Help is on the way</h3>
                  <p className="text-xs text-slate-600">
                    Emergency Squad 09 & Ambulance Alpha-108 have received your beacon with priority green wave corridor clearance.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <div className="text-xs text-slate-500 font-semibold">Estimated Responder ETA</div>
                  <div className="text-3xl font-black text-rose-600 font-mono">{sosEta} Minutes</div>
                </div>
                <button
                  onClick={() => setSosModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Close & Keep Beacon Active
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
