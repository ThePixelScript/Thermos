"""Schemas for Phase 6: Urban Climate Digital Twin & Scenario Simulator.

Defines:
- SimulationRequest: Input configuration for counterfactual zone simulation
- SimulationResult: Comprehensive impact outputs of simulated interventions
- ScenarioComparisonRequest: Side-by-side simulation comparison request
- ScenarioComparisonResponse: Multi-scenario comparative matrix and rankings
- CitywideSimulationResult: Citywide portfolio what-if projections
- ZoneSimulationMetadata: Zone baseline parameters and available levers
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    """Input parameters for simulating urban heat mitigation interventions."""
    zone_id: str = Field(..., description="Target zone identifier, e.g. ZONE-01")
    intervention_type: str = Field(
        ...,
        description="'urban_forestry', 'cool_roofs', 'reflective_pavements', 'shade_corridors', 'water_body_restoration', 'aqi_reduction'",
    )
    coverage_pct: float = Field(..., ge=1.0, le=100.0, description="Spatial intervention coverage percentage [1-100]")
    budget: float = Field(..., ge=0.0, description="Financial capital allocated in USD")
    implementation_horizon: str = Field(
        default="short_term",
        description="'immediate', 'short_term', 'mid_term', 'long_term'",
    )
    scenario_name: Optional[str] = Field(default="Counterfactual Scenario", description="Human-readable scenario title")


class SimulationResult(BaseModel):
    """Comprehensive projected outcomes from digital twin counterfactual simulation."""
    zone_id: str
    zone_name: str
    scenario_name: str
    intervention_type: str
    coverage_pct: float
    budget: float
    implementation_horizon: str
    baseline_chri: float
    simulated_chri: float
    projected_chri_reduction: float = Field(..., description="Points reduction in CHRI")
    baseline_lst_c: float
    simulated_lst_c: float
    projected_lst_reduction: float = Field(..., description="Surface temperature reduction in °C")
    baseline_ndvi: float
    simulated_ndvi: float
    projected_ndvi_increase: float = Field(..., description="Vegetative health gain")
    baseline_aqi: float
    simulated_aqi: float
    projected_aqi_reduction: float = Field(..., description="Air quality improvement")
    baseline_risk_level: str
    simulated_risk_level: str
    baseline_forecast_peak: float
    simulated_forecast_peak: float
    forecast_improvement: float = Field(..., description="Reduction in projected peak forecast risk points")
    exposed_population_reduction: int = Field(..., description="Citizens de-escalated from high thermal risk")
    economic_benefit_usd: float = Field(..., description="Calculated public health and energy savings in USD")
    roi: float = Field(..., description="Civic return on investment ratio")
    applied_interventions: List[str]
    timestamp: str


class ScenarioComparisonRequest(BaseModel):
    """Side-by-side comparison request evaluating two scenarios against baseline."""
    zone_id: str
    scenario_a: SimulationRequest
    scenario_b: SimulationRequest


class ScenarioComparisonResponse(BaseModel):
    """Comparative evaluation matrix contrasting Baseline, Scenario A, and Scenario B."""
    zone_id: str
    zone_name: str
    baseline: SimulationResult
    scenario_a: SimulationResult
    scenario_b: SimulationResult
    winner_scenario: str = Field(..., description="'Scenario A', 'Scenario B', or 'Tie'")
    winning_metric: str = Field(..., description="Deciding factor for recommendation")
    delta_chri_a_vs_b: float = Field(..., description="Scenario A CHRI drop minus Scenario B CHRI drop")
    delta_cooling_a_vs_b: float = Field(..., description="Scenario A cooling minus Scenario B cooling (°C)")
    delta_roi_a_vs_b: float = Field(..., description="Scenario A ROI minus Scenario B ROI")
    recommendation: str = Field(..., description="Executive decision recommendation")


class CitywideSimulationResult(BaseModel):
    """Metropolitan what-if simulation aggregated across budget portfolios."""
    budget_tier: str = Field(..., description="'LOW', 'MEDIUM', 'HIGH'")
    budget_limit_usd: float
    total_cost_usd: float
    city_chri_change: float = Field(..., description="Citywide mean CHRI points reduction")
    city_mean_chri_baseline: float
    city_mean_chri_simulated: float
    hotspot_reduction: int = Field(..., description="Number of hotspots remediated below high risk threshold")
    population_protected: int = Field(..., description="Total citizens shielded from severe heat exposure")
    economic_benefit_usd: float = Field(..., description="Aggregate metropolitan economic and health dividend")
    temperature_reduction: float = Field(..., description="Average citywide surface cooling in °C")
    zones_simulated: int
    roi_score: float


class ZoneSimulationMetadata(BaseModel):
    """Zone baseline biophysical status and simulation parameter bounds."""
    zone_id: str
    zone_name: str
    current_chri: float
    current_lst_c: float
    current_ndvi: float
    current_aqi: float
    tree_canopy_fraction: float
    impervious_surface_fraction: float
    building_density: float
    water_fraction: float
    total_population: int
    available_interventions: List[str]
