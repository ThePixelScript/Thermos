"""Schemas for the deterministic Heat Risk Index, component scores, and evidence breakdown."""
from typing import List, Optional, Dict
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


class EvidenceItem(BaseModel):
    """Specific empirical or observational evidence supporting a risk factor."""
    driver_key: str = Field(..., description="Unique machine key for the driver")
    factor_name: str = Field(..., description="Human-readable factor title")
    observed_value: float = Field(..., description="Raw metric value in natural units")
    unit: str = Field(..., description="Unit of measurement")
    contribution_pct: float = Field(..., description="Contribution percentage to risk score")
    evidence_statement: str = Field(..., description="Factual evidence statement explaining the metric")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Assessment and data confidence for this factor [0.0, 1.0]")
    data_source: str = Field(
        default="Synthetic Demonstration Data",
        description="Source of indicator data (labeled as synthetic/demo for MVP, swappable for real ingest later)",
    )
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
    component_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Normalized 0-100 scores for all dimensional and sub-factor components",
    )
    driver_contributions: List[DriverContribution]
    evidence: List[EvidenceItem] = Field(
        default_factory=list,
        description="Empirical evidence records supporting each risk driver",
    )
    confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Overall assessment confidence score based on input data completeness and proxy validity",
    )
    assumptions: List[str] = Field(
        default_factory=list,
        description="Explicit mathematical and modeling assumptions governing this assessment",
    )
    formula_version: str = Field(default="CHRI-v1.0-deterministic")
    calculation_timestamp: str


class RiskAssessment(BaseModel):
    """Complete risk evaluation bundle for an urban zone."""
    zone_id: str
    zone_name: str
    risk_score: HeatRiskScore
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="Overall assessment and input data confidence score")
    assumptions: List[str] = Field(default_factory=list)
    classification: DataClassification = Field(default=DataClassification.DERIVED)
