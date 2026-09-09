/**
 * THERMOS Geospatial Platform — LayerManager Abstraction
 * 
 * Provides centralized registry, state management, visibility toggling,
 * opacity calibration, and MapLibre GL layer synchronization for the 10 core
 * platform layers.
 */
import type { Map as MapLibreMap, LayerSpecification, SourceSpecification } from 'maplibre-gl';

export type LayerId =
  | 'basemap'
  | 'chri'
  | 'lst'
  | 'ndvi'
  | 'buildings'
  | 'roads'
  | 'waterbodies'
  | 'population'
  | 'wind'
  | 'aqi';

export type LayerCategory =
  | 'Base'
  | 'Resilience'
  | 'Thermal'
  | 'Ecology'
  | 'Urban Form'
  | 'Hydrology'
  | 'Atmosphere';

export interface LegendItem {
  label: string;
  color: string;
}

export interface LayerMetadata {
  id: LayerId;
  name: string;
  category: LayerCategory;
  description: string;
  visible: boolean;
  opacity: number;
  status: 'active' | 'ready_phase_2';
  mapLayerIds: string[]; // Corresponding MapLibre GL layer IDs
  sourceId?: string;
  legend?: {
    type: 'categorical' | 'gradient';
    items: LegendItem[];
  };
}

