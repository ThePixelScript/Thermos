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
// BACKEND API CONTRACT SCHEMAS
// ----------------------------------------------------

export interface BackendHealthResponse {
  status: string;
  version?: string;
  engine?: string;
}

export interface BackendZoneItem {
  zone_id: string;
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
  vegetation_pct?: number;
  vegetation?: number;
  impervious_pct?: number;
  impervious_surface?: number;
  building_density?: string;
  population_density?: string;
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

export interface HotspotItem {
  rank: number;
  zone_id: string;
  zone_name: string;
  typology: string;
  risk_score: number;
  risk_level: BackendRiskLevel;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  dominant_driver: string;
  dominant_driver_pct: number;
  total_population: number;
  vulnerable_population: number;
  area_sqkm: number;
}

export interface ZoneDetail {
  zone_id: string;
  zone_name: string;
  code?: string;
  district?: string;
  typology: string;
  land_use?: string;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  baseline_temp_c?: number;
  peak_temp_c?: number;
  risk_score: number;
  risk_level: BackendRiskLevel;
  vegetation_pct: number;
  impervious_pct: number;
  building_density?: string;
  population_density?: string;
  total_population: number;
  vulnerable_population: number;
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
}

export interface DriverContribution {
  driver: string;
  contribution_pct: number;
  name?: string;
  percentage?: number;
  description?: string;
  color?: string;
}

export interface RiskScoreDetails {
  score: number;
  risk_level: BackendRiskLevel;
  subscores?: {
    hazard?: number;
    exposure?: number;
    vulnerability?: number;
    [key: string]: number | undefined;
  };
  driver_contributions?: DriverContribution[] | Record<string, number>;
}

export interface RiskAssessment {
  risk_score: RiskScoreDetails;
  chri?: number;
  hazard_score?: number;
  exposure_score?: number;
  vulnerability_score?: number;
}

export interface BackendInterventionItem {
  id?: string;
  intervention_id: string;
  name: string;
  category: string;
  description: string;
  why_recommended?: string;
  cost_usd?: number;
  cost_inr_lakhs?: number;
  cooling_impact_c?: number;
  cooling_lst_c?: number;
  cooling_impact_label?: string;
  feasibility?: string;
  priority?: string;
  population_benefit?: number;
  implementation_area_sqm?: number;
  implementation_area_km2?: number;
  co_benefits?: string[];
  suitability_score?: number;
}

export interface HotspotDetail {
  summary: string;
  zone: ZoneDetail;
  risk_assessment: RiskAssessment;
  recommended_interventions: BackendInterventionItem[];
  ai_executive_brief?: string | {
    overview?: string;
    action_plan?: string[];
    urgency_level?: string;
    key_vulnerabilities?: string[];
  };
}

export interface SimulationRequest {
  zone_id: string;
  selected_intervention_ids?: string[];
  intervention_ids?: string[];
  budget_inr_lakhs?: number;
  budget_lakhs?: number;
}

export interface PhasedRoadmapStep {
  phase: string;
  timeframe: string;
  interventions: string[];
  cost_inr_lakhs: number;
  milestones?: string[];
}

export interface SimulationResponse {
  total_cost_inr_lakhs?: number;
  remaining_budget_inr_lakhs?: number;
  budget_utilization_pct?: number;
  deficit_inr_lakhs?: number;
  modeled_lst_reduction_c?: number;
  modeled_ambient_reduction_c?: number;
  synergy_factor_c?: number;
  total_implementation_area_sqm?: number;
  total_implementation_area_hectares?: number;
  zone_area_coverage_pct?: number;
  population_benefited?: number;
  active_interventions?: Array<{
    intervention_id: string;
    name?: string;
    cost_inr_lakhs?: number;
    modeled_cooling_c?: number;
    area_sqm?: number;
  }>;
  phased_roadmap?: PhasedRoadmapStep[];
  assumptions?: string[];
  provenance?: string;
  classification?: string;
  zone_id?: string;
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

