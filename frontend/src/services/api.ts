import type {
  BackendHealth,
  GeoJSONFeatureCollection,
  HotspotSummary,
  HotspotDetail,
  Intervention,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<BackendHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchZonesGeoJSON(): Promise<GeoJSONFeatureCollection> {
  const res = await fetch(`${API_BASE}/api/v1/zones/geojson`);
  if (!res.ok) {
    throw new Error(`Failed to load zones GeoJSON: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchHotspots(minRisk = 30): Promise<HotspotSummary[]> {
  const res = await fetch(`${API_BASE}/api/v1/hotspots?min_risk=${minRisk}`);
  if (!res.ok) {
    throw new Error(`Failed to load hotspots: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchHotspotDetail(zoneId: string): Promise<HotspotDetail> {
  const res = await fetch(`${API_BASE}/api/v1/hotspots/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load hotspot detail for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchInterventionsCatalog(): Promise<Intervention[]> {
  const res = await fetch(`${API_BASE}/api/v1/interventions/catalog`);
  if (!res.ok) {
    throw new Error(`Failed to load interventions catalog: ${res.statusText}`);
  }
  return res.json();
}