export const DEFAULT_PLATFORM_LAYERS: LayerMetadata[] = [
  {
    id: 'basemap',
    name: 'OpenStreetMap Carto',
    category: 'Base',
    description: 'High-contrast base raster tiles (OpenStreetMap Contributors)',
    visible: true,
    opacity: 1.0,
    status: 'active',
    mapLayerIds: ['osm-tiles-layer'],
    sourceId: 'osm-tiles',
  },
  {
    id: 'chri',
    name: 'Composite Heat Risk Index (CHRI)',
    category: 'Resilience',
    description: 'Deterministic risk choropleth combining physical hazard, exposure, and vulnerability',
    visible: true,
    opacity: 0.65,
    status: 'active',
    mapLayerIds: ['zones-fill', 'zones-border', 'zones-selected-border'],
    sourceId: 'urban-zones',
    legend: {
      type: 'categorical',
      items: [
        { label: 'Extreme / Critical (≥85)', color: '#EF4444' },
        { label: 'High (65–84.9)', color: '#F97316' },
        { label: 'Moderate (40–64.9)', color: '#F59E0B' },
        { label: 'Low (<40)', color: '#3B82F6' },
      ],
    },
  },
  {
    id: 'lst',
    name: 'Land Surface Temp (LST 30m)',
    category: 'Thermal',
    description: 'Landsat 8/9 Collection 2 Level-2 Thermal Infrared (Band 10) surface skin temperature',
    visible: false,
    opacity: 0.75,
    status: 'active',
    mapLayerIds: ['lst-raster-layer'],
    sourceId: 'lst-cog-source',
    legend: {
      type: 'gradient',
      items: [
        { label: '25°C (Marine)', color: '#0284c7' },
        { label: '30°C (Canopy)', color: '#06b6d4' },
        { label: '35°C (Urban)', color: '#eab308' },
        { label: '40°C (Hotspot)', color: '#ea580c' },
        { label: '45°C+ (Critical)', color: '#991b1b' },
      ],
    },
  },
  {
    id: 'ndvi',
    name: 'Vegetation Greenness (NDVI 10m)',
    category: 'Ecology',
    description: 'Copernicus Sentinel-2 multispectral surface photosynthetic biomass and shade density',
    visible: false,
    opacity: 0.70,
    status: 'active',
    mapLayerIds: ['ndvi-raster-layer'],
    sourceId: 'ndvi-cog-source',
    legend: {
      type: 'gradient',
      items: [
        { label: 'Dense Canopy (>0.5)', color: '#15803d' },
        { label: 'Moderate Green (0.3-0.5)', color: '#84cc16' },
        { label: 'Sparse (0.15-0.3)', color: '#eab308' },
        { label: 'Barren/Built (<0.15)', color: '#d97706' },
      ],
    },
  },
  {
    id: 'buildings',
    name: '3D Building Footprints & Heights',
    category: 'Urban Form',
    description: 'Volumetric building footprints with 3D heights and solar shadow casting',
    visible: false,
    opacity: 0.85,
    status: 'active',
    mapLayerIds: ['buildings-3d-extrusion'],
    sourceId: 'overture-buildings-source',
    legend: {
      type: 'gradient',
      items: [
        { label: '<15m (Low-rise)', color: '#64748b' },
        { label: '30m (Mid-rise)', color: '#94a3b8' },
        { label: '60m+ (High-rise)', color: '#f8fafc' },
      ],
    },
  },
  {
    id: 'roads',
    name: 'Street Network & Corridors',
    category: 'Urban Form',
    description: 'OpenStreetMap street hierarchy distinguishing asphalt arterials and pedestrian walkways',
    visible: false,
    opacity: 0.60,
    status: 'ready_phase_2',
    mapLayerIds: ['roads-vector-layer'],
    sourceId: 'osm-roads-source',
  },
  {
    id: 'waterbodies',
    name: 'Surface Water & Evaporative Buffers',
    category: 'Hydrology',
    description: 'Lakes, rivers, and coastal wetlands acting as nocturnal thermal cooling sinks',
    visible: false,
    opacity: 0.80,
    status: 'active',
    mapLayerIds: ['water-vector-layer', 'water-vector-outline'],
    sourceId: 'osm-water-source',
    legend: {
      type: 'categorical',
      items: [
        { label: 'Surface Water Bodies', color: '#0284c7' },
        { label: 'Riparian Buffer', color: '#38bdf8' },
      ],
    },
  },
  {
    id: 'population',
    name: 'Population Exposure (100m H3)',
    category: 'Urban Form',
    description: 'Kontur high-resolution population density grid highlighting human heat exposure',
    visible: false,
    opacity: 0.50,
    status: 'ready_phase_2',
    mapLayerIds: ['population-h3-layer'],
    sourceId: 'population-h3-source',
  },
  {
    id: 'wind',
    name: 'Atmospheric Wind Streamlines',
    category: 'Atmosphere',
    description: 'Live atmospheric wind streamlines and ventilation corridors driven by WeatherAPI telemetry',
    visible: false,
    opacity: 0.75,
    status: 'active',
    mapLayerIds: ['wind-particle-layer'],
    sourceId: 'wind-gfs-source',
    legend: {
      type: 'categorical',
      items: [
        { label: 'Streamline Velocity', color: '#38bdf8' },
      ],
    },
  },
  {
    id: 'aqi',
    name: 'Air Quality Index & PM2.5',
    category: 'Atmosphere',
    description: 'OpenAQ ground station particulate matter compounding heat stress mortality',
    visible: false,
    opacity: 0.65,
    status: 'ready_phase_2',
    mapLayerIds: ['aqi-sensor-layer'],
    sourceId: 'openaq-sensor-source',
  },
];

type LayerChangeListener = (layers: LayerMetadata[]) => void;

export class LayerManager {
  private map: MapLibreMap | null = null;
  private layers: Map<LayerId, LayerMetadata> = new Map();
  private listeners: Set<LayerChangeListener> = new Set();

  constructor(initialLayers: LayerMetadata[] = DEFAULT_PLATFORM_LAYERS) {
    for (const layer of initialLayers) {
      this.layers.set(layer.id, { ...layer });
    }
  }

  /**
   * Attach MapLibre GL map instance to enable real-time canvas synchronization.
   */
  public attachMap(map: MapLibreMap): void {
    this.map = map;
    this.syncAllLayersWithMap();
  }

  /**
   * Detach MapLibre map on unmount.
   */
  public detachMap(): void {
    this.map = null;
  }

