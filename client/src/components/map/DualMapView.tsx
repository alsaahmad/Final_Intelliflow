import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, RotateCcw, Building2 } from 'lucide-react';
import { gisApiClient } from '../../api/gisApiClient';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: 'JUNCTION' | 'HOSPITAL' | 'AMBULANCE' | 'CCTV' | 'INCIDENT' | 'PARKING' | 'CITIZEN_LOCATION';
  badge?: string;
  color?: string;
  onClick?: () => void;
}

export interface MapPolyline {
  id: string;
  coordinates: [number, number][];
  color: string;
  weight?: number;
  dashArray?: string;
  title?: string;
  congestionPercent?: number;
}

interface DualMapViewProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  tiltMode?: boolean;
  onMapClick?: (coords: [number, number]) => void;
  className?: string;
  showControls?: boolean;
  showKmlBoundary?: boolean;
}

const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const INITIAL_PITCH = 60;

const FALLBACK_SECTOR_BOUNDARY_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Sector A GIS Boundary' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.18381070420673, 28.58070067752181],
            [77.2520067597289, 28.57925551422057],
            [77.24992136692033, 28.6318608282402],
            [77.19489321228228, 28.63286914482247],
            [77.18381070420673, 28.58070067752181],
          ],
        ],
      },
    },
  ],
};

function configureBuildingExtrusions(map: maplibregl.Map) {
  try {
    if (map.getLayer('building-3d')) {
      map.setPaintProperty('building-3d', 'fill-extrusion-height', [
        'coalesce',
        ['get', 'render_height'],
        ['get', 'height'],
        15,
      ]);
      map.setPaintProperty('building-3d', 'fill-extrusion-base', [
        'coalesce',
        ['get', 'render_min_height'],
        ['get', 'min_height'],
        0,
      ]);
      map.setPaintProperty('building-3d', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'render_height'], 0],
        0,
        '#cbd5e1',
        30,
        '#94a3b8',
        80,
        '#64748b',
      ]);
      map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.88);
    } else if (map.getSource('openmaptiles')) {
      map.addLayer({
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'render_height'], 0],
            0,
            '#cbd5e1',
            30,
            '#94a3b8',
            80,
            '#64748b',
          ],
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'render_height'],
            ['get', 'height'],
            15,
          ],
          'fill-extrusion-base': [
            'coalesce',
            ['get', 'render_min_height'],
            ['get', 'min_height'],
            0,
          ],
          'fill-extrusion-opacity': 0.88,
        },
      });
    }
  } catch (err) {
    console.warn('3D building layer configuration notice:', err);
  }
}

async function addSectorBoundary(map: maplibregl.Map) {
  try {
    let boundaryData: any = FALLBACK_SECTOR_BOUNDARY_GEOJSON;
    try {
      const apiBoundary = await gisApiClient.getSectorBoundary();
      if (apiBoundary?.features?.length > 0) {
        boundaryData = apiBoundary;
      }
    } catch {
      console.info('Using verified KML boundary dataset fallback');
    }

    map.addSource('sector-boundary', {
      type: 'geojson',
      data: boundaryData,
    });

    map.addLayer({
      id: 'sector-boundary-fill',
      type: 'fill',
      source: 'sector-boundary',
      paint: {
        'fill-color': '#8b5cf6',
        'fill-opacity': 0.08,
      },
    });

    map.addLayer({
      id: 'sector-boundary-line',
      type: 'line',
      source: 'sector-boundary',
      paint: {
        'line-color': '#8b5cf6',
        'line-width': 3,
        'line-opacity': 0.85,
        'line-dasharray': [3, 3],
      },
    });
  } catch (err) {
    console.warn('Sector boundary layer notice:', err);
  }
}

