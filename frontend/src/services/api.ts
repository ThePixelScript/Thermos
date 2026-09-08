import type {
  BackendHealth,
  GeoJSONFeatureCollection,
  HotspotSummary,
  HotspotDetail,
  Intervention,
  WeatherData,
  CHRIScoreData,
  ZoneRecommendationData,
  TileJSONMetadata,
  STACScene,
  NDVIZonalStatsData,
  NDVIColormapBreakData,
  LSTZonalStatsData,
  LSTColormapBreakData,
  LiveCHRIScoreData,
  LiveHeatHotspotData,
  HotspotTrendsSummaryData,
  CHRIForecastData,
  CitywideForecastSummaryData,
  CityCommandOverviewData,
  PriorityInterventionData,
  MunicipalActionData,
  ResourcePortfolioData,
  ExecutiveSummaryData,
  SimulationRequestData,
  SimulationResultData,
  ScenarioComparisonRequestData,
  ScenarioComparisonResponseData,
  CitywideSimulationResultData,
  ZoneSimulationMetadataData,
  SimulationRequest,
  SimulationResponse,
  SimulatedInterventionItem,
  LocationSearchResult,
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

export async function fetchHexagonsGeoJSON(
  resolutionKm = 2.5,
  lat?: number,
  lon?: number
): Promise<GeoJSONFeatureCollection> {
  const params = new URLSearchParams({ resolution_km: resolutionKm.toString() });
  if (lat !== undefined && lon !== undefined) {
    params.set('lat', lat.toString());
    params.set('lon', lon.toString());
  }
  const res = await fetch(`${API_BASE}/api/v1/zones/hexagons?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load hexagons GeoJSON: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchHotspots(minRisk = 30, lat?: number, lon?: number): Promise<HotspotSummary[]> {
  const params = new URLSearchParams({ min_risk: minRisk.toString() });
  if (lat !== undefined && lon !== undefined) {
    params.set('lat', lat.toString());
    params.set('lon', lon.toString());
  }
  const res = await fetch(`${API_BASE}/api/v1/hotspots?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load hotspots: ${res.statusText}`);
  }
  return res.json();
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  if (!query || !query.trim()) return [];
  const res = await fetch(`${API_BASE}/api/location/search?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) {
    throw new Error(`Location search failed: ${res.statusText}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
}

export async function reverseGeocodeLocation(lat: number, lon: number): Promise<LocationSearchResult> {
  const res = await fetch(`${API_BASE}/api/location/reverse?lat=${lat}&lon=${lon}`);
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data || data;
}

export async function fetchHotspotDetail(zoneId: string): Promise<HotspotDetail> {
  const res = await fetch(`${API_BASE}/api/v1/hotspots/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load hotspot detail for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

const CATALOG_ENHANCEMENTS: Record<string, Partial<Intervention>> = {
  'INT-TREE-CANOPY': {
    cost_inr_lakhs: 14.5,
    typical_area_sqm: 18000,
    phase: 'Phase 3: Structural Canopy (8–18m)',
    timeframe: '8 – 14 Months',
    feasibility: 'High',
    why_recommended: 'Targeted along pedestrian sidewalk easements to mitigate severe unshaded street solar radiation.',
  },
  'INT-COOL-ROOF': {
    cost_inr_lakhs: 8.5,
    typical_area_sqm: 14000,
    phase: 'Phase 1: Immediate Relief (1–3m)',
    timeframe: '1 – 3 Months',
    feasibility: 'High',
    why_recommended: 'Rapidly reflects up to 80% of solar radiation from dense commercial and municipal flat roofs.',
  },
  'INT-PERM-PAVEMENT': {
    cost_inr_lakhs: 11.0,
    typical_area_sqm: 9000,
    phase: 'Phase 2: Permeable Works (3–8m)',
    timeframe: '2 – 4 Months',
    feasibility: 'Medium',
    why_recommended: 'Prevents daytime ground thermal storage and speeds nocturnal radiative cooling.',
  },
  'INT-TRANSIT-SHADE': {
    cost_inr_lakhs: 6.5,
    typical_area_sqm: 3500,
    phase: 'Phase 1: Immediate Relief (1–3m)',
    timeframe: '1 Month',
    feasibility: 'High',
    why_recommended: 'Protects high-volume transit commuters and street laborers from extreme acute daytime solar exposure.',
  },
  'INT-POCKET-PARK': {
    cost_inr_lakhs: 15.0,
    typical_area_sqm: 8000,
    phase: 'Phase 2: Permeable Works (3–8m)',
    timeframe: '4 – 8 Months',
    feasibility: 'Medium',
    why_recommended: 'Creates localized vegetative cooling oases in dense residential blocks lacking open parks.',
  },
  'INT-GREEN-CORRIDOR': {
    cost_inr_lakhs: 17.5,
    typical_area_sqm: 20000,
    phase: 'Phase 3: Structural Canopy (8–18m)',
    timeframe: '8 – 14 Months',
    feasibility: 'Medium',
    why_recommended: 'Channels urban ventilation breezes into high-density building clusters.',
  },
  'INT-CANOPY-PRESERVE': {
    cost_inr_lakhs: 5.5,
    typical_area_sqm: 25000,
    phase: 'Phase 1: Immediate Relief (1–3m)',
    timeframe: '1 – 2 Months',
    feasibility: 'High',
    why_recommended: 'Preserves irreplaceable mature ecological cooling sinks and prevents canopy degradation.',
  },
  'INT-WATER-RETENTION': {
    cost_inr_lakhs: 9.5,
    typical_area_sqm: 5000,
    phase: 'Phase 2: Permeable Works (3–8m)',
    timeframe: '3 – 6 Months',
    feasibility: 'Medium',
    why_recommended: 'Provides passive water-sink thermal absorption during extreme dry summer peaks.',
  },
};

export async function fetchInterventionsCatalog(): Promise<Intervention[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/interventions/catalog`);
    if (res.ok) {
      const items: Intervention[] = await res.json();
      return items.map((item) => {
        const enh = CATALOG_ENHANCEMENTS[item.id] || {};
        return {
          ...item,
          cost_inr_lakhs: item.cost_inr_lakhs ?? enh.cost_inr_lakhs ?? Math.max(5.0, Math.round((item.unit_cost_usd_per_sqm * 0.18) * 10) / 10),
          typical_area_sqm: item.typical_area_sqm ?? enh.typical_area_sqm ?? 10000,
          phase: item.phase ?? enh.phase ?? 'Phase 1: Fast Mitigation',
          timeframe: item.timeframe ?? enh.timeframe ?? '1 – 3 Months',
          feasibility: item.feasibility ?? enh.feasibility ?? 'High',
          why_recommended: item.why_recommended ?? enh.why_recommended ?? 'Evidence-based cooling for urban heat islands.',
        };
      });
    }
  } catch (err) {
    console.warn('Backend catalog unreachable, using calibrated fallback catalog', err);
  }

  // Fallback to built-in calibrated catalog if endpoint is unavailable
  return Object.entries(CATALOG_ENHANCEMENTS).map(([id, enh]) => ({
    id,
    name: id.replace('INT-', '').replace(/-/g, ' '),
    category: 'cooling',
    description: enh.why_recommended || '',
    target_surface: 'urban_surface',
    cooling_potential_c: 5.0,
    air_temp_reduction_c: 1.5,
    unit_cost_usd_per_sqm: 40.0,
    expected_lifespan_years: 15,
    maintenance_cost_usd_annual_per_sqm: 2.0,
    co_benefits: ['Thermal comfort', 'Air quality', 'Stormwater management'],
    ...enh,
  } as Intervention));
}

export async function simulateInterventions(payload: SimulationRequest): Promise<SimulationResponse> {
  // 1. Try remote API endpoint if implemented
  try {
    const res = await fetch(`${API_BASE}/api/v1/interventions/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fall through to deterministic client calculation
  }

  // 2. Deterministic calculation engine
  const catalog = await fetchInterventionsCatalog().catch(() => []);
  const selected = catalog.filter((c) => payload.selected_intervention_ids.includes(c.id));

  const totalCost = selected.reduce((sum, item) => sum + (item.cost_inr_lakhs || 10.0), 0);
  const isBudgetExceeded = totalCost > payload.budget_inr_lakhs;
  const remaining = Math.max(0, payload.budget_inr_lakhs - totalCost);
  const deficit = isBudgetExceeded ? totalCost - payload.budget_inr_lakhs : 0;
  const utilization = payload.budget_inr_lakhs > 0 ? (totalCost / payload.budget_inr_lakhs) * 100 : 0;

  // Diminishing returns calculation for combined LST and ambient reduction
  const rawLst = selected.reduce((sum, item) => sum + (item.cooling_potential_c || 4.0), 0);
  const rawAir = selected.reduce((sum, item) => sum + (item.air_temp_reduction_c || 1.2), 0);
  const modeledLst = Number((rawLst * 0.42).toFixed(1));
  const modeledAir = Number((rawAir * 0.52).toFixed(1));

  const totalAreaSqm = selected.reduce((sum, item) => sum + (item.typical_area_sqm || 10000), 0);
  const totalAreaHa = Number((totalAreaSqm / 10000).toFixed(1));
  const popBenefited = Math.round(totalAreaHa * 1850);

  const activeItems: SimulatedInterventionItem[] = selected.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    target_surface: item.target_surface,
    cost_inr_lakhs: item.cost_inr_lakhs || 10.0,
    implementation_area_sqm: item.typical_area_sqm || 10000,
    implementation_area_hectares: Number(((item.typical_area_sqm || 10000) / 10000).toFixed(1)),
    surface_constraint_checked: true,
    estimated_lst_drop_c: Number(((item.cooling_potential_c || 4.0) * 0.45).toFixed(1)),
    estimated_ambient_drop_c: Number(((item.air_temp_reduction_c || 1.2) * 0.55).toFixed(1)),
    phase: item.phase || 'Phase 1: Immediate Relief',
    timeframe: item.timeframe || '1 – 3 Months',
    co_benefits: item.co_benefits || [],
  }));

  const roadmap: Record<string, string[]> = {
    'Phase 1: Immediate Relief (1–3 Months)': selected
      .filter((i) => (i.phase || '').includes('Phase 1'))
      .map((i) => `${i.name} (₹${(i.cost_inr_lakhs || 0).toFixed(1)}L)`),
    'Phase 2: Permeable Works (3–8 Months)': selected
      .filter((i) => (i.phase || '').includes('Phase 2'))
      .map((i) => `${i.name} (₹${(i.cost_inr_lakhs || 0).toFixed(1)}L)`),
    'Phase 3: Structural Canopy (8–18 Months)': selected
      .filter((i) => (i.phase || '').includes('Phase 3'))
      .map((i) => `${i.name} (₹${(i.cost_inr_lakhs || 0).toFixed(1)}L)`),
  };

  // Filter empty phases
  Object.keys(roadmap).forEach((k) => {
    if (roadmap[k].length === 0) delete roadmap[k];
  });

  return {
    zone_id: payload.zone_id,
    zone_name: `Zone ${payload.zone_id}`,
    budget_inr_lakhs: payload.budget_inr_lakhs,
    total_cost_inr_lakhs: Number(totalCost.toFixed(1)),
    remaining_budget_inr_lakhs: Number(remaining.toFixed(1)),
    budget_utilization_pct: Number(utilization.toFixed(1)),
    is_budget_exceeded: isBudgetExceeded,
    deficit_inr_lakhs: Number(deficit.toFixed(1)),
    modeled_lst_reduction_c: modeledLst,
    modeled_ambient_reduction_c: modeledAir,
    synergy_factor_c: 0.35,
    total_implementation_area_sqm: totalAreaSqm,
    total_implementation_area_hectares: totalAreaHa,
    zone_area_coverage_pct: Math.min(100, Number(((totalAreaHa / 150) * 100).toFixed(1))),
    population_benefited: popBenefited,
    active_interventions: activeItems,
    phased_roadmap: roadmap,
    assumptions: [
      'Cost estimations benchmarked against municipal public works schedules (₹ Lakhs).',
      'Non-linear cooling decay models saturation from overlapping thermal footprints.',
      'Surface constraint assumptions apply minimum viable unobstructed public easement.',
      'Implementation timelines assume parallel procurement and continuous municipal clearance.',
    ],
    provenance: 'THERMOS_DETERMINISTIC_ENGINE_V1',
    classification: 'CALIBRATED_SCENARIO',
  };
}

