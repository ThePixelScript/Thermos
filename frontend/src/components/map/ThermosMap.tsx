/**
 * THERMOS Geospatial Platform — Production MapLibre GL Workbench
 * 
 * Production-grade geospatial canvas:
 * - Default center: Chennai, India [80.2707, 13.0827], Zoom 10
 * - Base layer: OpenStreetMap raster tiles
 * - Navigation controls: Zoom in/out, Compass reset
 * - Centralized LayerManager synchronization
 * - Floating Layer Control panel with checkboxes and opacity sliders
 * - Zero static/mock geometries
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoJSONFeatureCollection, WeatherData } from '../../types';
import { layerManager, type LayerId, type LayerMetadata } from '../../lib/map/layerManager';
import { LayerControl } from './LayerControl';
import { fetchWaterBodies } from '../../services/overpassWaterService';
import { fetchBuildingFootprints } from '../../services/buildingFootprintsService';
import { ndviService } from '../../services/ndviService';
import { lstService } from '../../services/lstService';
import { windParticleLayer } from '../../lib/map/windParticleLayer';
import { useTheme } from '../../context/ThemeContext';
import { useLocation } from '../../context/LocationContext';
import { LocationSearchBar } from '../search/LocationSearchBar';
import { reverseGeocodeLocation } from '../../services/api';

export interface ThermosMapProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  weather?: WeatherData | null;
}

// Chennai, Tamil Nadu, India reference coordinates
const CHENNAI_CENTER: [number, number] = [80.2707, 13.0827];
const DEFAULT_ZOOM = 10;

const CARTO_DARK_TILES = ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'];
const OSM_LIGHT_TILES = ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];

export const ThermosMap: React.FC<ThermosMapProps> = ({
  geoJsonData,
  selectedZoneId,
  onSelectZone,
  initialCenter = CHENNAI_CENTER,
  initialZoom = DEFAULT_ZOOM,
  weather,
}) => {
  const { resolvedMode } = useTheme();
  const { selectedLocation, setSelectedLocation, setIsResolving } = useLocation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pulseMarkerRef = useRef<maplibregl.Marker | null>(null);
  const waterLoadedRef = useRef<boolean>(false);
  const buildingsLoadedRef = useRef<boolean>(false);
  const [layers, setLayers] = useState<LayerMetadata[]>(layerManager.getLayers());
  const [mapError, setMapError] = useState<string | null>(null);

  // Subscribe to LayerManager mutations
  useEffect(() => {
    const unsubscribe = layerManager.subscribe((updatedLayers) => {
      setLayers(updatedLayers);
    });
    return unsubscribe;
  }, []);

  // Adapt basemap tiles automatically on mode change (Carto Dark for dark, OSM Light for light)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetTiles = resolvedMode === 'dark' ? CARTO_DARK_TILES : OSM_LIGHT_TILES;
    const targetAttribution = resolvedMode === 'dark'
      ? '&copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a> contributors'
      : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

    const updateSource = () => {
      try {
        const source = map.getSource('osm-tiles') as any;
        if (source && typeof source.setTiles === 'function') {
          source.setTiles(targetTiles);
        } else if (map.getLayer('osm-tiles-layer')) {
          const currentOpacity = layerManager.getLayers().find((l) => l.id === 'basemap')?.opacity ?? 1.0;
          const currentVisibility = layerManager.getLayers().find((l) => l.id === 'basemap')?.visible ? 'visible' : 'none';
          map.removeLayer('osm-tiles-layer');
          map.removeSource('osm-tiles');
          map.addSource('osm-tiles', {
            type: 'raster',
            tiles: targetTiles,
            tileSize: 256,
            attribution: targetAttribution,
          });
          const firstLayerId = map.getStyle().layers?.[0]?.id;
          map.addLayer({
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            layout: { visibility: currentVisibility },
            paint: { 'raster-opacity': currentOpacity },
          }, firstLayerId);
        }
      } catch (err) {
        console.warn('Unable to dynamically swap basemap tiles:', err);
      }
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once('load', updateSource);
    }
  }, [resolvedMode]);

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
              tiles: resolvedMode === 'dark' ? CARTO_DARK_TILES : OSM_LIGHT_TILES,
              tileSize: 256,
              attribution: resolvedMode === 'dark'
                ? '&copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a> contributors'
                : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
              paint: {
                'raster-opacity': 1.0,
              },
            },
          ],
        },
        center: initialCenter,
        zoom: initialZoom,
      });

      // Requirement 6: Add navigation controls (Zoom in/out, Compass reset)
      const navControl = new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      });
      map.addControl(navControl, 'top-right');

      // Add Current Location Button (GeolocateControl)
      const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: false,
      });
      geolocateControl.on('geolocate', async (e: any) => {
        const lat = e.coords.latitude;
        const lon = e.coords.longitude;
        try {
          const resolved = await reverseGeocodeLocation(lat, lon);
          setSelectedLocation({
            name: resolved.name || `Current Location (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
            display_name: resolved.display_name || `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            lat,
            lon,
            bbox: resolved.bbox,
            source: 'Device GPS',
          });
        } catch {
          setSelectedLocation({
            name: `Current Location (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
            display_name: `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            lat,
            lon,
            source: 'Device GPS',
          });
        }
      });
      map.addControl(geolocateControl, 'top-right');

      // Add scale control
      map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

      map.on('load', () => {
        mapRef.current = map;
        layerManager.attachMap(map);
        syncGeoJsonLayers(map, geoJsonData, selectedZoneId);

        // 1. Water Bodies
        if (!map.getSource('osm-water-source')) {
          map.addSource('osm-water-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          map.addLayer({
            id: 'water-vector-layer',
            type: 'fill',
            source: 'osm-water-source',
            layout: { visibility: 'none' },
            paint: {
              'fill-color': '#0284c7',
              'fill-opacity': 0.8,
            },
          });

          map.addLayer({
            id: 'water-vector-outline',
            type: 'line',
            source: 'osm-water-source',
            layout: { visibility: 'none' },
            paint: {
              'line-color': '#0369a1',
              'line-width': 1.5,
              'line-opacity': 0.9,
            },
          });
        }

        // 2. 3D Building Extrusions
        if (!map.getSource('overture-buildings-source')) {
          map.addSource('overture-buildings-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          map.addLayer({
            id: 'buildings-3d-extrusion',
            type: 'fill-extrusion',
            source: 'overture-buildings-source',
            layout: { visibility: 'none' },
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0, '#64748b',
                15, '#94a3b8',
                30, '#cbd5e1',
                60, '#f8fafc',
              ],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.85,
            },
          });
        }

        // 3. Sentinel-2 NDVI
        if (!map.getSource('ndvi-cog-source')) {
          map.addSource('ndvi-cog-source', {
            type: 'raster',
            tiles: [ndviService.getBackendNDVITileUrl(), ndviService.getNDVIRasterTileUrl()],
            tileSize: 256,
          });

          map.addLayer({
            id: 'ndvi-raster-layer',
            type: 'raster',
            source: 'ndvi-cog-source',
            layout: { visibility: 'none' },
            paint: {
              'raster-opacity': 0.70,
            },
          });
        }

        // 4. Landsat 8/9 LST
        if (!map.getSource('lst-cog-source')) {
          map.addSource('lst-cog-source', {
            type: 'raster',
            tiles: [lstService.getBackendLSTTileUrl(), lstService.getLSTRasterTileUrl()],
            tileSize: 256,
          });

          map.addLayer({
            id: 'lst-raster-layer',
            type: 'raster',
            source: 'lst-cog-source',
            layout: { visibility: 'none' },
            paint: {
              'raster-opacity': 0.75,
            },
          });
        }

        // 5. Wind Streamline Particles
        windParticleLayer.attach(map);
        if (weather) {
          windParticleLayer.updateWindTelemetry(weather.wind_speed, weather.wind_direction);
        }

        // Popups for real-world layers
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        map.on('mouseenter', 'water-vector-layer', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            popup
              .setLngLat(e.lngLat)
              .setHTML(
                `<div style="font-size:12px;color:#0f172a;padding:2px 4px;">` +
                `<strong>🌊 ${props.name || 'Water Cooling Buffer'}</strong><br/>` +
                `Type: ${props.type || 'lake'}<br/>` +
                `Buffer: ${props.cooling_buffer_radius_m || 250}m evaporative sink` +
                `</div>`
              )
              .addTo(map);
          }
        });

        map.on('mouseleave', 'water-vector-layer', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        map.on('click', 'buildings-3d-extrusion', (e: any) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(
                `<div style="font-size:12px;color:#0f172a;padding:2px 4px;">` +
                `<strong>🏢 ${props.name || 'Building Structure'}</strong><br/>` +
                `Height: <strong>${props.height}m</strong> (${props.levels || 3} floors)<br/>` +
                `Thermal Mass Factor: ${props.thermal_mass_factor || 1.0}x base` +
                `</div>`
              )
              .addTo(map);
          }
        });

        // Interactive map click for any global point on Earth
        map.on('click', async (e: any) => {
          const zoneFeatures = map.queryRenderedFeatures(e.point, {
            layers: map.getLayer('zones-fill') ? ['zones-fill'] : [],
          });
          if (zoneFeatures && zoneFeatures.length > 0) {
            return;
          }

          const { lng, lat } = e.lngLat;
          setIsResolving(true);
          try {
            const resolved = await reverseGeocodeLocation(lat, lng);
            setSelectedLocation({
              name: resolved.name || `Target (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
              display_name: resolved.display_name || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              lat,
              lon: lng,
              bbox: resolved.bbox,
              source: 'Map Click',
            });
          } catch (err) {
            console.warn('Map reverse geocoding fallback:', err);
            setSelectedLocation({
              name: `Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
              display_name: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              lat,
              lon: lng,
              source: 'Map Coordinate',
            });
          } finally {
            setIsResolving(false);
          }
        });
      });

      map.on('error', (e: any) => {
        console.warn('MapLibre GL internal event:', e);
      });

      return () => {
        if (pulseMarkerRef.current) {
          pulseMarkerRef.current.remove();
          pulseMarkerRef.current = null;
        }
        windParticleLayer.detach();
        layerManager.detachMap();
        map.remove();
        mapRef.current = null;
      };
    } catch (err: any) {
      console.error('MapLibre GL WebGL initialization error:', err);
      setMapError(err?.message || 'WebGL 2.0 context unavailable in this browser environment.');
    }
  }, []);

  // Handle container resize cleanly
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Synchronize GIS target pin and camera with selectedLocation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    if (!pulseMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'gis-target-pin';
      el.innerHTML = `
        <svg width="26" height="34" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <filter id="gis-pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22c0-7.732-6.268-14-14-14z" fill="#DC2626" filter="url(#gis-pin-shadow)"/>
          <circle cx="14" cy="14" r="5" fill="#FFFFFF"/>
        </svg>
      `;
      pulseMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([selectedLocation.lon, selectedLocation.lat])
        .addTo(map);
    } else {
      pulseMarkerRef.current.setLngLat([selectedLocation.lon, selectedLocation.lat]);
    }

    map.flyTo({
      center: [selectedLocation.lon, selectedLocation.lat],
      zoom: 12,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [selectedLocation]);

  // Synchronize GeoJSON features and selected zone borders
  const syncGeoJsonLayers = (
    map: maplibregl.Map,
    data: GeoJSONFeatureCollection | null,
    selectedId: string | null
  ) => {
    if (!data || data.features.length === 0) return;

    const source = map.getSource('urban-zones') as maplibregl.GeoJSONSource;

    if (!source) {
      map.addSource('urban-zones', {
        type: 'geojson',
        data: data as any,
      });

      // 1. Fill layer colored by CHRI risk level
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'urban-zones',
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'CRITICAL', '#EF4444',
            'SEVERE', '#EF4444',
            'HIGH', '#F97316',
            'MODERATE', '#F59E0B',
            'LOW', '#3B82F6',
            '#94A3B8',
          ],
          'fill-opacity': 0.65,
        },
      });

      // 2. Zone boundaries
      map.addLayer({
        id: 'zones-border',
        type: 'line',
        source: 'urban-zones',
        paint: {
          'line-color': '#64748b',
          'line-width': 1.0,
          'line-opacity': 0.7,
        },
      });

      // 3. Highlight boundary for selected zone
      map.addLayer({
        id: 'zones-selected-border',
        type: 'line',
        source: 'urban-zones',
        filter: ['==', 'id', selectedId || ''],
        paint: {
          'line-color': '#2563EB',
          'line-width': 3.0,
          'line-opacity': 1.0,
        },
      });

      // Interactive zone clicks
      map.on('click', 'zones-fill', (e: any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const zoneId = feature.properties?.id;
          if (zoneId) {
            onSelectZone(zoneId);
          }
        }
      });

      // Cursor affordance
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

  // Update source data when GeoJSON or selection changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      syncGeoJsonLayers(mapRef.current, geoJsonData, selectedZoneId);
    }
  }, [geoJsonData, selectedZoneId]);

  // Pan to selected zone centroid if present in GeoJSON
  useEffect(() => {
    if (!mapRef.current || !selectedZoneId || !geoJsonData) return;

    const feature = geoJsonData.features.find((f) => f.properties.id === selectedZoneId);
    if (feature && feature.geometry.coordinates[0]) {
      const coords = feature.geometry.coordinates[0];
      const avgLon = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
      const avgLat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;

      mapRef.current.flyTo({
        center: [avgLon, avgLat],
        zoom: 12.5,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }
  }, [selectedZoneId, geoJsonData]);

  // Synchronize wind speed & direction from weather telemetry
  useEffect(() => {
    if (weather) {
      windParticleLayer.updateWindTelemetry(weather.wind_speed, weather.wind_direction);
    }
  }, [weather]);

  // Layer control callbacks
  const handleToggleLayer = useCallback(async (id: LayerId) => {
    const layer = layerManager.getLayer(id);
    const willBeVisible = layer ? !layer.visible : false;

    // Real-world lazy ingestion
    if (id === 'waterbodies' && willBeVisible && mapRef.current) {
      const src = mapRef.current.getSource('osm-water-source') as maplibregl.GeoJSONSource;
      if (src && !waterLoadedRef.current) {
        try {
          const waterGeo = await fetchWaterBodies();
          src.setData(waterGeo as any);
          waterLoadedRef.current = true;
        } catch (err) {
          console.warn('Failed to load water bodies:', err);
        }
      }
    } else if (id === 'buildings' && willBeVisible && mapRef.current) {
      const src = mapRef.current.getSource('overture-buildings-source') as maplibregl.GeoJSONSource;
      if (src && !buildingsLoadedRef.current) {
        try {
          const bldGeo = await fetchBuildingFootprints();
          src.setData(bldGeo as any);
          buildingsLoadedRef.current = true;
        } catch (err) {
          console.warn('Failed to load 3D buildings:', err);
        }
      }
      if (mapRef.current.getPitch() < 25) {
        mapRef.current.easeTo({ pitch: 45, duration: 1200 });
      }
    } else if (id === 'wind') {
      windParticleLayer.setVisibility(willBeVisible);
    }

    layerManager.toggleLayer(id);
  }, []);

  const handleUpdateOpacity = useCallback((id: LayerId, opacity: number) => {
    if (id === 'wind') {
      windParticleLayer.setOpacity(opacity);
    }
    layerManager.updateOpacity(id, opacity);
  }, []);

  const handleResetCamera = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: CHENNAI_CENTER,
      zoom: DEFAULT_ZOOM,
      speed: 1.2,
      essential: true,
    });
  }, []);

  return (
    <div className="thermos-map-wrapper">
      {/* Floating Google Maps / Mapbox style search bar over map (Top-Left) */}
      <div className="map-search-overlay-container">
        <LocationSearchBar placeholder="Search city, district, or coordinates..." />
      </div>

      {/* Floating Layer Control UI Panel */}
      <LayerControl
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onUpdateOpacity={handleUpdateOpacity}
        onResetCamera={handleResetCamera}
      />

      {/* Production MapLibre Container */}
      <div ref={mapContainerRef} className="maplibre-container" />

      {/* WebGL Error Banner (replaces any mock map fallback) */}
      {mapError && (
        <div className="map-error-overlay">
          <div className="error-card">
            <h3>⚠️ MapLibre WebGL Initialization Issue</h3>
            <p>{mapError}</p>
            <p className="error-sub">Ensure hardware acceleration and WebGL 2.0 are enabled in your browser settings.</p>
          </div>
        </div>
      )}
    </div>
  );
};
