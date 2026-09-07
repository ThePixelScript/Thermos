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
    vegetation: float = Field(..., description="Total vegetation fraction (canopy + grass) [0.0, 1.0]")
    imperviousness: float = Field(..., description="Impervious surface fraction [0.0, 1.0]")
    building_density: float = Field(..., description="Building footprint density [0.0, 1.0]")
    population_exposure: float = Field(..., description="Normalized population exposure index [0.0, 100.0]")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite Heat Risk Index [0.0, 100.0]")
    risk_level: RiskLevel
    land_surface_temp_c: float
    thermal_anomaly_c: float
    dominant_driver: str = Field(..., description="Top contributing factor to thermal risk")
    dominant_driver_pct: float
    total_population: int
    vulnerable_population: int
    area_sqkm: float
    center_coords: List[float] = Field(..., description="[longitude, latitude] centroid")


class HotspotDetail(BaseModel):
    """Deep-dive hotspot dossier combining spatial, thermal, risk, and intervention intelligence."""
    summary: HotspotSummary
    zone: Zone
    risk_assessment: RiskAssessment
    recommended_interventions: List[InterventionEstimate]
    ai_executive_brief: Optional[str] = Field(None, description="Deterministic factual summary prepared by the AI translation bridge")
