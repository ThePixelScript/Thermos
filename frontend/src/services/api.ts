import type {
  BackendHealth,
  GeoJSONFeatureCollection,
  HotspotSummary,
  HotspotDetail,
  Intervention,
  SimulationRequest,
  SimulationResponse,
} from '../types';
import {
  FALLBACK_HEALTH,
  FALLBACK_GEOJSON,
  FALLBACK_HOTSPOTS,
  FALLBACK_HOTSPOT_DETAILS,
  FALLBACK_CATALOG,
} from './fallbackData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<{ data: BackendHealth; isFallback: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const json = await res.json();
      return { data: json, isFallback: false };
    }
  } catch {
    // Backend offline or unreachable
  }
  return { data: FALLBACK_HEALTH, isFallback: true };
}

export async function fetchZonesGeoJSON(): Promise<GeoJSONFeatureCollection> {
  try {
    const res = await fetch(`${API_BASE}/api/zones/geojson`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
    const resV1 = await fetch(`${API_BASE}/api/v1/zones/geojson`, { signal: AbortSignal.timeout(3000) });
    if (resV1.ok) return await resV1.json();
  } catch {
    // Fallback
  }
  return FALLBACK_GEOJSON;
}

export async function fetchHotspots(minRisk = 30): Promise<HotspotSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/hotspots?min_risk=${minRisk}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
    const resV1 = await fetch(`${API_BASE}/api/v1/hotspots?min_risk=${minRisk}`, { signal: AbortSignal.timeout(3000) });
    if (resV1.ok) return await resV1.json();
  } catch {
    // Fallback
  }
  return FALLBACK_HOTSPOTS.filter((h) => h.risk_score >= minRisk);
}

export async function fetchHotspotDetail(zoneId: string): Promise<HotspotDetail> {
  try {
    const res = await fetch(`${API_BASE}/api/hotspots/${zoneId}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
    const resV1 = await fetch(`${API_BASE}/api/v1/hotspots/${zoneId}`, { signal: AbortSignal.timeout(3000) });
    if (resV1.ok) return await resV1.json();
  } catch {
    // Fallback
  }
  if (FALLBACK_HOTSPOT_DETAILS[zoneId]) {
    return FALLBACK_HOTSPOT_DETAILS[zoneId];
  }
  throw new Error(`Detail for zone ${zoneId} not found`);
}

export async function fetchInterventionsCatalog(): Promise<Intervention[]> {
  try {
    const res = await fetch(`${API_BASE}/api/interventions/catalog`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
    const resV1 = await fetch(`${API_BASE}/api/v1/interventions/catalog`, { signal: AbortSignal.timeout(3000) });
    if (resV1.ok) return await resV1.json();
  } catch {
    // Fallback
  }
  return FALLBACK_CATALOG;
}

export async function simulateInterventions(payload: SimulationRequest): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/api/interventions/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Simulation request failed' }));
    throw new Error(errData.detail || `Server error ${res.status}`);
  }

  return await res.json();
}

