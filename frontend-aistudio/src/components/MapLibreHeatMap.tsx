import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Flame, 
  Layers, 
  MapPin, 
  Compass, 
  Maximize2, 
  RefreshCw, 
  Satellite, 
  AlertTriangle,
  Info,
  Thermometer
} from 'lucide-react';
import { Zone, HotspotItem, ZoneGeoJSONCollection, GeoJSONFeature } from '../types';
import { HeatScapeApi } from '../services/api';

interface MapLibreHeatMapProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis?: (zone: Zone) => void;
  hotspots?: HotspotItem[];
  geoJson?: ZoneGeoJSONCollection | null;
  onError?: (error: Error) => void;
  filterRiskLevels?: string[];
  minTempFilter?: number;
  landUseFilter?: string;
  className?: string;
}

// Compute geographic centroid of a GeoJSON polygon
function computePolygonCentroid(geometry: any): [number, number] | null {
  if (!geometry) return null;
  let coords: number[][] = [];
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    coords = geometry.coordinates[0]?.[0];
  }
  if (!coords || coords.length === 0) return null;

  let sumLon = 0;
  let sumLat = 0;
  let count = 0;
  for (const pt of coords) {
    if (Array.isArray(pt) && pt.length >= 2 && isFinite(pt[0]) && isFinite(pt[1])) {
      sumLon += pt[0];
      sumLat += pt[1];
      count++;
    }
  }
  if (count === 0) return null;
  return [sumLon / count, sumLat / count];
}

// Compute geographic bounding box [minLon, minLat, maxLon, maxLat] from GeoJSON
function computeGeoJsonBounds(collection: ZoneGeoJSONCollection | null): [number, number, number, number] | null {
  if (!collection?.features || collection.features.length === 0) return null;
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const inspectCoord = (pt: number[]) => {
    if (Array.isArray(pt) && pt.length >= 2) {
      const [lon, lat] = pt;
      if (typeof lon === 'number' && typeof lat === 'number' && isFinite(lon) && isFinite(lat)) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
    }
  };

  for (const feature of collection.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    if (geom.type === 'Polygon') {
      const coords = geom.coordinates as number[][][];
      if (coords && coords[0]) {
        for (const pt of coords[0]) inspectCoord(pt);
      }
    } else if (geom.type === 'MultiPolygon') {
      const coords = geom.coordinates as number[][][][];
      if (coords) {
        for (const poly of coords) {
          if (poly && poly[0]) {
            for (const pt of poly[0]) inspectCoord(pt);
          }
        }
      }
    }
  }

  if (!isFinite(minLon) || !isFinite(minLat) || !isFinite(maxLon) || !isFinite(maxLat)) {
    return null;
  }
  return [minLon, minLat, maxLon, maxLat];
}

