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
    data_source: str = Field(
        default="WeatherAPI + NASA FIRMS + OpenStreetMap",
        description="Authoritative Earth Observation and vector telemetry sources",
    )
    observation_date: str = Field(
        default="2024-05-15",
        description="Observation date of primary satellite thermal and multispectral acquisition",
    )
    last_update_timestamp: str = Field(
        default="2026-09-09T03:00:00Z",
        description="Timestamp when the hotspot analytical dossier was updated",
    )
    confidence_score: float = Field(
        default=0.94,
        ge=0.0,
        le=1.0,
        description="Multi-criteria spatial analytical confidence score [0.0, 1.0]",
    )
    methodology: str = Field(
        default="Composite Heat Risk Index (CHRI) v3.0: Multi-Criteria Analytical Hierarchy Process fusing Land Surface Temperature (30%), Vegetation Deficit (20%), Building Density (15%), Population Exposure (15%), Water Distance (10%), and Weather Telemetry (10%)",
        description="Exact deterministic calculation methodology",
    )
    water_distance_km: Optional[float] = Field(default=None, description="Distance to nearest major cooling water body in km")
    weather_condition: Optional[str] = Field(default=None, description="Live meteorological condition summary")


class HotspotDetail(BaseModel):
    """Deep-dive hotspot dossier combining spatial, thermal, risk, and intervention intelligence."""
    summary: HotspotSummary
    zone: Zone
    risk_assessment: RiskAssessment
    recommended_interventions: List[InterventionEstimate]
    ai_executive_brief: Optional[str] = Field(None, description="Deterministic factual summary prepared by the AI translation bridge")
