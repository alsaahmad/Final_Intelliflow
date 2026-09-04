import React, { useEffect } from 'react';
import L from 'leaflet';
import axios from 'axios';

interface KMZLayerOverlayProps {
  map: L.Map | null;
}

export const KMZLayerOverlay: React.FC<KMZLayerOverlayProps> = ({ map }) => {
  useEffect(() => {
    if (!map) return;

    let layerGroup: L.LayerGroup | null = L.layerGroup().addTo(map);

    const fetchGisBoundary = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.get('http://localhost:8000/api/v1/gis/layers', { headers });

        if (response.data && response.data.features && layerGroup) {
          const geoJsonLayer = L.geoJSON(response.data, {
            style: {
              color: '#8b5cf6', // Violet/Purple boundary stroke
              weight: 3,
              opacity: 0.85,
              fillColor: '#a855f7',
              fillOpacity: 0.12,
              dashArray: '6, 6',
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              layer.bindTooltip(
                `<div class="px-2 py-1 font-sans text-xs font-bold text-purple-900 bg-white rounded shadow border border-purple-200">
                  🗺️ ${props.name || 'Sector A GIS Boundary'} (KML Dataset)
                </div>`,
                { permanent: false, direction: 'top' }
              );
            },
          });

          geoJsonLayer.addTo(layerGroup);
        }
      } catch (err) {
        console.warn('GIS sector boundary overlay fetch failed (falling back to static Leaflet bounds):', err);
      }
    };

    fetchGisBoundary();

    return () => {
      if (layerGroup && map) {
        map.removeLayer(layerGroup);
      }
    };
  }, [map]);

  return null;
};
