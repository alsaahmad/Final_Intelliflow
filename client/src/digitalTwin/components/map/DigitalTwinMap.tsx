import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useTwin } from '../../context/TwinContext';
import { MapControls } from './MapControls';
import { KMZLayerOverlay } from '../../../components/gis/KMZLayerOverlay';
import { NavigationOverlay } from './NavigationOverlay';
import { CITY_CENTER, DEFAULT_MAP_ZOOM } from '../../data/seedTwinData';
import { Road } from '../../types';
import '../../digitalTwin.css';

const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_API_KEY || 'ckytfxntdvupxhoixsiypuzyouwykylfmogm';

const TILE_URLS = {
  mappls: `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/still_map/{z}/{x}/{y}.png`,
  positron: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

export const DigitalTwinMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylinesGroupRef = useRef<L.LayerGroup | null>(null);

  const {
    mode,
    roads,
    junctions,
    hospitals,
    ambulances,
    cctvs,
    incidents,
    policeStations,
    fireStations,
    selectedEntity,
    setSelectedEntity,
    layerVisibility,
    predictionHorizon,
    simulationResult,
    simulationStepIndex,
    builderTool,
    setBuilderCoords,
    setBuilderModalOpen,
  } = useTwin();

  const [zoomLevel, setZoomLevel] = useState<number>(DEFAULT_MAP_ZOOM);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [tileTheme, setTileTheme] = useState<'voyager' | 'positron' | 'osm' | 'mappls'>('voyager');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CITY_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    const tileLayer = L.tileLayer(TILE_URLS[tileTheme], {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '© OpenStreetMap contributors, © CARTO, © Mappls',
    }).addTo(map);

    tileLayer.on('tileerror', () => {
      if (tileLayerRef.current && tileTheme === 'mappls') {
        tileLayerRef.current.setUrl(TILE_URLS.voyager);
      }
    });

    tileLayerRef.current = tileLayer;

    // Create Layer Groups
    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    const routesGroup = L.layerGroup().addTo(map);
    routePolylinesGroupRef.current = routesGroup;

    // Invalidate size after mount and resize to ensure full canvas rendering
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Track Zoom Changes
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Map Click for Builder Mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (builderTool !== 'NONE') {
        setBuilderCoords([e.latlng.lat, e.latlng.lng]);
        setBuilderModalOpen(true);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Theme
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(TILE_URLS[tileTheme]);
  }, [tileTheme]);

  // Color Calculation for Roads based on mode
  const getRoadColor = useCallback(
    (road: Road): string => {
      // Simulation mode override
      if (mode === 'SIMULATION' && simulationResult) {
        if (simulationResult.affectedRoadIds.includes(road.id)) {
          if (simulationStepIndex >= 4) {
            return '#ef4444'; // Red gridlock / closed
          }
          return '#f97316'; // Orange heavy
        }
        if (road.id === 'r-105' && simulationStepIndex >= 5) {
          return '#2563eb'; // Blue green corridor bypass
        }
      }

      // Prediction mode override
      if (mode === 'PREDICTION') {
        const predCongestion =
          predictionHorizon === '+30m'
            ? road.prediction30MinCongestion
            : road.prediction15MinCongestion;

        if (predCongestion > 85) return '#ef4444';
        if (predCongestion > 70) return '#f97316';
        if (predCongestion > 45) return '#eab308';
        return '#10b981';
      }

      // Live mode standard
      if (road.status === 'BLOCKED') return '#64748b';
      if (road.isEmergencyCorridor) return '#2563eb';

      switch (road.trafficLevel) {
        case 'CRITICAL':
          return '#ef4444';
        case 'HEAVY':
          return '#f97316';
        case 'MODERATE':
          return '#eab308';
        case 'LOW':
        default:
          return '#10b981';
      }
    },
    [mode, predictionHorizon, simulationResult, simulationStepIndex]
  );

  // Redraw Map Elements when state, layers or zoom changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current || !routePolylinesGroupRef.current) return;

    layersGroupRef.current.clearLayers();
    routePolylinesGroupRef.current.clearLayers();

    const zoom = zoomLevel;

    // 1. Draw Roads Layer (Polylines)
    if (layerVisibility.roads) {
      roads.forEach((road) => {
        const isSelected = selectedEntity?.type === 'ROAD' && selectedEntity.data.id === road.id;
        const color = getRoadColor(road);
        const weight = isSelected ? 8 : zoom > 14 ? 6 : 4;
        const isDashed = road.status === 'BLOCKED';

        const polyline = L.polyline(road.coordinates, {
          color: isSelected ? '#3b82f6' : color,
          weight,
          opacity: isSelected ? 1 : 0.85,
          dashArray: isDashed ? '8, 8' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Hover & Click
        polyline.on('click', () => {
          setSelectedEntity({ type: 'ROAD', data: road });
        });

        polyline.on('mouseover', (e: L.LeafletEvent) => {
          (e.target as L.Polyline).setStyle({ weight: weight + 3, opacity: 1 });
        });

        polyline.on('mouseout', (e: L.LeafletEvent) => {
          (e.target as L.Polyline).setStyle({ weight, opacity: isSelected ? 1 : 0.85 });
        });

        // Tooltip
        polyline.bindTooltip(
          `<div class="px-2 py-1 text-xs font-sans">
            <strong class="text-slate-900">${road.code} - ${road.name}</strong>
            <div class="text-[11px] text-slate-600 font-medium">
              Traffic: <span style="color:${color}" class="font-bold">${road.congestionPercent}% (${road.trafficLevel})</span> • ${road.currentSpeedKmh} km/h
            </div>
          </div>`,
          { sticky: true, className: 'leaflet-popup-content-wrapper' }
        );

        polyline.addTo(layersGroupRef.current!);
      });
    }

    // 2. Draw Junctions Layer (Markers)
    if (layerVisibility.junctions) {
      junctions.forEach((jnc) => {
        const isSelected = selectedEntity?.type === 'JUNCTION' && selectedEntity.data.id === jnc.id;
        const isCongested = jnc.congestionIndex > 70;

        const iconHtml = `
          <div class="relative group cursor-pointer transition-transform transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-8 h-8 rounded-xl bg-white shadow-lg border-2 ${
              isCongested ? 'border-rose-500' : 'border-indigo-500'
            } flex items-center justify-center text-slate-900 font-mono font-black text-[11px]">
              ${jnc.code}
            </div>
            ${
              zoom > 14
                ? `<div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap">
                    ${jnc.signalTimerSeconds}s
                  </div>`
                : ''
            }
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(jnc.location, { icon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'JUNCTION', data: jnc });
        });

        marker.addTo(layersGroupRef.current!);
      });
    }

    // 3. Draw Hospitals Layer
    if (layerVisibility.hospitals) {
      hospitals.forEach((hosp) => {
        const isSelected = selectedEntity?.type === 'HOSPITAL' && selectedEntity.data.id === hosp.id;

        const iconHtml = `
          <div class="relative cursor-pointer transition-transform transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white shadow-xl border-2 border-white flex items-center justify-center font-black text-sm">
              +
            </div>
            <div class="absolute -top-2 -right-2 bg-slate-900 text-emerald-400 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500 shadow">
              ${hosp.capacityPercent}%
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(hosp.location, { icon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'HOSPITAL', data: hosp });
        });

        marker.addTo(layersGroupRef.current!);
      });
    }

    // 4. Draw Ambulances Layer & Active Routes
    if (layerVisibility.ambulances && zoom >= 12.5) {
      ambulances.forEach((amb) => {
        const isSelected = selectedEntity?.type === 'AMBULANCE' && selectedEntity.data.id === amb.id;
        const isEnRoute = amb.status === 'EN_ROUTE' || amb.status === 'DISPATCHED';

        const iconHtml = `
          <div class="relative cursor-pointer transition-transform transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-8 h-8 rounded-full ${
              isEnRoute ? 'bg-rose-600 animate-ambulance-beacon' : 'bg-blue-600'
            } text-white shadow-lg border-2 border-white flex items-center justify-center text-[10px] font-black">
              🚑
            </div>
            <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white font-mono text-[8px] font-bold px-1 rounded shadow whitespace-nowrap">
              ${amb.unitCode}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(amb.location, { icon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'AMBULANCE', data: amb });
        });

        marker.addTo(layersGroupRef.current!);

        // If ambulance has route coordinates, draw green corridor path line
        if (amb.routeCoordinates && amb.routeCoordinates.length > 0 && isEnRoute) {
          const routeLine = L.polyline(amb.routeCoordinates, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.9,
            dashArray: '8, 8',
          });
          routeLine.addTo(routePolylinesGroupRef.current!);
        }
      });
    }

    // 5. Draw CCTV Cameras Layer
    if (layerVisibility.cctv && zoom >= 13) {
      cctvs.forEach((cam) => {
        const isSelected = selectedEntity?.type === 'CCTV' && selectedEntity.data.id === cam.id;
        const hasAlarm = cam.latestEvent !== 'NORMAL';

        const iconHtml = `
          <div class="relative cursor-pointer transition-transform transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-7 h-7 rounded-lg ${
              hasAlarm ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'
            } text-white shadow-md border border-white flex items-center justify-center text-[10px]">
              📹
            </div>
            ${
              hasAlarm
                ? `<div class="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-rose-600 border border-white animate-ping"></div>`
                : ''
            }
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(cam.location, { icon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'CCTV', data: cam });
        });

        marker.addTo(layersGroupRef.current!);
      });
    }

    // 6. Draw Incidents Layer
    if (incidents.length > 0) {
      incidents.forEach((inc) => {
        const isSelected = selectedEntity?.type === 'INCIDENT' && selectedEntity.data.id === inc.id;

        const iconHtml = `
          <div class="relative cursor-pointer transition-transform transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-9 h-9 rounded-full bg-rose-600 text-white shadow-xl border-2 border-white flex items-center justify-center text-xs animate-incident-pulse">
              ⚠️
            </div>
            <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-rose-700 text-white font-sans text-[9px] font-extrabold px-1.5 py-0.2 rounded shadow whitespace-nowrap">
              ${inc.type}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker(inc.coordinates, { icon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'INCIDENT', data: inc });
        });

        marker.addTo(layersGroupRef.current!);
      });
    }

    // 7. Draw Police & Fire Stations (Zoom >= 13.5)
    if (zoom >= 13.5) {
      if (layerVisibility.police) {
        policeStations.forEach((pol) => {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-6 h-6 rounded-lg bg-indigo-700 text-white border border-white flex items-center justify-center text-[9px] font-bold shadow">🚓</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker(pol.location, { icon }).addTo(layersGroupRef.current!);
        });
      }

      if (layerVisibility.fire) {
        fireStations.forEach((fire) => {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-6 h-6 rounded-lg bg-orange-600 text-white border border-white flex items-center justify-center text-[9px] font-bold shadow">🚒</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker(fire.location, { icon }).addTo(layersGroupRef.current!);
        });
      }
    }
  }, [
    roads,
    junctions,
    hospitals,
    ambulances,
    cctvs,
    incidents,
    policeStations,
    fireStations,
    layerVisibility,
    zoomLevel,
    selectedEntity,
    mode,
    predictionHorizon,
    simulationResult,
    simulationStepIndex,
    getRoadColor,
    setSelectedEntity,
  ]);

  // Smooth Fly-to when an entity is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEntity) return;

    let targetCoords: [number, number] | null = null;

    if (selectedEntity.type === 'JUNCTION') targetCoords = selectedEntity.data.location;
    else if (selectedEntity.type === 'HOSPITAL') targetCoords = selectedEntity.data.location;
    else if (selectedEntity.type === 'AMBULANCE') targetCoords = selectedEntity.data.location;
    else if (selectedEntity.type === 'CCTV') targetCoords = selectedEntity.data.location;
    else if (selectedEntity.type === 'INCIDENT') targetCoords = selectedEntity.data.coordinates;
    else if (selectedEntity.type === 'ROAD' && selectedEntity.data.coordinates.length > 0) {
      targetCoords = selectedEntity.data.coordinates[
        Math.floor(selectedEntity.data.coordinates.length / 2)
      ];
    }

    if (targetCoords) {
      mapInstanceRef.current.flyTo(targetCoords, Math.max(14.5, mapInstanceRef.current.getZoom()), {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedEntity]);

  // Map Control Actions
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () =>
    mapInstanceRef.current?.flyTo(CITY_CENTER, DEFAULT_MAP_ZOOM, { duration: 1.0 });

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || roads.length === 0) return;
    const allCoords = roads.flatMap((r) => r.coordinates);
    const bounds = L.latLngBounds(allCoords);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], duration: 1.0 });
  };

  const handleToggle3D = () => setIs3DMode((prev) => !prev);

  const handleCycleTileTheme = () => {
    setTileTheme((prev) => {
      if (prev === 'mappls') return 'voyager';
      if (prev === 'voyager') return 'positron';
      if (prev === 'positron') return 'osm';
      return 'mappls';
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 select-none">
      {/* 2.5D Perspective / 2D Map Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 transition-all ${
          is3DMode ? 'map-perspective-3d' : 'map-perspective-2d'
        } ${builderTool !== 'NONE' ? 'cursor-crosshair' : 'cursor-grab'}`}
      />

      {/* Interactive Map Controls Overlay */}
      <KMZLayerOverlay map={mapInstanceRef.current} />
      <NavigationOverlay mapInstance={mapInstanceRef.current} routesGroup={routePolylinesGroupRef.current} />
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitBounds={handleFitBounds}
        is3DMode={is3DMode}
        onToggle3D={handleToggle3D}
        tileTheme={tileTheme}
        onCycleTileTheme={handleCycleTileTheme}
        zoomLevel={zoomLevel}
      />
    </div>
  );
};
