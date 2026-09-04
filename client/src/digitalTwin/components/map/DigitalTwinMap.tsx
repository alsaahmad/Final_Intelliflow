import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';

import { useTwin } from '../../context/TwinContext';
import { MapControls } from './MapControls';
import { NavigationOverlay } from './NavigationOverlay';
import { gisApiClient } from '../../../api/gisApiClient';
import { Road } from '../../types';
import '../../digitalTwin.css';

// Reference configuration matching Untitled Project.geolibre
const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const INITIAL_CENTER: [number, number] = [77.23374957630529, 28.614464556753063]; // [lng, lat]
const INITIAL_ZOOM = 14.45;
const INITIAL_PITCH = 60; // 3D Perspective Pitch
const INITIAL_BEARING = 0;

// Fallback GeoJSON boundary matching GIS/sector_boundary.kml polygon
const FALLBACK_SECTOR_BOUNDARY_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'sector_boundary_kml',
        name: 'Sector A GIS Boundary',
        layerType: 'SECTOR_BOUNDARY',
        source: 'KML_SECTOR_BOUNDARY',
      },
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

export const DigitalTwinMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

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

  const [mapError, setMapError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(INITIAL_ZOOM);
  const [bearing, setBearing] = useState<number>(INITIAL_BEARING);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [showBuildings3D, setShowBuildings3D] = useState<boolean>(true);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: LIBERTY_STYLE_URL,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        pitch: INITIAL_PITCH,
        bearing: INITIAL_BEARING,
        maxPitch: 85,
        attributionControl: false,
        dragRotate: true,
        pitchWithRotate: true,
      });

      // Add MapLibre navigation control (compass + tilt visualizer)
      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showCompass: true,
          showZoom: false, // Handled by custom HUD
        }),
        'top-left'
      );

      // Attribution
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© OpenStreetMap contributors, © OpenFreeMap Liberty',
        }),
        'bottom-right'
      );

      map.on('load', async () => {
        // 1. Configure and optimize 3D Building Extrusions from OpenFreeMap Liberty
        try {
          if (map.getLayer('building-3d')) {
            // Enhance Liberty's existing 3d building extrusion layer with realistic lighting
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
            // If building-3d layer was missing, inject it directly against openmaptiles vector source
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
          console.warn('Notice configuring 3D building layer:', err);
        }

        // 2. Add KML Sector Boundary GeoJSON Layer
        try {
          let boundaryData: any = FALLBACK_SECTOR_BOUNDARY_GEOJSON;
          try {
            const apiBoundary = await gisApiClient.getSectorBoundary();
            if (apiBoundary && apiBoundary.features && apiBoundary.features.length > 0) {
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
          console.warn('Error loading KML sector boundary:', err);
        }

        // 3. Add Authoritative OSM Vector Road Network Layer
        try {
          const osmRoadGeoJson = await gisApiClient.getRoadNetwork();
          if (osmRoadGeoJson && osmRoadGeoJson.features) {
            map.addSource('osm-authoritative-roads', {
              type: 'geojson',
              data: osmRoadGeoJson as any,
            });

            map.addLayer({
              id: 'osm-authoritative-roads-line',
              type: 'line',
              source: 'osm-authoritative-roads',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-opacity': 0.4,
              },
            });
          }
        } catch (err) {
          console.info('OSM vector roads overlay note:', err);
        }

        // 4. Add Digital Twin Operational Road Network Sources and Layers
        map.addSource('twin-operational-roads', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        // Road Casing
        map.addLayer({
          id: 'twin-roads-casing',
          type: 'line',
          source: 'twin-operational-roads',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#0f172a',
            'line-width': ['interpolate', ['linear'], ['zoom'], 12, 5, 15, 8, 18, 12],
            'line-opacity': 0.35,
          },
        });

        // Road Main Colored Line
        map.addLayer({
          id: 'twin-roads-line',
          type: 'line',
          source: 'twin-operational-roads',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3.5, 15, 6, 18, 9],
            'line-opacity': 0.95,
          },
        });

        // Emergency / Blocked Road Highlight Overlay
        map.addLayer({
          id: 'twin-roads-blocked',
          type: 'line',
          source: 'twin-operational-roads',
          filter: ['==', ['get', 'isBlocked'], true],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#64748b',
            'line-width': 4,
            'line-dasharray': [2, 2],
          },
        });

        // Setup Hover & Click interactions for Operational Roads
        map.on('mouseenter', 'twin-roads-line', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            if (props) {
              if (!hoverPopupRef.current) {
                hoverPopupRef.current = new maplibregl.Popup({
                  closeButton: false,
                  closeOnClick: false,
                  offset: 12,
                });
              }
              hoverPopupRef.current
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div class="px-2 py-1 text-xs font-sans">
                    <strong class="text-slate-900">${props.code} - ${props.name}</strong>
                    <div class="text-[11px] text-slate-600 font-medium">
                      Traffic: <span style="color:${props.color}" class="font-bold">${props.congestionPercent}% (${props.trafficLevel})</span> • ${props.speed} km/h
                    </div>
                  </div>`
                )
                .addTo(map);
            }
          }
        });

        map.on('mouseleave', 'twin-roads-line', () => {
          map.getCanvas().style.cursor = '';
          if (hoverPopupRef.current) {
            hoverPopupRef.current.remove();
          }
        });

        map.on('click', 'twin-roads-line', (e: any) => {
          if (e.features && e.features[0] && e.features[0].properties) {
            const roadId = e.features[0].properties.id;
            const roadObj = roads.find((r) => r.id === roadId);
            if (roadObj) {
              setSelectedEntity({ type: 'ROAD', data: roadObj });
            }
          }
        });
      });

      // Camera state listeners
      map.on('zoom', () => setZoomLevel(map.getZoom()));
      map.on('rotate', () => setBearing(map.getBearing()));
      map.on('pitch', () => {
        setIs3DMode(map.getPitch() > 25);
      });

      // Builder mode click listener
      map.on('click', (e: any) => {
        if (builderTool !== 'NONE') {
          setBuilderCoords([e.lngLat.lat, e.lngLat.lng]);
          setBuilderModalOpen(true);
        }
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre rendering event notice:', e.error);
      });

      mapInstanceRef.current = map;

      // Handle Container Resizing
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        if (hoverPopupRef.current) {
          hoverPopupRef.current.remove();
        }
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize MapLibre GL map:', err);
      setMapError(err.message || 'MapLibre WebGL Initialization Error');
    }
  }, []);

  // Calculate Road Color based on IntelliFlow Mode & Simulation State
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

  // Sync 3D Buildings visibility toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('building-3d')) {
      map.setLayoutProperty('building-3d', 'visibility', showBuildings3D ? 'visible' : 'none');
    }
  }, [showBuildings3D]);

  // Sync Layer Visibility toggles for KML boundary and OSM vector roads
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Sector boundary
    if (map.getLayer('sector-boundary-fill')) {
      map.setLayoutProperty('sector-boundary-fill', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }
    if (map.getLayer('sector-boundary-line')) {
      map.setLayoutProperty('sector-boundary-line', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }

    // Authoritative OSM roads
    if (map.getLayer('osm-authoritative-roads-line')) {
      map.setLayoutProperty('osm-authoritative-roads-line', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }

    // Operational roads
    if (map.getLayer('twin-roads-line')) {
      map.setLayoutProperty('twin-roads-line', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }
    if (map.getLayer('twin-roads-casing')) {
      map.setLayoutProperty('twin-roads-casing', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }
    if (map.getLayer('twin-roads-blocked')) {
      map.setLayoutProperty('twin-roads-blocked', 'visibility', layerVisibility.roads ? 'visible' : 'none');
    }
  }, [layerVisibility.roads]);

  // Update Operational Roads GeoJSON source when roads, congestion or mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('twin-operational-roads') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (!layerVisibility.roads) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const features = roads.map((road) => {
      const isSelected = selectedEntity?.type === 'ROAD' && selectedEntity.data.id === road.id;
      const color = isSelected ? '#3b82f6' : getRoadColor(road);
      
      // Convert Leaflet [lat, lng] to MapLibre GeoJSON [lng, lat]
      const coordinates = road.coordinates.map((coord) => [coord[1], coord[0]]);

      return {
        type: 'Feature' as const,
        properties: {
          id: road.id,
          name: road.name,
          code: road.code,
          color,
          speed: road.currentSpeedKmh,
          trafficLevel: road.trafficLevel,
          congestionPercent: road.congestionPercent,
          isBlocked: road.status === 'BLOCKED',
          isSelected,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
      };
    });

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [roads, layerVisibility.roads, selectedEntity, getRoadColor]);

  // Update DOM Markers: Junctions, Hospitals, Ambulances, CCTV, Incidents, Stations
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const newMarkers: maplibregl.Marker[] = [];

    // 1. Traffic Signals / Junctions Layer (J01, J02, J03, J14)
    if (layerVisibility.junctions) {
      junctions.forEach((jnc) => {
        const isSelected = selectedEntity?.type === 'JUNCTION' && selectedEntity.data.id === jnc.id;
        const isCongested = jnc.congestionIndex > 70;
        const isValidatedSignal = ['J01', 'J02', 'J03', 'J14'].includes(jnc.code);
        const isSimulatingThisJunction =
          mode === 'SIMULATION' &&
          (simulationResult?.junctionCode === jnc.code || jnc.code === 'J14');

        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `
          <div class="relative group cursor-pointer transition-transform transform ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            ${
              isSimulatingThisJunction
                ? `<div class="absolute -top-2 -left-2 w-12 h-12 rounded-full border-2 border-amber-400 animate-ping opacity-75 pointer-events-none"></div>`
                : ''
            }
            <div class="w-8 h-8 rounded-xl bg-white shadow-lg border-2 ${
              isSimulatingThisJunction
                ? 'border-amber-500 bg-amber-50'
                : isCongested
                ? 'border-rose-500'
                : isValidatedSignal
                ? 'border-emerald-600 ring-2 ring-emerald-400/30'
                : 'border-indigo-500'
            } flex items-center justify-center text-slate-900 font-mono font-black text-[11px]">
              ${jnc.code}
            </div>
            ${
              isValidatedSignal
                ? `<div class="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center border border-white font-bold" title="Validated Signalized Junction">🚥</div>`
                : ''
            }
            <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap">
              ${jnc.signalTimerSeconds}s ${isSimulatingThisJunction ? '(SUMO)' : ''}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedEntity({ type: 'JUNCTION', data: jnc });
        });

        // Convert [lat, lng] to [lng, lat]
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([jnc.location[1], jnc.location[0]])
          .addTo(map);

        newMarkers.push(marker);
      });
    }

    // 2. Hospitals Layer
    if (layerVisibility.hospitals) {
      hospitals.forEach((hosp) => {
        const isSelected = selectedEntity?.type === 'HOSPITAL' && selectedEntity.data.id === hosp.id;

        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `
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

        el.addEventListener('click', () => {
          setSelectedEntity({ type: 'HOSPITAL', data: hosp });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([hosp.location[1], hosp.location[0]])
          .addTo(map);

        newMarkers.push(marker);
      });
    }

    // 3. Ambulances Layer
    if (layerVisibility.ambulances) {
      ambulances.forEach((amb) => {
        const isSelected = selectedEntity?.type === 'AMBULANCE' && selectedEntity.data.id === amb.id;
        const isEnRoute = amb.status === 'EN_ROUTE' || amb.status === 'DISPATCHED';

        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `
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

        el.addEventListener('click', () => {
          setSelectedEntity({ type: 'AMBULANCE', data: amb });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([amb.location[1], amb.location[0]])
          .addTo(map);

        newMarkers.push(marker);
      });
    }

    // 4. CCTV Cameras Layer
    if (layerVisibility.cctv) {
      cctvs.forEach((cam) => {
        const isSelected = selectedEntity?.type === 'CCTV' && selectedEntity.data.id === cam.id;
        const hasAlarm = cam.latestEvent !== 'NORMAL';

        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `
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

        el.addEventListener('click', () => {
          setSelectedEntity({ type: 'CCTV', data: cam });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cam.location[1], cam.location[0]])
          .addTo(map);

        newMarkers.push(marker);
      });
    }

    // 5. Active Incidents Layer
    if (incidents.length > 0) {
      incidents.forEach((inc) => {
        const isSelected = selectedEntity?.type === 'INCIDENT' && selectedEntity.data.id === inc.id;

        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `
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

        el.addEventListener('click', () => {
          setSelectedEntity({ type: 'INCIDENT', data: inc });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([inc.coordinates[1], inc.coordinates[0]])
          .addTo(map);

        newMarkers.push(marker);
      });
    }

    // 6. Police & Fire Stations
    if (layerVisibility.police) {
      policeStations.forEach((pol) => {
        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `<div class="w-6 h-6 rounded-lg bg-indigo-700 text-white border border-white flex items-center justify-center text-[9px] font-bold shadow">🚓</div>`;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pol.location[1], pol.location[0]])
          .addTo(map);
        newMarkers.push(marker);
      });
    }

    if (layerVisibility.fire) {
      fireStations.forEach((fire) => {
        const el = document.createElement('div');
        el.className = 'custom-maplibre-marker cursor-pointer select-none';
        el.innerHTML = `<div class="w-6 h-6 rounded-lg bg-orange-600 text-white border border-white flex items-center justify-center text-[9px] font-bold shadow">🚒</div>`;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([fire.location[1], fire.location[0]])
          .addTo(map);
        newMarkers.push(marker);
      });
    }

    markersRef.current = newMarkers;
  }, [
    junctions,
    hospitals,
    ambulances,
    cctvs,
    incidents,
    policeStations,
    fireStations,
    layerVisibility,
    selectedEntity,
    mode,
    simulationResult,
    setSelectedEntity,
  ]);

  // Smooth Camera Fly-To when an entity is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedEntity) return;

    let targetLngLat: [number, number] | null = null;

    if (selectedEntity.type === 'JUNCTION') {
      targetLngLat = [selectedEntity.data.location[1], selectedEntity.data.location[0]];
    } else if (selectedEntity.type === 'HOSPITAL') {
      targetLngLat = [selectedEntity.data.location[1], selectedEntity.data.location[0]];
    } else if (selectedEntity.type === 'AMBULANCE') {
      targetLngLat = [selectedEntity.data.location[1], selectedEntity.data.location[0]];
    } else if (selectedEntity.type === 'CCTV') {
      targetLngLat = [selectedEntity.data.location[1], selectedEntity.data.location[0]];
    } else if (selectedEntity.type === 'INCIDENT') {
      targetLngLat = [selectedEntity.data.coordinates[1], selectedEntity.data.coordinates[0]];
    } else if (selectedEntity.type === 'ROAD' && selectedEntity.data.coordinates.length > 0) {
      const midCoord = selectedEntity.data.coordinates[
        Math.floor(selectedEntity.data.coordinates.length / 2)
      ];
      targetLngLat = [midCoord[1], midCoord[0]];
    }

    if (targetLngLat) {
      map.flyTo({
        center: targetLngLat,
        zoom: Math.max(15, map.getZoom()),
        pitch: is3DMode ? 60 : 0,
        duration: 1200,
      });
    }
  }, [selectedEntity, is3DMode]);

  // Map Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut({ duration: 300 });

  const handleResetView = () => {
    mapInstanceRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: is3DMode ? INITIAL_PITCH : 0,
      bearing: INITIAL_BEARING,
      duration: 1200,
    });
  };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || roads.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    roads.forEach((r) => {
      r.coordinates.forEach((c) => {
        bounds.extend([c[1], c[0]]);
      });
    });

    map.fitBounds(bounds, { padding: 60, duration: 1000 });
  };

  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const next3D = !is3DMode;
    setIs3DMode(next3D);
    map.easeTo({
      pitch: next3D ? 60 : 0,
      duration: 1000,
    });
  };

  const handleToggleBuildings3D = () => {
    setShowBuildings3D((prev) => !prev);
  };

  const handleResetBearing = () => {
    mapInstanceRef.current?.easeTo({
      bearing: 0,
      duration: 800,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 select-none">
      {/* MapLibre WebGL Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${
          builderTool !== 'NONE' ? 'cursor-crosshair' : 'cursor-grab'
        }`}
      />

      {/* Map Error Fallback Banner */}
      {mapError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-rose-950/90 text-rose-200 border border-rose-800 rounded-2xl px-4 py-2 text-xs font-bold shadow-2xl">
          ⚠️ Map Rendering Notice: {mapError}
        </div>
      )}

      {/* Interactive OSM Navigation Overlay */}
      <NavigationOverlay mapInstance={mapInstanceRef.current} />

      {/* Unified 3D Map HUD Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitBounds={handleFitBounds}
        is3DMode={is3DMode}
        onToggle3D={handleToggle3D}
        showBuildings3D={showBuildings3D}
        onToggleBuildings3D={handleToggleBuildings3D}
        onResetBearing={handleResetBearing}
        bearing={bearing}
        zoomLevel={zoomLevel}
      />
    </div>
  );
};

export default DigitalTwinMap;
