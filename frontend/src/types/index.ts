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
    name?: string;
    typology?: string;
    area_sqkm?: number;
    land_surface_temp_c?: number;
    thermal_anomaly_c?: number;
    tree_canopy_fraction?: number;
    impervious_surface_fraction?: number;
    population_density?: number;
    total_population?: number;
    vulnerable_ratio?: number;
    temperature?: number;
    vegetation?: number;
    imperviousness?: number;
    building_density?: number;
    population_exposure?: number;
    risk_score?: number;
    risk_level?: RiskLevel;
    [key: string]: any;
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
  driver_contributions: DriverContribution[];
  component_scores?: Record<string, number>;
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
  data_source?: string;
  observation_date?: string;
  last_update_timestamp?: string;
  confidence_score?: number;
  methodology?: string;
  water_distance_km?: number;
  weather_condition?: string;
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

export interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  heat_index_c: number;
  bioclimatic_stress: string;
  timestamp: string;
  source: string;
}

export interface CHRIScoreData {
  zone_id: string;
  zone_name: string;
  score: number;
  risk_level: string;
  normalized_lst: number;
  normalized_population_density: number;
  normalized_building_density: number;
  normalized_ndvi: number;
  normalized_aqi: number;
  raw_metrics: {
    lst_c: number;
    population_density: number;
    building_density: number;
    ndvi: number;
    aqi: number;
    [key: string]: number;
  };
  driver_contributions: Record<string, number>;
  dominant_driver: string;
  dominant_driver_pct: number;
  formula: string;
  timestamp: string;
}

export interface MitigationActionData {
  action_id: string;
  title: string;
  category: string;
  driver_addressed: string;
  description: string;
  cooling_impact_c: number;
  cost_tier: string;
  implementation_time: string;
  co_benefits: string[];
}

export interface ZoneRecommendationData {
  zone_id: string;
  zone_name: string;
  chri_score: number;
  risk_level: string;
  dominant_drivers: string[];
  recommended_actions: MitigationActionData[];
  projected_cooling_c: number;
  projected_chri_reduction: number;
  summary: string;
}

export interface STACScene {
  scene_id: string;
  collection: string;
  satellite: string;
  acquisition_date: string;
  cloud_cover_percentage: number;
  sun_elevation_deg: number;
  resolution_meters: number;
  bbox: [number, number, number, number];
  titiler_tile_url: string;
  assets: string[];
}

export interface TileJSONMetadata {
  tilejson: string;
  name: string;
  description: string;
  tiles: string[];
  minzoom: number;
  maxzoom: number;
  bounds: [number, number, number, number];
  format: string;
  attribution: string;
}

export interface NDVIColormapBreakData {
  value: number;
  color: string;
  label: string;
}

export interface NDVIZonalStatsData {
  zone_id: string;
  zone_name: string;
  mean_ndvi: number;
  min_ndvi: number;
  max_ndvi: number;
  canopy_cover_percentage: number;
  vegetation_health: string;
  thermal_mitigation_cooling_c: number;
}

export interface LSTColormapBreakData {
  value: number;
  color: string;
  label: string;
}

export interface LSTZonalStatsData {
  zone_id: string;
  zone_name: string;
  mean_lst_c: number;
  min_lst_c: number;
  max_lst_c: number;
  thermal_anomaly_c: number;
  uhi_intensity_c: number;
  heat_stress_tier: string;
}

export interface LiveRasterMetricsData {
  mean_lst_c: number;
  max_lst_c: number;
  mean_ndvi: number;
  vegetation_coverage_pct: number;
  thermal_anomaly_c: number;
  thermal_anomaly_pct: number;
  lst_sensor: string;
  ndvi_sensor: string;
}

export interface LiveCHRIScoreData {
  zone_id: string;
  zone_name: string;
  score: number;
  baseline_score: number;
  delta_from_baseline: number;
  risk_level: string;
  hotspot_trend: 'emerging' | 'persistent' | 'cooling';
  confidence_score: number;
  normalized_lst: number;
  normalized_population_density: number;
  normalized_building_density: number;
  normalized_ndvi: number;
  normalized_aqi: number;
  raw_metrics: Record<string, number>;
  driver_contributions: Record<string, number>;
  dominant_driver: string;
  dominant_driver_pct: number;
  raster_metrics: LiveRasterMetricsData;
  formula: string;
  timestamp: string;
}

