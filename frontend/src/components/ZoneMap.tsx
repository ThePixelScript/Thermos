import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoJSONFeatureCollection } from '../types';

interface ZoneMapProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

export const ZoneMap: React.FC<ZoneMapProps> = ({
  geoJsonData,
  selectedZoneId,
  onSelectZone,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap Contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [77.215, 28.64],
        zoom: 11.8,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        updateMapData(map, geoJsonData, selectedZoneId);
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre notice/fallback:', e);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.warn('WebGL / MapLibre initialization failed, falling back to SVG canvas:', err);
      setMapError(true);
    }
  }, []);

  // Update map source when geoJsonData changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateMapData(mapRef.current, geoJsonData, selectedZoneId);
    }
  }, [geoJsonData, selectedZoneId]);

  const updateMapData = (
    map: maplibregl.Map,
    data: GeoJSONFeatureCollection | null,
    selectedId: string | null
  ) => {
    if (!data) return;

    const source = map.getSource('urban-zones') as maplibregl.GeoJSONSource;

    if (!source) {
      map.addSource('urban-zones', {
        type: 'geojson',
        data: data as any,
      });

      // Zone fill layer colored by risk level
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'urban-zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL',
            '#b91c1c',
            'SEVERE',
            '#dc2626',
            'HIGH',
            '#ea580c',
            'MODERATE',
            '#eab308',
            'LOW',
            '#16a34a',
            '#64748b',
          ],
          'fill-opacity': 0.65,
        },
      });

      // Zone borders
      map.addLayer({
        id: 'zones-border',
        type: 'line',
        source: 'urban-zones',
        paint: {
          'line-color': '#0f172a',
          'line-width': 1.5,
        },
      });

      // Selected zone highlight layer
      map.addLayer({
        id: 'zones-selected-border',
        type: 'line',
        source: 'urban-zones',
        filter: ['==', 'id', selectedId || ''],
        paint: {
          'line-color': '#38bdf8',
          'line-width': 4,
        },
      });

      // Interactive clicks
      map.on('click', 'zones-fill', (e: any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const zoneId = feature.properties?.id;
          if (zoneId) {
            onSelectZone(zoneId);
          }
        }
      });

      map.on('mouseenter', 'zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    } else {
      source.setData(data as any);
      if (map.getLayer('zones-selected-border')) {
        map.setFilter('zones-selected-border', ['==', 'id', selectedId || '']);
      }
    }
  };

  // SVG Fallback for resilient rendering in any restricted sandbox or test headless mode
  const renderSvgFallback = () => {
    if (!geoJsonData || geoJsonData.features.length === 0) {
      return <div className="map-placeholder">Loading urban zone boundaries...</div>;
    }

    // Compute bounding box for projection
    const lons: number[] = [];
    const lats: number[] = [];
    geoJsonData.features.forEach((f) => {
      f.geometry.coordinates[0].forEach(([lon, lat]) => {
        lons.push(lon);
        lats.push(lat);
      });
    });

    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const width = 800;
    const height = 550;
    const padding = 40;

    const project = (lon: number, lat: number) => {
      const x = padding + ((lon - minLon) / (maxLon - minLon)) * (width - 2 * padding);
      const y = height - (padding + ((lat - minLat) / (maxLat - minLat)) * (height - 2 * padding));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };

    const getFill = (level?: string) => {
      switch (level) {
        case 'CRITICAL':
          return '#b91c1c';
        case 'SEVERE':
          return '#dc2626';
        case 'HIGH':
          return '#ea580c';
        case 'MODERATE':
          return '#eab308';
        case 'LOW':
          return '#16a34a';
        default:
          return '#64748b';
      }
    };

    return (
      <svg className="svg-map" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#mapGlow)" rx="12" />

        {geoJsonData.features.map((feat) => {
          const coords = feat.geometry.coordinates[0];
          const points = coords.map(([lon, lat]) => project(lon, lat)).join(' ');
          const isSelected = feat.properties.id === selectedZoneId;
          const fill = getFill(feat.properties.risk_level);

          return (
            <g
              key={feat.properties.id}
              className="svg-zone-group"
              onClick={() => onSelectZone(feat.properties.id)}
            >
              <polygon
                points={points}
                fill={fill}
                fillOpacity={isSelected ? 0.9 : 0.65}
                stroke={isSelected ? '#38bdf8' : '#334155'}
                strokeWidth={isSelected ? 3.5 : 1.5}
              />
              <text
                x={coords.reduce((acc, curr) => acc + curr[0], 0) / coords.length}
                y={coords.reduce((acc, curr) => acc + curr[1], 0) / coords.length}
                className="svg-zone-label"
              >
                {feat.properties.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="zone-map-wrapper">
      <div className="map-legend">
        <span className="legend-title">Heat Risk Index</span>
        <div className="legend-items">
          <span className="legend-item"><span className="color-box critical"></span> Critical (&gt;85)</span>
          <span className="legend-item"><span className="color-box severe"></span> Severe (70-85)</span>
          <span className="legend-item"><span className="color-box high"></span> High (50-70)</span>
          <span className="legend-item"><span className="color-box moderate"></span> Moderate (30-50)</span>
          <span className="legend-item"><span className="color-box low"></span> Low (&lt;30)</span>
        </div>
      </div>

      <div ref={mapContainerRef} className={`maplibre-container ${mapError ? 'hidden' : ''}`} />
      {mapError && <div className="svg-fallback-container">{renderSvgFallback()}</div>}
    </div>
  );
};
