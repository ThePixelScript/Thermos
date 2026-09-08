import { 
  Zone, 
  BackendZoneItem, 
  BackendZoneSummary,
  BackendZone,
  HotspotItem, 
  HotspotDetail, 
  GeoJSONFeature,
  mapBackendRiskToPresentation,
  HeatContributor,
  BackendRiskLevel,
  SimulationResponse,
  PhasedRoadmapStep,
  BackendInterventionItem,
  Intervention,
  DriverContribution
} from '../types';

/**
 * Normalizes string-based land use / typology into human readable labels
 */
export function normalizeLandUse(typology?: string): string {
  if (!typology) return 'Mixed Urban';
  const t = typology.toLowerCase().replace(/_/g, ' ');
  if (t.includes('commercial')) return 'Commercial';
  if (t.includes('industrial')) return 'Industrial';
  if (t.includes('highrise') || t.includes('high-rise')) return 'High-Density Residential';
  if (t.includes('suburban')) return 'Suburban Residential';
  if (t.includes('historic')) return 'Historic Quarter';
  if (t.includes('informal')) return 'Informal Settlement';
  if (t.includes('transit')) return 'Transit Hub';
  if (t.includes('park') || t.includes('riparian')) return 'Park & Riparian Sink';
  if (t.includes('campus') || t.includes('institutional')) return 'Institutional Campus';
  if (t.includes('mixed')) return 'Mixed Urban';
  if (t.includes('satellite')) return 'Satellite Grid';
  return typology;
}

/**
 * Converts float [0.0, 1.0] or string to user-facing building density tier
 */
export function formatBuildingDensity(density?: number | string | null): string {
  if (density === undefined || density === null) return 'High';
  if (typeof density === 'string') return density;
  if (density >= 0.75) return 'Very High';
  if (density >= 0.55) return 'High';
  if (density >= 0.30) return 'Medium';
  return 'Low';
}

/**
 * Normalizes vegetation or imperviousness to a 0-100 percentage
 */
export function normalizeToPercentage(val?: number | null, defaultPct = 20): number {
  if (val === undefined || val === null) return defaultPct;
  // If stored as a unit fraction [0.0, 1.0], scale to 0-100
  if (val <= 1.0 && val >= 0.0) {
    return Math.round(val * 100);
  }
  return Math.round(val);
}

/**
 * Maps coordinate pairs or zone numbers to SVG 0-100 canvas coordinates
 * so map markers render accurately.
 */
export function deriveSvgCoordinates(
  zoneId: string, 
  coords?: { x?: number; y?: number; lat?: number; lng?: number }
): { x: number; y: number; lat: number; lng: number } {
  if (coords?.x !== undefined && coords?.y !== undefined) {
    return {
      x: coords.x,
      y: coords.y,
      lat: coords.lat || 28.6139,
      lng: coords.lng || 77.2090
    };
  }

  // Pre-calibrated spatial distribution for standard ZONE-01 .. ZONE-10 in Delhi grid
  const standardZonePositions: Record<string, { x: number; y: number; lat: number; lng: number }> = {
    'ZONE-01': { x: 52, y: 38, lat: 28.6315, lng: 77.2167 }, // Downtown Financial District
    'ZONE-02': { x: 78, y: 30, lat: 28.6300, lng: 77.2375 }, // Riverfront Park & Wetlands (East, Yamuna)
    'ZONE-03': { x: 28, y: 22, lat: 28.6600, lng: 77.1950 }, // Industrial Freight Corridor (North-West)
    'ZONE-04': { x: 60, y: 25, lat: 28.6575, lng: 77.2275 }, // Old City Market (North Central)
    'ZONE-05': { x: 38, y: 48, lat: 28.6325, lng: 77.2025 }, // University Campus (Central-West)
    'ZONE-06': { x: 55, y: 62, lat: 28.6125, lng: 77.2250 }, // High-Rise Residential (South Central)
    'ZONE-07': { x: 54, y: 30, lat: 28.6525, lng: 77.2175 }, // Central Railway Terminal
    'ZONE-08': { x: 22, y: 50, lat: 28.6300, lng: 77.1850 }, // Greenbelt Suburban (Far West)
    'ZONE-09': { x: 35, y: 70, lat: 28.6090, lng: 77.2000 }, // Biotech District (South-West)
    'ZONE-10': { x: 68, y: 18, lat: 28.6725, lng: 77.2325 }, // Ashray Nagar Settlement (North-East)

    // Legacy mock ID fallbacks for graceful resilience
    'ZONE-17': { x: 48, y: 38, lat: 28.6139, lng: 77.2090 },
    'ZONE-21': { x: 74, y: 64, lat: 28.5910, lng: 77.2450 },
    'ZONE-25': { x: 62, y: 24, lat: 28.6510, lng: 77.2300 },
    'ZONE-12': { x: 50, y: 52, lat: 28.6100, lng: 77.2050 },
    'ZONE-15': { x: 74, y: 28, lat: 28.6410, lng: 77.2510 },
  };

  const cleanId = (zoneId || '').toUpperCase().trim();
  if (standardZonePositions[cleanId]) {
    return standardZonePositions[cleanId];
  }

  // Fallback hash positioning inside valid bounds (18-82)
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = (hash << 5) - hash + cleanId.charCodeAt(i);
    hash |= 0;
  }
  const x = 20 + Math.abs(hash % 60);
  const y = 20 + Math.abs((hash >> 3) % 60);

  return {
    x,
    y,
    lat: coords?.lat || 28.6139,
    lng: coords?.lng || 77.2090
  };
}

