import { 
  BackendHealthResponse, 
  BackendZoneItem, 
  BackendZoneSummary,
  BackendZone,
  ZoneGeoJSONCollection, 
  HotspotItem, 
  HotspotDetail, 
  BackendInterventionItem, 
  SimulationRequest, 
  SimulationResponse,
  RealDataMetadata
} from '../types';
import { adaptSimulationResponse } from './zoneAdapter';

/**
 * Root URL for the FastAPI backend.
 * Configured via VITE_API_URL (defaults to http://localhost:8000).
 * Does NOT include /api/v1 suffix.
 */
const BASE_URL = (((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiServiceError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiServiceError(
        `API request failed: ${response.status} ${response.statusText} at ${endpoint}`,
        response.status,
        errorData
      );
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error instanceof ApiServiceError) {
      throw error;
    }
    // Network errors (e.g. Failed to fetch, CORS, connection refused)
    throw new ApiServiceError(
      `Unable to connect to HeatScape backend at ${BASE_URL}. Ensure the service is running on port 8000.`,
      0,
      error
    );
  }
}

export const HeatScapeApi = {
  /**
   * Health check endpoint
   * GET /health
   */
  async getHealth(): Promise<BackendHealthResponse> {
    return request<BackendHealthResponse>('/health');
  },

  /**
   * Zone list
   * GET /api/v1/zones
   */
  async getZones(): Promise<BackendZoneItem[]> {
    return request<BackendZoneItem[]>('/api/v1/zones');
  },

  /**
   * GeoJSON spatial layers for heat map
   * GET /api/v1/zones/geojson
   */
  async getZonesGeoJson(): Promise<ZoneGeoJSONCollection> {
    return request<ZoneGeoJSONCollection>('/api/v1/zones/geojson');
  },

  /**
   * Specific zone details
   * GET /api/v1/zones/{zone_id}
   */
  async getZoneById(zoneId: string): Promise<BackendZone | BackendZoneItem> {
    return request<BackendZone | BackendZoneItem>(`/api/v1/zones/${encodeURIComponent(zoneId)}`);
  },

  /**
   * Ranked municipal hotspot list
   * GET /api/v1/hotspots
   */
  async getHotspots(params?: { minRisk?: number; minAnomaly?: number }): Promise<HotspotItem[]> {
    const query = new URLSearchParams();
    if (params?.minRisk !== undefined) query.set('min_risk', String(params.minRisk));
    if (params?.minAnomaly !== undefined) query.set('min_anomaly', String(params.minAnomaly));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<HotspotItem[]>(`/api/v1/hotspots${qs}`);
  },

  /**
   * Comprehensive hotspot diagnostic details
   * GET /api/v1/hotspots/{zone_id}
   */
  async getHotspotDetail(zoneId: string): Promise<HotspotDetail> {
    return request<HotspotDetail>(`/api/v1/hotspots/${encodeURIComponent(zoneId)}`);
  },

  /**
   * Interventions catalog
   * GET /api/v1/interventions/catalog
   */
  async getInterventionsCatalog(): Promise<BackendInterventionItem[]> {
    return request<BackendInterventionItem[]>('/api/v1/interventions/catalog');
  },

  /**
   * Specific intervention catalog item
   * GET /api/v1/interventions/catalog/{intervention_id}
   */
  async getInterventionById(interventionId: string): Promise<BackendInterventionItem> {
    return request<BackendInterventionItem>(`/api/v1/interventions/catalog/${encodeURIComponent(interventionId)}`);
  },

  /**
   * Zone-specific recommended interventions
   * GET /api/v1/interventions/recommendations/{zone_id}
   */
  async getInterventionRecommendations(zoneId: string): Promise<BackendInterventionItem[]> {
    return request<BackendInterventionItem[]>(`/api/v1/interventions/recommendations/${encodeURIComponent(zoneId)}`);
  },

  /**
   * Execute intervention portfolio simulation
   * POST /api/v1/interventions/simulate
   */
  async simulateInterventions(payload: SimulationRequest): Promise<SimulationResponse> {
    const cleanPayload = {
      zone_id: payload.zone_id,
      selected_intervention_ids: payload.selected_intervention_ids || payload.intervention_ids || [],
      budget_inr_lakhs: payload.budget_inr_lakhs ?? payload.budget_lakhs ?? 30.0
    };

    const raw = await request<SimulationResponse>('/api/v1/interventions/simulate', {
      method: 'POST',
      body: JSON.stringify(cleanPayload)
    });

    return adaptSimulationResponse(raw);
  },

  /**
   * Real satellite metadata & acquisition details
   * GET /api/v1/real-data/metadata
   */
  async getRealDataMetadata(): Promise<RealDataMetadata> {
    return request<RealDataMetadata>('/api/v1/real-data/metadata');
  }
};

export default HeatScapeApi;
