import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, RotateCcw, Box } from 'lucide-react';

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
}

export const DualMapView: React.FC<DualMapViewProps> = ({
  center = [28.6139, 77.2090],
  zoom = 14,
  markers = [],
  polylines = [],
  tiltMode = false,
  onMapClick,
  className = 'h-full w-full',
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [is3D, setIs3D] = useState(tiltMode);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  // Leaflet references
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletPolylinesGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet
  useEffect(() => {
    if (!containerRef.current) return;
    if (leafletMapRef.current) return;

    try {
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '© OpenStreetMap contributors, © CARTO',
      });

      tileLayer.addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const polylinesGroup = L.layerGroup().addTo(map);

      leafletMapRef.current = map;
      leafletMarkersGroupRef.current = markersGroup;
      leafletPolylinesGroupRef.current = polylinesGroup;

      // Ensure proper sizing immediately and on container resize
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 200);

      const resizeObserver = new ResizeObserver(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick([e.latlng.lat, e.latlng.lng]);
        }
      });
    } catch (err) {
      console.warn('Leaflet fallback initialization:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update center & zoom
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update polylines
  useEffect(() => {
    if (!leafletPolylinesGroupRef.current) return;
    leafletPolylinesGroupRef.current.clearLayers();

    polylines.forEach((poly) => {
      const leafletPoly = L.polyline(poly.coordinates, {
        color: poly.color || '#2563eb',
        weight: poly.weight || 6,
        opacity: 0.9,
        dashArray: poly.dashArray,
      });

      if (poly.title) {
        leafletPoly.bindTooltip(
          `<div class="font-sans font-bold text-xs p-1">${poly.title} ${
            poly.congestionPercent ? `(${poly.congestionPercent}%)` : ''
          }</div>`,
          { sticky: true }
        );
      }

      leafletPoly.addTo(leafletPolylinesGroupRef.current!);
    });
  }, [polylines]);

  // Update markers
  useEffect(() => {
    if (!leafletMarkersGroupRef.current) return;
    leafletMarkersGroupRef.current.clearLayers();

    markers.forEach((m) => {
      const color = m.color || (m.category === 'HOSPITAL' ? '#059669' : m.category === 'AMBULANCE' ? '#e11d48' : '#2563eb');
      const customIcon = L.divIcon({
        className: 'custom-dual-marker',
        html: `
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
            ${m.badge || (m.category === 'HOSPITAL' ? 'H' : m.category === 'AMBULANCE' ? '🚑' : '•')}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });

      marker.bindTooltip(`<div class="font-sans text-xs font-bold">${m.title}</div>`, {
        direction: 'top',
        offset: [0, -10],
      });

      if (m.onClick) {
        marker.on('click', () => m.onClick!());
      }

      marker.addTo(leafletMarkersGroupRef.current!);
    });
  }, [markers]);

  const handleReset = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, 14);
    }
  };

  const handleZoomIn = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomOut();
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* 2.5D Tilt Perspective Wrapper */}
      <div
        className={`h-full w-full transition-transform duration-500 ease-out ${
          is3D ? 'transform [perspective:1200px] [transform:rotateX(28deg)_scale(1.04)]' : ''
        }`}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Floating Control HUD */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[400] flex flex-col items-end space-y-2 select-none pointer-events-auto">
          {/* Zoom Buttons */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-1 flex flex-col space-y-1">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <div className="text-[9px] font-mono text-center font-bold text-slate-400 py-0.5">
              {currentZoom}z
            </div>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center transition-colors"
              title="Zoom Out"
            >
              -
            </button>
          </div>

          {/* Controls Capsule */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-1.5 flex items-center space-x-1.5">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Reset View to Center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIs3D(!is3D)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all ${
                is3D ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="Toggle 2.5D Isometric Tilt"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="text-[10px]">2.5D</span>
            </button>

            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center" title="Digital Compass: North Aligned">
              <Compass className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
