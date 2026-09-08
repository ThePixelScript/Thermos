export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export type BackendRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'CRITICAL';

export type NavigationTab = 'dashboard' | 'heatmap' | 'hotspots' | 'analysis' | 'interventions' | 'reports';

export const getRiskFromTemp = (temp: number): RiskLevel => {
  if (temp >= 41) return 'extreme';
  if (temp >= 38) return 'high';
  if (temp >= 34) return 'moderate';
  return 'low';
};

/**
 * Maps a backend risk level (LOW, MODERATE, HIGH, SEVERE, CRITICAL)
 * to the presentation RiskLevel for styling colors while preserving the backend data.
 */
export const mapBackendRiskToPresentation = (risk: BackendRiskLevel | string): RiskLevel => {
  const r = (risk || '').toUpperCase();
  if (r === 'CRITICAL' || r === 'SEVERE') return 'extreme';
  if (r === 'HIGH') return 'high';
  if (r === 'MODERATE') return 'moderate';
  return 'low';
};

/**
 * Returns a human-friendly label for display while keeping CRITICAL/SEVERE distinction.
 */
export const getBackendRiskDisplayLabel = (risk: BackendRiskLevel | string): string => {
  const r = (risk || '').toUpperCase();
  if (r === 'CRITICAL') return 'Critical Risk';
  if (r === 'SEVERE') return 'Severe Risk';
  if (r === 'HIGH') return 'High Risk';
  if (r === 'MODERATE') return 'Moderate Risk';
  if (r === 'LOW') return 'Low Risk';
  return risk || 'Unknown';
};

export interface HeatContributor {
  name: string;
  percentage: number;
  color?: string;
  description?: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  shortName: string;
  district: string;
  temperature: number;
  baselineTemp: number;
  peakTemp: number;
  diffFromSurround: number;
  risk: RiskLevel;
  backendRiskLevel?: BackendRiskLevel;
  riskScore: number;
  vegetation: number; // percentage e.g. 12
  imperviousSurface: number; // percentage e.g. 68
  buildingDensity: 'Low' | 'Medium' | 'High' | 'Very High' | string;
  populationDensity: 'Low' | 'Medium' | 'High' | 'Very High' | string;
  population: number;
  populationVulnerable: number;
  elderlyPercent: number;
  outdoorWorkers: number;
  hvi: number; // Heat Vulnerability Index (1-10)
  primaryCause: string;
  landUse: 'Commercial' | 'Industrial' | 'High-Density Residential' | 'Transit Hub' | 'Mixed Urban' | 'Institutional' | string;
  causes: HeatContributor[];
  recommendedInterventionIds: string[];
  coordinates: {
    x: number; // 0-100 relative SVG coordinate
    y: number; // 0-100 relative SVG coordinate
    lat: number;
    lng: number;
  };
  areaKm2: number;
  hourlyTemps: { hour: string; temp: number; baseline: number }[];
}

// ----------------------------------------------------
// BACKEND API CONTRACT SCHEMAS (Pydantic-Mirrored)
// ----------------------------------------------------

export interface BackendHealthResponse {
  status: string;
  version?: string;
  engine?: string;
}

export interface RealDataMetadata {
  scene_id: string;
  satellite: string;
  sensor: string;
  acquisition_date?: string | null;
  crs: string;
  grid_resolution_m: number;
  aoi_bbox: number[];
  total_cells: number;
  valid_cells: number;
  baseline_temp_c: number;
  mean_lst_c: number;
  min_lst_c: number;
  max_lst_c: number;
  hotspots_count: number;
  data_status: string;
  is_synthetic: boolean;
  verification_status: string;
}

/**
 * Direct representation of backend ZoneSummary schema from GET /api/v1/zones.
 */
export interface BackendZoneSummary {
  id: string;
  name: string;
  typology: string;
  area_sqkm: number;
  temperature: number;
  vegetation?: number | null; // unit fraction [0.0, 1.0]
  imperviousness?: number | null; // unit fraction [0.0, 1.0]
  building_density?: number | null; // unit fraction [0.0, 1.0]
  population_exposure?: number | null;
  risk_score?: number | null;
  risk_level?: BackendRiskLevel | string | null;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  tree_canopy_fraction?: number | null;
  impervious_surface_fraction?: number | null;
  total_population?: number | null;
}

