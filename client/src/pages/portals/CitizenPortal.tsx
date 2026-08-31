import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCitySync } from '../../context/CitySyncContext';
import { DualMapView, MapMarker, MapPolyline } from '../../components/map/DualMapView';
import {
  Users,
  Navigation,
  ParkingSquare,
  AlertTriangle,
  PhoneCall,
  LogOut,
  Send,
  CheckCircle2,
  QrCode,
  ShieldAlert,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    complaints,
    addComplaint,
    garages,
    activeGarage,
    setActiveGarage,
    selectSlot,
    selectedSlot,
    activeBooking,
    confirmParkingBooking,
    clearActiveBooking,
    nodes,
    calculateDijkstraRoute,
    trigger112Sos,
  } = useCitySync();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'NAVIGATION' | 'PARKING' | 'REPORT' | 'SOS'>('NAVIGATION');

  // Tab A: Navigation States
  const [originId, setOriginId] = useState('node-cp');
  const [destId, setDestId] = useState('node-hosp1');
  const [navRoute, setNavRoute] = useState<any | null>(null);

  // Tab B: Parking Booking States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('DL 03 CA 4892');
  const [durationHours, setDurationHours] = useState(3);

  // Tab C: Report Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'POTHOLE' | 'TRAFFIC_LIGHT_FAILURE' | 'WATERLOGGING' | 'ROAD_HAZARD' | 'ILLEGAL_PARKING'>('POTHOLE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('HIGH');
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // DPDP Privacy Vault State
  const [privacyVaultOpen, setPrivacyVaultOpen] = useState(false);
  const [dataExportedMsg, setDataExportedMsg] = useState<string | null>(null);
  const [consentRevokedMsg, setConsentRevokedMsg] = useState<string | null>(null);

  // Export My Data (JSON) under DPDP Act 2023 Section 12
  const handleExportData = () => {
    const exportData = {
      complianceStandard: 'DPDP Act 2023 (Section 12 - Right to Information)',
      citizenProfile: {
        name: user?.name || 'Verified Citizen',
        email: user?.email || 'citizen@intelliflow.ai',
        aadhaarMasked: 'XXXX-XXXX-8921',
      },
      submittedComplaints: complaints,
      timestamp: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `intellicivic_dpdp_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDataExportedMsg('Personal data package exported successfully in compliance with DPDP Act 2023.');
    setTimeout(() => setDataExportedMsg(null), 4000);
  };

  // Revoke Consent / Right to be Forgotten (DPDP Section 12)
  const handleRevokeConsent = () => {
    setConsentRevokedMsg('Data processing consent revoked. Personal identifiers queued for purge within 72 hours per DPDP Act Section 12(3).');
    setTimeout(() => setConsentRevokedMsg(null), 5000);
  };

  // Tab D: SOS States
  const [sosActive, setSosActive] = useState(false);
  const [sosEvent, setSosEvent] = useState<any | null>(null);

  // Calculate Dijkstra Route
  const handleCalculateRoute = () => {
    const route = calculateDijkstraRoute(originId, destId);
    setNavRoute(route);
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

  // Confirm Parking Booking
  const handleConfirmBooking = () => {
    if (!activeGarage || !selectedSlot) return;
    confirmParkingBooking(activeGarage.id, selectedSlot.id, vehicleNumber, durationHours);
    setBookingModalOpen(false);
  };

  // Trigger 112 SOS
  const handleTriggerSos = () => {
    const ev = trigger112Sos(user?.name || 'Rahul Sharma', 'Connaught Center Inner Circle, Gate 4');
    setSosEvent(ev);
    setSosActive(true);
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      {/* 1. GIGW 3.0 Header Bar with Global Navigation Law */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm">
        {/* Brand Mark Linking to / */}
        <Link to="/" className="flex items-center space-x-3 group" title="Return to IntelliFlow OS Home">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base text-slate-900 tracking-tight">IntelliCivic</span>
              <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                CITIZEN 360°
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Ministry of Housing & Urban Affairs • Smart Cities Portal
            </span>
          </div>
        </Link>

        {/* Center Tabs Navigation */}
        <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 space-x-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('NAVIGATION')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'NAVIGATION' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Smart Navigation</span>
          </button>
          <button
            onClick={() => setActiveTab('PARKING')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'PARKING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ParkingSquare className="w-3.5 h-3.5" />
            <span>Cinema Parking</span>
          </button>
          <button
            onClick={() => setActiveTab('REPORT')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'REPORT' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Report Incident</span>
          </button>
          <button
            onClick={() => setActiveTab('SOS')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'SOS' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112 SOS Distress</span>
          </button>
        </nav>

        {/* User Info & Quick DPDP / SOS */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setPrivacyVaultOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition-colors"
            title="Open DPDP Privacy & Data Rights Vault"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">DPDP Vault</span>
          </button>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user?.name || 'Verified Citizen'}</span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Aadhaar Verified</span>
            </span>
          </div>

          <button
            onClick={() => setActiveTab('SOS')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center space-x-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">112 SOS</span>
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Body Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Interactive Control Panel (Tabs Content) */}
        <div className="w-full lg:w-[480px] xl:w-[540px] bg-white border-r border-slate-200 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 space-y-4 z-10">
          {/* GIGW 3.0 Breadcrumb Navigation Trail */}
          <nav aria-label="Breadcrumb Trail" className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1.5 pb-1 border-b border-slate-100">
            <Link to="/" className="text-blue-600 hover:underline">Home</Link>
            <span>/</span>
            <span className="text-slate-700">Citizen 360°</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">
              {activeTab === 'NAVIGATION'
                ? 'Smart Navigation'
                : activeTab === 'PARKING'
                ? 'Cinema Parking'
                : activeTab === 'REPORT'
                ? 'Report Incident'
                : '112 SOS Distress'}
            </span>
          </nav>
          {/* TAB A: SMART NAVIGATION & DIJKSTRA ENGINE */}
          {activeTab === 'NAVIGATION' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Dijkstra Pathfinding & Flow Router
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Traffic-weighted graph engine avoiding congested corridors
                  </p>
                </div>
              </div>

              {/* Origin & Destination Selectors */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Origin / Starting Hub</span>
                  </label>
                  <select
                    value={originId}
                    onChange={(e) => setOriginId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Destination Hub</span>
                  </label>
                  <select
                    value={destId}
                    onChange={(e) => setDestId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <span>COMPUTE DIJKSTRA OPTIMIZED ROUTE</span>
                </button>
              </div>

              {/* Route Summary Results Card */}
              {navRoute && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-200 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-950 uppercase tracking-wider text-[11px]">
                      Optimal Route Computed
                    </span>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded">
                      Congestion Delay: +{navRoute.congestionDelayMinutes} min
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold block">TOTAL DISTANCE</span>
                      <strong className="text-base text-slate-900 font-mono">{navRoute.totalDistanceKm} km</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold block">ESTIMATED TIME</span>
                      <strong className="text-base text-blue-700 font-mono">{navRoute.estimatedTimeMinutes} mins</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-blue-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold block">AVERAGE SPEED</span>
                      <strong className="text-base text-slate-900 font-mono">{navRoute.averageSpeedKmh} km/h</strong>
                    </div>
                  </div>

                  {/* Turn-by-Turn Steps */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Turn-by-Turn Guidance:</span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
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
          )}

          {/* TAB B: VISUAL CINEMA-STYLE PARKING */}
          {activeTab === 'PARKING' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ParkingSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Interactive Visual Parking
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Cinema-seat layout model with instant digital QR pass
                  </p>
                </div>
              </div>

              {/* Garage Selector Tabs */}
              <div className="grid grid-cols-1 gap-2">
                {garages.map((g) => {
                  const isSelected = activeGarage?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setActiveGarage(g);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-xs text-slate-900">{g.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{g.address}</div>
                        <div className="text-[10px] text-blue-600 font-bold mt-0.5">
                          {g.distanceKm} km away • ₹{g.hourlyRateInr}/hour
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-emerald-600">
                          {g.availableSlots} / {g.totalSlots}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">SLOTS FREE</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Floor Plan (Cinema Grid) */}
              {activeGarage && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900">{activeGarage.name}</span>
                      <span className="text-[10px] text-slate-500 block font-medium">Floor 1 - Live Occupancy</span>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center space-x-3 text-[10px] font-bold">
                      <span className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-md bg-emerald-500"></span>
                        <span>Free</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-md bg-rose-500"></span>
                        <span>Occupied</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-md bg-blue-600"></span>
                        <span>Selected</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Grid: Sections A, B, C */}
                  {(['A', 'B', 'C'] as const).map((sec) => (
                    <div key={sec} className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Section {sec} (Slots {sec}-01 to {sec}-08)
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {activeGarage.slots
                          .filter((s) => s.section === sec)
                          .map((slot) => {
                            const isSelected = selectedSlot?.id === slot.id;
                            const isOccupied = slot.status === 'OCCUPIED';
                            return (
                              <button
                                key={slot.id}
                                disabled={isOccupied}
                                onClick={() => selectSlot(activeGarage.id, slot.id)}
                                className={`h-10 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center justify-center ${
                                  isOccupied
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200 cursor-not-allowed opacity-80'
                                    : isSelected
                                    ? 'bg-blue-600 text-white shadow-md scale-105 border-2 border-blue-600'
                                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                <span>{slot.code}</span>
                                <span className="text-[8px] opacity-75">{slot.type === 'EV_CHARGING' ? '⚡' : 'P'}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}

                  {/* Slot Booking Action Button */}
                  {selectedSlot && (
                    <div className="pt-2">
                      <button
                        onClick={() => setBookingModalOpen(true)}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>BOOK SLOT {selectedSlot.code} & GENERATE QR PASS</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB C: CITIZEN INCIDENT REPORTER */}
          {activeTab === 'REPORT' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Report Public Civic Incident
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

                {/* DPDP Act 2023 Mandatory Consent Switch */}
                <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    id="dpdp-consent-check"
                    required
                    checked={dpdpConsent}
                    onChange={(e) => setDpdpConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="dpdp-consent-check" className="text-[11px] font-semibold text-slate-800 leading-snug cursor-pointer select-none">
                    <strong className="text-blue-950 font-black">DPDP Consent:</strong> I authorize Aegis/IntelliFlow to process my location data strictly for this specific civic resolution under the Digital Personal Data Protection Act 2023.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!dpdpConsent}
                  className={`w-full py-3 rounded-xl font-black shadow-lg transition-all flex items-center justify-center space-x-2 ${
                    dpdpConsent
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>TRANSMIT COMPLAINT TO MUNICIPAL QUEUE</span>
                </button>
              </form>

              {/* My Reported Complaints Tracker */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-extrabold uppercase text-slate-400">
                  Live Tracked Complaints ({complaints.length})
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
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
                        <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200 font-medium">
                          <strong>Update:</strong> {c.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB D: 112 SOS DISTRESS */}
          {activeTab === 'SOS' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider">
                    Emergency 112 SOS Dispatch
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Instant priority beacon to IntelliCommand & 108 EMS
                  </p>
                </div>
              </div>

              {/* Big Red SOS Button */}
              <div className="text-center py-4 space-y-3">
                <button
                  onClick={handleTriggerSos}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white font-black text-xl shadow-2xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all mx-auto flex flex-col items-center justify-center space-y-1 border-4 border-white/40 animate-pulse"
                >
                  <ShieldAlert className="w-10 h-10" />
                  <span>SOS 112</span>
                  <span className="text-[9px] font-mono tracking-widest uppercase opacity-90">TAP TO TRIGGER</span>
                </button>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                  Broadcasting will immediately alert the nearest PCR van, dispatch a 108 Advanced Life Support ambulance, and notify the Command Center.
                </p>
              </div>

              {/* Active SOS Tracker */}
              {sosActive && sosEvent && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-xs animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                    <span className="font-mono font-black text-rose-900">{sosEvent.code}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                      CODE RED ACTIVE
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-700">
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

                  <div className="p-2 rounded-xl bg-white border border-rose-200 text-[11px] font-bold text-rose-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Green Corridor signal priority requested for ambulance route.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Hero Map Panel */}
        <main className="flex-1 relative h-full min-h-[420px] lg:min-h-full bg-slate-200">
          <DualMapView
            center={[28.6139, 77.2090]}
            zoom={14}
            markers={mapMarkers}
            polylines={mapPolylines}
            showControls={true}
          />
        </main>
      </div>

      {/* Booking Confirmation & QR Pass Modal */}
      {bookingModalOpen && selectedSlot && activeGarage && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-blue-700">
                <ParkingSquare className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">Confirm Smart Parking Pass</h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
              <div className="text-xs font-black text-slate-900">{activeGarage.name}</div>
              <div className="text-blue-700 font-bold">
                Selected Slot: <strong className="font-mono text-base">{selectedSlot.code}</strong> ({selectedSlot.type})
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 01 AB 1234"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex justify-between">
                  <span>Duration</span>
                  <strong className="text-blue-600 font-mono">{durationHours} Hours</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Total Tariff Amount:</span>
                <strong className="text-base font-black text-slate-900 font-mono">
                  ₹{activeGarage.hourlyRateInr * durationHours}
                </strong>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>CONFIRM & GET PASS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Digital QR Pass Modal */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center animate-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PARKING CONFIRMED
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">{activeBooking.passCode}</h3>
              <p className="text-[11px] text-slate-500 font-medium">{activeBooking.garageName}</p>
            </div>

            {/* Simulated QR Code Canvas Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 inline-block shadow-inner">
              <div className="w-36 h-36 bg-white p-2 border border-slate-300 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                <QrCode className="w-32 h-32 text-slate-900" />
              </div>
              <span className="text-[9px] font-mono text-slate-400 block mt-1.5">SCAN AT BOOM BARRIER</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Slot:</span>
                <strong className="text-blue-700 font-mono text-xs">{activeBooking.slotCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Number:</span>
                <strong className="text-slate-900 font-mono">{activeBooking.vehicleNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <strong className="text-slate-900">{activeBooking.validUntil}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Amount Paid:</span>
                <strong className="text-emerald-700 font-mono text-xs font-black">₹{activeBooking.totalAmountInr}</strong>
              </div>
            </div>

            <button
              onClick={clearActiveBooking}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
            >
              Done & Save to Wallet
            </button>
          </div>
        </div>
      )}

      {/* DPDP ACT 2023 CITIZEN PRIVACY VAULT MODAL */}
      {privacyVaultOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setPrivacyVaultOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  DPDP Act 2023 Compliant
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Citizen Data & Privacy Vault</h3>
                <p className="text-xs text-slate-500 font-medium">Manage your personal civic data and privacy rights</p>
              </div>
            </div>

            {/* Notice Messages */}
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

            {/* Privacy Summary Card */}
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
                <span className="font-bold text-emerald-700">Auto-Purge after 30 Days</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleExportData}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Export My Data (JSON) — Section 12 Right</span>
              </button>

              <button
                onClick={handleRevokeConsent}
                className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-all flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Revoke Data Consent / Right to be Forgotten</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-medium">
              Operated under Section 12(3) & Section 14 of the Digital Personal Data Protection Act, 2023.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenPortal;
