"""Schemas for the deterministic Heat Risk Index and explainable driver attribution."""
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import RiskLevel, DataClassification


class DriverContribution(BaseModel):
    """Explainable component contribution indicating why a zone received its risk score."""
    driver_key: str = Field(..., description="Unique machine key for driver, e.g. 'canopy_deficit'")
    name: str = Field(..., description="Human-readable label, e.g. 'Canopy Deficit'")
    contribution_pct: float = Field(..., ge=0.0, le=100.0, description="Percentage contribution to total risk score (0-100%)")
    raw_value: float = Field(..., description="Original metric value in its natural units")
    unit: str = Field(..., description="Unit of measurement, e.g. '°C', '%', 'people/km²'")
    dimension: str = Field(..., description="'Hazard', 'Exposure', or 'Vulnerability'")
    explanation: str = Field(..., description="Contextual explanation for non-technical urban planners")
    classification: DataClassification = Field(default=DataClassification.DERIVED)


class SubscoreBreakdown(BaseModel):
    """Normalized sub-indices comprising the Composite Heat Risk Index."""
    hazard_score: float = Field(..., ge=0.0, le=100.0, description="Physical heat hazard (thermal anomaly, albedo, imperviousness)")
    exposure_score: float = Field(..., ge=0.0, le=100.0, description="Human presence and outdoor activity density")
    vulnerability_score: float = Field(..., ge=0.0, le=100.0, description="Demographic sensitivity (age, lack of AC, lack of shade)")


class HeatRiskScore(BaseModel):
    """Calculated Composite Heat Risk Index (CHRI) with full mathematical explainability."""
    score: float = Field(..., ge=0.0, le=100.0, description="Overall Composite Heat Risk Index (0-100)")
    risk_level: RiskLevel
    subscores: SubscoreBreakdown
    driver_contributions: List[DriverContribution]
    formula_version: str = Field(default="CHRI-v1.0-deterministic")
    calculation_timestamp: str


class RiskAssessment(BaseModel):
    """Complete risk evaluation bundle for an urban zone."""
    zone_id: str
    zone_name: str
    risk_score: HeatRiskScore
    classification: DataClassification = Field(default=DataClassification.DERIVED)