/**
 * Flexible zone item used across frontend services with id as primary.
 */
export interface BackendZoneItem {
  id?: string;
  zone_id?: string;
  name?: string;
  zone_name?: string;
  code?: string;
  district?: string;
  typology?: string;
  land_use?: string;
  land_surface_temp_c?: number;
  temperature?: number;
  thermal_anomaly_c?: number;
  baseline_temp_c?: number;
  risk_score?: number;
  risk_level?: BackendRiskLevel;
  vegetation?: number;
  vegetation_pct?: number;
  imperviousness?: number;
  impervious_pct?: number;
  impervious_surface?: number;
  building_density?: number | string;
  population_density?: number | string;
  total_population?: number;
  population?: number;
  vulnerable_population?: number;
  area_sqkm?: number;
  area_km2?: number;
  coordinates?: {
    lat?: number;
    lng?: number;
    x?: number;
    y?: number;
  };
}

export interface BackendLandCover {
  impervious_surface_fraction: number;
  tree_canopy_fraction: number;
  vegetation_grass_fraction: number;
  water_fraction: number;
  average_albedo: number;
  building_density: number;
}

export interface BackendThermalObservation {
  land_surface_temp_c: number;
  baseline_temp_c: number;
  thermal_anomaly_c: number;
  sensor_source?: string;
  observation_time?: string;
}

export interface BackendDemographics {
  population_density_per_sqkm: number;
  total_population: number;
  vulnerable_ratio: number;
  outdoor_worker_density_per_sqkm: number;
  low_ac_coverage_ratio: number;
}

export interface BackendProvenanceRecord {
  field_name: string;
  classification: string;
  source: string;
  confidence?: number;
  notes?: string;
}

/**
 * Full domain Zone schema from GET /api/v1/zones/{zone_id}.
 */
export interface BackendZone {
  id: string;
  name: string;
  typology: string;
  area_sqkm: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  land_cover?: BackendLandCover | null;
  thermal_observation: BackendThermalObservation;
  demographics?: BackendDemographics | null;
  provenance?: BackendProvenanceRecord[];
  temperature?: number | null;
  vegetation?: number | null;
  imperviousness?: number | null;
  building_density?: number | null;
  population_exposure?: number | null;
  risk_score?: number | null;
  risk_level?: string | null;
}

/**
 * Ranked Hotspot schema from GET /api/v1/hotspots.
 */
export interface HotspotItem {
  rank: number;
  zone_id: string;
  zone_name: string;
  typology: string;
  temperature?: number;
  vegetation?: number | null;
  imperviousness?: number | null;
  building_density?: number | null;
  population_exposure?: number | null;
  risk_score: number;
  risk_level: BackendRiskLevel;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  dominant_driver: string;
  dominant_driver_pct: number;
  total_population?: number | null;
  vulnerable_population?: number | null;
  area_sqkm: number;
  center_coords?: [number, number] | number[];
  confidence?: number;
  is_hotspot?: boolean;
  hotspot_tier?: string;
}

export interface ZoneDetail {
  id?: string;
  zone_id: string;
  zone_name: string;
  name?: string;
  code?: string;
  district?: string;
  typology: string;
  land_use?: string;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  baseline_temp_c?: number;
  peak_temp_c?: number;
  risk_score: number;
  risk_level: BackendRiskLevel | string;
  vegetation_pct?: number;
  impervious_pct?: number;
  building_density?: number | string;
  population_density?: number | string;
  total_population: number;
  vulnerable_population?: number;
  elderly_population_pct?: number;
  outdoor_workers_count?: number;
  hvi?: number;
  area_sqkm: number;
  coordinates?: {
    lat: number;
    lng: number;
    x?: number;
    y?: number;
  };
  hourly_temps?: Array<{ hour: string; temp: number; baseline: number }>;
  land_cover?: BackendLandCover | null;
  thermal_observation?: BackendThermalObservation;
  demographics?: BackendDemographics | null;
  geometry?: {
    type: string;
    coordinates: any;
  };
  vegetation_cover_pct?: number;
  impervious_surface_pct?: number;
  building_density_pct?: number;
}

