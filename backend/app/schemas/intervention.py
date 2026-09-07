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
