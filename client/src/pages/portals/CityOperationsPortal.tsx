import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCitySync } from '../../context/CitySyncContext';
import api from '../../api/authClient';
import { infrastructureApiClient } from '../../api/infrastructureApiClient';
import { emergencyApiClient } from '../../api/emergencyApiClient';

import { DualMapView, MapMarker } from '../../components/map/DualMapView';
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
  Building2,
  CheckSquare,
  Play,
  Eye,
  EyeOff,
  Map as MapIcon,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check,
  Cpu,
} from 'lucide-react';

export type CityOpsTab =
  | 'overview'
  | 'map'
  | 'traffic'
  | 'complaints'
  | 'infrastructure'
  | 'closures'
  | 'digital-twin'
  | 'simulation'
  | 'analytics';

export const CityOperationsPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { complaints, updateComplaintStatus } = useCitySync();

  // Tab state initialized from URL query param if present
  const initialTab = (searchParams.get('tab') as CityOpsTab) || 'overview';
  const [activeTab, setActiveTab] = useState<CityOpsTab>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync tab change with URL
  const handleTabChange = (tab: CityOpsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  // Command Center Data States
  const [overview, setOverview] = useState<any>(null);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Municipal Data States
  const [municipalStats, setMunicipalStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([
    {
      id: 'proj-01',
      project_code: 'PRJ-201',
      title: 'Sector 4 Flyover Expansion & Underpass Reinforcement',
      name: 'Sector 4 Flyover Expansion & Underpass Reinforcement',
      department: 'Bridges & Structural Engineering',
      contractor: 'L&T Infrastructure',
      progressPercent: 72,
      progress: 72,
      budget: '₹14.2 Crore',
      budget_crores: 14.2,
      status: 'IN_PROGRESS',
      estimated_completion: 'Nov 2026',
      timeline: 'Sep 2026 - Nov 2026',
      traffic_diversion_active: true,
    },
    {
      id: 'proj-02',
      project_code: 'PRJ-202',
      title: 'Smart Storm-Water High-Capacity Drainage Grid',
      name: 'Smart Storm-Water High-Capacity Drainage Grid',
      department: 'Flood Prevention & Public Health',
      contractor: 'NCC Urban Works',
      progressPercent: 45,
      progress: 45,
      budget: '₹8.6 Crore',
      budget_crores: 8.6,
      status: 'IN_PROGRESS',
      estimated_completion: 'Dec 2026',
      timeline: 'Aug 2026 - Dec 2026',
      traffic_diversion_active: false,
    },
    {
      id: 'proj-03',
      project_code: 'PRJ-203',
      title: 'Arterial Corridor Bitumen Cold-Mix Asphalt Resurfacing',
      name: 'Arterial Corridor Bitumen Cold-Mix Asphalt Resurfacing',
      department: 'Road Maintenance Bureau',
      contractor: 'Afcons Infra',
      progressPercent: 90,
      progress: 90,
      budget: '₹5.1 Crore',
      budget_crores: 5.1,
      status: 'IN_PROGRESS',
      estimated_completion: 'Oct 2026',
      timeline: 'Jul 2026 - Oct 2026',
      traffic_diversion_active: true,
    },
  ]);
  const [approvals, setApprovals] = useState<any[]>([
    {
      id: 1,
      title: 'Underground Cable Ducting Closure',
      proposed_by: 'State Power Distribution Ltd',
      location: 'Western Express Arterial',
      closure_duration: '3 Days (Weekend)',
      estimated_delay_mins: 14,
      traffic_impact_level: 'HIGH',
      status: 'PENDING',
      comments: 'Requires traffic diversion via Outer Ring Road',
    },
    {
      id: 2,
      title: 'Water Main Replacement Project',
      proposed_by: 'Municipal Water Board',
      location: 'Sector 7 Market Cross',
      closure_duration: '24 Hours',
      estimated_delay_mins: 8,
      traffic_impact_level: 'MODERATE',
      status: 'PENDING',
      comments: 'Partial single-lane night closure proposed',
    },
    {
      id: 3,
      title: 'Pedestrian Skywalk Girder Placement',
      proposed_by: 'Urban Mobility Authority',
      location: 'Metro Station Gate 2',
      closure_duration: '6 Hours (Night)',
      estimated_delay_mins: 4,
      traffic_impact_level: 'LOW',
      status: 'APPROVED',
      comments: 'Scheduled for Sunday 01:00 AM - 07:00 AM',
    },
  ]);

  // Complaints / Grievance Management States
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

  // Road Closure Simulation States
  const [selectedRoad, setSelectedRoad] = useState('Western Arterial Expressway (KM 4 - 8)');
  const [closureType, setClosureType] = useState('PARTIAL_CLOSURE');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Green Corridor Dispatch Modal States
  const [corridorModalOpen, setCorridorModalOpen] = useState(false);
  const [corridorName, setCorridorName] = useState('');
  const [assignedUnit, setAssignedUnit] = useState('EMS Ambulance Alpha-108');
  const [corridorRoute, setCorridorRoute] = useState('Junction A -> Hospital Trauma Corridor');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Filter for Map & Incidents
  const [mapLayerFilter, setMapLayerFilter] = useState<'ALL' | 'JUNCTIONS' | 'INCIDENTS' | 'HOSPITALS'>('ALL');

  // Fetch initial telemetry data
  const fetchData = async () => {
    try {
      const [overRes, emergRes, logsRes, munRes, fastInfraRes, fastEmergRes] = await Promise.allSettled([
        api.get('/api/command/overview'),
        api.get('/api/command/emergency-monitoring'),
        api.get('/api/command/logs'),
        api.get('/api/municipal/overview'),
        infrastructureApiClient.getOverview(),
        emergencyApiClient.getMonitoring(),
      ]);

      if (overRes.status === 'fulfilled') setOverview(overRes.value.data);
      if (emergRes.status === 'fulfilled') setEmergencyData(emergRes.value.data);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.logs || []);
      if (munRes.status === 'fulfilled') {
        setMunicipalStats(munRes.value.data.stats || null);
        if (munRes.value.data.projects?.length) setProjects(munRes.value.data.projects);
        if (munRes.value.data.approvals?.length) setApprovals(munRes.value.data.approvals);
      }

      // FastAPI Phase 3D Infrastructure & Emergency updates (override if available)
      if (fastInfraRes.status === 'fulfilled' && fastInfraRes.value?.success) {
        if (fastInfraRes.value.stats) setMunicipalStats(fastInfraRes.value.stats);
        if (fastInfraRes.value.projects?.length) setProjects(fastInfraRes.value.projects);
        if (fastInfraRes.value.approvals?.length) setApprovals(fastInfraRes.value.approvals);
      }
      if (fastEmergRes.status === 'fulfilled' && fastEmergRes.value?.success) {
        setEmergencyData(fastEmergRes.value);
      }
    } catch (err) {
      console.error('Failed to load City Operations data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update complaint status
  const handleUpdateStatus = (id: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
    updateComplaintStatus(
      id,
      newStatus,
      statusRemark || `Status verified and updated by ${user?.name || 'City Operations Officer'}.`
    );
    setStatusFeedback(`Complaint status updated to ${newStatus}. Synced to Citizen Portal.`);
    setStatusRemark('');
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  // Run road closure simulation via infrastructureApiClient
  const handleRunClosureSim = async () => {
    setSimulating(true);
    try {
      const data = await infrastructureApiClient.runClosureSimulation({
        road_segment: selectedRoad,
        closure_type: closureType === 'PARTIAL_CLOSURE' ? 'SINGLE_LANE' : 'FULL_CLOSURE',
        duration_days: 3,
      });
      if (data?.simulation) {
        setSimResult({
          impactedThroughput: `-${data.simulation.diverted_vehicles_per_hour || data.simulation.divertedVehiclesPerHour} veh/hr`,
          queueSpilloverMeters: `+${(data.simulation.estimated_average_delay_mins || data.simulation.estimatedAverageDelayMins) * 45}m delay`,
          suggestedDetour: (data.simulation.suggested_detours || data.simulation.suggestedDetours)?.[0]?.route_name || (data.simulation.suggested_detours || data.simulation.suggestedDetours)?.[0]?.routeName || 'Divert via Outer Sector Link R106',
          riskLevel: (data.simulation.impact_score || data.simulation.impactScore) === 'CRITICAL' ? 'HIGH_CONGESTION' : 'MODERATE_MITIGATED',
          mitigationPlan: data.simulation.mitigation_plan || data.simulation.mitigationPlan || [],
        });
      }
    } catch {
      // Fallback via legacy Express or local simulation
      try {
        const res = await api.post('/api/municipal/closure-simulation', {
          roadSegment: selectedRoad,
          closureType: closureType === 'PARTIAL_CLOSURE' ? 'SINGLE_LANE' : 'FULL_CLOSURE',
          durationDays: 3,
        });
        if (res.data?.simulation) {
          setSimResult({
            impactedThroughput: `-${res.data.simulation.divertedVehiclesPerHour} veh/hr`,
            queueSpilloverMeters: `+${res.data.simulation.estimatedAverageDelayMins * 45}m delay`,
            suggestedDetour: res.data.simulation.suggestedDetours?.[0]?.routeName || 'Divert via Outer Sector Link R106',
            riskLevel: res.data.simulation.impactScore === 'CRITICAL' ? 'HIGH_CONGESTION' : 'MODERATE_MITIGATED',
            mitigationPlan: res.data.simulation.mitigationPlan || [],
          });
        }
      } catch {
        setTimeout(() => {
          setSimResult({
            impactedThroughput: '-320 veh/hr',
            queueSpilloverMeters: '+420m on Ring Road',
            suggestedDetour: 'Divert heavy traffic via Outer Sector Link R106',
            riskLevel: 'MODERATE_MITIGATED',
            mitigationPlan: [
              'Adjust traffic signals on Detour Alpha +15s green wave during peak hours',
              'Deploy 4 traffic wardens at Sector 8 merge junction',
              'Broadcast public detour advisory on Citizen Portal & GPS feeds 48h prior',
            ],
          });
        }, 500);
      }
    } finally {
      setSimulating(false);
    }
  };

  // Road Plan Approval Decision via infrastructureApiClient
  const handleApprovalDecision = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await infrastructureApiClient.submitApprovalDecision(id, decision);
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision } : a))
      );
      setStatusFeedback(`Road Plan #${id} has been ${decision.toLowerCase()} (FastAPI Synced).`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch {
      try {
        await api.post(`/api/municipal/approvals/${id}/decision`, { decision });
      } catch {}
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: decision } : a))
      );
      setStatusFeedback(`Road Plan #${id} marked as ${decision.toLowerCase()} (Demo Mode).`);
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  // Create Green Corridor via emergencyApiClient
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
      setDispatchSuccess(`[Simulated Wave] Priority Green Corridor "${corridorName}" registered via FastAPI.`);
      setCorridorModalOpen(false);
      setCorridorName('');
      fetchData();
    } catch {
      try {
        await api.post('/api/command/green-corridor', {
          name: corridorName,
          assignedUnit,
          corridorRoute,
          etaMinutes: 6,
          speedKmh: 68,
        });
      } catch {}
      setDispatchSuccess(`[Simulated Wave] Priority Green Corridor "${corridorName}" registered.`);
      setCorridorModalOpen(false);
      setCorridorName('');
    }
  };


  // Map Markers for Live Map View
  const rawMarkers: MapMarker[] = [
    { id: 'j-101', lat: 28.6139, lng: 77.209, title: 'Junction A — Central Blvd (Congestion 84%)', category: 'JUNCTION', badge: 'HEAVY' },
    { id: 'j-102', lat: 28.625, lng: 77.218, title: 'Junction B — Ring Toll (Congestion 56%)', category: 'JUNCTION', badge: 'MODERATE' },
    { id: 'j-103', lat: 28.601, lng: 77.225, title: 'Junction C — Hospital Corridor', category: 'JUNCTION', badge: 'OPTIMAL' },
    { id: 'j-104', lat: 28.638, lng: 77.234, title: 'Junction D — Tech Park Ring', category: 'JUNCTION', badge: 'OPTIMAL' },
    { id: 'h-01', lat: 28.598, lng: 77.228, title: 'City General Trauma Hospital (24 Beds Free)', category: 'HOSPITAL' },
    { id: 'amb-108', lat: 28.61, lng: 77.215, title: 'EMS Ambulance Alpha-108 (Active Corridor)', category: 'AMBULANCE' },
    ...complaints.map((c, idx): MapMarker => ({
      id: `comp-${c.id}`,
      lat: 28.615 + (idx % 3) * 0.008,
      lng: 77.205 + (idx % 4) * 0.007,
      title: `Civic Report: ${c.title} (${c.status})`,
      category: 'INCIDENT',
      badge: c.urgency,
    })),
  ];

  const mapMarkers = rawMarkers.filter((m) => {
    if (mapLayerFilter === 'JUNCTIONS') return m.category === 'JUNCTION';
    if (mapLayerFilter === 'INCIDENTS') return m.category === 'INCIDENT';
    if (mapLayerFilter === 'HOSPITALS') return m.category === 'HOSPITAL' || m.category === 'AMBULANCE';
    return true;
  });

  const navTabs: { id: CityOpsTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'map', label: 'Live City Map', icon: MapIcon },
    { id: 'traffic', label: 'Traffic & Incidents', icon: Radio },
    { id: 'complaints', label: 'Citizen Complaints', icon: CheckSquare, count: complaints.filter((c) => c.status === 'PENDING').length },
    { id: 'infrastructure', label: 'Infrastructure', icon: Building2, count: projects.length },
    { id: 'closures', label: 'Road Closures', icon: AlertTriangle },
    { id: 'digital-twin', label: 'Digital Twin', icon: Layers },
    { id: 'simulation', label: 'Simulation', icon: Cpu },
    { id: 'analytics', label: 'Analytics / Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans select-none">
      {/* 📱 Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <Link to="/" className="flex items-center space-x-2.5" title="Return to Home">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-900">IntelliFlow</span>
            <span className="text-[10px] text-blue-700 font-bold block -mt-0.5">City Operations</span>
          </div>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
            OPERATIONAL
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 🧭 Unified Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-30 sticky top-0 md:h-screen ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Brand & Portal Header */}
          <Link to="/" className="hidden md:flex items-center space-x-3 group" title="Return to Home">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base text-slate-900 tracking-tight">IntelliFlow</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  OPS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold block -mt-0.5">
                City Operations Portal
              </span>
            </div>
          </Link>

          {/* Commander / Officer Profile Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">
                Authority Session
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="font-extrabold text-xs text-slate-900 truncate">
              {user?.name || 'City Operations Officer'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              {user?.department || 'Integrated Municipal & Command Directorate'}
            </div>
          </div>

          {/* 9-Item Unified Navigation List */}
          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            to="/digital-twin"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Launch Digital Twin</span>
            <ExternalLink className="w-3 h-3 text-purple-500" />
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ Main Workspace Content Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Global Feedback Banner */}
        {statusFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{statusFeedback}</span>
            </div>
            <button onClick={() => setStatusFeedback(null)} className="text-emerald-700 font-black text-xs">
              ✕
            </button>
          </div>
        )}

        {dispatchSuccess && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{dispatchSuccess}</span>
            </div>
            <button onClick={() => setDispatchSuccess(null)} className="text-amber-700 font-black text-xs">
              ✕
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: OVERVIEW (METROPOLITAN HIGH-LEVEL DASHBOARD)
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Overview Banner */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>CONSOLIDATED CITY OPERATIONS & GOVERNANCE</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Metropolitan Command & Civic Overview
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Synchronized operational matrix for Traffic Enforcement, Infrastructure Works, and Emergency Priority Waves.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setCorridorModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Simulate Green Wave</span>
                </button>

                <button
                  onClick={() => handleTabChange('closures')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center space-x-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Closure Planner</span>
                </button>
              </div>
            </div>

            {/* 4 Core Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Average Travel Time */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    <span>-12.8%</span>
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Transit Time</span>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                    {overview?.metrics?.averageTravelTime?.value || '18.4 mins'}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">vs peak week baseline (arterial grid)</p>
              </div>

              {/* Card 2: Active Green Corridors */}
              <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 space-y-3 bg-gradient-to-b from-rose-50/30 to-white">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                    SIM ACTIVE
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Green Corridors</span>
                  <div className="text-3xl font-black text-rose-600 tracking-tight mt-1">
                    {overview?.metrics?.activeGreenCorridors?.value || '2 Active'}
                  </div>
                </div>
                <p className="text-[11px] text-rose-700 font-semibold">Priority preemption routes monitored</p>
              </div>

              {/* Card 3: Pending Civic Grievances */}
              <div className="bg-white rounded-3xl border border-teal-200 shadow-sm p-6 space-y-3 bg-gradient-to-b from-teal-50/30 to-white">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-black uppercase">
                    CIVIC SYNC
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Civic Complaints</span>
                  <div className="text-3xl font-black text-teal-900 tracking-tight mt-1">
                    {complaints.filter((c) => c.status === 'PENDING').length} Pending
                  </div>
                </div>
                <p className="text-[11px] text-teal-800 font-medium">
                  {complaints.filter((c) => c.status === 'RESOLVED').length} Resolved this month
                </p>
              </div>

              {/* Card 4: Infrastructure Projects */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    CAPEX
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Capital Works</span>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                    {projects.length} Projects
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {municipalStats?.totalCapitalBudgetCrores ? `₹${municipalStats.totalCapitalBudgetCrores}` : '₹155.70 Cr'} allocated budget
                </p>
              </div>
            </div>

            {/* Operational Health & Quick Gateway Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Emergency Priority Corridors */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Priority Emergency Waves (Simulation)</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Automated signal preemption waves for hospital triage</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('traffic')}
                    className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(emergencyData?.greenCorridors || [
                    { id: 1, name: 'Trauma Priority Wave 01', assigned_unit: 'Ambulance EMS-108 (Cardiac)', corridor_route: 'Junction A -> JNC-103 -> City Trauma Hospital', eta_minutes: 6, speed_kmh: 68, signals_cleared: '4/5' },
                    { id: 2, name: 'VIP Escort Wave 02', assigned_unit: 'State Delegate Escort', corridor_route: 'Airport Tollway -> Central Secretariat', eta_minutes: 12, speed_kmh: 55, signals_cleared: '6/8' },
                  ]).map((gc: any) => (
                    <div key={gc.id} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            WAVE #{gc.id}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-900 mt-1">{gc.name}</h3>
                          <p className="text-xs text-slate-600 font-medium">{gc.assigned_unit}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-rose-600 font-mono">{gc.eta_minutes}m ETA</span>
                          <span className="text-[10px] text-slate-500 block">{gc.speed_kmh} km/h</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-rose-200 text-xs text-slate-700 flex items-center justify-between">
                        <span className="truncate pr-2">Route: <strong>{gc.corridor_route}</strong></span>
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] flex-shrink-0">
                          {gc.signals_cleared}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 1 Col: City System Health Stats */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-extrabold">System Health Diagnostics</h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Monitored Junctions</span>
                    <strong className="text-slate-900 font-mono text-sm">184 Grid Nodes</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">CCTV AI Vision Streams</span>
                    <strong className="text-emerald-700 font-mono text-sm">184 / 184 Online</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Connected GPS Probes</span>
                    <strong className="text-slate-900 font-mono text-sm">28 Units Synced</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Network Flow Efficiency</span>
                    <strong className="text-blue-700 font-mono text-sm">91.4% Optimal</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('digital-twin')}
                  className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-extrabold text-xs border border-blue-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Explore Urban Digital Twin</span>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: LIVE CITY MAP (DUAL 2D/3D LEAFLET VIEW)
           ========================================================================= */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <h2 className="text-base font-black text-slate-900">Live Spatial Operations Map</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time overlay of junctions, civic reports, and emergency assets</p>
              </div>

              {/* Layer Filter Buttons */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold space-x-1">
                {(['ALL', 'JUNCTIONS', 'INCIDENTS', 'HOSPITALS'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMapLayerFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      mapLayerFilter === filter
                        ? 'bg-white text-blue-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Map Canvas */}
            <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-200">
              <DualMapView
                markers={mapMarkers}
                zoom={13}
                center={[28.6139, 77.209]}
                tiltMode={false}
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: TRAFFIC & INCIDENTS
           ========================================================================= */}
        {activeTab === 'traffic' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Live Traffic & Incidents Intelligence</h2>
                <p className="text-xs text-slate-500 font-medium">Sensor-detected bottlenecks and emergency event log</p>
              </div>
              <button
                onClick={() => setCorridorModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Activate Green Corridor</span>
              </button>
            </div>

            {/* Junctions Telemetry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { code: 'JNC-101', name: 'Central Boulevard & 4th Ave', congestion: 84, status: 'HEAVY', delay: '+18m', alert: 'Severe surge in 15 mins' },
                { code: 'JNC-102', name: 'Metro Ring Expressway Toll', congestion: 56, status: 'MODERATE', delay: '+5m', alert: 'Moderate flow at peak' },
                { code: 'JNC-103', name: 'Hospital Trauma Corridor', congestion: 22, status: 'GREEN_WAVE', delay: '0m', alert: 'Green Corridor Active' },
                { code: 'JNC-104', name: 'Tech Park North Ring', congestion: 31, status: 'OPTIMAL', delay: '+2m', alert: 'Smooth flow' },
              ].map((j) => (
                <div key={j.code} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-900">{j.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        j.status === 'HEAVY'
                          ? 'bg-rose-100 text-rose-800'
                          : j.status === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {j.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">{j.name}</h3>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Congestion Index:</span>
                    <strong className="font-mono text-sm">{j.congestion}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-600 font-medium border border-slate-100">
                    💡 {j.alert} (Delay: {j.delay})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CITIZEN COMPLAINTS (PRESERVED MUNICIPAL CIVIC QUEUE)
           ========================================================================= */}
        {activeTab === 'complaints' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Citizen Civic Grievance Triage</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time sync with Citizen Portal • Potholes, Signal Outages, Waterlogging
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
              {/* Complaints List */}
              <div className="lg:col-span-2 space-y-3">
                {complaints.map((c) => {
                  const isSelected = selectedComplaintId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
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

              {/* Action Drawer */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm h-fit">
                <div className="flex items-center space-x-2 text-blue-800 pb-2 border-b border-slate-100">
                  <CheckSquare className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Resolution Action Panel
                  </h3>
                </div>

                {selectedComplaintId ? (
                  (() => {
                    const c = complaints.find((x) => x.id === selectedComplaintId);
                    if (!c) return <p className="text-xs text-slate-400">Select a complaint.</p>;
                    return (
                      <div className="space-y-4 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{c.title}</div>
                          <div className="text-slate-500 text-[11px]">Ticket: {c.code}</div>
                        </div>

                        {/* DPDP Masking Toggle */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">DPDP Citizen Anonymity</span>
                          <button
                            onClick={() => toggleUnmaskCitizen(c.id)}
                            className="flex items-center space-x-1 text-blue-600 font-bold hover:underline"
                          >
                            {unmaskedCitizenIds[c.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{unmaskedCitizenIds[c.id] ? 'Mask PII' : 'Reveal Identity'}</span>
                          </button>
                        </div>

                        {/* Remarks */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Officer Resolution Remarks</label>
                          <textarea
                            rows={3}
                            value={statusRemark}
                            onChange={(e) => setStatusRemark(e.target.value)}
                            placeholder="Enter resolution notes, assigned contractor, or inspection report..."
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>

                        {/* Status Buttons */}
                        <div className="space-y-2 pt-1">
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                          >
                            Mark as IN PROGRESS
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                          >
                            Mark as RESOLVED & Close Ticket
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    Click any complaint on the left to review telemetry & execute status updates.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: INFRASTRUCTURE (PRESERVED CAPITAL PROJECTS & APPROVALS)
           ========================================================================= */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900">Municipal Capital Works & Road Approvals</h2>
              <p className="text-xs text-slate-500 font-medium">
                Infrastructure project tracking, contractor milestones, and permit approvals
              </p>
            </div>

            {/* Active Projects List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {projects.map((p) => (
                <div key={p.id || p.project_code} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div>
                    <span className="font-mono text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.project_code || p.id}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-2">{p.title || p.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.department || 'Urban Works'}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Progress:</span>
                      <span className="text-blue-700 font-mono">{p.progressPercent || p.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${p.progressPercent || p.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-600">
                    <span>Budget: <strong>{p.budget || `₹${p.budget_crores} Cr`}</strong></span>
                    <span>Target: <strong>{p.estimated_completion || 'Q4 2026'}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Road Plan Approvals Workflow */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Pending Road Work & Utility Approvals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Plan Title</th>
                      <th className="pb-2">Proposed By</th>
                      <th className="pb-2">Duration</th>
                      <th className="pb-2">Impact Level</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvals.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono text-slate-400">#{app.id}</td>
                        <td className="py-3 font-bold text-slate-900">{app.title}</td>
                        <td className="py-3 text-slate-600">{app.proposed_by}</td>
                        <td className="py-3 font-mono">{app.closure_duration}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              app.traffic_impact_level === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : app.traffic_impact_level === 'MODERATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {app.traffic_impact_level}
                          </span>
                        </td>
                        <td className="py-3 font-bold font-mono">{app.status}</td>
                        <td className="py-3 text-right">
                          {app.status === 'PENDING' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApprovalDecision(app.id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprovalDecision(app.id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: ROAD CLOSURES (PRESERVED CLOSURE IMPACT SIMULATOR)
           ========================================================================= */}
        {activeTab === 'closures' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900">Road Closure & Detour Impact Simulator</h2>
              <p className="text-xs text-slate-500 font-medium">
                Test arterial network impact before granting physical utility permits
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Form */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900">Closure Parameters</h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Arterial Corridor</label>
                    <select
                      value={selectedRoad}
                      onChange={(e) => setSelectedRoad(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    >
                      <option>Western Arterial Expressway (KM 4 - 8)</option>
                      <option>Central Boulevard Sector 4 Underpass</option>
                      <option>Ring Road Outer Flyover Merge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Closure Severity Extent</label>
                    <select
                      value={closureType}
                      onChange={(e) => setClosureType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                    >
                      <option value="PARTIAL_CLOSURE">Single Lane Partial Closure (50% Capacity)</option>
                      <option value="FULL_CLOSURE">Full Corridor Complete Blockage (100% Diversion)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunClosureSim}
                    disabled={simulating}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{simulating ? 'Simulating Impact...' : 'Run Traffic Impact Simulation'}</span>
                  </button>
                </div>
              </div>

              {/* Simulation Result */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900">Virtual Simulation Outcome</h3>

                {simResult ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-800 uppercase">Throughput Loss</span>
                        <div className="text-xl font-black text-rose-700 mt-1">{simResult.impactedThroughput}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-800 uppercase">Queue Spillover</span>
                        <div className="text-xl font-black text-amber-700 mt-1">{simResult.queueSpilloverMeters}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Recommended Detour Advisory</span>
                      <p className="text-slate-900 font-bold">{simResult.suggestedDetour}</p>
                    </div>

                    {simResult.mitigationPlan?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Mitigation Checklist:</span>
                        {simResult.mitigationPlan.map((m: string, i: number) => (
                          <div key={i} className="flex items-center space-x-2 text-slate-700 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    Configure parameters on the left and run simulation to preview network bottleneck mitigation.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: DIGITAL TWIN (DIRECT GATEWAY TO FLAGSHIP 2D/3D TWIN)
           ========================================================================= */}
        {activeTab === 'digital-twin' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 text-center max-w-3xl mx-auto animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
              <Layers className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Flagship AEGIS Urban Digital Twin</h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto font-medium">
                High-fidelity 2D/3D spatial twin with neural graph predictive horizon (+5m to +30m), AI signal wave preemption, and real-time CCTV AI vision feeds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-xs text-purple-950">Spatial Layers</span>
                <p className="text-[11px] text-slate-500">Junctions, Roads, Ambulances, Hospitals, CCTV</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-xs text-purple-950">AI Horizon HUD</span>
                <p className="text-[11px] text-slate-500">+5m, +10m, +15m, +30m congestion forecasts</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-xs text-purple-950">Scenario Builder</span>
                <p className="text-[11px] text-slate-500">Virtual crisis simulation & AI recommendations</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/digital-twin"
                className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-105"
              >
                <span>Launch Fullscreen Digital Twin</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: SIMULATION (WHAT-IF SCENARIOS)
           ========================================================================= */}
        {activeTab === 'simulation' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900">What-If Crisis Simulation Sandbox</h2>
              <p className="text-xs text-slate-500 font-medium">
                Model crisis propagation before physical impact occurs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'J14 Arterial Collision', event: 'ACCIDENT', severity: 'HIGH', impact: 'Throughput -480 veh/hr', eta: '+6 min delay' },
                { title: 'Sector 4 Underpass Flood', event: 'WATERLOGGING', severity: 'CRITICAL', impact: 'Throughput -920 veh/hr', eta: '+14 min delay' },
                { title: 'State VIP Escort Wave', event: 'GREEN_WAVE', severity: 'MEDIUM', impact: 'Hold +15s green wave', eta: 'Sub-8 min transit' },
              ].map((sc, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {sc.event}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                      {sc.severity}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">{sc.title}</h3>
                  <div className="p-3 rounded-2xl bg-slate-50 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Impact:</span>
                      <strong className="text-slate-900">{sc.impact}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delay:</span>
                      <strong className="text-rose-600">{sc.eta}</strong>
                    </div>
                  </div>
                  <Link
                    to="/digital-twin"
                    className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Run in Digital Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 9: ANALYTICS & AUDIT LOGS
           ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Metropolitan System Audit Logs</h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Multi-agency audit trail of officer decisions, approvals, and emergency alerts
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Details</th>
                      <th className="pb-2">Severity</th>
                      <th className="pb-2">Operator / Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 font-mono">
                        <td className="py-2.5 text-slate-400">#{log.id}</td>
                        <td className="py-2.5 text-slate-500 text-[11px] font-sans">
                          {new Date(log.created_at || Date.now()).toLocaleTimeString()}
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
                          {log.user_name || 'System / Auto'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 🚑 Green Corridor Simulation Modal */}
      {corridorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <HeartPulse className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">Simulate Green Wave Preemption</h3>
              </div>
              <button
                onClick={() => setCorridorModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGreenCorridor} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Corridor Name / Label</label>
                <input
                  type="text"
                  required
                  value={corridorName}
                  onChange={(e) => setCorridorName(e.target.value)}
                  placeholder="e.g. Trauma Wave 03 (Cardiac Distress)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Emergency Unit</label>
                <input
                  type="text"
                  required
                  value={assignedUnit}
                  onChange={(e) => setAssignedUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corridor Route</label>
                <input
                  type="text"
                  required
                  value={corridorRoute}
                  onChange={(e) => setCorridorRoute(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorridorModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md"
                >
                  Engage Wave (Demo)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
