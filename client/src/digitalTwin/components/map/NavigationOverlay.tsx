import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { navigationApiClient, RouteResponseData } from '../../../api/navigationApiClient';
import { useTranslation } from '../../../i18n/useTranslation';
import { Navigation, MapPin, Flag, Zap, Compass, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NavigationOverlayProps {
  mapInstance: L.Map | null;
  routesGroup: L.LayerGroup | null;
}

const PRESET_POINTS = [
  { name: 'J01 - Kartavya Path & Rafi Ahmed Kidwai Marg', lat: 28.6137551, lon: 77.2122049 },
  { name: 'J02 - Kartavya Path & Janpath', lat: 28.6134521, lon: 77.2184671 },
  { name: 'J03 - Kartavya Path Signalized Junction', lat: 28.6130207, lon: 77.2276662 },
  { name: 'J14 - Kartavya Path & Man Singh Road', lat: 28.6131567, lon: 77.2247654 },
];

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ mapInstance, routesGroup }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [originLat, setOriginLat] = useState<string>('28.6137551');
  const [originLon, setOriginLon] = useState<string>('77.2122049');
  const [destLat, setDestLat] = useState<string>('28.6130207');
  const [destLon, setDestLon] = useState<string>('77.2276662');
  const [preference, setPreference] = useState<'FASTEST' | 'SHORTEST'>('FASTEST');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteResponseData | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [clickMode, setClickMode] = useState<'ORIGIN' | 'DESTINATION' | null>(null);

  // Map click listener for setting origin/destination
  useEffect(() => {
    if (!mapInstance || !clickMode) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat.toFixed(7);
      const lon = e.latlng.lng.toFixed(7);
      if (clickMode === 'ORIGIN') {
        setOriginLat(lat);
        setOriginLon(lon);
      } else if (clickMode === 'DESTINATION') {
        setDestLat(lat);
        setDestLon(lon);
      }
      setClickMode(null);
    };

    mapInstance.on('click', handleMapClick);
    return () => {
      mapInstance.off('click', handleMapClick);
    };
  }, [mapInstance, clickMode]);

  // Clear polylines & markers on routesGroup
  const clearMapOverlays = () => {
    if (routesGroup) {
      routesGroup.clearLayers();
    }
  };

  // Render polylines and markers onto Leaflet map
  useEffect(() => {
    if (!mapInstance || !routesGroup || !routeData) {
      clearMapOverlays();
      return;
    }

    clearMapOverlays();

    // Start Icon
    const originIcon = L.divIcon({
      className: 'custom-nav-marker',
      html: `<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">A</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Destination Icon
    const destIcon = L.divIcon({
      className: 'custom-nav-marker',
      html: `<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">B</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const origLatLon: [number, number] = [
      routeData.snapped_origin.latitude,
      routeData.snapped_origin.longitude,
    ];
    const destLatLon: [number, number] = [
      routeData.snapped_destination.latitude,
      routeData.snapped_destination.longitude,
    ];

    L.marker(origLatLon, { icon: originIcon }).addTo(routesGroup);
    L.marker(destLatLon, { icon: destIcon }).addTo(routesGroup);

    // Draw non-active alternative routes first (dashed gray)
    routeData.routes.forEach((rt, idx) => {
      if (idx !== activeRouteIndex) {
        const latlngs: [number, number][] = rt.geometry.coordinates.map((c) => [c[1], c[0]]);
        L.polyline(latlngs, {
          color: '#6B7280',
          weight: 5,
          opacity: 0.6,
          dashArray: '8, 8',
        }).addTo(routesGroup);
      }
    });

    // Draw active primary route (solid vibrant blue)
    const activeRoute = routeData.routes[activeRouteIndex];
    if (activeRoute) {
      const latlngs: [number, number][] = activeRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
      const activePolyline = L.polyline(latlngs, {
        color: '#2563EB',
        weight: 7,
        opacity: 0.9,
      }).addTo(routesGroup);

      // Fit map bounds to show full route
      mapInstance.fitBounds(activePolyline.getBounds(), { padding: [50, 50] });
    }
  }, [mapInstance, routesGroup, routeData, activeRouteIndex]);

  const handleCalculateRoute = async () => {
    setLoading(true);
    setErrorMsg(null);
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
        route_preference: preference,
        include_alternatives: true,
      });

      setRouteData(res);
      setActiveRouteIndex(0);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to calculate route.';
      setErrorMsg(msg);
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearRoute = () => {
    setRouteData(null);
    setErrorMsg(null);
    clearMapOverlays();
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="absolute top-20 right-4 z-[1000]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg font-semibold text-xs transition-all border ${
            isOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/60 hover:bg-slate-800'
          } backdrop-blur-md`}
        >
          <Navigation className="w-4 h-4 text-blue-400" />
          <span>{t('nav.title', 'OSM Navigation')}</span>
        </button>
      </div>

      {/* Navigation HUD Panel */}
      {isOpen && (
        <div className="absolute top-32 right-4 z-[1000] w-88 max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-100 font-sans transition-all">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-100">{t('nav.title', 'OSM Road Navigation')}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets Dropdown */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {t('nav.preset', 'Quick Presets')}
            </label>
            <select
              onChange={(e) => {
                const p = PRESET_POINTS[parseInt(e.target.value)];
                if (p) {
                  setOriginLat(p.lat.toString());
                  setOriginLon(p.lon.toString());
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Set Origin Preset --</option>
              {PRESET_POINTS.map((pt, idx) => (
                <option key={idx} value={idx}>{pt.name}</option>
              ))}
            </select>
          </div>

          {/* Origin Inputs */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {t('nav.origin', 'Origin Point (A)')}
              </span>
              <button
                onClick={() => setClickMode('ORIGIN')}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  clickMode === 'ORIGIN'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
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
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-blue-500"
              />
              <input
                type="text"
                value={originLon}
                onChange={(e) => setOriginLon(e.target.value)}
                placeholder="Longitude"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Destination Inputs */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> {t('nav.destination', 'Destination Point (B)')}
              </span>
              <button
                onClick={() => setClickMode('DESTINATION')}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  clickMode === 'DESTINATION'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
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
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-blue-500"
              />
              <input
                type="text"
                value={destLon}
                onChange={(e) => setDestLon(e.target.value)}
                placeholder="Longitude"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preference Selection */}
          <div className="flex items-center justify-between mb-3 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setPreference('FASTEST')}
              className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                preference === 'FASTEST' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ {t('nav.fastest', 'Fastest Route')}
            </button>
            <button
              onClick={() => setPreference('SHORTEST')}
              className={`flex-1 py-1 text-xs rounded-md font-medium transition-all ${
                preference === 'SHORTEST' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📏 {t('nav.shortest', 'Shortest Distance')}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleCalculateRoute}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              {loading ? <Zap className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>{loading ? t('nav.calculating', 'Routing...') : t('nav.findRoute', 'Find OSM Route')}</span>
            </button>
            {routeData && (
              <button
                onClick={handleClearRoute}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-xl text-xs border border-slate-700"
              >
                {t('nav.clear', 'Clear')}
              </button>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 mb-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Route Results Card */}
          {routeData && routeData.routes.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              {/* Route Options Switcher */}
              <div className="space-y-1.5">
                {routeData.routes.map((rt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveRouteIndex(idx)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      idx === activeRouteIndex
                        ? 'bg-blue-950/70 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                        {idx === activeRouteIndex && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                        {rt.route_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">{rt.formatted_eta}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>Distance: {(rt.distance_meters / 1000).toFixed(2)} km</span>
                      <span>Steps: {rt.steps.length}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Turn-by-Turn Steps Preview */}
              {routeData.routes[activeRouteIndex] && (
                <div className="max-h-36 overflow-y-auto pr-1 space-y-1 text-[11px] bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-400 mb-1">Maneuvers:</div>
                  {routeData.routes[activeRouteIndex].steps.map((st, sIdx) => (
                    <div key={sIdx} className="text-slate-300 py-0.5 border-b border-slate-800/60 last:border-none flex justify-between">
                      <span>{sIdx + 1}. {st.instruction}</span>
                      <span className="text-slate-500 shrink-0 ml-2">{int(st.distance_meters)}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

function int(val: number): number {
  return Math.round(val);
}