  /**
   * Register a new layer or update an existing layer definition.
   */
  public addLayer(
    config: LayerMetadata,
    sourceDef?: { id: string; spec: SourceSpecification },
    layerDefs?: LayerSpecification[]
  ): void {
    this.layers.set(config.id, { ...config });

    if (this.map && this.map.isStyleLoaded()) {
      if (sourceDef && !this.map.getSource(sourceDef.id)) {
        this.map.addSource(sourceDef.id, sourceDef.spec);
      }
      if (layerDefs) {
        for (const layerDef of layerDefs) {
          if (!this.map.getLayer(layerDef.id)) {
            this.map.addLayer(layerDef);
          }
        }
      }
      this.applyLayerToMap(config);
    }

    this.notifyListeners();
  }

  /**
   * Remove a layer from management and unregister associated MapLibre layers.
   */
  public removeLayer(id: LayerId): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    if (this.map && this.map.isStyleLoaded()) {
      for (const mapLayerId of layer.mapLayerIds) {
        if (this.map.getLayer(mapLayerId)) {
          this.map.removeLayer(mapLayerId);
        }
      }
      if (layer.sourceId && this.map.getSource(layer.sourceId)) {
        this.map.removeSource(layer.sourceId);
      }
    }

    this.layers.delete(id);
    this.notifyListeners();
  }

  /**
   * Toggle visibility of a target layer.
   */
  public toggleLayer(id: LayerId, visible?: boolean): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    const newVisibility = visible !== undefined ? visible : !layer.visible;
    layer.visible = newVisibility;

    if (this.map && this.map.isStyleLoaded()) {
      this.applyVisibilityToMap(layer);
    }

    this.notifyListeners();
  }

  /**
   * Update opacity for a target layer.
   */
  public updateOpacity(id: LayerId, opacity: number): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    layer.opacity = clampedOpacity;

    if (this.map && this.map.isStyleLoaded()) {
      this.applyOpacityToMap(layer);
    }

    this.notifyListeners();
  }

  /**
   * Get all managed layers as an array.
   */
  public getLayers(): LayerMetadata[] {
    return Array.from(this.layers.values());
  }

  /**
   * Get a specific layer metadata by ID.
   */
  public getLayer(id: LayerId): LayerMetadata | undefined {
    return this.layers.get(id);
  }

  /**
   * Subscribe to layer state mutations.
   */
  public subscribe(listener: LayerChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getLayers();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private syncAllLayersWithMap(): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    for (const layer of this.layers.values()) {
      this.applyLayerToMap(layer);
    }
  }

  private applyLayerToMap(layer: LayerMetadata): void {
    this.applyVisibilityToMap(layer);
    this.applyOpacityToMap(layer);
  }

  private applyVisibilityToMap(layer: LayerMetadata): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    const visibilityValue = layer.visible ? 'visible' : 'none';
    for (const mapLayerId of layer.mapLayerIds) {
      if (this.map.getLayer(mapLayerId)) {
        this.map.setLayoutProperty(mapLayerId, 'visibility', visibilityValue);
      }
    }
  }

  private applyOpacityToMap(layer: LayerMetadata): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    for (const mapLayerId of layer.mapLayerIds) {
      const mapLayer = this.map.getLayer(mapLayerId);
      if (!mapLayer) continue;

      const layerType = mapLayer.type;
      switch (layerType) {
        case 'raster':
          this.map.setPaintProperty(mapLayerId, 'raster-opacity', layer.opacity);
          break;
        case 'fill':
          this.map.setPaintProperty(mapLayerId, 'fill-opacity', layer.opacity);
          break;
        case 'line':
          this.map.setPaintProperty(mapLayerId, 'line-opacity', layer.opacity);
          break;
        case 'circle':
          this.map.setPaintProperty(mapLayerId, 'circle-opacity', layer.opacity);
          break;
        case 'fill-extrusion':
          this.map.setPaintProperty(mapLayerId, 'fill-extrusion-opacity', layer.opacity);
          break;
        default:
          break;
      }
    }
  }
}

export const layerManager = new LayerManager();
