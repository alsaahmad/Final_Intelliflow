import React, { useEffect } from 'react';
import L from 'leaflet';
import { gisApiClient } from '../../api/gisApiClient';

interface KMZLayerOverlayProps {
  map: L.Map | null;
  strokeColor?: string;
  fillColor?: string;
  layerTitle?: string;
}

// Fallback GeoJSON boundary coordinates matching GIS/sector_boundary.kml polygon
// Bounds: Longitude [77.18381, 77.25200], Latitude [28.57925, 28.63286]
const FALLBACK_SECTOR_BOUNDARY_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'sector_boundary_fallback',
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

export const KMZLayerOverlay: React.FC<KMZLayerOverlayProps> = ({
  map,
  strokeColor = '#8b5cf6',
  fillColor = '#a855f7',
}) => {
  useEffect(() => {
    if (!map) return;

    let layerGroup: L.LayerGroup | null = L.layerGroup().addTo(map);

    const renderGeoJson = (data: any) => {
      if (!layerGroup || !data || !data.features || data.features.length === 0) return;

      const geoJsonLayer = L.geoJSON(data, {
        style: {
          color: strokeColor,
          weight: 3.5,
          opacity: 0.85,
          fillColor: fillColor,
          fillOpacity: 0.12,
          dashArray: '6, 6',
        },
        interactive: false, // Ensure map clicks pass directly through to origin/destination picking
      });

      geoJsonLayer.addTo(layerGroup);
    };

    const fetchGisBoundary = async () => {
      try {
        const response = await gisApiClient.getSectorBoundary();
        if (response && response.features && response.features.length > 0) {
          renderGeoJson(response);
        } else {
          renderGeoJson(FALLBACK_SECTOR_BOUNDARY_GEOJSON);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'GIS dataset load error';
        console.warn('GIS sector boundary API notice (using verified KML boundary):', msg);
        renderGeoJson(FALLBACK_SECTOR_BOUNDARY_GEOJSON);
      }
    };

    fetchGisBoundary();

    return () => {
      if (layerGroup && map) {
        map.removeLayer(layerGroup);
      }
    };
  }, [map, strokeColor, fillColor]);

  return null;
};