export interface LiveHeatHotspotData {
  rank: number;
  zone_id: string;
  zone_name: string;
  live_chri_score: number;
  baseline_chri_score: number;
  delta_score: number;
  risk_level: string;
  hotspot_trend: 'emerging' | 'persistent' | 'cooling';
  dominant_driver: string;
  dominant_driver_pct: number;
  mean_lst_c: number;
  max_lst_c: number;
  mean_ndvi: number;
  canopy_cover_pct: number;
  thermal_anomaly_c: number;
  confidence_score: number;
  center_coords: [number, number];
  urgency: string;
  data_source?: string;
  observation_date?: string;
  last_update_timestamp?: string;
  methodology?: string;
  water_distance_km?: number;
  weather_condition?: string;
}

export interface HotspotTrendsSummaryData {
  total_zones: number;
  emerging_hotspots_count: number;
  persistent_hotspots_count: number;
  cooling_zones_count: number;
  citywide_mean_lst_c: number;
  citywide_mean_ndvi: number;
  emerging_hotspots: LiveHeatHotspotData[];
  persistent_hotspots: LiveHeatHotspotData[];
  cooling_zones: LiveHeatHotspotData[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Phase 4: Predictive Urban Heat Intelligence Types
// ---------------------------------------------------------------------------

export interface ForecastDriverImpactData {
  driver: string;
  driver_name: string;
  delta_impact: number;
  description: string;
}

export interface ForecastPointData {
  horizon: '24h' | '72h' | '7d' | string;
  forecast_timestamp: string;
  projected_chri: number;
  projected_lst_c: number;
  projected_ambient_temp_c: number;
  projected_heat_index_c: number;
  delta_chri: number;
  risk_level: string;
  escalation: 'Severe Rise' | 'Rising' | 'Cooling' | 'Stable' | string;
  confidence_score: number;
  driver_breakdown: ForecastDriverImpactData[];
}

export interface CHRIForecastData {
  zone_id: string;
  zone_name: string;
  current_chri: number;
  current_lst_c: number;
  current_risk_level: string;
  horizons: ForecastPointData[];
  peak_risk_horizon: string;
  peak_chri: number;
  primary_escalation_driver: string;
  overall_escalation: 'Severe Rise' | 'Rising' | 'Cooling' | 'Stable' | string;
  generated_at: string;
}

export interface ForecastAlertData {
  alert_id: string;
  zone_id: string;
  zone_name: string;
  severity: 'WATCH' | 'WARNING' | 'EMERGENCY' | string;
  headline: string;
  escalation: string;
  trigger_horizon: string;
  current_chri: number;
  projected_chri: number;
  primary_driver: string;
  recommended_early_action: string;
  timestamp: string;
}

export interface CitywideForecastSummaryData {
  generated_at: string;
  total_zones: number;
  zones_escalating: number;
  zones_severe_rise: number;
  zones_cooling: number;
  zones_stable: number;
  citywide_mean_chri_current: number;
  citywide_mean_chri_24h: number;
  citywide_mean_chri_72h: number;
  citywide_mean_chri_7d: number;
  active_alerts: ForecastAlertData[];
  high_risk_zones_forecast: CHRIForecastData[];
}

// ---------------------------------------------------------------------------
// Phase 5: Municipal Decision Intelligence Types
// ---------------------------------------------------------------------------

export interface CityCommandOverviewData {
  city_name: string;
  total_zones: number;
  current_city_chri: number;
  forecast_city_chri_24h: number;
  forecast_city_chri_72h: number;
  forecast_city_chri_7d: number;
  active_hotspots: number;
  emerging_hotspots: number;
  cooling_zones: number;
  population_exposed: number;
  total_population: number;
  high_risk_zones_count: number;
  average_lst: number;
  average_ndvi: number;
  timestamp: string;
}

export interface PriorityInterventionData {
  zone_id: string;
  zone_name: string;
  rank: number;
  priority_score: number;
  chri_component: number;
  forecast_risk_component: number;
  population_exposure_component: number;
  vulnerability_component: number;
  feasibility_component: number;
  risk_level: string;
  dominant_driver: string;
  recommended_action: string;
  urgency: 'IMMEDIATE' | 'URGENT' | 'PLANNED' | 'ROUTINE' | string;
}

export interface MunicipalActionData {
  action_id: string;
  action_type: string;
  title: string;
  description: string;
  target_zones: string[];
  target_zone_names: string[];
  estimated_chri_reduction: number;
  estimated_temperature_reduction: number;
  affected_population: number;
  implementation_horizon: string;
  cost_tier: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  estimated_cost_usd: number;
  feasibility_score: number;
  co_benefits: string[];
}

export interface ResourcePortfolioData {
  budget_tier: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  budget_limit_usd: number;
  total_cost_usd: number;
  unallocated_budget_usd: number;
  selected_actions: MunicipalActionData[];
  projected_chri_reduction: number;
  projected_cooling: number;
  beneficiary_population: number;
  roi_score: number;
}

export interface ExecutiveSummaryData {
  city_name: string;
  generated_at: string;
  overview: CityCommandOverviewData;
  top_priority_interventions: PriorityInterventionData[];
  recommended_portfolio: ResourcePortfolioData;
  all_portfolios: Record<string, ResourcePortfolioData>;
  executive_directives: string[];
}

// ============================================================================
// Phase 6: Urban Climate Digital Twin & Scenario Simulator Types
// ============================================================================

export type InterventionType =
  | 'urban_forestry'
  | 'cool_roofs'
  | 'reflective_pavements'
  | 'shade_corridors'
  | 'water_body_restoration'
  | 'aqi_reduction';

export type ImplementationHorizon = 'immediate' | 'short_term' | 'mid_term' | 'long_term';

export interface SimulationRequestData {
  zone_id: string;
  intervention_type: InterventionType | string;
  coverage_pct: number;
  budget: number;
  implementation_horizon?: ImplementationHorizon | string;
  scenario_name?: string;
}

export interface SimulationResultData {
  zone_id: string;
  zone_name: string;
  scenario_name: string;
  intervention_type: string;
  coverage_pct: number;
  budget: number;
  implementation_horizon: string;
  baseline_chri: number;
  simulated_chri: number;
  projected_chri_reduction: number;
  baseline_lst_c: number;
  simulated_lst_c: number;
  projected_lst_reduction: number;
  baseline_ndvi: number;
  simulated_ndvi: number;
  projected_ndvi_increase: number;
  baseline_aqi: number;
  simulated_aqi: number;
  projected_aqi_reduction: number;
  baseline_risk_level: string;
  simulated_risk_level: string;
  baseline_forecast_peak: number;
  simulated_forecast_peak: number;
  forecast_improvement: number;
  exposed_population_reduction: number;
  economic_benefit_usd: number;
  roi: number;
  applied_interventions: string[];
  timestamp: string;
}

export interface ScenarioComparisonRequestData {
  zone_id: string;
  scenario_a: SimulationRequestData;
  scenario_b: SimulationRequestData;
}

export interface ScenarioComparisonResponseData {
  zone_id: string;
  zone_name: string;
  baseline: SimulationResultData;
  scenario_a: SimulationResultData;
  scenario_b: SimulationResultData;
  winner_scenario: 'Scenario A' | 'Scenario B' | 'Tie' | string;
  winning_metric: string;
  delta_chri_a_vs_b: number;
  delta_cooling_a_vs_b: number;
  delta_roi_a_vs_b: number;
  recommendation: string;
}

export interface CitywideSimulationResultData {
  budget_tier: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  budget_limit_usd: number;
  total_cost_usd: number;
  city_chri_change: number;
  city_mean_chri_baseline: number;
  city_mean_chri_simulated: number;
  hotspot_reduction: number;
  population_protected: number;
  economic_benefit_usd: number;
  temperature_reduction: number;
  zones_simulated: number;
  roi_score: number;
}

export interface ZoneSimulationMetadataData {
  zone_id: string;
  zone_name: string;
  current_chri: number;
  current_lst_c: number;
  current_ndvi: number;
  current_aqi: number;
  tree_canopy_fraction: number;
  impervious_surface_fraction: number;
  building_density: number;
  water_fraction: number;
  total_population: number;
  available_interventions: string[];
}

export interface LocationSearchResult {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  bbox?: [number, number, number, number] | null;
  type?: string;
  category?: string;
  importance?: number;
  source?: string;
}

export interface SelectedLocation {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  bbox?: [number, number, number, number] | null;
  source?: string;
}
