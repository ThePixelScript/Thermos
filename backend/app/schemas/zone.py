"""Urban Zone schemas mapping physical, thermal, demographic, and risk dimensions."""
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from backend.app.schemas.common import Typology, GeoJSONPolygon, ProvenanceRecord, DataClassification


class LandCover(BaseModel):
    """Physical land cover composition of an urban zone."""
    impervious_surface_fraction: float = Field(..., ge=0.0, le=1.0, description="Fraction covered by concrete, asphalt, buildings")
    tree_canopy_fraction: float = Field(..., ge=0.0, le=1.0, description="Fraction covered by urban tree canopy")
    vegetation_grass_fraction: float = Field(..., ge=0.0, le=1.0, description="Fraction covered by turf/grass/shrubs")
    water_fraction: float = Field(..., ge=0.0, le=1.0, description="Fraction covered by water bodies")
    average_albedo: float = Field(..., ge=0.05, le=0.90, description="Solar reflectance fraction (albedo)")
    building_density: float = Field(default=0.50, ge=0.0, le=1.0, description="Building footprint density [0.0, 1.0]")


class ThermalObservation(BaseModel):
    """Land surface temperature measurements and thermal anomaly."""
    land_surface_temp_c: float = Field(..., description="Observed Land Surface Temperature in °C")
    baseline_temp_c: float = Field(..., description="City-wide baseline reference temperature in °C")
    thermal_anomaly_c: float = Field(..., description="Deviation from baseline: LST - Baseline in °C")
    sensor_source: str = Field(default="Landsat-9 TIRS", description="Remote sensing platform or sensor array")
    observation_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Demographics(BaseModel):
    """Population density and vulnerability indicators."""
    population_density_per_sqkm: float = Field(..., ge=0.0)
    total_population: int = Field(..., ge=0)
    vulnerable_ratio: float = Field(..., ge=0.0, le=1.0, description="Fraction of population aged <5 or >65")
    outdoor_worker_density_per_sqkm: float = Field(..., ge=0.0, description="Estimated density of outdoor physical laborers")
    low_ac_coverage_ratio: float = Field(..., ge=0.0, le=1.0, description="Fraction of households without cooling infrastructure")


class Zone(BaseModel):
    """Core domain model representing a bounded urban zone."""
    id: str = Field(..., description="Unique zone identifier, e.g. ZONE-01")
    name: str = Field(..., description="Civic name of the neighborhood/district")
    typology: Typology
    area_sqkm: float = Field(..., gt=0.0)
    geometry: GeoJSONPolygon
    land_cover: Optional[LandCover] = None
    thermal_observation: ThermalObservation
    demographics: Optional[Demographics] = None
    provenance: Optional[List[ProvenanceRecord]] = Field(default_factory=list)

    # Core analytical indicators needed for planning queries & simulations
    temperature: Optional[float] = Field(None, description="Land surface temperature in °C")
    vegetation: Optional[float] = Field(None, description="Total vegetation fraction (canopy + grass) [0.0, 1.0]")
    imperviousness: Optional[float] = Field(None, description="Impervious surface fraction [0.0, 1.0]")
    building_density: Optional[float] = Field(None, description="Building footprint density [0.0, 1.0]")
    population_exposure: Optional[float] = Field(None, description="Normalized population exposure index [0.0, 100.0]")
    risk_score: Optional[float] = Field(None, description="Deterministic Composite Heat Risk Index [0.0, 100.0]")
    risk_level: Optional[str] = Field(None, description="Categorical risk tier (LOW, MODERATE, HIGH, SEVERE, CRITICAL)")


class ZoneSummary(BaseModel):
    """Lightweight summary of a zone for list views and map layers."""
    id: str
    name: str
    typology: Typology
    area_sqkm: float
    temperature: float = Field(..., description="Land surface temperature in °C")
    vegetation: Optional[float] = Field(None, description="Total vegetation fraction (canopy + grass) [0.0, 1.0]")
    imperviousness: Optional[float] = Field(None, description="Impervious surface fraction [0.0, 1.0]")
    building_density: Optional[float] = Field(None, description="Building footprint density [0.0, 1.0]")
    population_exposure: Optional[float] = Field(None, description="Normalized population exposure index [0.0, 100.0]")
    risk_score: Optional[float] = Field(None, description="Deterministic Composite Heat Risk Index [0.0, 100.0]")
    risk_level: Optional[str] = Field(None, description="Categorical risk tier")
    land_surface_temp_c: float
    thermal_anomaly_c: float
    tree_canopy_fraction: Optional[float] = None
    impervious_surface_fraction: Optional[float] = None
    total_population: Optional[int] = None
