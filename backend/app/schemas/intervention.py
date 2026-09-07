"""Schemas for cooling interventions, feasibility assessment, and cost/impact modeling."""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import DataClassification


class InterventionCategory(str, Enum):
    NATURE_BASED = "nature_based"
    MATERIAL_ENGINEERING = "material_engineering"
    URBAN_DESIGN = "urban_design"
    EMERGENCY_COOLING = "emergency_cooling"


class Intervention(BaseModel):
    """Catalog model representing a validated urban cooling measure."""
    id: str = Field(..., description="Unique intervention identifier, e.g. INT-COOL-ROOF")
    name: str = Field(..., description="Name of intervention, e.g. 'High-Albedo Cool Roof Coating'")
    category: InterventionCategory
    description: str
    target_surface: str = Field(..., description="'roof', 'pavement', 'public_space', 'street_corridor'")
    cooling_potential_c: float = Field(..., description="Estimated localized surface cooling delta in °C")
    air_temp_reduction_c: float = Field(..., description="Estimated ambient air temperature reduction in °C")
    unit_cost_usd_per_sqm: float = Field(..., ge=0.0)
    expected_lifespan_years: int = Field(..., ge=1)
    maintenance_cost_usd_annual_per_sqm: float = Field(..., ge=0.0)
    co_benefits: List[str] = Field(default_factory=list)
    applicability_rules: dict = Field(default_factory=dict)
    classification: DataClassification = Field(default=DataClassification.ESTIMATED)
    cost_inr_lakhs: Optional[float] = Field(default=None, description="Standard package implementation cost in INR Lakhs")
    typical_area_sqm: Optional[float] = Field(default=None, description="Typical implementation footprint in square meters")
    phase: Optional[str] = Field(default=None, description="Implementation phase (Phase 1, Phase 2, Phase 3)")
    timeframe: Optional[str] = Field(default=None, description="Estimated rollout duration")
    feasibility: Optional[str] = Field(default="High", description="Municipal deployment feasibility")
    why_recommended: Optional[str] = Field(default=None, description="Urban morphological suitability rationale")


class InterventionEstimate(BaseModel):
    """Site-specific deployment estimate for an intervention in a given zone."""
    intervention_id: str
    intervention_name: str
    category: InterventionCategory
    recommended_area_sqm: float = Field(..., ge=0.0)
    estimated_total_cost_usd: float = Field(..., ge=0.0)
    expected_local_lst_reduction_c: float = Field(..., ge=0.0)
    expected_ambient_reduction_c: float = Field(..., ge=0.0)
    suitability_score: float = Field(..., ge=0.0, le=100.0)
    rationale: str
    classification: DataClassification = Field(default=DataClassification.SIMULATED)


class PlanningConstraints(BaseModel):
    """Input parameters for scenario planning and optimization."""
    max_budget_usd: Optional[float] = None
    target_risk_reduction_pct: Optional[float] = None
    preferred_categories: Optional[List[InterventionCategory]] = None
    min_canopy_target_pct: Optional[float] = None


class SimulationRequest(BaseModel):
    """Scenario simulation request payload."""
    zone_id: str = Field(..., description="Target zone identifier, e.g. ZONE-01")
    selected_intervention_ids: List[str] = Field(default_factory=list, description="IDs of interventions selected for scenario")
    budget_inr_lakhs: float = Field(..., description="Allocated municipal resilience budget ceiling in INR Lakhs")


class SimulatedInterventionItem(BaseModel):
    """Detailed site-calibrated intervention result in a simulated scenario."""
    id: str
    name: str
    category: str
    target_surface: str
    cost_inr_lakhs: float
    implementation_area_sqm: float
    implementation_area_hectares: float
    surface_constraint_checked: bool
    estimated_lst_drop_c: float
    estimated_ambient_drop_c: float
    phase: str
    timeframe: str
    co_benefits: List[str] = Field(default_factory=list)


class SimulationResponse(BaseModel):
    """Server-authoritative deterministic scenario simulation response."""
    zone_id: str
    zone_name: str
    budget_inr_lakhs: float
    total_cost_inr_lakhs: float
    remaining_budget_inr_lakhs: float
    budget_utilization_pct: float
    is_budget_exceeded: bool
    deficit_inr_lakhs: float

    # Separated cooling dimensions
    modeled_lst_reduction_c: float
    modeled_ambient_reduction_c: float
    synergy_factor_c: float

    # Spatial and demographic coverage
    total_implementation_area_sqm: float
    total_implementation_area_hectares: float
    zone_area_coverage_pct: float
    population_benefited: int

    # Implementation roadmap
    active_interventions: List[SimulatedInterventionItem] = Field(default_factory=list)
    phased_roadmap: dict = Field(default_factory=dict)

    # Scientific integrity and audit
    assumptions: List[str] = Field(default_factory=list)
    provenance: str = Field(default="Modelled estimate under stated assumptions; not field-validated.")
    classification: DataClassification = Field(default=DataClassification.SIMULATED)
