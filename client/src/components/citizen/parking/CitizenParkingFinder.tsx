import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ParkingFacility,
  ParkingSlot,
} from '../../../types/citizen';
import { citizenParkingService } from '../../../services/citizenService';
import { navigationApiClient, RouteResponseData } from '../../../api/navigationApiClient';
import { DualMapView, MapMarker, MapPolyline } from '../../map/DualMapView';
import { ParkingFacilityCard } from './ParkingFacilityCard';
import { CinemaSeatParkingGrid } from './CinemaSeatParkingGrid';
import { ParkingSlotDetailCard } from './ParkingSlotDetailCard';
import { ParkingLegend } from './ParkingLegend';
import {
  ParkingSquare,
  ArrowLeft,
  Search,
  Zap,
  QrCode,
  X,
  Sparkles,
  Info,
  Navigation,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CitizenParkingFinderProps {
  onBackToDashboard: () => void;
  onGetDirections: (facility: ParkingFacility, slot: ParkingSlot) => void;
}

export const CitizenParkingFinder: React.FC<CitizenParkingFinderProps> = ({
  onBackToDashboard,
  onGetDirections,
}) => {
  // State
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('gar-01');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'EV_ONLY' | 'NEARBY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // User Origin Location in Delhi (Default Central Delhi: 28.6137551, 77.2122049)
  const [userOrigin, setUserOrigin] = useState<[number, number]>([28.6137551, 77.2122049]);
  const [routePreference, setRoutePreference] = useState<'FASTEST' | 'SHORTEST'>('FASTEST');
  const [osmRouteData, setOsmRouteData] = useState<RouteResponseData | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [navLoading, setNavLoading] = useState<boolean>(false);
  const [navError, setNavError] = useState<string | null>(null);
  const [showTurnSteps, setShowTurnSteps] = useState<boolean>(false);

  // Demo Pass Modal State
  const [passModalData, setPassModalData] = useState<{
    facility: ParkingFacility;
    slot: ParkingSlot;
    durationHours: number;
    passCode: string;
    validUntil: string;
    totalAmount: number;
  } | null>(null);

  // Load facilities from service layer
  useEffect(() => {
    const loadFacilities = async () => {
      setIsLoading(true);
      try {
        const data = await citizenParkingService.getNearbyParkingFacilities();
        setFacilities(data);
        if (data.length > 0 && !selectedFacilityId) {
          setSelectedFacilityId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load parking facilities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFacilities();
  }, []);

  // Filtered facilities list
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (filterMode === 'EV_ONLY' && (!f.evChargingAvailable || f.evSlotsAvailable === 0)) {
        return false;
      }
      if (filterMode === 'NEARBY' && f.distanceKm > 1.0) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [facilities, filterMode, searchQuery]);

  const activeFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || facilities[0] || null;
  }, [facilities, selectedFacilityId]);

  const selectedSlot = useMemo(() => {
    if (!activeFacility || !selectedSlotId) return null;
    return activeFacility.slots.find((s) => s.id === selectedSlotId) || null;
  }, [activeFacility, selectedSlotId]);

  // Calculate Real OSM Road Route to target parking facility
  const handleCalculateParkingRoute = useCallback(
    async (targetFacility: ParkingFacility, customOrigin?: [number, number], preference?: 'FASTEST' | 'SHORTEST') => {
      if (!targetFacility || !targetFacility.coordinates) return;
      const origin = customOrigin || userOrigin;
      const pref = preference || routePreference;

      setNavLoading(true);
      setNavError(null);
      try {
        const res = await navigationApiClient.calculateRoute({
          origin: { latitude: origin[0], longitude: origin[1] },
          destination: { latitude: targetFacility.coordinates[0], longitude: targetFacility.coordinates[1] },
          route_preference: pref,
          include_alternatives: true,
        });
        setOsmRouteData(res);
        setActiveRouteIndex(0);
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to calculate OSM route to parking.';
        setNavError(msg);
        setOsmRouteData(null);
      } finally {
        setNavLoading(false);
      }
    },
    [userOrigin, routePreference]
  );

  // Trigger initial route calculation when activeFacility loads
  useEffect(() => {
    if (activeFacility && !osmRouteData && !navLoading) {
      handleCalculateParkingRoute(activeFacility);
    }
  }, [activeFacility]);

  // Handle facility selection
  const handleSelectFacility = (facility: ParkingFacility) => {
    setSelectedFacilityId(facility.id);
    setSelectedSlotId(null); // Clear slot selection on facility switch
    handleCalculateParkingRoute(facility);
  };

  // Handle slot selection
  const handleSelectSlot = (slot: ParkingSlot) => {
    if (slot.status !== 'AVAILABLE') return;
    setSelectedSlotId((prev) => (prev === slot.id ? null : slot.id));
  };

  // Handle Demo Pass generation
  const handleSimulatePass = (facility: ParkingFacility, slot: ParkingSlot, durationHours: number) => {
    const passNum = Math.floor(100000 + Math.random() * 900000);
    const passCode = `PARK-DL-${passNum}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + durationHours * 3600 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setPassModalData({
      facility,
      slot,
      durationHours,
      passCode,
      validUntil,
      totalAmount: slot.hourlyRate * durationHours,
    });
  };

  // Convert facilities and user origin into DualMapView markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = [];

    // 1. User Location Origin Marker
    markers.push({
      id: 'user-origin-pt',
      lat: osmRouteData ? osmRouteData.snapped_origin.latitude : userOrigin[0],
      lng: osmRouteData ? osmRouteData.snapped_origin.longitude : userOrigin[1],
      title: 'Your Location (Central Delhi Origin)',
      category: 'CITIZEN_LOCATION',
      badge: '📍',
      color: '#10b981',
    });

    // 2. Parking Facility Markers for all existing parking lots
    facilities.forEach((fac) => {
      const isSelected = activeFacility?.id === fac.id;
      markers.push({
        id: `parking-fac-${fac.id}`,
        lat: fac.coordinates[0],
        lng: fac.coordinates[1],
        title: `${fac.name} — ${fac.availableSlots}/${fac.totalSlots} Slots Free (₹${fac.hourlyRateInr}/hr)`,
        category: 'PARKING',
        badge: '🅿',
        color: isSelected ? '#0f766e' : '#0d9488',
        onClick: () => {
          handleSelectFacility(fac);
        },
      });
    });

    return markers;
  }, [facilities, activeFacility, osmRouteData, userOrigin]);

  // Construct OSM Road Navigation Polylines
  const activeOsmRoute = osmRouteData && osmRouteData.routes[activeRouteIndex];
  const mapPolylines: MapPolyline[] = useMemo(() => {
    if (!activeOsmRoute) return [];

    return [
      // Alternative routes in dashed neutral gray
      ...osmRouteData.routes
        .filter((_, idx) => idx !== activeRouteIndex)
        .map((altRt, idx) => ({
          id: `osm-parking-alt-${idx}`,
          coordinates: altRt.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
          color: '#94a3b8',
          weight: 5,
          dashArray: '6, 6',
          title: `Alternative Route (${(altRt.distance_meters / 1000).toFixed(2)} km - ${altRt.formatted_eta})`,
        })),
      // Active chosen route in solid blue
      {
        id: 'osm-parking-active-route',
        coordinates: activeOsmRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
        color: '#2563eb',
        weight: 6,
        title: `OSM Route to ${activeFacility?.name} (${(activeOsmRoute.distance_meters / 1000).toFixed(2)} km - ${activeOsmRoute.formatted_eta})`,
      },
    ];
  }, [activeOsmRoute, osmRouteData, activeRouteIndex, activeFacility]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 🧭 Top Navigation & Back Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-600 hover:text-blue-600 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Citizen Home</span>
        </button>

        {/* Accessibility & Demo Tag */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold">
            <Info className="w-3 h-3 text-blue-600" />
            <span>Real OpenStreetMap Road Navigation to Selected Parking Lots</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-black border border-teal-200">
            OSM NAVIGATION
          </span>
        </div>
      </div>

      {/* 🅿️ Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN (Cols 1-5): NEARBY PARKING FACILITIES DISCOVERY
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
          {/* Header */}
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <ParkingSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Find Parking Facilities
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live availability, hourly tariffs, and real OSM navigation
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garage name, sector, or code..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterMode === 'ALL'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({facilities.length})
            </button>
            <button
              onClick={() => setFilterMode('EV_ONLY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 whitespace-nowrap ${
                filterMode === 'EV_ONLY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>EV Ready</span>
            </button>
            <button
              onClick={() => setFilterMode('NEARBY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterMode === 'NEARBY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              &lt; 1 km Nearby
            </button>
          </div>

          {/* Facilities List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Scanning nearby parking facilities...</p>
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500 font-medium">
                No parking facilities match your search filter.
              </div>
            ) : (
              filteredFacilities.map((fac) => (
                <ParkingFacilityCard
                  key={fac.id}
                  facility={fac}
                  isSelected={activeFacility?.id === fac.id}
                  onSelect={handleSelectFacility}
                  onGetDirections={(f) => {
                    handleSelectFacility(f);
                    handleCalculateParkingRoute(f);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (Cols 6-12): PARKING MAP + OSM ROUTE + SLOTS SELECTION
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {activeFacility ? (
            <div className="space-y-5">
              {/* 🗺️ Interactive Smart Parking Map & OSM Road Navigation Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
                {/* Header & Quick Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        Parking Location & OSM Navigation
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Real-time A* routing over OpenStreetMap road geometry to {activeFacility.name}
                      </p>
                    </div>
                  </div>

                  {/* Route Preference Toggle */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setRoutePreference('FASTEST');
                        handleCalculateParkingRoute(activeFacility, undefined, 'FASTEST');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        routePreference === 'FASTEST' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Fastest
                    </button>
                    <button
                      onClick={() => {
                        setRoutePreference('SHORTEST');
                        handleCalculateParkingRoute(activeFacility, undefined, 'SHORTEST');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        routePreference === 'SHORTEST' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Shortest
                    </button>
                  </div>
                </div>

                {/* Map Canvas */}
                <div className="h-[340px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-inner">
                  <DualMapView
                    center={activeFacility.coordinates}
                    zoom={14}
                    markers={mapMarkers}
                    polylines={mapPolylines}
                    showControls={true}
                    showKmlBoundary={true}
                    onMapClick={(coords) => {
                      setUserOrigin(coords);
                      handleCalculateParkingRoute(activeFacility, coords);
                    }}
                  />

                  {/* Map Status Badge Overlay */}
                  <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-[11px] font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Destination: <strong>{activeFacility.name}</strong></span>
                  </div>
                </div>

                {/* Navigation Metrics & Guidance Details */}
                {navLoading && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs flex items-center space-x-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Calculating real-time route over OpenStreetMap network...</span>
                  </div>
                )}

                {navError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs">
                    {navError}
                  </div>
                )}

                {activeOsmRoute && !navLoading && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-teal-50/70 border border-blue-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Distance</span>
                          <strong className="text-base font-black text-slate-900 font-mono">
                            {(activeOsmRoute.distance_meters / 1000).toFixed(2)} km
                          </strong>
                        </div>
                        <div className="h-7 w-px bg-slate-200" />
                        <div className="text-left">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Estimated ETA</span>
                          <strong className="text-base font-black text-emerald-700 font-mono">
                            {activeOsmRoute.formatted_eta}
                          </strong>
                        </div>
                        <div className="h-7 w-px bg-slate-200" />
                        <div className="text-left">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Maneuvers</span>
                          <strong className="text-base font-black text-blue-700 font-mono">
                            {activeOsmRoute.steps.length} Steps
                          </strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowTurnSteps(!showTurnSteps)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1 shadow-xs"
                      >
                        <span>{showTurnSteps ? 'Hide Guidance' : 'View Turn Guidance'}</span>
                        {showTurnSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Turn-by-Turn Guidance Accordion */}
                    {showTurnSteps && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider block">
                          Step-by-Step Road Guidance:
                        </span>
                        {activeOsmRoute.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-800 flex items-start space-x-2"
                          >
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-mono text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <div className="flex-1">
                              <div>{step.instruction}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {step.street_name || 'Connecting Road'} • {step.distance_meters}m • ~{Math.round(step.duration_seconds)}s
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 🎬 Visual Cinema-Seat Parking Slot Grid & Details Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
                {/* Facility Header Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {activeFacility.code}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {activeFacility.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {activeFacility.address} • {activeFacility.distanceDisplay} • Rate: ₹{activeFacility.hourlyRateInr}/hr
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                      {activeFacility.availableSlots} / {activeFacility.totalSlots} FREE
                    </span>
                  </div>
                </div>

                {/* Status Legend */}
                <ParkingLegend />

                {/* Cinema-Seat Parking Slot Grid */}
                <CinemaSeatParkingGrid
                  facility={activeFacility}
                  selectedSlotId={selectedSlotId}
                  onSelectSlot={handleSelectSlot}
                />

                {/* Selected Slot Details Panel (Interactive) */}
                {selectedSlot ? (
                  <ParkingSlotDetailCard
                    facility={activeFacility}
                    slot={selectedSlot}
                    onGetDirections={(fac, s) => {
                      handleCalculateParkingRoute(fac);
                      onGetDirections(fac, s);
                    }}
                    onSimulatePass={handleSimulatePass}
                    onClearSelection={() => setSelectedSlotId(null)}
                  />
                ) : (
                  <div className="p-6 rounded-3xl bg-slate-50/70 border border-dashed border-slate-300 text-center space-y-1.5">
                    <Sparkles className="w-5 h-5 text-teal-600 mx-auto" />
                    <div className="text-xs font-extrabold text-slate-800">
                      Select any green Available slot above
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-medium">
                      Tap a parking bay on the map to inspect bay amenities, calculate tariffs, and trigger direct GPS navigation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400 font-medium">
              Select a parking facility from the left column to view the movie-theatre slot map.
            </div>
          )}
        </div>
      </div>

      {/* 🎟️ Simulated Parking Pass Modal (Demo Feature) */}
      {passModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-teal-700">
                <QrCode className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Simulated Digital Parking Pass (Demo)
                </h3>
              </div>
              <button
                onClick={() => setPassModalData(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
                aria-label="Close pass modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Mock graphic */}
            <div className="w-36 h-36 mx-auto bg-slate-900 text-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg">
              <QrCode className="w-20 h-20 text-white" />
              <span className="font-mono text-[9px] text-teal-300 font-bold mt-1">
                {passModalData.passCode}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Bay</span>
              <div className="text-2xl font-black font-mono text-blue-600">
                Slot {passModalData.slot.code}
              </div>
              <div className="font-extrabold text-sm text-slate-900">
                {passModalData.facility.name}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <strong className="text-slate-900">{passModalData.durationHours} Hours</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <strong className="text-slate-900">{passModalData.validUntil}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Demo Tariff:</span>
                <strong className="text-emerald-700 font-mono text-sm">₹{passModalData.totalAmount}</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onGetDirections(passModalData.facility, passModalData.slot);
                  setPassModalData(null);
                }}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <span>Navigate to Parking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