export const DualMapView: React.FC<DualMapViewProps> = ({
  center = [28.6139, 77.209],
  zoom = 14,
  markers = [],
  polylines = [],
  tiltMode = true,
  onMapClick,
  className = 'h-full w-full',
  showControls = true,
  showKmlBoundary = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [is3D, setIs3D] = useState(tiltMode);
  const [showBuildings3D, setShowBuildings3D] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [bearing, setBearing] = useState(0);

  // Initialize MapLibre 3D map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: LIBERTY_STYLE_URL,
      center: [center[1], center[0]],
      zoom,
      pitch: tiltMode ? INITIAL_PITCH : 0,
      bearing: 0,
      maxPitch: 85,
      attributionControl: false,
      dragRotate: true,
      pitchWithRotate: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true, showZoom: false }),
      'top-left'
    );

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors, © OpenFreeMap Liberty',
      }),
      'bottom-right'
    );

    map.on('load', async () => {
      configureBuildingExtrusions(map);

      if (showKmlBoundary) {
        await addSectorBoundary(map);
      }

      map.addSource('dual-polylines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'dual-polylines-line',
        type: 'line',
        source: 'dual-polylines',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'weight'],
          'line-opacity': 0.9,
          'line-dasharray': ['get', 'dashArray'],
        },
      });
    });

    map.on('zoom', () => setCurrentZoom(map.getZoom()));
    map.on('rotate', () => setBearing(map.getBearing()));
    map.on('pitch', () => setIs3D(map.getPitch() > 25));

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.lngLat.lat, e.lngLat.lng]);
      }
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync center & zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [center[1], center[0]], zoom });
  }, [center[0], center[1], zoom]);

  // Sync polylines
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('dual-polylines') as maplibregl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features: polylines.map((poly) => ({
        type: 'Feature' as const,
        properties: {
          color: poly.color || '#2563eb',
          weight: poly.weight || 6,
          dashArray: poly.dashArray ? poly.dashArray.split(',').map(Number) : [1, 0],
          title: poly.title || '',
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: poly.coordinates.map(([lat, lng]) => [lng, lat]),
        },
      })),
    });
  }, [polylines]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((m) => {
      const color =
        m.color ||
        (m.category === 'HOSPITAL'
          ? '#059669'
          : m.category === 'AMBULANCE'
          ? '#e11d48'
          : m.category === 'PARKING'
          ? '#0d9488'
          : '#2563eb');

      const el = document.createElement('div');
      el.className = 'custom-dual-marker cursor-pointer select-none';
      el.innerHTML = `
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${m.badge || (m.category === 'HOSPITAL' ? 'H' : m.category === 'AMBULANCE' ? '🚑' : m.category === 'PARKING' ? '🅿' : '•')}
        </div>
      `;

      if (m.onClick) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          m.onClick!();
        });
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
            `<div class="font-sans text-xs font-bold px-1 py-0.5">${m.title}</div>`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [markers]);

  // Toggle 3D building extrusions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer('building-3d')) {
      map.setLayoutProperty('building-3d', 'visibility', showBuildings3D ? 'visible' : 'none');
    }
  }, [showBuildings3D]);

  const handleReset = () => {
    mapRef.current?.flyTo({
      center: [center[1], center[0]],
      zoom: 14,
      pitch: is3D ? INITIAL_PITCH : 0,
      bearing: 0,
      duration: 1000,
    });
  };

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });

  const handleToggle3D = () => {
    const map = mapRef.current;
    if (!map) return;
    const next3D = !is3D;
    setIs3D(next3D);
    map.easeTo({ pitch: next3D ? INITIAL_PITCH : 0, duration: 800 });
  };

  const handleResetBearing = () => {
    mapRef.current?.easeTo({ bearing: 0, duration: 600 });
  };

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />

      {showKmlBoundary && (
        <div className="absolute bottom-4 left-4 z-[400] pointer-events-none flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-purple-200 text-purple-950 shadow-md text-[11px] font-bold select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white" />
          <span>Sector A Boundary (KML)</span>
        </div>
      )}

      {showControls && (
        <div className="absolute top-4 right-4 z-[400] flex flex-col items-end space-y-2 select-none pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-1 flex flex-col space-y-1">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <div className="text-[9px] font-mono text-center font-bold text-slate-400 py-0.5">
              {currentZoom.toFixed(1)}z
            </div>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center transition-colors"
              title="Zoom Out"
            >
              -
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-1.5 flex items-center space-x-1.5">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleToggle3D}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center transition-all ${
                is3D ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title={is3D ? 'Switch to 2D view' : 'Switch to 3D view'}
            >
              {is3D ? '3D' : '2D'}
            </button>

            <button
              onClick={() => setShowBuildings3D((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center transition-all ${
                showBuildings3D
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title={showBuildings3D ? 'Hide 3D buildings' : 'Show 3D buildings'}
            >
              <Building2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetBearing}
              className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"
              title="Reset to North"
            >
              <Compass className="w-4 h-4" style={{ transform: `rotate(${-bearing}deg)` }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