/**
 * Generates diurnal hourly curves based on actual zone peak and current temperature
 */
export function deriveHourlyTemps(currentTemp: number, peakTemp: number, baseline: number) {
  const hours = ['00:00', '04:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
  const baseMultipliers = [0.80, 0.76, 0.90, 0.98, 1.03, 0.99, 0.91, 0.84];

  return hours.map((hour, idx) => {
    const mult = baseMultipliers[idx];
    const temp = Number((currentTemp * mult).toFixed(1));
    const base = Number((baseline * mult).toFixed(1));
    return { hour, temp, baseline: base };
  });
}

/**
 * Converts a BackendZoneItem or BackendZoneSummary or full BackendZone into a UI Zone.
 * Uses `id` as primary identifier and converts numeric 0-1 unit fractions to percentages.
 */
export function adaptBackendZoneToFrontend(
  item: BackendZoneItem | BackendZoneSummary | BackendZone | any, 
  geoJson?: GeoJSONFeature
): Zone {
  // 1. Resolve Zone ID (prefer backend `id` over legacy `zone_id`)
  const zoneId = item.id || item.zone_id || geoJson?.properties?.id || geoJson?.properties?.zone_id || 'ZONE-01';
  const name = item.name || item.zone_name || geoJson?.properties?.name || geoJson?.properties?.zone_name || `Zone ${zoneId}`;

  // 2. Resolve Thermal Metrics (support nested thermal_observation or flat summary)
  const thermalObs = item.thermal_observation;
  const temp = item.land_surface_temp_c ?? item.temperature ?? thermalObs?.land_surface_temp_c ?? 38.5;
  const baseline = thermalObs?.baseline_temp_c ?? item.baseline_temp_c ?? 31.5;
  const diff = item.thermal_anomaly_c ?? thermalObs?.thermal_anomaly_c ?? Number((temp - baseline).toFixed(1));
  const peak = Number((temp + 1.8).toFixed(1));

  // 3. Resolve Risk Level (server authoritative)
  const rawRiskLevel = item.risk_level || (item.risk_score ? (item.risk_score >= 85 ? 'CRITICAL' : item.risk_score >= 70 ? 'SEVERE' : item.risk_score >= 50 ? 'HIGH' : item.risk_score >= 30 ? 'MODERATE' : 'LOW') : 'MODERATE');
  const riskLevel = (typeof rawRiskLevel === 'string' ? rawRiskLevel.toUpperCase() : 'MODERATE') as BackendRiskLevel;

  // 4. Resolve Demographics (support nested demographics or flat summary)
  const demo = item.demographics;
  const population = item.total_population ?? item.population ?? demo?.total_population ?? 25000;
  const vulnRatio = demo?.vulnerable_ratio ?? 0.25;
  const vulnerable = item.vulnerable_population ?? Math.round(population * vulnRatio);
  const outdoorWorkers = demo?.outdoor_worker_density_per_sqkm !== undefined && (item.area_sqkm || 2.5)
    ? Math.round(demo.outdoor_worker_density_per_sqkm * (item.area_sqkm || 2.5))
    : Math.round(population * 0.18);

  // 5. Biophysical Indicators: normalize 0-1 unit fractions to percentages (0-100)
  const lc = item.land_cover;
  const rawVeg = item.vegetation ?? item.vegetation_pct ?? (lc ? lc.tree_canopy_fraction + lc.vegetation_grass_fraction : undefined);
  const vegetation = normalizeToPercentage(rawVeg, 18);

  const rawImp = item.imperviousness ?? item.impervious_surface_fraction ?? item.impervious_pct ?? item.impervious_surface ?? lc?.impervious_surface_fraction;
  const impervious = normalizeToPercentage(rawImp, 72);

  const rawBuildingDensity = item.building_density ?? lc?.building_density;
  const buildingDensity = formatBuildingDensity(rawBuildingDensity);

  const typology = item.typology || item.land_use || 'commercial_dense';
  const area = item.area_sqkm ?? item.area_km2 ?? 2.5;

  const causes: HeatContributor[] = [
    {
      name: 'Impervious Surface Absorption',
      percentage: Math.min(80, Math.max(20, Math.round(impervious * 0.65))),
      color: '#ef4444',
      description: `${impervious}% low-albedo asphalt and dense concrete surfaces`
    },
    {
      name: 'Vegetation Canopy Deficit',
      percentage: Math.max(10, Math.round((100 - vegetation) * 0.35)),
      color: '#f97316',
      description: `Only ${vegetation}% protective tree shade coverage`
    }
  ];

  return {
    id: zoneId,
    code: zoneId,
    name,
    shortName: `${zoneId} — ${name}`,
    district: item.district || `${normalizeLandUse(typology)} District`,
    temperature: temp,
    baselineTemp: baseline,
    peakTemp: peak,
    diffFromSurround: diff,
    risk: mapBackendRiskToPresentation(riskLevel),
    backendRiskLevel: riskLevel,
    riskScore: item.risk_score ?? 0,
    vegetation,
    imperviousSurface: impervious,
    buildingDensity,
    populationDensity: item.population_density ? String(item.population_density) : 'High',
    population,
    populationVulnerable: vulnerable,
    elderlyPercent: Math.round((vulnerable / (population || 1)) * 50) || 16,
    outdoorWorkers,
    hvi: Number(((item.risk_score ?? 50) / 10).toFixed(1)),
    primaryCause: `${impervious}% impervious coverage with low canopy`,
    landUse: normalizeLandUse(typology),
    causes,
    recommendedInterventionIds: ['INT-COOL-ROOF', 'INT-TREE-CANOPY', 'INT-PERM-PAVEMENT'],
    coordinates: deriveSvgCoordinates(zoneId, item.coordinates),
    areaKm2: area,
    hourlyTemps: deriveHourlyTemps(temp, peak, baseline)
  };
}

/**
 * Bulk converts BackendZoneItem or ZoneSummary list with optional GeoJSON feature collection
 */
export function adaptBackendZonesToFrontend(
  items: (BackendZoneItem | BackendZoneSummary)[], 
  geoCol?: any
): Zone[] {
  const featureMap = new Map<string, any>();
  if (geoCol?.features && Array.isArray(geoCol.features)) {
    for (const f of geoCol.features) {
      const id = f.properties?.id || f.properties?.zone_id || f.id;
      if (id) featureMap.set(String(id).toUpperCase().trim(), f);
    }
  }
  return items.map(item => {
    const key = String(item.id || (item as any).zone_id || '').toUpperCase().trim();
    return adaptBackendZoneToFrontend(item, featureMap.get(key));
  });
}

/**
 * Converts a HotspotItem (from GET /api/v1/hotspots) into a UI Zone
 */
export function adaptHotspotItemToZone(hotspot: HotspotItem): Zone {
  const zoneId = hotspot.zone_id;
  const temp = hotspot.land_surface_temp_c ?? hotspot.temperature ?? 38.5;
  const diff = hotspot.thermal_anomaly_c ?? 5.0;
  const baseline = Number((temp - diff).toFixed(1));
  const peak = Number((temp + 1.8).toFixed(1));
  const riskLevel = hotspot.risk_level || 'HIGH';
  const population = hotspot.total_population ?? 25000;
  const vulnerable = hotspot.vulnerable_population ?? Math.round(population * 0.25);
  const vegetation = normalizeToPercentage(hotspot.vegetation, 15);
  const impervious = normalizeToPercentage(hotspot.imperviousness, 75);

  const causes: HeatContributor[] = [
    {
      name: hotspot.dominant_driver || 'Impervious Surface Heat Storage',
      percentage: Math.round(hotspot.dominant_driver_pct || 55),
      color: '#ef4444',
      description: `Dominant biophysical driver for ${zoneId}`
    },
    {
      name: 'Canopy Deficit',
      percentage: Math.max(15, 100 - Math.round(hotspot.dominant_driver_pct || 55)),
      color: '#f97316',
      description: 'Lack of mature shade and evapotranspiration sink'
    }
  ];

  return {
    id: zoneId,
    code: zoneId,
    name: hotspot.zone_name,
    shortName: `${zoneId} — ${hotspot.zone_name}`,
    district: `${normalizeLandUse(hotspot.typology)} Corridor`,
    temperature: temp,
    baselineTemp: baseline,
    peakTemp: peak,
    diffFromSurround: diff,
    risk: mapBackendRiskToPresentation(riskLevel),
    backendRiskLevel: riskLevel,
    riskScore: hotspot.risk_score,
    vegetation,
    imperviousSurface: impervious,
    buildingDensity: formatBuildingDensity(hotspot.building_density),
    populationDensity: 'High',
    population,
    populationVulnerable: vulnerable,
    elderlyPercent: Math.round((vulnerable / (population || 1)) * 60) || 18,
    outdoorWorkers: Math.round(population * 0.2),
    hvi: Number((hotspot.risk_score / 10).toFixed(1)),
    primaryCause: hotspot.dominant_driver || 'Dense built-up thermal retention',
    landUse: normalizeLandUse(hotspot.typology),
    causes,
    recommendedInterventionIds: ['INT-TREE-CANOPY', 'INT-COOL-ROOF', 'INT-PERM-PAVEMENT'],
    coordinates: deriveSvgCoordinates(zoneId),
    areaKm2: hotspot.area_sqkm || 2.5,
    hourlyTemps: deriveHourlyTemps(temp, peak, baseline)
  };
}

/**
 * Enriches an existing Zone with full diagnostic data from GET /api/v1/hotspots/{zone_id}.
 * Correctly parses nested backend Zone and DriverContribution fields.
 */
export function enrichZoneWithHotspotDetail(existing: Zone, detail: HotspotDetail): Zone {
  const z: any = detail.zone;
  const ra = detail.risk_assessment;
  const scoreDetails = ra?.risk_score;
  const riskLevel = (scoreDetails?.risk_level || z?.risk_level || existing.backendRiskLevel || 'MODERATE') as BackendRiskLevel;

  // 1. Map driver contributions using authoritative backend field names
  let causes: HeatContributor[] = [];
  if (scoreDetails?.driver_contributions && Array.isArray(scoreDetails.driver_contributions)) {
    causes = scoreDetails.driver_contributions.map((d: DriverContribution, i: number) => {
      const name = d.name || d.driver || d.driver_key || `Thermal Driver ${i + 1}`;
      const percentage = d.contribution_pct ?? d.percentage ?? 25;
      const description = d.explanation || d.description || `Attributed biophysical heat driver`;
      const color = d.color || (i === 0 ? '#ef4444' : i === 1 ? '#f97316' : i === 2 ? '#eab308' : '#3b82f6');
      return {
        name,
        percentage: Math.round(percentage),
        color,
        description
      };
    });
  }

  if (causes.length === 0) {
    causes = existing.causes;
  }

  // 2. Extract recommended intervention IDs
  const recommendedIds = detail.recommended_interventions
    ? detail.recommended_interventions.map((int: any) => int.intervention_id || int.id || '')
    : existing.recommendedInterventionIds;

  // 3. Extract thermal observations (support both nested and flat schemas)
  const thermal = z?.thermal_observation;
  const landTemp = thermal?.land_surface_temp_c ?? z?.land_surface_temp_c ?? z?.temperature ?? existing.temperature;
  const anomaly = thermal?.thermal_anomaly_c ?? z?.thermal_anomaly_c ?? existing.diffFromSurround;
  const baseline = thermal?.baseline_temp_c ?? z?.baseline_temp_c ?? existing.baselineTemp;
  const peak = Number((landTemp + 1.8).toFixed(1));

  // 4. Extract land cover & scale 0-1 unit fractions to percentages
  const lc = z?.land_cover;
  const rawVeg = z?.vegetation ?? z?.vegetation_pct ?? (lc ? lc.tree_canopy_fraction + lc.vegetation_grass_fraction : undefined);
  const vegetation = normalizeToPercentage(rawVeg, existing.vegetation);

  const rawImp = z?.imperviousness ?? z?.impervious_surface_fraction ?? z?.impervious_pct ?? lc?.impervious_surface_fraction;
  const impervious = normalizeToPercentage(rawImp, existing.imperviousSurface);

  // 5. Extract demographics
  const demo = z?.demographics;
  const pop = demo?.total_population ?? z?.total_population ?? existing.population;
  const vuln = z?.vulnerable_population ?? (demo ? Math.round(pop * demo.vulnerable_ratio) : existing.populationVulnerable);
  const workers = demo?.outdoor_worker_density_per_sqkm !== undefined && (z?.area_sqkm || existing.areaKm2)
    ? Math.round(demo.outdoor_worker_density_per_sqkm * (z?.area_sqkm || existing.areaKm2))
    : existing.outdoorWorkers;

  const rawDensity = z?.building_density ?? lc?.building_density;
  const buildingDensity = formatBuildingDensity(rawDensity);

  return {
    ...existing,
    temperature: landTemp,
    diffFromSurround: anomaly,
    baselineTemp: baseline,
    peakTemp: peak,
    risk: mapBackendRiskToPresentation(riskLevel),
    backendRiskLevel: riskLevel,
    riskScore: scoreDetails?.score ?? z?.risk_score ?? existing.riskScore,
    vegetation,
    imperviousSurface: impervious,
    buildingDensity,
    population: pop,
    populationVulnerable: vuln,
    elderlyPercent: demo ? Math.round(demo.vulnerable_ratio * 100) : existing.elderlyPercent,
    outdoorWorkers: workers,
    hvi: Number(((scoreDetails?.score || existing.riskScore) / 10).toFixed(1)),
    landUse: normalizeLandUse(z?.typology || z?.land_use || existing.landUse),
    causes,
    recommendedInterventionIds: recommendedIds.filter(Boolean),
    hourlyTemps: z?.hourly_temps || existing.hourlyTemps
  };
}

/**
 * Adapts authoritative SimulationResponse with computed compatibility fields for existing UI.
 */
export function adaptSimulationResponse(
  res: SimulationResponse,
  zone?: { temperature?: number; population?: number }
): SimulationResponse {
  const baseTemp = zone?.temperature ?? 38.5;
  const projectedTemp = Number((baseTemp - res.modeled_lst_reduction_c).toFixed(1));
  const basePop = zone?.population ?? Math.round(res.population_benefited * 1.3);

  return {
    ...res,
    baseline: {
      lst_c: baseTemp,
      ambient_temp_c: undefined,
      population_exposed: basePop
    },
    projected: {
      lst_c: projectedTemp,
      ambient_temp_c: undefined,
      population_exposed: basePop
    },
    delta: {
      lst_reduction_c: res.modeled_lst_reduction_c,
      ambient_reduction_c: res.modeled_ambient_reduction_c,
      population_protected: res.population_benefited
    },
    cost_summary: {
      total_cost_lakhs: res.total_cost_inr_lakhs,
      budget_allocated_lakhs: res.budget_inr_lakhs,
      budget_utilized_pct: res.budget_utilization_pct,
      budget_remaining_lakhs: res.remaining_budget_inr_lakhs,
      is_within_budget: !res.is_budget_exceeded
    },
    interventions_applied: res.active_interventions.map((item) => ({
      id: item.id,
      name: item.name,
      cost_lakhs: item.cost_inr_lakhs,
      lst_reduction_c: item.estimated_lst_drop_c,
      implementation_area_km2: Number((item.implementation_area_sqm / 1_000_000).toFixed(2)),
      population_benefited: Math.round(res.population_benefited / (res.active_interventions.length || 1))
    })),
    synergy_effects: res.synergy_factor_c > 0 ? [`+${res.synergy_factor_c}°C coupled microclimate bonus`] : []
  };
}

/**
 * Converts a BackendInterventionItem (from catalog) into a UI Intervention
 */
export function adaptBackendInterventionToFrontend(item: BackendInterventionItem): Intervention {
  const costLakhs = item.cost_inr_lakhs ?? 10.0;
  const cooling = item.cooling_potential_c ?? 1.5;
  const id = item.id || item.intervention_id || 'INT-COOL';
  const name = item.name || item.intervention_name || 'Cooling Intervention';

  return {
    id,
    name,
    category: item.category,
    description: item.description || item.rationale || '',
    whyRecommended: item.why_recommended || item.rationale || 'Targeted urban microclimate cooling.',
    costLakhs,
    costRange: `₹${(costLakhs * 0.9).toFixed(1)}L – ₹${(costLakhs * 1.15).toFixed(1)}L`,
    coolingImpact: cooling,
    coolingImpactLabel: `-${cooling.toFixed(1)}°C (modeled LST)`,
    feasibility: (item.feasibility as any) || 'High',
    priority: item.phase?.includes('Phase 1') ? 'Urgent' : (item.phase?.includes('Phase 2') ? 'High' : 'Medium'),
    populationBenefit: item.population_benefit ?? 0,
    implementationAreaKm2: item.typical_area_sqm ? Number((item.typical_area_sqm / 1_000_000).toFixed(2)) : 0.5,
    timeToImpact: item.timeframe || '3 – 6 Months',
    coBenefits: item.co_benefits || ['Thermal relief']
  };
}

/**
 * Derives accurate citywide aggregate statistics using real backend zones and hotspots
 */
export function deriveCityMetricsFromBackend(zones: Zone[], hotspots?: HotspotItem[]) {
  const total = zones.length || 1;
  const avgTemp = Number((zones.reduce((sum, z) => sum + z.temperature, 0) / total).toFixed(1));
  const baselineTemp = 31.5; // Matches backend default_baseline_temp_c

  // Real backend risk counts
  const criticalCount = zones.filter(z => z.backendRiskLevel === 'CRITICAL').length;
  const severeCount = zones.filter(z => z.backendRiskLevel === 'SEVERE').length;
  const highCount = zones.filter(z => z.backendRiskLevel === 'HIGH').length;
  const moderateCount = zones.filter(z => z.backendRiskLevel === 'MODERATE').length;
  const lowCount = zones.filter(z => z.backendRiskLevel === 'LOW').length;

  const activeHotspotsCount = hotspots?.length ?? zones.filter(z => 
    z.backendRiskLevel === 'CRITICAL' || z.backendRiskLevel === 'SEVERE' || z.backendRiskLevel === 'HIGH'
  ).length;

  const totalPopulationAtRisk = zones
    .filter(z => z.backendRiskLevel === 'CRITICAL' || z.backendRiskLevel === 'SEVERE' || z.backendRiskLevel === 'HIGH')
    .reduce((sum, z) => sum + (z.populationVulnerable || z.population), 0);

  const totalSurveyedPopulation = zones.reduce((sum, z) => sum + z.population, 0);
  const totalArea = Number(zones.reduce((sum, z) => sum + z.areaKm2, 0).toFixed(1));

  return {
    totalZonesSurveyed: total,
    averageSurfaceTemp: avgTemp,
    baselineTemp,
    tempDiffVsBaseline: Number((avgTemp - baselineTemp).toFixed(1)),
    activeHotspotsCount,
    criticalZonesCount: criticalCount,
    severeZonesCount: severeCount,
    extremeZonesCount: criticalCount + severeCount,
    highZonesCount: highCount,
    moderateZonesCount: moderateCount,
    lowZonesCount: lowCount,
    totalPopulationAtRisk,
    totalSurveyedPopulation,
    totalSurveyedAreaKm2: totalArea || 25.1,
    lastUpdated: 'Live Telemetry via FastAPI Backend'
  };
}