export const MapLibreHeatMap: React.FC<MapLibreHeatMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  hotspots,
  geoJson: initialGeoJson,
  onError,
  filterRiskLevels,
  minTempFilter = 0,
  landUseFilter = 'all',
  className = 'w-full h-full'
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [activeGeoJson, setActiveGeoJson] = useState<ZoneGeoJSONCollection | null>(initialGeoJson || null);
  const [realChennaiGeoJson, setRealChennaiGeoJson] = useState<ZoneGeoJSONCollection | null>(null);
  const [activeLayerMode, setActiveLayerMode] = useState<'municipal' | 'chennai_grid'>('municipal');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const [hoveredZoneInfo, setHoveredZoneInfo] = useState<{ id: string; name: string; temp: number; anomaly: number; risk: string } | null>(null);

  // 1. Fetch backend GeoJSON if not supplied
  useEffect(() => {
    let isMounted = true;
    async function loadLayers() {
      try {
        const [zonesGj, chennaiGj] = await Promise.allSettled([
          initialGeoJson ? Promise.resolve(initialGeoJson) : HeatScapeApi.getZonesGeoJson(),
          HeatScapeApi.getRealZonesGeoJson().catch(() => null)
        ]);

        if (isMounted) {
          if (zonesGj.status === 'fulfilled' && zonesGj.value?.features) {
            setActiveGeoJson(zonesGj.value);
          }
          if (chennaiGj.status === 'fulfilled' && chennaiGj.value?.features) {
            setRealChennaiGeoJson(chennaiGj.value);
          }
        }
      } catch (err: any) {
        console.warn('Failed to load backend GeoJSON for MapLibre:', err);
        if (onError) onError(err);
      }
    }
    loadLayers();
    return () => { isMounted = false; };
  }, [initialGeoJson, onError]);

  // Current active collection based on switcher
  const currentCollection = activeLayerMode === 'chennai_grid' && realChennaiGeoJson
    ? realChennaiGeoJson
    : activeGeoJson;

  // 2. Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    try {
      // Test WebGL availability
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        throw new Error('WebGL rendering is not supported in this environment');
      }

      // Calculate initial center from GeoJSON bounds if available, else standard fallback
      const bounds = computeGeoJsonBounds(currentCollection);
      const initialCenter: [number, number] = bounds 
        ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]
        : [80.13, 12.88]; // Thermos AOI

      // Neutral CARTO Positron raster basemap
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'carto-basemap': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'
            }
          },
          layers: [
            {
              id: 'carto-basemap-layer',
              type: 'raster',
              source: 'carto-basemap',
              minzoom: 0,
              maxzoom: 20
            }
          ]
        },
        center: initialCenter,
        zoom: 11.5,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        setMapLoaded(true);
      });

      map.on('error', (e) => {
        if (e.error?.message?.includes('tile') || e.error?.message?.includes('network')) {
          setTileError('Basemap network tile delay detected');
        }
      });

      mapRef.current = map;
    } catch (err: any) {
      console.error('MapLibre initialization failed:', err);
      if (onError) onError(err);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // ignore cleanup errors
        }
        mapRef.current = null;
      }
    };
  }, [onError]);

  // Camera bounds fitting helper
  const fitCameraToBounds = useCallback((collection: ZoneGeoJSONCollection | null) => {
    const map = mapRef.current;
    if (!map || !collection) return;
    try {
      const bounds = computeGeoJsonBounds(collection);
      if (bounds) {
        map.fitBounds(
          [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          { padding: 45, maxZoom: 14.5, duration: 600 }
        );
      }
    } catch (err) {
      console.warn('Could not fit camera to bounds:', err);
    }
  }, []);

  // 3. Render Thermal Layers (Polygons + Heat Glow) whenever data or filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !currentCollection) return;

    function applyThermalLayers() {
      if (!map || !map.isStyleLoaded()) {
        map?.once('styledata', applyThermalLayers);
        return;
      }

      try {
        // Filter features based on UI controls
        const filteredFeatures = currentCollection.features.filter((f: GeoJSONFeature) => {
          const props = f.properties || {};
          const zoneId = props.id || props.zone_id;
          const zone = zones.find(z => z.id === zoneId || z.code === zoneId);

          if (filterRiskLevels && filterRiskLevels.length > 0) {
            const risk = (props.risk_level || zone?.risk || '').toLowerCase();
            if (!filterRiskLevels.includes(risk)) return false;
          }

          const temp = props.land_surface_temp_c ?? props.temperature ?? zone?.temperature ?? 0;
          if (temp < minTempFilter) return false;

          if (landUseFilter !== 'all') {
            const typology = (props.typology || zone?.landUse || '').toLowerCase();
            if (!typology.includes(landUseFilter.toLowerCase())) return false;
          }

          return true;
        });

        const displayData: ZoneGeoJSONCollection = {
          type: 'FeatureCollection',
          features: filteredFeatures
        };

        // Create Centroid Points for high-temperature heat glow overlay (>= 38°C)
        const glowPoints: any[] = [];
        for (const f of filteredFeatures) {
          const props = f.properties || {};
          const temp = props.land_surface_temp_c ?? props.temperature ?? 35;
          if (temp >= 37.5) {
            const centroid = computePolygonCentroid(f.geometry);
            if (centroid) {
              glowPoints.push({
                type: 'Feature',
                properties: {
                  id: props.id || props.zone_id,
                  land_surface_temp_c: temp
                },
                geometry: {
                  type: 'Point',
                  coordinates: centroid
                }
              });
            }
          }
        }
        const glowData = {
          type: 'FeatureCollection',
          features: glowPoints
        };

        const sourceId = 'thermos-zones-source';
        const glowSourceId = 'thermos-glow-source';
        const glowLayerId = 'thermos-heat-glow';
        const fillLayerId = 'thermos-zones-fill';
        const borderLayerId = 'thermos-zones-border';
        const highlightLayerId = 'thermos-zones-selected';

        // Update or Add Sources
        const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(displayData as any);
        } else {
          map.addSource(sourceId, { type: 'geojson', data: displayData as any });
        }

        const existingGlowSource = map.getSource(glowSourceId) as maplibregl.GeoJSONSource;
        if (existingGlowSource) {
          existingGlowSource.setData(glowData as any);
        } else {
          map.addSource(glowSourceId, { type: 'geojson', data: glowData as any });
        }

        // 1. Heat Glow Layer (Smooth radiant thermal bloom for high-LST areas)
        if (!map.getLayer(glowLayerId)) {
          map.addLayer({
            id: glowLayerId,
            type: 'circle',
            source: glowSourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 30,
                14, 90
              ],
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'land_surface_temp_c'],
                37.5, 'rgba(251, 146, 60, 0.25)',
                40.0, 'rgba(239, 68, 68, 0.40)',
                44.0, 'rgba(185, 28, 28, 0.55)'
              ],
              'circle-blur': 0.85,
              'circle-opacity': 0.75
            }
          });
        }

        // 2. Authoritative LST Thermal Fill Layer (Continuous Weather-Radar Style Color Ramp)
        // cool (<30°C: cyan/sky blue) -> teal -> yellow (34-36°C) -> orange (37-39°C) -> red (40-42°C) -> deep crimson (>43°C)
        if (!map.getLayer(fillLayerId)) {
          map.addLayer({
            id: fillLayerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'land_surface_temp_c'], ['get', 'temperature'], 35.0],
                28.0, 'rgba(56, 189, 248, 0.45)',   // Cool Cyan
                32.0, 'rgba(45, 212, 191, 0.52)',   // Teal / Low Risk
                35.0, 'rgba(250, 204, 21, 0.58)',   // Yellow / Moderate
                38.0, 'rgba(251, 146, 60, 0.65)',   // Thermal Orange / High
                41.0, 'rgba(239, 68, 68, 0.72)',    // Severe Red
                45.0, 'rgba(185, 28, 28, 0.82)'     // Critical Deep Crimson
              ],
              'fill-opacity': 0.62
            }
          });
        }

        // 3. Crisp Separation Boundaries
        if (!map.getLayer(borderLayerId)) {
          map.addLayer({
            id: borderLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 1.6,
              'line-opacity': 0.90
            }
          });
        }

        // 4. Selected Zone Highlight Outline
        if (!map.getLayer(highlightLayerId)) {
          map.addLayer({
            id: highlightLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#0f172a',
              'line-width': 3.5,
              'line-opacity': 1.0
            },
            filter: ['==', ['get', 'id'], selectedZone.id]
          });
        }

        // Fit camera to the loaded data bounds
        fitCameraToBounds(displayData);

        // Wire click and hover events safely
        const handleClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          try {
            if (!e.features || e.features.length === 0) return;
            const props = e.features[0].properties;
            const zoneId = props?.id || props?.zone_id;
            if (!zoneId) return;
            const matched = zones.find(z => z.id === zoneId || z.code === zoneId);
            if (matched) {
              onSelectZone(matched);
            }
          } catch (err) {
            console.warn('Error handling zone click:', err);
          }
        };

        const handleMouseEnter = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
            const temp = props.land_surface_temp_c ?? props.temperature ?? 0;
            const anomaly = props.thermal_anomaly_c ?? 0;
            setHoveredZoneInfo({
              id: props.id || props.zone_id || 'ZONE',
              name: props.name || props.zone_name || 'Urban Microclimate Zone',
              temp: Number(Number(temp).toFixed(1)),
              anomaly: Number(Number(anomaly).toFixed(1)),
              risk: props.risk_level || 'MODERATE'
            });
          }
        };

        const handleMouseLeave = () => {
          map.getCanvas().style.cursor = '';
          setHoveredZoneInfo(null);
        };

        map.off('click', fillLayerId, handleClick);
        map.off('mouseenter', fillLayerId, handleMouseEnter);
        map.off('mouseleave', fillLayerId, handleMouseLeave);

        map.on('click', fillLayerId, handleClick);
        map.on('mouseenter', fillLayerId, handleMouseEnter);
        map.on('mouseleave', fillLayerId, handleMouseLeave);
      } catch (err) {
        console.warn('Error applying thermal layers:', err);
      }
    }

    applyThermalLayers();
  }, [mapLoaded, currentCollection, zones, onSelectZone, filterRiskLevels, minTempFilter, landUseFilter, fitCameraToBounds]);

  // 4. Update Selected Zone Highlight Outline INDEPENDENTLY (prevents Style Loading crashes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;
    try {
      const highlightLayerId = 'thermos-zones-selected';
      if (map.getLayer(highlightLayerId)) {
        map.setFilter(highlightLayerId, ['==', ['get', 'id'], selectedZone.id]);
      }
    } catch (err) {
      console.warn('Error updating selected highlight filter:', err);
    }
  }, [selectedZone.id, mapLoaded]);

  // 5. Hotspot Centroid Glowing Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !currentCollection) return;

    // Clear previous markers
    markersRef.current.forEach(m => {
      try { m.remove(); } catch (e) { /* ignore */ }
    });
    markersRef.current = [];

    // Derive markers from actual geometry centroids
    const centroidItems = currentCollection.features.map(f => {
      const props = f.properties || {};
      const zoneId = props.id || props.zone_id;
      const zone = zones.find(z => z.id === zoneId || z.code === zoneId);
      const temp = props.land_surface_temp_c ?? props.temperature ?? zone?.temperature ?? 35;
      const risk = (props.risk_level || zone?.risk || '').toUpperCase();
      const isHot = temp >= 38.0 || risk === 'CRITICAL' || risk === 'SEVERE' || risk === 'HIGH';
      const centroid = computePolygonCentroid(f.geometry);
      return { feature: f, zone, temp, risk, isHot, centroid, zoneId };
    });

    centroidItems.forEach(({ zone, temp, isHot, centroid, zoneId }) => {
      if (!centroid || !isHot) return;

      const el = document.createElement('div');
      el.className = 'thermos-map-marker group cursor-pointer';
      const isSelected = (zone?.id === selectedZone.id);

      el.innerHTML = `
        <div class="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono-data font-extrabold shadow-lg transition-all transform hover:scale-110 ${
          isSelected 
            ? 'bg-red-600 text-white ring-2 ring-white ring-offset-2 scale-105' 
            : 'bg-white/95 text-red-700 border border-red-300 hover:bg-red-50'
        }">
          <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-red-500 animate-pulse'}"></span>
          <span>${zoneId}</span>
          <span class="text-slate-500 font-semibold">• ${temp.toFixed(1)}°C</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (zone) {
          onSelectZone(zone);
        }
      });

      try {
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(centroid)
          .addTo(map);
        markersRef.current.push(marker);
      } catch (e) {
        console.warn('Could not add marker:', e);
      }
    });
  }, [mapLoaded, currentCollection, zones, selectedZone.id, onSelectZone]);

  // Spatial Scope Toggle (Municipal Analysis vs Chennai 500m Grid)
  const handleToggleLayerMode = (mode: 'municipal' | 'chennai_grid') => {
    setActiveLayerMode(mode);
    const targetCollection = mode === 'chennai_grid' && realChennaiGeoJson
      ? realChennaiGeoJson
      : activeGeoJson;
    fitCameraToBounds(targetCollection);
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl border border-slate-300 shadow-inner bg-slate-100 select-none`}>
      {/* MapLibre DOM Mount Point */}
      <div 
        ref={mapContainerRef} 
        id="maplibre-gl-canvas"
        className="w-full h-full"
      />

      {/* Map Overlay Header: Sensor Provenance & Spatial Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-auto">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-heading font-extrabold text-slate-900 tracking-tight uppercase">
              Satellite-Derived Thermal Surface Map
            </span>
          </div>
          <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
            Landsat-9 TIRS-2 (Calibrated Sample)
          </span>
          <span className="text-[10px] font-mono-data text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
            500m Grid (Calibrated Sample)
          </span>
        </div>

        {/* Spatial Scope Switcher & Fit Controls */}
        <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-sm pointer-events-auto">
          <button
            id="btn-map-municipal-view"
            onClick={() => handleToggleLayerMode('municipal')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
              activeLayerMode === 'municipal'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Municipal Zones
          </button>
          {realChennaiGeoJson && (
            <button
              id="btn-map-chennai-grid-view"
              onClick={() => handleToggleLayerMode('chennai_grid')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1 ${
                activeLayerMode === 'chennai_grid'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Satellite className="w-3 h-3 text-emerald-300" />
              <span>Chennai AOI Grid</span>
            </button>
          )}
          <button
            onClick={() => fitCameraToBounds(currentCollection)}
            title="Fit Map to AOI Bounds"
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Hovered Zone Telemetry Tooltip */}
      {hoveredZoneInfo && (
        <div className="absolute bottom-16 left-4 bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-slate-200 shadow-xl text-xs space-y-0.5 pointer-events-none z-20 animate-in fade-in duration-100">
          <div className="flex items-center space-x-2">
            <span className="font-mono-data font-bold text-slate-900">{hoveredZoneInfo.id}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-700 truncate max-w-[180px]">{hoveredZoneInfo.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] pt-0.5">
            <span className="font-mono-data font-extrabold text-red-600">{hoveredZoneInfo.temp}°C LST</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono-data font-bold text-orange-600">
              {hoveredZoneInfo.anomaly > 0 ? `+${hoveredZoneInfo.anomaly}°C` : `${hoveredZoneInfo.anomaly}°C`}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-600 uppercase text-[10px]">{hoveredZoneInfo.risk}</span>
          </div>
        </div>
      )}

      {/* Clear LST Thermal Legend Bar */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-lg text-[11px] pointer-events-auto">
        <div className="flex items-center justify-between text-slate-700 font-semibold mb-1 space-x-2">
          <div className="flex items-center space-x-1 text-slate-900">
            <Thermometer className="w-3.5 h-3.5 text-red-600" />
            <span className="font-heading font-bold text-[10px] uppercase tracking-wider">Land Surface Temp (LST)</span>
          </div>
          <span className="font-mono-data text-[10px] text-slate-500">°C</span>
        </div>
        
        {/* Continuous Thermal Ramp Bar */}
        <div className="w-56 h-3 rounded-full overflow-hidden bg-gradient-to-r from-[#38bdf8] via-[#2dd4bf] via-[#facc15] via-[#fb923c] via-[#ef4444] to-[#b91c1c] shadow-inner" />
        
        {/* Scale labels */}
        <div className="flex justify-between text-[9px] font-mono-data text-slate-600 mt-1">
          <span>&lt;28°C Cool</span>
          <span>35°C</span>
          <span>41°C</span>
          <span>&gt;45°C Hot</span>
        </div>
      </div>

      {/* Cartographic Attribution Footer */}
      <div className="absolute bottom-1.5 right-12 text-[9px] text-slate-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200/50 pointer-events-auto">
        <span>&copy; OpenStreetMap &copy; CARTO • LST: Satellite Radiometric Calibration</span>
      </div>

      {/* Tile Degraded Notice */}
      {tileError && (
        <div className="absolute bottom-14 right-4 bg-amber-50 border border-amber-300 text-amber-800 text-[10px] px-2.5 py-1 rounded-md shadow-sm flex items-center space-x-1.5 z-10">
          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span>{tileError}</span>
        </div>
      )}
    </div>
  );
};