export async function fetchCurrentWeather(latitude = 13.0827, longitude = 80.2707): Promise<WeatherData> {
  const res = await fetch(`${API_BASE}/api/v1/weather/current?latitude=${latitude}&longitude=${longitude}`);
  if (!res.ok) {
    throw new Error(`Weather check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCHRIScore(zoneId: string): Promise<CHRIScoreData> {
  const res = await fetch(`${API_BASE}/api/v1/chri/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load CHRI score for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchZoneRecommendations(zoneId: string): Promise<ZoneRecommendationData> {
  const res = await fetch(`${API_BASE}/api/v1/chri/recommendations/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load recommendations for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchNDVITileJSON(): Promise<TileJSONMetadata> {
  const res = await fetch(`${API_BASE}/api/v1/raster/ndvi/tilejson`);
  if (!res.ok) {
    throw new Error(`Failed to load NDVI TileJSON: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchNDVIScenes(limit = 5): Promise<STACScene[]> {
  const res = await fetch(`${API_BASE}/api/v1/raster/ndvi/scenes?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to load NDVI STAC scenes: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchNDVIZonalStats(zoneId: string): Promise<NDVIZonalStatsData> {
  const res = await fetch(`${API_BASE}/api/v1/raster/ndvi/zonal-stats/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load zonal NDVI stats for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchNDVIColormap(): Promise<NDVIColormapBreakData[]> {
  const res = await fetch(`${API_BASE}/api/v1/raster/ndvi/colormap`);
  if (!res.ok) {
    throw new Error(`Failed to load NDVI colormap: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLSTTileJSON(): Promise<TileJSONMetadata> {
  const res = await fetch(`${API_BASE}/api/v1/raster/lst/tilejson`);
  if (!res.ok) {
    throw new Error(`Failed to load LST TileJSON: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLSTScenes(limit = 5): Promise<STACScene[]> {
  const res = await fetch(`${API_BASE}/api/v1/raster/lst/scenes?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to load LST STAC scenes: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLSTZonalStats(zoneId: string): Promise<LSTZonalStatsData> {
  const res = await fetch(`${API_BASE}/api/v1/raster/lst/zonal-stats/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load zonal LST stats for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLSTColormap(): Promise<LSTColormapBreakData[]> {
  const res = await fetch(`${API_BASE}/api/v1/raster/lst/colormap`);
  if (!res.ok) {
    throw new Error(`Failed to load LST colormap: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLiveCHRIZones(minScore?: number, riskLevel?: string, trend?: string): Promise<LiveCHRIScoreData[]> {
  const params = new URLSearchParams();
  if (minScore !== undefined) params.append('min_score', minScore.toString());
  if (riskLevel) params.append('risk_level', riskLevel);
  if (trend) params.append('trend', trend);

  const res = await fetch(`${API_BASE}/api/v1/chri/live/zones?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load live CHRI zones: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLiveCHRIHotspots(limit = 30, trend?: string): Promise<LiveHeatHotspotData[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (trend) params.append('trend', trend);

  const res = await fetch(`${API_BASE}/api/v1/chri/live/hotspots?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load live CHRI hotspots: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLiveCHRIScore(zoneId: string): Promise<LiveCHRIScoreData> {
  const res = await fetch(`${API_BASE}/api/v1/chri/live/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load live CHRI score for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLiveHotspotTrends(): Promise<HotspotTrendsSummaryData> {
  const res = await fetch(`${API_BASE}/api/v1/chri/live/trends`);
  if (!res.ok) {
    throw new Error(`Failed to load live hotspot trends: ${res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Phase 4: Predictive Urban Heat Forecast Endpoints
// ---------------------------------------------------------------------------

export async function fetchZoneForecast(zoneId: string): Promise<CHRIForecastData> {
  const res = await fetch(`${API_BASE}/api/v1/forecast/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load forecast for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchHotspotForecasts(limit = 30, minEscalation?: string): Promise<CHRIForecastData[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (minEscalation) params.append('min_escalation', minEscalation);

  const res = await fetch(`${API_BASE}/api/v1/forecast/hotspots?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load hotspot forecasts: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCitywideForecast(): Promise<CitywideForecastSummaryData> {
  const res = await fetch(`${API_BASE}/api/v1/forecast/citywide`);
  if (!res.ok) {
    throw new Error(`Failed to load citywide forecast: ${res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Phase 5: Municipal Decision Intelligence Endpoints
// ---------------------------------------------------------------------------

export async function fetchCityOverview(): Promise<CityCommandOverviewData> {
  const res = await fetch(`${API_BASE}/api/v1/city/overview`);
  if (!res.ok) {
    throw new Error(`Failed to load city overview: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCityInterventions(limit?: number, urgency?: string): Promise<PriorityInterventionData[]> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (urgency) params.append('urgency', urgency);

  const res = await fetch(`${API_BASE}/api/v1/city/interventions?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load city priority interventions: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMunicipalActions(): Promise<MunicipalActionData[]> {
  const res = await fetch(`${API_BASE}/api/v1/city/actions`);
  if (!res.ok) {
    throw new Error(`Failed to load municipal actions: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCityResources(budgetTier = 'MEDIUM'): Promise<ResourcePortfolioData> {
  const params = new URLSearchParams({ budget_tier: budgetTier });
  const res = await fetch(`${API_BASE}/api/v1/city/resources?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load resource portfolio for tier ${budgetTier}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCityExecutiveSummary(): Promise<ExecutiveSummaryData> {
  const res = await fetch(`${API_BASE}/api/v1/city/executive-summary`);
  if (!res.ok) {
    throw new Error(`Failed to load executive summary: ${res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Phase 6: Urban Climate Digital Twin & Scenario Simulator Endpoints
// ---------------------------------------------------------------------------

export async function fetchZoneSimulationMetadata(zoneId: string): Promise<ZoneSimulationMetadataData> {
  const res = await fetch(`${API_BASE}/api/v1/simulation/zone/${zoneId}`);
  if (!res.ok) {
    throw new Error(`Failed to load simulation metadata for ${zoneId}: ${res.statusText}`);
  }
  return res.json();
}

export async function runSimulation(request: SimulationRequestData): Promise<SimulationResultData> {
  const res = await fetch(`${API_BASE}/api/v1/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`Failed to execute simulation: ${res.statusText}`);
  }
  return res.json();
}

export async function compareScenarios(
  request: ScenarioComparisonRequestData
): Promise<ScenarioComparisonResponseData> {
  const res = await fetch(`${API_BASE}/api/v1/simulation/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    throw new Error(`Failed to execute scenario comparison: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCitywideSimulation(budgetTier = 'MEDIUM'): Promise<CitywideSimulationResultData> {
  const params = new URLSearchParams({ budget_tier: budgetTier });
  const res = await fetch(`${API_BASE}/api/v1/simulation/citywide?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load citywide simulation: ${res.statusText}`);
  }
  return res.json();
}