export interface DriverContribution {
  driver_key?: string;
  name: string;
  contribution_pct: number;
  raw_value?: number;
  unit?: string;
  dimension?: string;
  explanation?: string;
  classification?: string;

  // Compatibility aliases for current frontend components
  driver?: string;
  percentage?: number;
  description?: string;
  color?: string;
}

export interface EvidenceItem {
  driver_key: string;
  factor_name: string;
  observed_value: number;
  unit: string;
  contribution_pct: number;
  evidence_statement: string;
  confidence?: number;
  data_source?: string;
  classification?: string;
}

export interface SubscoreBreakdown {
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
}

export interface RiskScoreDetails {
  score: number;
  risk_level: BackendRiskLevel;
  subscores?: SubscoreBreakdown | {
    hazard?: number;
    exposure?: number;
    vulnerability?: number;
    [key: string]: number | undefined;
  };
  component_scores?: Record<string, number>;
  driver_contributions?: DriverContribution[];
  evidence?: EvidenceItem[];
  confidence?: number;
  assumptions?: string[];
  formula_version?: string;
  calculation_timestamp?: string;
}

export interface RiskAssessment {
  zone_id?: string;
  zone_name?: string;
  risk_score: RiskScoreDetails;
  confidence?: number;
  assumptions?: string[];
  classification?: string;

  // Compatibility aliases
  chri?: number;
  hazard_score?: number;
  exposure_score?: number;
  vulnerability_score?: number;
}

export interface InterventionEstimate {
  intervention_id: string;
  intervention_name: string;
  category: string;
  recommended_area_sqm: number;
  estimated_total_cost_usd: number;
  expected_local_lst_reduction_c: number;
  expected_ambient_reduction_c: number;
  suitability_score: number;
  rationale: string;
  classification?: string;
}

export interface BackendInterventionItem {
  id?: string;
  name: string;
  category: string;
  description: string;
  target_surface?: string;
  cooling_potential_c?: number;
  air_temp_reduction_c?: number;
  unit_cost_usd_per_sqm?: number;
  expected_lifespan_years?: number;
  maintenance_cost_usd_annual_per_sqm?: number;
  co_benefits?: string[];
  cost_inr_lakhs?: number | null;
  typical_area_sqm?: number | null;
  phase?: string | null;
  timeframe?: string | null;
  feasibility?: string | null;
  why_recommended?: string | null;
  classification?: string;

  // Recommendation item (InterventionEstimate) compatibility
  intervention_id?: string;
  intervention_name?: string;
  recommended_area_sqm?: number;
  estimated_total_cost_usd?: number;
  expected_local_lst_reduction_c?: number;
  expected_ambient_reduction_c?: number;
  suitability_score?: number;
  rationale?: string;

  // UI presentation aliases
  cost_usd?: number;
  cooling_impact_c?: number;
  cooling_lst_c?: number;
  cooling_impact_label?: string;
  priority?: string;
  population_benefit?: number;
  implementation_area_sqm?: number;
  implementation_area_km2?: number;
}

export interface HotspotDetail {
  summary: HotspotItem | string;
  zone: BackendZone | ZoneDetail;
  risk_assessment: RiskAssessment;
  recommended_interventions: (InterventionEstimate | BackendInterventionItem)[];
  ai_executive_brief?: string | {
    overview?: string;
    action_plan?: string[];
    urgency_level?: string;
    key_vulnerabilities?: string[];
    summary?: string;
  } | null;
  confidence?: number;
  assumptions?: string[];
}

export interface SimulationRequest {
  zone_id: string;
  selected_intervention_ids: string[];
  budget_inr_lakhs: number;

  // Compatibility aliases
  intervention_ids?: string[];
  budget_lakhs?: number;
}

