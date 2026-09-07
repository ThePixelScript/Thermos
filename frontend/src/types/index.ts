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
  land_surface_temp_c: number;
  thermal_anomaly_c: number;
  tree_canopy_fraction: number;
  impervious_surface_fraction: number;
  total_population: number;
  risk_score?: number;
  risk_level?: RiskLevel;
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

export interface SubscoreBreakdown {
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
}

export interface HeatRiskScore {
  score: number;
  risk_level: RiskLevel;
  subscores: SubscoreBreakdown;
  driver_contributions: DriverContribution[];
  formula_version: string;
  calculation_timestamp: string;
}

export interface RiskAssessment {
  zone_id: string;
  zone_name: string;
  risk_score: HeatRiskScore;
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

export interface HotspotSummary {
  rank: number;
  zone_id: string;
  zone_name: string;
  typology: string;
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
}

export interface HotspotDetail {
  summary: HotspotSummary;
  zone: any;
  risk_assessment: RiskAssessment;
  recommended_interventions: InterventionEstimate[];
  ai_executive_brief?: string;
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
