"""Schemas for hotspot identification, priority ranking, and comprehensive zone inspection."""
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import RiskLevel
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import RiskAssessment, DriverContribution
from backend.app.schemas.intervention import InterventionEstimate


class HotspotSummary(BaseModel):
    """Ranked hotspot summary for list views and map markers."""
    rank: int = Field(..., ge=1, description="Priority ranking across the city (1 = highest urgency)")
    zone_id: str
    zone_name: str
    typology: str
    temperature: float = Field(..., description="Land surface temperature in °C")
    vegetation: Optional[float] = Field(None, description="Total vegetation fraction (canopy + grass) [0.0, 1.0]")
    imperviousness: Optional[float] = Field(None, description="Impervious surface fraction [0.0, 1.0]")
    building_density: Optional[float] = Field(None, description="Building footprint density [0.0, 1.0]")
    population_exposure: Optional[float] = Field(None, description="Normalized population exposure index [0.0, 100.0]")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite Heat Risk Index [0.0, 100.0]")
    risk_level: RiskLevel
    land_surface_temp_c: float
    thermal_anomaly_c: float
    dominant_driver: str = Field(..., description="Top contributing factor to thermal risk")
    dominant_driver_pct: float
    total_population: Optional[int] = None
    vulnerable_population: Optional[int] = None
    area_sqkm: float
    center_coords: List[float] = Field(..., description="[longitude, latitude] centroid")
    confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Overall assessment and data confidence score (reflecting input completeness and proxy validity)",
    )
    is_hotspot: bool = Field(default=True, description="Hotspot qualification flag")
    hotspot_tier: str = Field(default="HIGH_HOTSPOT", description="Categorical hotspot classification tier")


class HotspotDetail(BaseModel):
    """Deep-dive hotspot dossier combining spatial, thermal, risk, and intervention intelligence."""
    summary: HotspotSummary
    zone: Zone
    risk_assessment: RiskAssessment
    recommended_interventions: List[InterventionEstimate]
    ai_executive_brief: Optional[str] = Field(None, description="Deterministic factual summary prepared by the AI translation bridge")
    confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Overall assessment and data confidence score (reflecting input completeness and proxy validity)",
    )
    assumptions: List[str] = Field(default_factory=list, description="Documented planning and model assumptions")
