import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCitySync } from '../../context/CitySyncContext';
import { DualMapView, MapMarker, MapPolyline } from '../../components/map/DualMapView';
import { citizenService } from '../../services/citizenService';
import {
  TrafficAlert,
  CitizenJunctionSummary,
  CitizenNotification,
  CityMobilityStatus,
  ParkingFacility,
  ParkingSlot,
} from '../../types/citizen';

// Modular Citizen Dashboard & Parking Components
import { CitizenHeader } from '../../components/citizen/CitizenHeader';
import { CitizenGreeting } from '../../components/citizen/CitizenGreeting';
import { CitizenQuickActions } from '../../components/citizen/CitizenQuickActions';
import { CitizenTrafficMap } from '../../components/citizen/CitizenTrafficMap';
import { CitizenAlertsFeed } from '../../components/citizen/CitizenAlertsFeed';
import { CitizenBottomNav, CitizenTabType } from '../../components/citizen/CitizenBottomNav';
import { JunctionDetailModal } from '../../components/citizen/JunctionDetailModal';
import { CitizenParkingFinder } from '../../components/citizen/parking/CitizenParkingFinder';

// Lucide Icons
import {
  LayoutDashboard,
  Navigation,
  ParkingSquare,
  AlertTriangle,
  PhoneCall,
  Send,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  X,
  Check,
  ArrowLeft,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const { user } = useAuth();
  const {
    complaints,
    addComplaint,
    nodes,
    calculateDijkstraRoute,
    trigger112Sos,
  } = useCitySync();

  // Active View State (Default to modern DASHBOARD)
  const [activeTab, setActiveTab] = useState<CitizenTabType>('DASHBOARD');

  // Service Layer State
  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
  const [junctions, setJunctions] = useState<CitizenJunctionSummary[]>([]);
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  const [mobilityStatus, setMobilityStatus] = useState<CityMobilityStatus>({
    cityCongestionIndex: 44,
    averageSpeedKmh: 41.5,
    activeGreenCorridors: 1,
    trafficStatus: 'NORMAL',
    activeSignalsCount: 142,
    lastUpdated: new Date().toISOString(),
    currentLocationName: 'Connaught Place Sector 4, New Delhi',
  });

  // Lifecycle States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected Junction for Detail Modal
  const [selectedJunction, setSelectedJunction] = useState<CitizenJunctionSummary | null>(null);

  // Tab A: Navigation States
  const [originId, setOriginId] = useState('node-cp');
  const [destId, setDestId] = useState('node-hosp1');
  const [navRoute, setNavRoute] = useState<any | null>(null);

  // Tab C: Report Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<
    'POTHOLE' | 'TRAFFIC_LIGHT_FAILURE' | 'WATERLOGGING' | 'ROAD_HAZARD' | 'ILLEGAL_PARKING'
  >('POTHOLE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('HIGH');
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Privacy Vault State
  const [privacyVaultOpen, setPrivacyVaultOpen] = useState(false);
  const [dataExportedMsg, setDataExportedMsg] = useState<string | null>(null);
  const [consentRevokedMsg, setConsentRevokedMsg] = useState<string | null>(null);

  // Tab D: SOS States
  const [sosActive, setSosActive] = useState(false);
  const [sosEvent, setSosEvent] = useState<any | null>(null);

  // Fetch telemetry from service layer
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setFetchError(null);

    try {
      const [alertsData, junctionsData, statusData, notifData] = await Promise.all([
        citizenService.getTrafficAlerts(),
        citizenService.getNearbyJunctions(),
        citizenService.getCityMobilityStatus(),
        citizenService.getNotifications(),
      ]);
      setAlerts(alertsData);
      setJunctions(junctionsData);
      setMobilityStatus(statusData);
      setNotifications(notifData);
    } catch (err) {
      console.error('Failed to load citizen traffic telemetry:', err);
      setFetchError("Traffic data couldn't be loaded.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch telemetry on initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Export My Data (JSON) - Demo Mode
  const handleExportData = () => {
    const exportData = {
      platform: 'IntelliFlow AI Civic Mobility Platform (Demo Mode)',
      citizenProfile: {
        name: user?.name || 'Verified Citizen',
        email: user?.email || 'citizen@intelliflow.ai',
      },
      submittedComplaints: complaints,
      timestamp: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `intelliflow_data_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDataExportedMsg('Personal data package exported successfully (Demo Mode).');
    setTimeout(() => setDataExportedMsg(null), 4000);
  };

  // Revoke Consent - Demo Mode
  const handleRevokeConsent = () => {
    setConsentRevokedMsg(
      'Data processing consent revoked (Demo Mode). Personal identifiers queued for purge.'
    );
    setTimeout(() => setConsentRevokedMsg(null), 5000);
  };

  // Calculate Dijkstra Route
  const handleCalculateRoute = () => {
    const route = calculateDijkstraRoute(originId, destId);
    setNavRoute(route);
  };

  // Direct Dijkstra Route Calculation to Parking Facility
  const handleParkingDirections = (facility: ParkingFacility, _slot: ParkingSlot) => {
    const targetNode = facility.dijkstraNodeId || 'node-cp';
    setDestId(targetNode);
    const route = calculateDijkstraRoute(originId, targetNode);
    setNavRoute(route);
    setActiveTab('NAVIGATION');
  };

  // Submit Citizen Complaint
  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newComp = addComplaint({
      title: title || 'Reported Civic Problem',
      category,
      location: location || 'Sector 4, Central Corridor',
      urgency,
      reportedBy: user?.name || 'Verified Citizen',
      description: description || 'Civic issue reported via IntelliCivic mobile app.',
    });
    setReportSuccess(`Complaint #${newComp.code} logged and synced to IntelliWorks Municipal queue.`);
    setTitle('');
    setLocation('');
    setDescription('');
    setTimeout(() => setReportSuccess(null), 5000);
  };

  // Trigger 112 SOS
  const handleTriggerSos = () => {
    const ev = trigger112Sos(user?.name || 'Rahul Sharma', 'Connaught Center Inner Circle, Gate 4');
    setSosEvent(ev);
    setSosActive(true);
    setActiveTab('SOS');
  };

  // Prepare map polylines and markers for DualMapView
  const mapPolylines: MapPolyline[] = navRoute
    ? [
        {
          id: 'dijkstra-nav-path',
          coordinates: navRoute.pathCoordinates,
          color: '#2563eb',
          weight: 6,
          title: `Optimized Route (${navRoute.totalDistanceKm} km)`,
        },
      ]
    : [];

  const mapMarkers: MapMarker[] = nodes.map((n) => ({
    id: n.id,
    lat: n.coordinates[0],
    lng: n.coordinates[1],
    title: n.name,
    category: n.category === 'HOSPITAL' ? 'HOSPITAL' : 'JUNCTION',
    badge: n.category === 'HOSPITAL' ? 'H' : '•',
    color: n.id === originId ? '#10b981' : n.id === destId ? '#2563eb' : '#64748b',
    onClick: () => {
      if (activeTab === 'NAVIGATION') {
        if (!originId) setOriginId(n.id);
        else setDestId(n.id);
      }
    },
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-16 md:pb-6">
      {/* 1. Modern Header with Notifications, DPDP Vault, Profile */}
      <CitizenHeader
        notifications={notifications}
        onOpenPrivacyVault={() => setPrivacyVaultOpen(true)}
        onTriggerSos={handleTriggerSos}
        onSelectNotificationAction={(tab) => setActiveTab(tab)}
      />

      {/* 2. Top Navigation Breadcrumb / Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav aria-label="Breadcrumb Trail" className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
            <Link to="/" className="text-blue-600 hover:underline">
              Home
            </Link>
            <span>/</span>
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`hover:underline ${
                activeTab === 'DASHBOARD' ? 'text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Citizen Dashboard
            </button>
            {activeTab !== 'DASHBOARD' && (
              <>
                <span>/</span>
                <span className="text-blue-700 font-extrabold capitalize">
                  {activeTab.toLowerCase()}
                </span>
              </>
            )}
          </nav>

          {/* Desktop Tab Switcher */}
          <div className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'DASHBOARD'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('NAVIGATION')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'NAVIGATION'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigation</span>
            </button>
            <button
              onClick={() => setActiveTab('PARKING')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'PARKING'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ParkingSquare className="w-3.5 h-3.5" />
              <span>Parking</span>
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'REPORT'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Report</span>
            </button>
            <button
              onClick={() => setActiveTab('SOS')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'SOS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>112 SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Body Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 w-full space-y-6">
        {/* VIEW 1: CITIZEN DASHBOARD HOME (PHASE 2A/2B CORE) */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Greeting Section with Refresh Trigger */}
            <CitizenGreeting
              status={mobilityStatus}
              onRefresh={() => loadData(true)}
              isRefreshing={isRefreshing}
            />

            {/* Error Banner with Retry */}
            {fetchError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-900 animate-in fade-in duration-150">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span className="font-bold">{fetchError} Live traffic telemetry could not be synced.</span>
                </div>
                <button
                  onClick={() => loadData(true)}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-xs flex-shrink-0 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Main Quick Actions */}
            <CitizenQuickActions
              onSelectAction={(action) => {
                if (action === 'SOS') handleTriggerSos();
                else setActiveTab(action);
              }}
            />

            {/* Main Grid: Traffic Around You + Traffic Alerts Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Primary 7 Cols: Traffic Around You Map */}
              <div className="lg:col-span-7">
                <CitizenTrafficMap
                  junctions={junctions}
                  selectedJunction={selectedJunction}
                  onSelectJunction={(j) => setSelectedJunction(j)}
                  onOpenFullNavigation={() => setActiveTab('NAVIGATION')}
                  isLoading={isLoading}
                />
              </div>

              {/* Right/Secondary 5 Cols: Active Traffic Alerts */}
              <div className="lg:col-span-5">
                <CitizenAlertsFeed
                  alerts={alerts}
                  onSelectAlert={(a) => {
                    // Direct ID-based junction lookup
                    if (a.junctionId) {
                      const match = junctions.find((j) => j.id === a.junctionId);
                      if (match) setSelectedJunction(match);
                    }
                  }}
                  onNavigateAlternate={() => setActiveTab('NAVIGATION')}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SMART NAVIGATION (DIJKSTRA ROUTE FINDER) */}
        {activeTab === 'NAVIGATION' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Citizen Home</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Smart Pathfinding & Flow Router
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Traffic-weighted graph engine avoiding congested corridors
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Origin / Starting Hub</span>
                    </label>
                    <select
                      value={originId}
                      onChange={(e) => setOriginId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Destination Hub</span>
                    </label>
                    <select
                      value={destId}
                      onChange={(e) => setDestId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCalculateRoute}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>COMPUTE OPTIMIZED ROUTE</span>
                  </button>
                </div>

                {navRoute && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-200 space-y-3 text-xs animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-950 uppercase tracking-wider text-[11px]">
                        Optimal Route Computed
                      </span>
                      <span className="font-mono text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                        Delay: +{navRoute.congestionDelayMinutes} min
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-xs">
                        <span className="text-[9px] text-slate-400 font-bold block">DISTANCE</span>
                        <strong className="text-sm text-slate-900 font-mono">{navRoute.totalDistanceKm} km</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-xs">
                        <span className="text-[9px] text-slate-400 font-bold block">TIME</span>
                        <strong className="text-sm text-blue-700 font-mono">{navRoute.estimatedTimeMinutes} mins</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-xs">
                        <span className="text-[9px] text-slate-400 font-bold block">SPEED</span>
                        <strong className="text-sm text-slate-900 font-mono">{navRoute.averageSpeedKmh} km/h</strong>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">Turn Guidance:</span>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {navRoute.turnByTurnInstructions.map((inst: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-start space-x-2 text-[11px]"
                          >
                            <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <span className="text-slate-800 font-medium">{inst.instruction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 h-[460px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                <DualMapView
                  center={[28.6139, 77.209]}
                  zoom={14}
                  markers={mapMarkers}
                  polylines={mapPolylines}
                  showControls={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SMART MOVIE-THEATRE PARKING FINDER (PHASE 2D) */}
        {activeTab === 'PARKING' && (
          <CitizenParkingFinder
            onBackToDashboard={() => setActiveTab('DASHBOARD')}
            onGetDirections={handleParkingDirections}
          />
        )}

        {/* VIEW 4: CIVIC REPORTING & COMPLAINTS */}
        {activeTab === 'REPORT' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Citizen Home</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Complaint Form */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Report Civic Road Problem
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Auto-synced in real-time to IntelliWorks Municipal Queue
                    </p>
                  </div>
                </div>

                {reportSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{reportSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleComplaintSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Issue Headline</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Deep pothole cluster near underpass"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="POTHOLE">Pothole / Road Damage</option>
                        <option value="TRAFFIC_LIGHT_FAILURE">Traffic Signal Failure</option>
                        <option value="WATERLOGGING">Waterlogging / Flood</option>
                        <option value="ROAD_HAZARD">Debris / Road Hazard</option>
                        <option value="ILLEGAL_PARKING">Illegal Lane Obstruction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Urgency</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="LOW">Low (Routine)</option>
                        <option value="MEDIUM">Medium (48 hrs)</option>
                        <option value="HIGH">High Priority (12 hrs)</option>
                        <option value="EMERGENCY">Emergency (Immediate)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Location Details</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Sector 4, North Outer Service Lane"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about the issue to assist municipal field engineers..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start space-x-2.5">
                    <input
                      type="checkbox"
                      id="dpdp-consent-check"
                      required
                      checked={dpdpConsent}
                      onChange={(e) => setDpdpConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="dpdp-consent-check"
                      className="text-[11px] font-semibold text-slate-800 leading-snug cursor-pointer select-none"
                    >
                      <strong className="text-blue-950 font-black">Data Consent:</strong> I authorize IntelliFlow to process my location data strictly for this civic resolution in demo mode.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!dpdpConsent}
                    className={`w-full py-3 rounded-xl font-black shadow-lg transition-all flex items-center justify-center space-x-2 ${
                      dpdpConsent
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>TRANSMIT COMPLAINT TO MUNICIPAL QUEUE</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Tracked Complaints */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-sm">
                <div className="text-xs font-extrabold uppercase text-slate-700 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>My Reported Complaints</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
                    {complaints.length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-slate-900">{c.code}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
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
                      <div className="font-bold text-slate-800">{c.title}</div>
                      <div className="text-[11px] text-slate-500">{c.assignedDepartment}</div>
                      {c.remarks && (
                        <div className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 font-medium">
                          <strong>Update:</strong> {c.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: 112 SOS DISTRESS */}
        {activeTab === 'SOS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Citizen Home</span>
            </button>

            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <PhoneCall className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-black text-rose-950 uppercase tracking-wider">
                  Emergency Assistance — Demo Mode
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-1">
                  Simulated emergency assistance request for rapid response demonstration.
                </p>
              </div>

              <div className="py-2">
                <button
                  onClick={handleTriggerSos}
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white font-black text-xl shadow-2xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all mx-auto flex flex-col items-center justify-center space-y-1 border-4 border-white/40 animate-pulse"
                >
                  <ShieldAlert className="w-12 h-12" />
                  <span>SOS (DEMO)</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase opacity-90">TAP TO SIMULATE</span>
                </button>
              </div>

              {sosActive && sosEvent && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-xs text-left animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                    <span className="font-mono font-black text-rose-900">{sosEvent.code}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                      CODE RED (DEMO)
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Unit:</span>
                      <strong className="text-slate-900">{sosEvent.assignedAmbulanceUnit}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination Hub:</span>
                      <strong className="text-slate-900">{sosEvent.destinationHospital}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Arrival:</span>
                      <strong className="text-emerald-700 font-mono text-sm">{sosEvent.etaMinutes} minutes</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-rose-200 text-[11px] font-bold text-rose-900 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Simulated Green Corridor signal priority requested for emergency route.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. Mobile Bottom Navigation Bar (< md) */}
      <CitizenBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'SOS') handleTriggerSos();
          else setActiveTab(tab);
        }}
      />

      {/* 5. Modals: Junction Inspector, Booking Confirm, QR Pass, DPDP Vault */}
      <JunctionDetailModal
        junction={selectedJunction}
        onClose={() => setSelectedJunction(null)}
        onNavigateToJunction={(jId) => {
          setDestId(jId);
          setActiveTab('NAVIGATION');
        }}
      />

      {/* CITIZEN PRIVACY & DATA PREFERENCES MODAL (DEMO MODE) */}
      {privacyVaultOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setPrivacyVaultOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  DEMO MODE
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Citizen Privacy & Data Preferences</h3>
                <p className="text-xs text-slate-500 font-medium">Manage your personal civic data and privacy preferences</p>
              </div>
            </div>

            {dataExportedMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{dataExportedMsg}</span>
              </div>
            )}

            {consentRevokedMsg && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{consentRevokedMsg}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Citizen Telemetry ID:</span>
                <span className="font-mono text-blue-700">#CIT-DL-8921-X</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Consented Services:</span>
                <span className="font-bold text-slate-800">Smart Navigation, Incident Reporting</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Data Retention Policy:</span>
                <span className="font-bold text-emerald-700">Auto-Purge after 30 Days (Demo)</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <button
                onClick={handleExportData}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export My Data (JSON) — Demo Mode</span>
              </button>

              <button
                onClick={handleRevokeConsent}
                className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Revoke Data Consent (Demo Mode)</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-medium">
              IntelliFlow AI Platform • Privacy & Data Transparency (Prototype Demo)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenPortal;
