export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'CRITICAL';

export type Typology =
  | 'commercial_dense'
  | 'industrial_heavy'
  | 'residential_highrise'
  | 'residential_suburban'
  | 'historic_dense'
  | 'informal_settlement'
  | 'transit_hub'
  | 'park_riparian'
  | 'institutional_campus'
  | 'mixed_use';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string;
  geometry: GeoJSONPolygon;
  properties: {
    id: string;
    name: string;
    typology: string;
    area_sqkm: number;
    land_surface_temp_c: number;
    thermal_anomaly_c: number;
    tree_canopy_fraction: number;
    impervious_surface_fraction: number;
    population_density: number;
    total_population: number;
    vulnerable_ratio: number;
    temperature?: number;
    vegetation?: number;
    imperviousness?: number;
    building_density?: number;
    population_exposure?: number;
    risk_score?: number;
    risk_level?: RiskLevel;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ZoneSummary {
  id: string;
  name: string;
  typology: Typology;
  area_sqkm: number;
  temperature: number;
  vegetation: number;
  imperviousness: number;
  building_density: number;
  population_exposure: number;
  risk_score: number;
  risk_level: string;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  tree_canopy_fraction: number;
  impervious_surface_fraction: number;
  total_population: number;
}

export interface DriverContribution {
  driver_key: string;
  name: string;
  contribution_pct: number;
  raw_value: number;
  unit: string;
  dimension: string;
  explanation: string;
  classification: string;
}

export interface EvidenceItem {
  driver_key: string;
  factor_name: string;
  observed_value: number;
  unit: string;
  contribution_pct: number;
  evidence_statement: string;
  confidence: number;
  data_source: string;
  classification: string;
}

export interface SubscoreBreakdown {
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
}

export interface HeatRiskScore {
  score: number;
  risk_level: RiskLevel;
  subscores: SubscoreBreakdown;
  component_scores?: Record<string, number>;
  driver_contributions: DriverContribution[];
  evidence?: EvidenceItem[];
  confidence?: number;
  assumptions?: string[];
  formula_version: string;
  calculation_timestamp: string;
}

export interface RiskAssessment {
  zone_id: string;
  zone_name: string;
  risk_score: HeatRiskScore;
  confidence?: number;
  assumptions?: string[];
  classification: string;
}

export interface Intervention {
  id: string;
  name: string;
  category: string;
  description: string;
  target_surface: string;
  cooling_potential_c: number;
  air_temp_reduction_c: number;
  unit_cost_usd_per_sqm: number;
  expected_lifespan_years: number;
  maintenance_cost_usd_annual_per_sqm: number;
  co_benefits: string[];
  cost_inr_lakhs?: number;
  typical_area_sqm?: number;
  phase?: string;
  timeframe?: string;
  feasibility?: string;
  why_recommended?: string;
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
  classification: string;
}

export interface SimulationRequest {
  zone_id: string;
  selected_intervention_ids: string[];
  budget_inr_lakhs: number;
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
  co_benefits: string[];
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
  assumptions: string[];
  provenance: string;
  classification: string;
}

export interface HotspotSummary {
  rank: number;
  zone_id: string;
  zone_name: string;
  typology: string;
  temperature: number;
  vegetation: number;
  imperviousness: number;
  building_density: number;
  population_exposure: number;
  risk_score: number;
  risk_level: RiskLevel;
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  dominant_driver: string;
  dominant_driver_pct: number;
  total_population: number;
  vulnerable_population: number;
  area_sqkm: number;
  center_coords: [number, number]; // [lon, lat]
  confidence?: number;
  is_hotspot?: boolean;
  hotspot_tier?: string;
}

export interface HotspotDetail {
  summary: HotspotSummary;
  zone: any;
  risk_assessment: RiskAssessment;
  recommended_interventions: InterventionEstimate[];
  ai_executive_brief?: string;
  confidence?: number;
  assumptions?: string[];
}

export interface BackendHealth {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  zones_loaded: number;
  hotspots_count: number;
  engine_status: Record<string, string>;
}
