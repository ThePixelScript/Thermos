import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoJSONFeatureCollection, HotspotSummary } from '../types';

interface ZoneMapProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  hotspots?: HotspotSummary[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  basemapMode?: 'dark' | 'light';
  onBasemapModeChange?: (mode: 'dark' | 'light') => void;
}

export const ZoneMap: React.FC<ZoneMapProps> = ({
  geoJsonData,
  hotspots = [],
  selectedZoneId,
  onSelectZone,
  basemapMode: controlledTheme,
  onBasemapModeChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [activeLayerMode, setActiveLayerMode] = useState<'risk' | 'temperature' | 'canopy'>('risk');
  const [internalTheme, setInternalTheme] = useState<'dark' | 'light'>('dark');

  const currentTheme = controlledTheme ?? internalTheme;

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setInternalTheme(newTheme);
    onBasemapModeChange?.(newTheme);
  };

  const updateMapData = useCallback(
    (
      map: maplibregl.Map,
      data: GeoJSONFeatureCollection | null,
      hotspotList: HotspotSummary[],
      selectedId: string | null
    ) => {
      if (!data) return;

      // 1. Zone Polygons
      const source = map.getSource('urban-zones') as maplibregl.GeoJSONSource;

      const getFillColorExpression = () => {
        if (activeLayerMode === 'temperature') {
          return [
            'step',
            ['get', 'land_surface_temp_c'],
            '#10b981',
            35, '#eab308',
            38, '#f59e0b',
            40, '#f97316',
            42, '#ef4444',
          ];
        }
        if (activeLayerMode === 'canopy') {
          return [
            'step',
            ['get', 'tree_canopy_fraction'],
            '#ef4444',
            0.10, '#f97316',
            0.20, '#eab308',
            0.30, '#10b981',
            0.40, '#059669',
          ];
        }
        return [
          'match',
          ['get', 'risk_level'],
          'CRITICAL', '#ef4444',
          'SEVERE', '#f97316',
          'HIGH', '#f59e0b',
          'MODERATE', '#eab308',
          'LOW', '#10b981',
          '#64748b',
        ];
      };

      if (!source) {
        map.addSource('urban-zones', {
          type: 'geojson',
          data: data as any,
        });

        // Zone fill layer colored by selected layer mode
        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'urban-zones',
          paint: {
            'fill-color': getFillColorExpression() as any,
            'fill-opacity': 0.62,
          },
        });

        // Zone borders
        map.addLayer({
          id: 'zones-border',
          type: 'line',
          source: 'urban-zones',
          paint: {
            'line-color': '#1e293b',
            'line-width': 1.5,
          },
        });

        // Selected zone highlight border
        map.addLayer({
          id: 'zones-selected-border',
          type: 'line',
          source: 'urban-zones',
          filter: ['==', 'id', selectedId || ''],
          paint: {
            'line-color': '#38bdf8',
            'line-width': 4,
            'line-opacity': 0.95,
          },
        });

        // Zone name labels
        map.addLayer({
          id: 'zones-labels',
          type: 'symbol',
          source: 'urban-zones',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-anchor': 'center',
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#f8fafc',
            'text-halo-color': '#0f172a',
            'text-halo-width': 1.5,
          },
        });

        // Interactive clicks on polygons
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
        if (map.getLayer('zones-fill')) {
          map.setPaintProperty('zones-fill', 'fill-color', getFillColorExpression() as any);
        }
        if (map.getLayer('zones-selected-border')) {
          map.setFilter('zones-selected-border', ['==', 'id', selectedId || '']);
        }
      }

      // 2. Hotspot Centroid Pins & Highlights
      const hotspotPointsData: any = {
        type: 'FeatureCollection',
        features: hotspotList.map((h) => ({
          type: 'Feature',
          id: h.zone_id,
          geometry: {
            type: 'Point',
            coordinates: h.center_coords,
          },
          properties: {
            zone_id: h.zone_id,
            rank: `#${h.rank}`,
            risk_level: h.risk_level,
            risk_score: h.risk_score,
            temp: `${h.temperature}°C`,
          },
        })),
      };

      const hsSource = map.getSource('hotspot-markers') as maplibregl.GeoJSONSource;
      if (!hsSource) {
        map.addSource('hotspot-markers', {
          type: 'geojson',
          data: hotspotPointsData,
        });

        // Hotspot circle marker
        map.addLayer({
          id: 'hotspot-circles',
          type: 'circle',
          source: 'hotspot-markers',
          paint: {
            'circle-radius': 13,
            'circle-color': [
              'match',
              ['get', 'risk_level'],
              'CRITICAL',
              '#ef4444',
              'SEVERE',
              '#f97316',
              'HIGH',
              '#f59e0b',
              'MODERATE',
              '#eab308',
              'LOW',
              '#10b981',
              '#ef4444',
            ],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95,
          },
        });

        // Hotspot rank badge text
        map.addLayer({
          id: 'hotspot-rank-text',
          type: 'symbol',
          source: 'hotspot-markers',
          layout: {
            'text-field': ['get', 'rank'],
            'text-size': 10,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.on('click', 'hotspot-circles', (e: any) => {
          if (e.features && e.features.length > 0) {
            const zid = e.features[0].properties?.zone_id;
            if (zid) onSelectZone(zid);
          }
        });

        map.on('mouseenter', 'hotspot-circles', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'hotspot-circles', () => {
          map.getCanvas().style.cursor = '';
        });
      } else {
        hsSource.setData(hotspotPointsData);
      }
    },
    [activeLayerMode, onSelectZone]
  );

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'dark-tiles': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; CARTO &copy; OpenStreetMap Contributors',
            },
            'light-tiles': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '&copy; CARTO &copy; OpenStreetMap Contributors',
            },
          },
          layers: [
            {
              id: 'background-layer',
              type: 'background',
              paint: {
                'background-color': '#0f172a',
              },
            },
            {
              id: 'dark-basemap-layer',
              type: 'raster',
              source: 'dark-tiles',
              minzoom: 0,
              maxzoom: 19,
              layout: {
                visibility: 'visible',
              },
            },
            {
              id: 'light-basemap-layer',
              type: 'raster',
              source: 'light-tiles',
              minzoom: 0,
              maxzoom: 19,
              layout: {
                visibility: 'none',
              },
            },
          ],
        },
        center: [77.215, 28.64],
        zoom: 11.9,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        setMapReady(true);
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre notice/fallback:', e);
      });

      return () => {
        map.remove();
        mapRef.current = null;
        setMapReady(false);
      };
    } catch (err) {
      console.warn('WebGL / MapLibre initialization failed, falling back to SVG canvas:', err);
      setTimeout(() => {
        setMapError(true);
      }, 0);
    }
  }, []);

  // Synchronize basemap visibility and background color when currentTheme changes
  useEffect(() => {
    if (mapReady && mapRef.current && mapRef.current.isStyleLoaded()) {
      const isDark = currentTheme === 'dark';
      if (mapRef.current.getLayer('background-layer')) {
        mapRef.current.setPaintProperty(
          'background-layer',
          'background-color',
          isDark ? '#0f172a' : '#f8fafc'
        );
      }
      if (mapRef.current.getLayer('dark-basemap-layer')) {
        mapRef.current.setLayoutProperty(
          'dark-basemap-layer',
          'visibility',
          isDark ? 'visible' : 'none'
        );
      }
      if (mapRef.current.getLayer('light-basemap-layer')) {
        mapRef.current.setLayoutProperty(
          'light-basemap-layer',
          'visibility',
          isDark ? 'none' : 'visible'
        );
      }
    }
  }, [mapReady, currentTheme]);

  // Update map source when map is ready or geoJsonData, hotspots, selectedZoneId, activeLayerMode changes
  useEffect(() => {
    if (mapReady && mapRef.current && mapRef.current.isStyleLoaded()) {
      updateMapData(mapRef.current, geoJsonData, hotspots, selectedZoneId);
    }
  }, [mapReady, geoJsonData, hotspots, selectedZoneId, updateMapData]);

  // Pan / Fly to selected zone
  useEffect(() => {
    if (!mapRef.current || !selectedZoneId || !geoJsonData) return;
    const feat = geoJsonData.features.find((f) => f.properties.id === selectedZoneId);
    if (feat && feat.geometry.coordinates[0]) {
      const coords = feat.geometry.coordinates[0];
      const avgLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      mapRef.current.flyTo({
        center: [avgLon, avgLat],
        zoom: 12.8,
        speed: 1.2,
        curve: 1.4,
      });
    }
  }, [selectedZoneId, geoJsonData]);

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
      return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
    };

    const getFill = (props: any) => {
      if (activeLayerMode === 'temperature') {
        const t = props.land_surface_temp_c ?? 35;
        if (t >= 42) return '#ef4444';
        if (t >= 40) return '#f97316';
        if (t >= 38) return '#f59e0b';
        if (t >= 35) return '#eab308';
        return '#10b981';
      }
      if (activeLayerMode === 'canopy') {
        const c = props.tree_canopy_fraction ?? 0.15;
        if (c >= 0.40) return '#059669';
        if (c >= 0.30) return '#10b981';
        if (c >= 0.20) return '#eab308';
        if (c >= 0.10) return '#f97316';
        return '#ef4444';
      }
      switch (props.risk_level) {
        case 'CRITICAL':
          return '#ef4444';
        case 'SEVERE':
          return '#f97316';
        case 'HIGH':
          return '#f59e0b';
        case 'MODERATE':
          return '#eab308';
        case 'LOW':
          return '#10b981';
        default:
          return '#64748b';
      }
    };

    return (
      <svg className="svg-map" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={currentTheme === 'dark' ? '#1e293b' : '#e2e8f0'}
            />
            <stop
              offset="100%"
              stopColor={currentTheme === 'dark' ? '#0b0f19' : '#cbd5e1'}
            />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#mapGlow)" rx="12" />

        {/* Polygons */}
        {geoJsonData.features.map((feat) => {
          const coords = feat.geometry.coordinates[0];
          const points = coords.map(([lon, lat]) => project(lon, lat).str).join(' ');
          const isSelected = feat.properties.id === selectedZoneId;
          const fill = getFill(feat.properties);

          const avgLon = coords.reduce((acc, curr) => acc + curr[0], 0) / coords.length;
          const avgLat = coords.reduce((acc, curr) => acc + curr[1], 0) / coords.length;
          const labelPos = project(avgLon, avgLat);

          return (
            <g
              key={feat.properties.id}
              className="svg-zone-group"
              onClick={() => onSelectZone(feat.properties.id)}
            >
              <polygon
                points={points}
                fill={fill}
                fillOpacity={isSelected ? 0.88 : 0.62}
                stroke={isSelected ? '#38bdf8' : '#334155'}
                strokeWidth={isSelected ? 4 : 1.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                className="svg-zone-label"
              >
                {feat.properties.name.split(' ')[0]}
              </text>
            </g>
          );
        })}

        {/* Hotspot Markers on SVG */}
        {hotspots.map((h) => {
          const pos = project(h.center_coords[0], h.center_coords[1]);
          const isSelected = h.zone_id === selectedZoneId;
          const fill = getFill(h);

          return (
            <g
              key={`hs-${h.zone_id}`}
              className="svg-hotspot-pin"
              onClick={(e) => {
                e.stopPropagation();
                onSelectZone(h.zone_id);
              }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 16 : 12}
                fill={fill}
                stroke={isSelected ? '#38bdf8' : '#ffffff'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={0.95}
              />
              <text
                x={pos.x}
                y={pos.y + 3.5}
                fontSize={isSelected ? "11" : "9"}
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                #{h.rank}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="zone-map-wrapper">
      {/* Map Control Bar */}
      <div className="map-control-bar">
        {/* Layer Switcher */}
        <div className="map-layer-switcher">
          <button
            className={`layer-switch-btn ${activeLayerMode === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveLayerMode('risk')}
          >
            Heat Risk (CHRI)
          </button>
          <button
            className={`layer-switch-btn ${activeLayerMode === 'temperature' ? 'active' : ''}`}
            onClick={() => setActiveLayerMode('temperature')}
          >
            Surface Temp (LST)
          </button>
          <button
            className={`layer-switch-btn ${activeLayerMode === 'canopy' ? 'active' : ''}`}
            onClick={() => setActiveLayerMode('canopy')}
          >
            Canopy Coverage
          </button>
        </div>

        {/* Basemap Theme Switcher */}
        <div className="map-theme-switcher">
          <button
            type="button"
            className={`theme-switch-btn ${currentTheme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
            title="Switch to Dark Basemap"
          >
            🌙 Dark
          </button>
          <button
            type="button"
            className={`theme-switch-btn ${currentTheme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
            title="Switch to Light Basemap"
          >
            ☀️ Light
          </button>
        </div>

        {/* Dynamic Legend */}
        <div className="map-legend">
          <span className="legend-title">
            {activeLayerMode === 'risk' && 'Heat Risk Index (CHRI)'}
            {activeLayerMode === 'temperature' && 'Land Surface Temp (°C)'}
            {activeLayerMode === 'canopy' && 'Tree Canopy Coverage'}
          </span>
          <div className="legend-items">
            {activeLayerMode === 'risk' && (
              <>
                <span className="legend-item">
                  <span className="color-box critical"></span> Critical (&ge;85)
                </span>
                <span className="legend-item">
                  <span className="color-box severe"></span> Severe (70-85)
                </span>
                <span className="legend-item">
                  <span className="color-box high"></span> High (50-70)
                </span>
                <span className="legend-item">
                  <span className="color-box moderate"></span> Moderate (30-50)
                </span>
                <span className="legend-item">
                  <span className="color-box low"></span> Low (&lt;30)
                </span>
              </>
            )}
            {activeLayerMode === 'temperature' && (
              <>
                <span className="legend-item">
                  <span className="color-box critical"></span> &ge;42°C (Extreme)
                </span>
                <span className="legend-item">
                  <span className="color-box severe"></span> 40-42°C (Very Hot)
                </span>
                <span className="legend-item">
                  <span className="color-box high"></span> 38-40°C (High)
                </span>
                <span className="legend-item">
                  <span className="color-box moderate"></span> 35-38°C (Moderate)
                </span>
                <span className="legend-item">
                  <span className="color-box low"></span> &lt;35°C (Refuge)
                </span>
              </>
            )}
            {activeLayerMode === 'canopy' && (
              <>
                <span className="legend-item">
                  <span className="color-box critical"></span> &lt;10% (Severe Deficit)
                </span>
                <span className="legend-item">
                  <span className="color-box severe"></span> 10-20% (Low Shade)
                </span>
                <span className="legend-item">
                  <span className="color-box moderate"></span> 20-30% (Moderate)
                </span>
                <span className="legend-item">
                  <span className="color-box low"></span> 30-40% (Target Canopy)
                </span>
                <span className="legend-item">
                  <span className="color-box green-optimal"></span> &ge;40% (Optimal)
                </span>
              </>
            )}
          </div>
        </div>

        <div className="map-hotspot-indicator">
          <span className="pin-sample">#1</span>
          <span>Hotspots ({hotspots.length})</span>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className={`maplibre-container ${mapError ? 'hidden' : ''}`}
        style={{ backgroundColor: currentTheme === 'dark' ? '#0f172a' : '#f8fafc' }}
      />
      {mapError && (
        <div
          className="svg-fallback-container"
          style={{ backgroundColor: currentTheme === 'dark' ? '#0f172a' : '#f8fafc' }}
        >
          {renderSvgFallback()}
        </div>
      )}
    </div>
  );
};

