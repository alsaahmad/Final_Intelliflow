import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCitySync } from '../../context/CitySyncContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { DualMapView, MapMarker, MapPolyline } from '../../components/map/DualMapView';
import { citizenService } from '../../services/citizenService';
import { navigationApiClient, RouteResponseData } from '../../api/navigationApiClient';
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
  MapPin,
  Flag,
  Zap,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
  X,
  Check,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const { user } = useAuth();
  const { connectionStatus, lastEvent } = useWebSocket();
  const {
    complaints,
    addComplaint,
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

  // Tab A: Navigation States (OSM Road Network Router)
  const [originLat, setOriginLat] = useState('28.6137551');
  const [originLon, setOriginLon] = useState('77.2122049');
  const [destLat, setDestLat] = useState('28.6130207');
  const [destLon, setDestLon] = useState('77.2276662');
  const [routePreference, setRoutePreference] = useState<'FASTEST' | 'SHORTEST'>('FASTEST');
  const [osmRouteData, setOsmRouteData] = useState<RouteResponseData | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [navLoading, setNavLoading] = useState<boolean>(false);
  const [navError, setNavError] = useState<string | null>(null);
  const [clickMode, setClickMode] = useState<'ORIGIN' | 'DESTINATION' | null>(null);

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

  // Calculate OSM Road Network Route
  const handleCalculateRoute = async () => {
    setNavLoading(true);
    setNavError(null);
    try {
      const oLat = parseFloat(originLat);
      const oLon = parseFloat(originLon);
      const dLat = parseFloat(destLat);
      const dLon = parseFloat(destLon);

      if (isNaN(oLat) || isNaN(oLon) || isNaN(dLat) || isNaN(dLon)) {
        throw new Error('Please enter valid numeric latitude and longitude coordinates.');
      }

      const res = await navigationApiClient.calculateRoute({
        origin: { latitude: oLat, longitude: oLon },
        destination: { latitude: dLat, longitude: dLon },
        route_preference: routePreference,
        include_alternatives: true,
      });

      setOsmRouteData(res);
      setActiveRouteIndex(0);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to calculate route over OSM road network.';
      setNavError(msg);
      setOsmRouteData(null);
    } finally {
      setNavLoading(false);
    }
  };

  // Sector A Prototype Presets for instant navigation
  const SECTOR_A_PRESETS = [
    { name: 'J01 — Rafi Ahmed Kidwai Marg (Signal)', lat: '28.6137551', lon: '77.2122049', code: 'J01' },
    { name: 'J02 — Janpath Intersection (Signal)', lat: '28.6134521', lon: '77.2184671', code: 'J02' },
    { name: 'J14 — Man Singh Road (Signal)', lat: '28.6131567', lon: '77.2247654', code: 'J14' },
    { name: 'J03 — Kartavya Path Signalized Junction', lat: '28.6130207', lon: '77.2276662', code: 'J03' },
    { name: '🅿 Connaught Central Car Park', lat: '28.6139000', lon: '77.2090000', code: 'PKG-CP' },
    { name: '🅿 Metro Tech Hub Smart Garage', lat: '28.6195000', lon: '77.2145000', code: 'PKG-MTH' },
    { name: '🅿 City General Trauma Parking Deck', lat: '28.6255000', lon: '77.2185000', code: 'PKG-CGT' },
    { name: '🅿 Municipal Civic Secretariat Parking', lat: '28.6160000', lon: '77.2220000', code: 'PKG-CIVIC' },
    { name: 'India Gate C-Hexagon Roundabout', lat: '28.6129000', lon: '77.2295000', code: 'IG' },
    { name: 'National Museum Janpath', lat: '28.6118000', lon: '77.2192000', code: 'NM' },
    { name: 'Udyog Bhawan Metro Station', lat: '28.6106000', lon: '77.2128000', code: 'UB' },
  ];

  // Direct Route Calculation to Parking Facility (OSM Road Snapped)
  const handleParkingDirections = (facility: ParkingFacility, _slot: ParkingSlot) => {
    const dLat = facility.coordinates ? facility.coordinates[0].toString() : '28.6134521';
    const dLon = facility.coordinates ? facility.coordinates[1].toString() : '77.2184671';
    setOriginLat('28.6137551');
    setOriginLon('77.2122049');
    setDestLat(dLat);
    setDestLon(dLon);
    setActiveTab('NAVIGATION');
    setNavLoading(true);
    setNavError(null);
    navigationApiClient
      .calculateRoute({
        origin: { latitude: 28.6137551, longitude: 77.2122049 },
        destination: { latitude: parseFloat(dLat), longitude: parseFloat(dLon) },
        route_preference: routePreference,
        include_alternatives: true,
      })
      .then((res) => {
        setOsmRouteData(res);
        setActiveRouteIndex(0);
      })
      .catch((err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to calculate OSM route to parking.';
        setNavError(msg);
      })
      .finally(() => {
        setNavLoading(false);
      });
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

  const activeOsmRoute = osmRouteData && osmRouteData.routes[activeRouteIndex];
  const mapPolylines: MapPolyline[] = activeOsmRoute
    ? [
        // Alternative routes in dashed gray
        ...osmRouteData.routes
          .filter((_, idx) => idx !== activeRouteIndex)
          .map((altRt, idx) => ({
            id: `osm-alt-route-${idx}`,
            coordinates: altRt.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
            color: '#94a3b8',
            weight: 5,
            dashArray: '6, 6',
            title: `Alternative Route (${(altRt.distance_meters / 1000).toFixed(2)} km - ${altRt.formatted_eta})`,
          })),
        // Active chosen route in solid blue
        {
          id: 'osm-active-route',
          coordinates: activeOsmRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
          color: '#2563eb',
          weight: 6,
          title: `OSM ${activeOsmRoute.route_type.replace('_', ' ')} (${(activeOsmRoute.distance_meters / 1000).toFixed(2)} km - ${activeOsmRoute.formatted_eta})`,
        },
      ]
    : [];

  const oLatNum = parseFloat(originLat) || 28.6137551;
  const oLonNum = parseFloat(originLon) || 77.2122049;
  const dLatNum = parseFloat(destLat) || 28.6130207;
  const dLonNum = parseFloat(destLon) || 77.2276662;

  const mapMarkers: MapMarker[] = activeTab === 'NAVIGATION'
    ? [
        {
          id: 'origin-pt',
          lat: osmRouteData ? osmRouteData.snapped_origin.latitude : oLatNum,
          lng: osmRouteData ? osmRouteData.snapped_origin.longitude : oLonNum,
          title: `Origin (A) — ${osmRouteData ? `Snapped to Road (${osmRouteData.snapped_origin.distance_to_road_meters}m)` : 'Selected Point'}`,
          category: 'CITIZEN_LOCATION',
          badge: 'A',
          color: '#10b981',
        },
        {
          id: 'dest-pt',
          lat: osmRouteData ? osmRouteData.snapped_destination.latitude : dLatNum,
          lng: osmRouteData ? osmRouteData.snapped_destination.longitude : dLonNum,
          title: `Destination (B) — ${osmRouteData ? `Snapped to Road (${osmRouteData.snapped_destination.distance_to_road_meters}m)` : 'Selected Point'}`,
          category: 'CITIZEN_LOCATION',
          badge: 'B',
          color: '#ef4444',
        },
        // Validated Signalized Junction Waypoints in Sector A
        {
          id: 'nav-j01',
          lat: 28.6137551,
          lng: 77.2122049,
          title: 'J01 — Rafi Ahmed Kidwai Marg (Traffic Signal)',
          category: 'JUNCTION',
          badge: 'J01',
          color: '#059669',
          onClick: () => {
            setDestLat('28.6137551');
            setDestLon('77.2122049');
          },
        },
        {
          id: 'nav-j02',
          lat: 28.6134521,
          lng: 77.2184671,
          title: 'J02 — Janpath Intersection (Traffic Signal)',
          category: 'JUNCTION',
          badge: 'J02',
          color: '#059669',
          onClick: () => {
            setDestLat('28.6134521');
            setDestLon('77.2184671');
          },
        },
        {
          id: 'nav-j14',
          lat: 28.6131567,
          lng: 77.2247654,
          title: 'J14 — Man Singh Road (Traffic Signal)',
          category: 'JUNCTION',
          badge: 'J14',
          color: '#059669',
          onClick: () => {
            setDestLat('28.6131567');
            setDestLon('77.2247654');
          },
        },
        {
          id: 'nav-j03',
          lat: 28.6130207,
          lng: 77.2276662,
          title: 'J03 — Kartavya Path Signalized Junction',
          category: 'JUNCTION',
          badge: 'J03',
          color: '#059669',
          onClick: () => {
            setDestLat('28.6130207');
            setDestLon('77.2276662');
          },
        },
        // Validated Smart Parking Facilities
        {
          id: 'nav-pkg-gar-01',
          lat: 28.6139,
          lng: 77.2090,
          title: '🅿 Connaught Central Multi-Level Car Park',
          category: 'PARKING',
          badge: '🅿',
          color: '#0d9488',
          onClick: () => {
            setDestLat('28.6139');
            setDestLon('77.2090');
          },
        },
        {
          id: 'nav-pkg-gar-02',
          lat: 28.6195,
          lng: 77.2145,
          title: '🅿 Metro Tech Hub Underground Smart Garage',
          category: 'PARKING',
          badge: '🅿',
          color: '#0d9488',
          onClick: () => {
            setDestLat('28.6195');
            setDestLon('77.2145');
          },
        },
        {
          id: 'nav-pkg-gar-03',
          lat: 28.6255,
          lng: 77.2185,
          title: '🅿 City General Trauma Plaza Parking Deck',
          category: 'PARKING',
          badge: '🅿',
          color: '#0d9488',
          onClick: () => {
            setDestLat('28.6255');
            setDestLon('77.2185');
          },
        },
        {
          id: 'nav-pkg-gar-04',
          lat: 28.6160,
          lng: 77.2220,
          title: '🅿 Municipal Civic Secretariat Visitor Parking',
          category: 'PARKING',
          badge: '🅿',
          color: '#0d9488',
          onClick: () => {
            setDestLat('28.6160');
            setDestLon('77.2220');
          },
        },
      ]
    : junctions.map((j) => ({
        id: j.id,
        lat: j.location[0],
        lng: j.location[1],
        title: `${j.name} (${j.congestionPercent}%)`,
        category: 'JUNCTION',
        badge: j.code,
        color: ['J01', 'J02', 'J03', 'J14'].includes(j.code) ? '#059669' : '#2563eb',
        onClick: () => setSelectedJunction(j),
      }));


  // Live WebSocket Event Handler for Traffic Alerts (Strict Domain Separation)
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'TRAFFIC_ALERT_PUBLISHED' && lastEvent.data) {
      const liveAlert = lastEvent.data;
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === liveAlert.id || a.code === liveAlert.code);
        if (exists) return prev;
        return [liveAlert, ...prev];
      });
    }
  }, [lastEvent]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-16 md:pb-6">
      {/* 1. Modern Header with Notifications, DPDP Vault, Profile */}
      <CitizenHeader
        notifications={notifications}
        connectionStatus={connectionStatus}
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

        {/* VIEW 2: SMART NAVIGATION (REAL OSM ROAD ROUTER) */}
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
                      OSM Smart Pathfinding Router
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Real OpenStreetMap road network & A* routing graph
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Quick Preset Route Selector */}
                  <div className="p-2.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                      ⚡ Quick Sector A Route Presets
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        onChange={(e) => {
                          const idx = parseInt(e.target.value, 10);
                          if (!isNaN(idx) && SECTOR_A_PRESETS[idx]) {
                            setOriginLat(SECTOR_A_PRESETS[idx].lat);
                            setOriginLon(SECTOR_A_PRESETS[idx].lon);
                          }
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                      >
                        <option value="">-- Origin Preset --</option>
                        {SECTOR_A_PRESETS.map((p, idx) => (
                          <option key={idx} value={idx}>{p.name}</option>
                        ))}
                      </select>

                      <select
                        onChange={(e) => {
                          const idx = parseInt(e.target.value, 10);
                          if (!isNaN(idx) && SECTOR_A_PRESETS[idx]) {
                            setDestLat(SECTOR_A_PRESETS[idx].lat);
                            setDestLon(SECTOR_A_PRESETS[idx].lon);
                          }
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                      >
                        <option value="">-- Dest Preset --</option>
                        {SECTOR_A_PRESETS.map((p, idx) => (
                          <option key={idx} value={idx}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Origin Inputs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Origin Point (A)</span>
                      </label>
                      <button
                        onClick={() => setClickMode(clickMode === 'ORIGIN' ? null : 'ORIGIN')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                          clickMode === 'ORIGIN'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {clickMode === 'ORIGIN' ? 'Click Map...' : 'Pick on Map'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={originLat}
                        onChange={(e) => setOriginLat(e.target.value)}
                        placeholder="Latitude"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={originLon}
                        onChange={(e) => setOriginLon(e.target.value)}
                        placeholder="Longitude"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Destination Inputs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center space-x-1">
                        <Flag className="w-3.5 h-3.5 text-rose-600" />
                        <span>Destination Point (B)</span>
                      </label>
                      <button
                        onClick={() => setClickMode(clickMode === 'DESTINATION' ? null : 'DESTINATION')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                          clickMode === 'DESTINATION'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {clickMode === 'DESTINATION' ? 'Click Map...' : 'Pick on Map'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={destLat}
                        onChange={(e) => setDestLat(e.target.value)}
                        placeholder="Latitude"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={destLon}
                        onChange={(e) => setDestLon(e.target.value)}
                        placeholder="Longitude"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Route Preference Switcher */}
                  <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setRoutePreference('FASTEST')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        routePreference === 'FASTEST'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⚡ Fastest Route
                    </button>
                    <button
                      onClick={() => setRoutePreference('SHORTEST')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        routePreference === 'SHORTEST'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📏 Shortest Distance
                    </button>
                  </div>

                  {/* Compute Route Button */}
                  <button
                    onClick={handleCalculateRoute}
                    disabled={navLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    {navLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{navLoading ? 'ROUTING OVER OSM NETWORK...' : 'COMPUTE OSM ROAD ROUTE'}</span>
                  </button>
                </div>

                {/* Error Banner */}
                {navError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{navError}</span>
                  </div>
                )}

                {/* OSM Route Results Card */}
                {osmRouteData && osmRouteData.routes.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-200 space-y-3 text-xs animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-950 uppercase tracking-wider text-[11px]">
                        OSM Route Computed
                      </span>
                      <span className="font-mono text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                        {osmRouteData.data_origin}
                      </span>
                    </div>

                    {/* Route Options Tabs */}
                    {osmRouteData.routes.length > 1 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Available Route Options:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {osmRouteData.routes.map((rt, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveRouteIndex(idx)}
                              className={`p-2 rounded-xl text-left border transition-all ${
                                idx === activeRouteIndex
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                  : 'bg-white text-slate-700 border-blue-100 hover:bg-blue-50'
                              }`}
                            >
                              <div className="text-[10px] font-extrabold uppercase">{rt.route_type.replace('_', ' ')}</div>
                              <div className="text-[11px] font-mono">{rt.formatted_eta} • {(rt.distance_meters / 1000).toFixed(1)}km</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeOsmRoute && (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-xs">
                            <span className="text-[9px] text-slate-400 font-bold block">DISTANCE</span>
                            <strong className="text-sm text-slate-900 font-mono">
                              {(activeOsmRoute.distance_meters / 1000).toFixed(2)} km
                            </strong>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-xs">
                            <span className="text-[9px] text-slate-400 font-bold block">ESTIMATED ETA</span>
                            <strong className="text-sm text-blue-700 font-mono">{activeOsmRoute.formatted_eta}</strong>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-xs">
                            <span className="text-[9px] text-slate-400 font-bold block">MANEUVERS</span>
                            <strong className="text-sm text-slate-900 font-mono">{activeOsmRoute.steps.length} steps</strong>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-black uppercase text-slate-500">Turn Guidance:</span>
                          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                            {activeOsmRoute.steps.map((st, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-start justify-between space-x-2 text-[11px]"
                              >
                                <div className="flex items-start space-x-2">
                                  <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <span className="text-slate-800 font-medium">{st.instruction}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">{Math.round(st.distance_meters)}m</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 relative">
                <DualMapView
                  center={[28.6139, 77.209]}
                  zoom={14}
                  markers={mapMarkers}
                  polylines={mapPolylines}
                  showControls={true}
                  showKmlBoundary={true}
                  onMapClick={(coords) => {
                    if (clickMode === 'ORIGIN') {
                      setOriginLat(coords[0].toFixed(7));
                      setOriginLon(coords[1].toFixed(7));
                      setClickMode(null);
                    } else if (clickMode === 'DESTINATION') {
                      setDestLat(coords[0].toFixed(7));
                      setDestLon(coords[1].toFixed(7));
                      setClickMode(null);
                    }
                  }}
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
          const match = junctions.find((j) => j.id === jId);
          if (match && match.location) {
            setDestLat(match.location[0].toString());
            setDestLon(match.location[1].toString());
          }
          setActiveTab('NAVIGATION');
          setTimeout(() => {
            handleCalculateRoute();
          }, 100);
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
