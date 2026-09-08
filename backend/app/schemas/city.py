"""Schemas for Phase 5: Municipal Decision Intelligence.

Defines:
- CityCommandOverview: Executive-level KPIs and citywide metrics
- PriorityIntervention: Deterministically scored zone intervention priority
- MunicipalAction: Operational mitigation action across 6 core categories
- ResourcePortfolio: Budget-constrained optimal intervention allocation
- ExecutiveSummary: Complete decision intelligence synthesis for municipal leadership
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CityCommandOverview(BaseModel):
    """Executive intelligence summary of metropolitan heat status."""
    city_name: str
    total_zones: int
    current_city_chri: float = Field(..., description="Citywide mean live CHRI score [0-100]")
    forecast_city_chri_24h: float = Field(..., description="Projected citywide mean CHRI in +24h")
    forecast_city_chri_72h: float = Field(..., description="Projected citywide mean CHRI in +72h")
    forecast_city_chri_7d: float = Field(..., description="Projected citywide mean CHRI in +7d")
    active_hotspots: int = Field(..., description="Count of zones with live CHRI >= 40.0")
    emerging_hotspots: int = Field(..., description="Count of zones exhibiting rapid heat escalation")
    cooling_zones: int = Field(..., description="Count of zones experiencing microclimate cooling")
    population_exposed: int = Field(..., description="Total population residing in HIGH, SEVERE, or CRITICAL zones")
    total_population: int = Field(..., description="Total population across all urban zones")
    high_risk_zones_count: int = Field(..., description="Count of zones in HIGH, SEVERE, or CRITICAL risk tier")
    average_lst: float = Field(..., description="Citywide mean Land Surface Temperature in °C")
    average_ndvi: float = Field(..., description="Citywide mean NDVI vegetation index")
    timestamp: str


class PriorityIntervention(BaseModel):
    """Deterministically scored intervention priority for an urban zone."""
    zone_id: str
    zone_name: str
    rank: int
    priority_score: float = Field(..., ge=0.0, le=100.0, description="0.35*CHRI + 0.25*Forecast + 0.20*Pop + 0.10*Vuln + 0.10*Feas")
    chri_component: float = Field(..., ge=0.0, le=100.0)
    forecast_risk_component: float = Field(..., ge=0.0, le=100.0)
    population_exposure_component: float = Field(..., ge=0.0, le=100.0)
    vulnerability_component: float = Field(..., ge=0.0, le=100.0)
    feasibility_component: float = Field(..., ge=0.0, le=100.0)
    risk_level: str
    dominant_driver: str
    recommended_action: str
    urgency: str = Field(..., description="'IMMEDIATE', 'URGENT', 'PLANNED', 'ROUTINE'")


class MunicipalAction(BaseModel):
    """Operational municipal mitigation measure deployed across target zones."""
    action_id: str
    action_type: str = Field(
        ...,
        description="'cool_roofs', 'urban_forestry', 'shade_corridors', 'water_bodies_restoration', 'aqi_mitigation', 'reflective_pavements'",
    )
    title: str
    description: str
    target_zones: List[str] = Field(default_factory=list)
    target_zone_names: List[str] = Field(default_factory=list)
    estimated_chri_reduction: float = Field(..., description="Expected points reduction in CHRI")
    estimated_temperature_reduction: float = Field(..., description="Expected localized temperature reduction in °C")
    affected_population: int = Field(..., description="Number of citizens directly protected")
    implementation_horizon: str = Field(..., description="'Immediate (0-3 mo)', 'Short-term (3-6 mo)', 'Mid-term (6-18 mo)', 'Long-term (1-3 yr)'")
    cost_tier: str = Field(..., description="'LOW', 'MEDIUM', 'HIGH'")
    estimated_cost_usd: float = Field(..., ge=0.0)
    feasibility_score: float = Field(..., ge=0.0, le=100.0)
    co_benefits: List[str] = Field(default_factory=list)


class ResourcePortfolio(BaseModel):
    """Optimal intervention portfolio under specified municipal budget tier."""
    budget_tier: str = Field(..., description="'LOW', 'MEDIUM', 'HIGH'")
    budget_limit_usd: float
    total_cost_usd: float
    unallocated_budget_usd: float
    selected_actions: List[MunicipalAction]
    projected_chri_reduction: float = Field(..., description="Cumulative citywide CHRI point reduction")
    projected_cooling: float = Field(..., description="Estimated aggregate surface/ambient temperature reduction in °C")
    beneficiary_population: int = Field(..., description="Citizens benefiting from selected actions")
    roi_score: float = Field(..., description="Calculated civic return on investment score")


class ExecutiveSummary(BaseModel):
    """Metropolitan executive briefing for civic leaders and municipal commissioners."""
    city_name: str
    generated_at: str
    overview: CityCommandOverview
    top_priority_interventions: List[PriorityIntervention]
    recommended_portfolio: ResourcePortfolio
    all_portfolios: Dict[str, ResourcePortfolio]
    executive_directives: List[str]
