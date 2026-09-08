import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Flame, 
  MapPin, 
  Thermometer, 
  Layers, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Zone, HotspotItem, ZoneGeoJSONCollection, GeoJSONFeature } from '../types';
import { 
  CHENNAI_METRO_BOUNDS, 
  CHENNAI_LANDSAT_AOI_BOUNDS, 
  CHENNAI_URBAN_ANCHORS,
  buildChennaiUrbanGeoJsonCollection 
} from '../data/chennaiGeoJson';
import { HeatScapeApi } from '../services/api';

// Multi-spectral thermal color lookup for Zoom Earth continuous heat surface
const getThermalSurfaceColor = (temp: number): string => {
  if (temp >= 44.5) return '#991b1b'; // Deep Crimson / Extreme
  if (temp >= 42.5) return '#ef4444'; // Vivid Red / Severe
  if (temp >= 39.5) return '#f97316'; // Thermal Orange / High
  if (temp >= 36.5) return '#facc15'; // Warm Yellow / Moderate
  if (temp >= 33.0) return '#4ade80'; // Eco Green
  if (temp >= 29.5) return '#06b6d4'; // Cyan
  return '#1e40af';                  // Cool Blue (<29°C)
};

// Safe centroid computation for complex/nested polygons
function computePolygonCentroid(geometry: any): [number, number] | null {
  if (!geometry) return null;
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates[0], geometry.coordinates[1]];
  }
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates) && geometry.coordinates[0]?.length) {
    const ring = geometry.coordinates[0];
    let sumLon = 0;
    let sumLat = 0;
    for (let i = 0; i < ring.length; i++) {
      sumLon += ring[i][0];
      sumLat += ring[i][1];
    }
    return [sumLon / ring.length, sumLat / ring.length];
  }
  return null;
}