export interface PhasedRoadmapStep {
  phase: string;
  timeframe: string;
  interventions: string[];
  cost_inr_lakhs?: number;
  milestones?: string[];
}

export interface SimulatedInterventionItem {
  id: string;
  name: string;
  category: string;
  target_surface: string;
  cost_inr_lakhs: number;
  implementation_area_sqm: number;
  implementation_area_hectares: number;
  surface_constraint_checked: boolean;
  estimated_lst_drop_c: number;
  estimated_ambient_drop_c: number;
  phase: string;
  timeframe: string;
  co_benefits?: string[];

  // Compatibility aliases
  intervention_id?: string;
  modeled_cooling_c?: number;
  area_sqm?: number;
}

export interface SimulationResponse {
  zone_id: string;
  zone_name: string;
  budget_inr_lakhs: number;
  total_cost_inr_lakhs: number;
  remaining_budget_inr_lakhs: number;
  budget_utilization_pct: number;
  is_budget_exceeded: boolean;
  deficit_inr_lakhs: number;

  modeled_lst_reduction_c: number;
  modeled_ambient_reduction_c: number;
  synergy_factor_c: number;

  total_implementation_area_sqm: number;
  total_implementation_area_hectares: number;
  zone_area_coverage_pct: number;
  population_benefited: number;

  active_interventions: SimulatedInterventionItem[];
  phased_roadmap: Record<string, string[]>;

  assumptions?: string[];
  provenance?: string;
  classification?: string;

  // Compatibility fields for current UI (populated via zoneAdapter adapter)
  baseline?: {
    lst_c: number;
    ambient_temp_c?: number;
    heat_index_c?: number;
    population_exposed?: number;
    vulnerable_population?: number;
  };
  projected?: {
    lst_c: number;
    ambient_temp_c?: number;
    heat_index_c?: number;
    population_exposed?: number;
    vulnerable_population?: number;
  };
  delta?: {
    lst_reduction_c: number;
    ambient_reduction_c?: number;
    heat_index_reduction_c?: number;
    population_protected?: number;
  };
  cost_summary?: {
    total_cost_lakhs: number;
    budget_allocated_lakhs: number;
    budget_utilized_pct: number;
    budget_remaining_lakhs: number;
    is_within_budget: boolean;
  };
  interventions_applied?: Array<{
    id: string;
    name: string;
    cost_lakhs?: number;
    lst_reduction_c?: number;
    implementation_area_km2?: number;
    population_benefited?: number;
  }>;
  synergy_effects?: string[] | number;
  spatial_impacts?: string[] | string;
  cooling_efficiency?: number | string;
  recommendations?: string[];
}

export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    id?: string;
    zone_id?: string;
    name?: string;
    zone_name?: string;
    risk_level?: BackendRiskLevel;
    land_surface_temp_c?: number;
    temperature?: number;
    [key: string]: any;
  };
}

export interface ZoneGeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

export interface Intervention {
  id: string;
  name: string;
  category: 'Nature-Based' | 'Material Surface' | 'Architectural Shade' | 'Urban Ecology' | 'Conservation' | 'Ecosystem Connectivity' | string;
  description: string;
  whyRecommended: string;
  costLakhs: number; // In Lakhs (₹)
  costRange: string;
  coolingImpact: number; // in °C reduction
  coolingImpactLabel: string;
  feasibility: 'High' | 'Medium' | 'Moderate' | string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Strategic' | 'Low' | string;
  populationBenefit: number;
  implementationAreaKm2: number;
  timeToImpact: string;
  coBenefits: string[];
}

export interface MapLayerSettings {
  thermalRaster: boolean;
  treeCanopy: boolean;
  impervious: boolean;
  populationDensity: boolean;
  coolingCorridors: boolean;
  builtUp: boolean;
}

export interface MapFilterSettings {
  riskLevels: RiskLevel[];
  minTemp: number;
  maxTemp: number;
  maxVegetation: number;
  landUse: string;
  dateRange: string;
}

export interface CoolingPlanState {
  targetZoneId: string;
  selectedInterventionIds: string[];
  budgetLakhs: number;
}