// Compute geographic bounds for Chennai AOI
function computeChennaiAoiBounds(geojson: ZoneGeoJSONCollection | null | undefined): [number, number, number, number] {
  if (!geojson || !geojson.features || geojson.features.length === 0) {
    return CHENNAI_METRO_BOUNDS;
  }

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const feature of geojson.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
      for (const ring of geom.coordinates) {
        for (const coord of ring) {
          const lon = coord[0];
          const lat = coord[1];
          if (lon < minLon) minLon = lon;
          if (lat < minLat) minLat = lat;
          if (lon > maxLon) maxLon = lon;
          if (lat > maxLat) maxLat = lat;
        }
      }
    } else if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
      const lon = geom.coordinates[0];
      const lat = geom.coordinates[1];
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
  }

  if (!isFinite(minLon) || !isFinite(minLat) || !isFinite(maxLon) || !isFinite(maxLat) || minLon < 80.0 || minLon > 81.0) {
    return CHENNAI_METRO_BOUNDS;
  }
  return [minLon, minLat, maxLon, maxLat];
}

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
  const hasFittedRef = useRef<boolean>(false);

  const [activeGeoJson, setActiveGeoJson] = useState<ZoneGeoJSONCollection>(() => 
    buildChennaiUrbanGeoJsonCollection(zones, initialGeoJson)
  );
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [hoveredZoneInfo, setHoveredZoneInfo] = useState<{ 
    id: string; 
    name: string; 
    temp: number; 
    anomaly: number; 
    risk: string;
    isSimulated?: boolean;
    district?: string;
  } | null>(null);

  // 1. Fetch real satellite Landsat grid cells and build authoritative Chennai GeoJSON
  useEffect(() => {
    let isMounted = true;
    async function loadChennaiLayers() {
      try {
        const realGj = await HeatScapeApi.getRealZonesGeoJson().catch(() => null);
        if (isMounted) {
          const mergedCollection = buildChennaiUrbanGeoJsonCollection(zones, realGj);
          setActiveGeoJson(mergedCollection);
        }
      } catch (err: any) {
        console.warn('Real satellite GeoJSON overlay fetch skipped, relying on authoritative anchors:', err);
      }
    }
    loadChennaiLayers();
    return () => { isMounted = false; };
  }, [zones]);

  // Handler for zone selection + immediate tab transition to Hotspot Analysis
  const handleZoneSelectionAndOpen = useCallback((zone: Zone) => {
    onSelectZone(zone);
    if (onOpenAnalysis) {
      onOpenAnalysis(zone);
    }
  }, [onSelectZone, onOpenAnalysis]);

  // Fit camera bounds to Chennai
  const fitCameraToChennai = useCallback((gj: ZoneGeoJSONCollection) => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = computeChennaiAoiBounds(gj);
    map.fitBounds(
      [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
      {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 13.5,
        duration: 900
      }
    );
  }, []);

  // 2. Initialize MapLibre Map with Clean Esri Light Gray Basemap (Mount Once)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const bounds = CHENNAI_METRO_BOUNDS;
      const centerLon = (bounds[0] + bounds[2]) / 2;
      const centerLat = (bounds[1] + bounds[3]) / 2;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          sources: {
            'esri-light-gray-base': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
              ],
              tileSize: 256,
              attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ, OpenStreetMap'
            }
          },
          layers: [
            {
              id: 'esri-base-layer',
              type: 'raster',
              source: 'esri-light-gray-base',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [centerLon, centerLat],
        zoom: 10.5,
        minZoom: 8.5,
        maxZoom: 18.0,
        pitch: 0,
        bearing: 0,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-left');
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        setMapLoaded(true);
      });

      mapRef.current = map;
      (window as any).__maplibreMap = map;
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
        delete (window as any).__maplibreMap;
      }
    };
  }, [onError]);

  // 3. Render Thermal Layers (Continuous Surface Hero + Subtle Zone Fills + Top Labels)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !activeGeoJson) return;

    function applyThermalLayers() {
      if (!map) return;
      if (!map.isStyleLoaded()) {
        map.once('styledata', applyThermalLayers);
        return;
      }

      try {
        if (!hasFittedRef.current) {
          hasFittedRef.current = true;
          fitCameraToChennai(activeGeoJson);
        }

        const filteredFeatures = activeGeoJson.features.filter((f: GeoJSONFeature) => {
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

        const enrichedPolygons = filteredFeatures.map(f => {
          const props = f.properties || {};
          const temp = props.land_surface_temp_c ?? props.temperature ?? 35.0;
          return {
            ...f,
            properties: {
              ...props,
              surface_color: getThermalSurfaceColor(temp),
              land_surface_temp_c: temp
            }
          };
        });

        const polygonData: ZoneGeoJSONCollection = {
          type: 'FeatureCollection',
          features: enrichedPolygons
        };

        // DENSE THERMAL SAMPLE GRID:
        // Build an organic, multi-anchor continuous temperature surface across Chennai
        const thermalPoints: any[] = [];
        filteredFeatures.forEach((f: GeoJSONFeature) => {
          const props = f.properties || {};
          const centroid = props.centroid || computePolygonCentroid(f.geometry);
          if (centroid) {
            const temp = props.land_surface_temp_c ?? props.temperature ?? 35.0;
            
            // Primary Anchor Centroid Point
            const primaryWeight = Number(Math.max(0.2, (temp - 26.0) / 19.2).toFixed(2));
            thermalPoints.push({
              type: 'Feature',
              properties: {
                id: props.id || props.zone_id,
                weight: primaryWeight,
                land_surface_temp_c: temp,
                temperature: temp,
                is_simulated: props.is_simulated || false
              },
              geometry: {
                type: 'Point',
                coordinates: centroid
              }
            });

            // Smooth concentric dispersion rings (4 rings x 6 points = 24 points per anchor)
            const rings = [0.006, 0.012, 0.018, 0.026];
            rings.forEach((r, rIdx) => {
              const numAngles = 6;
              const angleStep = (Math.PI * 2) / numAngles;
              const tempFalloff = Math.max(26.0, temp - (rIdx + 1) * 0.40);
              for (let a = 0; a < numAngles; a++) {
                const angle = a * angleStep + (rIdx * 0.28);
                const dx = r * Math.cos(angle);
                const dy = r * Math.sin(angle);
                const ringWeight = Number(Math.max(0.1, (tempFalloff - 26.0) / 19.2).toFixed(2));
                thermalPoints.push({
                  type: 'Feature',
                  properties: {
                    id: `${props.id}-r${rIdx}-a${a}`,
                    weight: ringWeight,
                    land_surface_temp_c: Number(tempFalloff.toFixed(1)),
                    temperature: Number(tempFalloff.toFixed(1)),
                    is_simulated: true
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: [
                      Number((centroid[0] + dx).toFixed(5)),
                      Number((centroid[1] + dy).toFixed(5))
                    ]
                  }
                });
              }
            });
          }
        });

        console.warn('[THERMAL_DEBUG] activeGeoJson features:', activeGeoJson?.features?.length, 'filteredFeatures:', filteredFeatures.length, 'thermalPoints:', thermalPoints.length);

        const heatmapData = {
          type: 'FeatureCollection',
          features: thermalPoints
        };

        const heatmapSourceId = 'thermos-thermal-heatmap-source';
        const polygonSourceId = 'thermos-zones-polygon-source';

        const heatmapLayerId = 'thermos-thermal-heatmap';
        const fillLayerId = 'thermos-zones-fill';
        const borderLayerId = 'thermos-zones-border';
        const haloLayerId = 'thermos-zones-halo';
        const highlightLayerId = 'thermos-zones-selected';

        // 1. Point Source for Heatmap
        const existingHeatmapSource = map.getSource(heatmapSourceId) as maplibregl.GeoJSONSource;
        if (existingHeatmapSource) {
          existingHeatmapSource.setData(heatmapData as any);
        } else {
          map.addSource(heatmapSourceId, { type: 'geojson', data: heatmapData as any });
        }

        // 2. Polygon Source for Zone Fills & Outlines
        const existingPolySource = map.getSource(polygonSourceId) as maplibregl.GeoJSONSource;
        if (existingPolySource) {
          existingPolySource.setData(polygonData as any);
        } else {
          map.addSource(polygonSourceId, { type: 'geojson', data: polygonData as any });
        }

        // LAYER 1: Native Heatmap Layer (Zoom Earth Continuous Thermal Surface)
        if (!map.getLayer(heatmapLayerId)) {
          map.addLayer({
            id: heatmapLayerId,
            type: 'heatmap',
            source: heatmapSourceId,
            paint: {
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 1.8,
                10, 2.6,
                12, 3.6,
                15, 5.0
              ],
              // Zoom Earth Multi-Spectral Ramping (Vibrant & Immediate):
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0.00, 'rgba(0, 0, 0, 0)',
                0.01, 'rgba(30, 64, 175, 0.60)',   // Cool Blue (<28°C)
                0.08, 'rgba(6, 182, 212, 0.75)',   // Vibrant Cyan (~31°C)
                0.20, 'rgba(74, 222, 128, 0.82)',  // Eco Green (~34°C)
                0.38, 'rgba(250, 204, 21, 0.88)',  // Thermal Yellow (~37°C)
                0.58, 'rgba(249, 115, 22, 0.92)',  // Alert Orange (~40°C)
                0.78, 'rgba(239, 68, 68, 0.96)',   // Severe Red (~43°C)
                1.00, 'rgba(153, 27, 27, 0.98)'    // Extreme Crimson (>45°C)
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8, 70,
                10, 120,
                12, 190,
                15, 300,
                17, 420
              ],
              'heatmap-opacity': 0.85
            }
          });
        }

        // LAYER 2: Subtle Zone Fill (Soft organic body)
        if (!map.getLayer(fillLayerId)) {
          map.addLayer({
            id: fillLayerId,
            type: 'fill',
            source: polygonSourceId,
            paint: {
              'fill-color': ['get', 'surface_color'],
              'fill-opacity': 0.42
            }
          });
        }

        // LAYER 3: Polygon Boundaries (Hidden by default so the continuous surface is the hero)
        if (!map.getLayer(borderLayerId)) {
          map.addLayer({
            id: borderLayerId,
            type: 'line',
            source: polygonSourceId,
            paint: {
              'line-color': '#0f172a',
              'line-width': 1.0,
              'line-opacity': 0.0
            }
          });
        }

        // LAYER 4: Selected Zone Glowing White Halo
        if (!map.getLayer(haloLayerId)) {
          map.addLayer({
            id: haloLayerId,
            type: 'line',
            source: polygonSourceId,
            filter: ['==', ['get', 'id'], selectedZone.id || selectedZone.code],
            paint: {
              'line-color': '#ffffff',
              'line-width': 6.0,
              'line-opacity': 0.95,
              'line-blur': 3.0
            }
          });
        }

        // LAYER 5: Selected Zone Crisp Dark Border
        if (!map.getLayer(highlightLayerId)) {
          map.addLayer({
            id: highlightLayerId,
            type: 'line',
            source: polygonSourceId,
            filter: ['==', ['get', 'id'], selectedZone.id || selectedZone.code],
            paint: {
              'line-color': '#0f172a',
              'line-width': 3.0,
              'line-opacity': 1.0
            }
          });
        }



        // INTERACTION: Zone hover & click
        const handlePolygonClick = (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const clickedFeature = e.features[0];
          const props = clickedFeature.properties;
          const zoneId = props.id || props.zone_id;
          const zone = zones.find(z => z.id === zoneId || z.code === zoneId);
          if (zone) {
            handleZoneSelectionAndOpen(zone);
          }
        };

        const handlePolygonMouseEnter = (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          if (!e.features || e.features.length === 0) return;
          const props = e.features[0].properties;
          setHoveredZoneInfo({
            id: props.id || props.zone_id,
            name: props.name || 'Chennai Urban Zone',
            temp: Number(props.land_surface_temp_c ?? props.temperature ?? 35.0),
            anomaly: Number(props.lst_anomaly_k ?? 5.0),
            risk: String(props.risk_level || 'moderate').toUpperCase(),
            isSimulated: props.is_simulated,
            district: props.district
          });
        };

        const handlePolygonMouseLeave = () => {
          map.getCanvas().style.cursor = '';
          setHoveredZoneInfo(null);
        };

        map.off('click', fillLayerId, handlePolygonClick);
        map.on('click', fillLayerId, handlePolygonClick);

        map.off('mouseenter', fillLayerId, handlePolygonMouseEnter);
        map.on('mouseenter', fillLayerId, handlePolygonMouseEnter);

        map.off('mouseleave', fillLayerId, handlePolygonMouseLeave);
        map.on('mouseleave', fillLayerId, handlePolygonMouseLeave);

      } catch (err: any) {
        console.error('Error applying thermal layers:', err);
      }
    }

    applyThermalLayers();
  }, [mapLoaded, activeGeoJson, zones, filterRiskLevels, minTempFilter, landUseFilter, handleZoneSelectionAndOpen, fitCameraToChennai]);

  // 4. Update Selected Zone Highlight Filters
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const zoneIdentifier = selectedZone.id || selectedZone.code;
    const filterExpr: any = [
      'any',
      ['==', ['get', 'id'], zoneIdentifier],
      ['==', ['get', 'zone_id'], zoneIdentifier],
      ['==', ['get', 'code'], zoneIdentifier]
    ];
    if (map.getLayer('thermos-zones-selected')) {
      map.setFilter('thermos-zones-selected', filterExpr);
    }
    if (map.getLayer('thermos-zones-halo')) {
      map.setFilter('thermos-zones-halo', filterExpr);
    }
  }, [selectedZone, mapLoaded]);

  // 5. RENDER IRREGULAR TEMPERATURE PILLS (NOT ON A GRID)
  // Show only 5-7 key natural anchors + selected zone
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !activeGeoJson) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const keyAnchorCodes = new Set(['ZONE-01', 'ZONE-02', 'ZONE-03', 'ZONE-04', 'ZONE-07', 'ZONE-10']);
    const selectedCode = selectedZone.code || selectedZone.id;

    const visiblePillFeatures = activeGeoJson.features.filter((f: GeoJSONFeature) => {
      const props = f.properties || {};
      const code = props.code || props.id || props.zone_id;
      return keyAnchorCodes.has(code) || code === selectedCode;
    });

    visiblePillFeatures.forEach((feature: GeoJSONFeature) => {
      const props = feature.properties || {};
      const centroid = props.centroid || computePolygonCentroid(feature.geometry);
      if (!centroid) return;

      const zoneId = props.id || props.zone_id;
      const zone = zones.find(z => z.id === zoneId || z.code === zoneId);
      const temp = props.land_surface_temp_c ?? props.temperature ?? zone?.temperature ?? 35.0;
      const isSelected = zoneId === selectedZone.id || zoneId === selectedZone.code || props.code === selectedZone.code;
      const surfaceColor = getThermalSurfaceColor(temp);

      const el = document.createElement('div');
      el.className = 'thermos-map-marker group';
      el.setAttribute('data-zone-id', zoneId);
      el.setAttribute('data-temp', String(temp));
      el.style.cursor = 'pointer';

      el.innerHTML = `
        <div class="flex items-center space-x-1.5 px-2 py-1 rounded-full shadow-md backdrop-blur-sm transition-all duration-150 ${
          isSelected 
            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' 
            : 'hover:scale-105'
        }" style="background-color: ${surfaceColor}; color: #ffffff; border: 1.5px solid rgba(255, 255, 255, 0.85);">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span class="text-[11px] font-mono-data font-black tracking-tight">${temp.toFixed(1)}°C</span>
        </div>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (zone) {
          handleZoneSelectionAndOpen(zone);
        } else if (zones.length > 0) {
          const base = zones[0];
          handleZoneSelectionAndOpen({
            ...base,
            id: zoneId,
            code: props.code || zoneId,
            name: props.name || base.name,
            temperature: temp,
            risk: (props.risk_level || base.risk) as any,
            coordinates: { ...base.coordinates, x: centroid[0], y: centroid[1], lat: centroid[1], lng: centroid[0] }
          });
        }
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat(centroid)
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [mapLoaded, activeGeoJson, selectedZone, zones, handleZoneSelectionAndOpen]);

  return (
    <div className={`relative ${className} bg-[#e5e7eb] rounded-xl overflow-hidden shadow-inner`}>
      {/* MapLibre WebGL Canvas Container */}
      <div 
        id="maplibre-gl-canvas"
        ref={mapContainerRef} 
        className="w-full h-full" 
      />

      {/* Top Banner: Scientific Provenance */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col space-y-1.5 max-w-[85%]">
        <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-auto">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-heading font-extrabold text-slate-900 uppercase tracking-tight">
              Satellite-Derived Thermal Surface Map
            </span>
          </div>
          <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
            Landsat-9 TIRS-2 (Calibrated Sample)
          </span>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white/90 shadow-sm pointer-events-auto w-fit">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span className="font-medium">Chennai Metropolitan Area</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">Continuous Thermal Gradient</span>
        </div>
      </div>

      {/* Top Right: Reset View & Fit AOI */}
      <div className="absolute top-3 right-12 z-10 flex items-center space-x-1.5 pointer-events-auto">
        <button
          onClick={() => fitCameraToChennai(activeGeoJson)}
          className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold shadow-sm flex items-center space-x-1 transition-all"
          title="Reset Camera to Chennai AOI"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Metro</span>
        </button>
      </div>

      {/* Interactive Zone Hover Card */}
      {hoveredZoneInfo && (
        <div className="absolute top-16 right-3 z-20 bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg max-w-xs animate-in fade-in duration-100 pointer-events-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
            <div>
              <span className="text-[10px] font-mono-data font-bold text-slate-400 uppercase">{hoveredZoneInfo.id}</span>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{hoveredZoneInfo.name}</h4>
              {hoveredZoneInfo.district && (
                <p className="text-[10px] text-slate-500">{hoveredZoneInfo.district}</p>
              )}
            </div>
            <div 
              className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
              style={{
                backgroundColor: `${getThermalSurfaceColor(hoveredZoneInfo.temp)}15`,
                color: getThermalSurfaceColor(hoveredZoneInfo.temp)
              }}
            >
              {hoveredZoneInfo.risk}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-slate-600 font-medium">Surface LST:</span>
            <span className="font-mono-data font-black text-sm" style={{ color: getThermalSurfaceColor(hoveredZoneInfo.temp) }}>
              {hoveredZoneInfo.temp.toFixed(1)}°C
            </span>
          </div>
          {hoveredZoneInfo.isSimulated && (
            <div className="mt-2 text-[9px] font-mono-data text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              SIMULATED — VISUALIZATION ONLY
            </div>
          )}
        </div>
      )}

      {/* Bottom Zoom Earth Multi-Spectral Legend Bar */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-2 rounded-xl shadow-md flex flex-col space-y-1.5 max-w-[320px]">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase tracking-wider">
          <span className="flex items-center space-x-1">
            <Thermometer className="w-3 h-3 text-red-600" />
            <span>Land Surface Temp (LST)</span>
          </span>
          <span className="text-[9px] text-slate-400 font-mono-data">Cool → Hot</span>
        </div>

        {/* Continuous 7-step thermal color ramp bar */}
        <div 
          className="w-full h-2.5 rounded-full shadow-inner border border-slate-300"
          style={{
            background: 'linear-gradient(to right, #1e40af, #06b6d4, #4ade80, #facc15, #f97316, #ef4444, #991b1b)'
          }}
        />

        <div className="flex justify-between text-[9px] font-mono-data font-bold text-slate-500">
          <span>&lt;28°C</span>
          <span>31°C</span>
          <span>34°C</span>
          <span>37°C</span>
          <span>40°C</span>
          <span>43°C</span>
          <span>&gt;45°C</span>
        </div>
      </div>
    </div>
  );
};
