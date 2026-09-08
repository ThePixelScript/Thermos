"""Schemas for the Phase 2A CHRI Analytics Engine.

Defines schemas for:
- CHRIScore: Mathematical composite score with driver decomposition
- HeatHotspot: Ranked spatial hotspot priority entity
- MitigationAction: Targeted cooling intervention action
- ZoneRecommendation: Comprehensive mitigation action plan
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CHRIScore(BaseModel):
    """Calculated Composite Heat Risk Index (CHRI) with full driver decomposition.
    
    Formula:
    CHRI = 0.35 * norm_lst + 0.20 * norm_pop + 0.20 * norm_bld - 0.15 * norm_ndvi + 0.10 * norm_aqi
    """
    zone_id: str = Field(..., description="Unique zone identifier")
    zone_name: str = Field(..., description="Human-readable zone name")
    score: float = Field(..., ge=0.0, le=100.0, description="CHRI composite score on a 0-100 scale")
    risk_level: str = Field(..., description="Classification: LOW (0-20), MODERATE (20-40), HIGH (40-60), SEVERE (60-80), CRITICAL (80-100)")
    normalized_lst: float = Field(..., ge=0.0, le=100.0, description="Normalized Land Surface Temperature (0-100)")
    normalized_population_density: float = Field(..., ge=0.0, le=100.0, description="Normalized Population Density (0-100)")
    normalized_building_density: float = Field(..., ge=0.0, le=100.0, description="Normalized Building Footprint Density (0-100)")
    normalized_ndvi: float = Field(..., ge=0.0, le=100.0, description="Normalized Vegetation Greenness Index (0-100)")
    normalized_aqi: float = Field(..., ge=0.0, le=100.0, description="Normalized Air Quality Index (0-100)")
    raw_metrics: Dict[str, float] = Field(..., description="Raw metric values prior to normalization")
    driver_contributions: Dict[str, float] = Field(..., description="Weighted contribution points of each factor")
    dominant_driver: str = Field(..., description="Primary risk-driving factor (e.g., 'high_lst', 'low_ndvi', 'high_population', 'high_building_density', 'poor_air_quality')")
    dominant_driver_pct: float = Field(..., description="Share percentage of total positive risk attributed to dominant driver")
    formula: str = Field(
        default="0.35 * norm_lst + 0.20 * norm_pop + 0.20 * norm_bld - 0.15 * norm_ndvi + 0.10 * norm_aqi",
        description="Applied deterministic formula specification",
    )
    timestamp: str = Field(..., description="ISO 8601 computation timestamp")


class HeatHotspot(BaseModel):
    """Ranked heat hotspot priority item for spatial planning and intervention routing."""
    rank: int = Field(..., ge=1, description="Citywide priority rank (1 = highest urgency)")
    zone_id: str = Field(..., description="Zone identifier")
    zone_name: str = Field(..., description="Civic district or neighborhood name")
    chri_score: float = Field(..., ge=0.0, le=100.0, description="CHRI score [0.0, 100.0]")
    risk_level: str = Field(..., description="Risk tier: LOW, MODERATE, HIGH, SEVERE, CRITICAL")
    dominant_driver: str = Field(..., description="Top risk-elevating driver")
    dominant_driver_pct: float = Field(..., description="Percentage of risk explained by top driver")
    surface_temperature_c: float = Field(..., description="Land surface temperature in °C")
    canopy_cover_pct: float = Field(..., description="Tree and vegetation canopy cover percentage")
    population_density: float = Field(..., description="Population density (people/km²)")
    building_density: float = Field(..., description="Building footprint coverage fraction")
    aqi: float = Field(..., description="Air Quality Index")
    center_coords: List[float] = Field(..., description="[longitude, latitude] centroid coordinate")
    urgency: str = Field(..., description="Action urgency tier: 'Immediate Action', 'Priority Intervention', or 'Routine Monitoring'")
    data_source: str = Field(
        default="WeatherAPI + NASA FIRMS + OpenStreetMap",
        description="Active satellite and vector telemetry sources",
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


class MitigationAction(BaseModel):
    """Specific urban heat mitigation intervention tailored to an identified risk driver."""
    action_id: str = Field(..., description="Identifier for the mitigation measure")
    title: str = Field(..., description="Action title")
    category: str = Field(..., description="Classification category (e.g. Nature-Based Solutions, Urban Fabric, Social Protection)")
    driver_addressed: str = Field(..., description="Targeted driver: 'high_lst', 'low_ndvi', 'high_population', 'high_building_density', or 'poor_air_quality'")
    description: str = Field(..., description="Actionable execution description for municipal engineers")
    cooling_impact_c: float = Field(..., description="Expected ambient/surface cooling potential in °C")
    cost_tier: str = Field(..., description="Estimated capital expenditure: $, $$, or $$$")
    implementation_time: str = Field(..., description="Expected deployment horizon")
    co_benefits: List[str] = Field(default_factory=list, description="Ancillary co-benefits (e.g., stormwater retention, biodiversity, air filtration)")


class ZoneRecommendation(BaseModel):
    """Decision intelligence package prescribing targeted interventions for an urban zone."""
    zone_id: str = Field(..., description="Zone identifier")
    zone_name: str = Field(..., description="Zone name")
    chri_score: float = Field(..., ge=0.0, le=100.0, description="Current baseline CHRI score")
    risk_level: str = Field(..., description="Current risk classification")
    dominant_drivers: List[str] = Field(..., description="Ranked list of risk-driving factors in descending order of severity")
    recommended_actions: List[MitigationAction] = Field(..., description="Prioritized list of prescriptive mitigation interventions")
    projected_cooling_c: float = Field(..., description="Total cumulative expected cooling benefit in °C")
    projected_chri_reduction: float = Field(..., description="Estimated CHRI score points reduction following complete implementation")
    summary: str = Field(..., description="Executive summary of the mitigation strategy")


class LiveRasterMetrics(BaseModel):
    """Zonal raster aggregations derived dynamically from Sentinel-2 & Landsat 8/9."""
    mean_lst_c: float = Field(..., description="Mean Land Surface Temperature in °C from Landsat 8/9 TIRS")
    max_lst_c: float = Field(..., description="Peak Land Surface Temperature in °C")
    mean_ndvi: float = Field(..., description="Mean vegetation greenness index from Sentinel-2 MSI")
    vegetation_coverage_pct: float = Field(..., description="Canopy & green vegetation coverage percentage")
    thermal_anomaly_c: float = Field(..., description="Thermal anomaly relative to baseline in °C")
    thermal_anomaly_pct: float = Field(..., description="Percentage thermal deviation from rural baseline")
    lst_sensor: str = Field(default="Landsat 8/9 TIRS 30m", description="Thermal sensor platform")
    ndvi_sensor: str = Field(default="Copernicus Sentinel-2 MSI 10m", description="Multispectral sensor platform")


class LiveCHRIScore(BaseModel):
    """Dynamically recomputed CHRI score incorporating live satellite raster statistics."""
    zone_id: str = Field(..., description="Zone identifier")
    zone_name: str = Field(..., description="Zone name")
    score: float = Field(..., ge=0.0, le=100.0, description="Dynamic live CHRI score")
    baseline_score: float = Field(..., ge=0.0, le=100.0, description="Static baseline CHRI score")
    delta_from_baseline: float = Field(..., description="Live score deviation from baseline")
    risk_level: str = Field(..., description="Live risk tier: LOW, MODERATE, HIGH, SEVERE, CRITICAL")
    hotspot_trend: str = Field(..., description="Temporal trend: 'emerging', 'persistent', or 'cooling'")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Analytical confidence score based on sensor resolution and data completeness")
    normalized_lst: float = Field(..., ge=0.0, le=100.0)
    normalized_population_density: float = Field(..., ge=0.0, le=100.0)
    normalized_building_density: float = Field(..., ge=0.0, le=100.0)
    normalized_ndvi: float = Field(..., ge=0.0, le=100.0)
    normalized_aqi: float = Field(..., ge=0.0, le=100.0)
    raw_metrics: Dict[str, float]
    driver_contributions: Dict[str, float]
    dominant_driver: str
    dominant_driver_pct: float
    raster_metrics: LiveRasterMetrics
    formula: str = Field(
        default="0.35 * norm_lst + 0.20 * norm_pop + 0.20 * norm_bld - 0.15 * norm_ndvi + 0.10 * norm_aqi",
        description="CHRI mathematical formula",
    )
    timestamp: str


class LiveHeatHotspot(BaseModel):
    """Real-time ranked heat hotspot with live raster attribution and trend classification."""
    rank: int = Field(..., ge=1)
    zone_id: str
    zone_name: str
    live_chri_score: float = Field(..., ge=0.0, le=100.0)
    baseline_chri_score: float = Field(..., ge=0.0, le=100.0)
    delta_score: float
    risk_level: str
    hotspot_trend: str = Field(..., description="'emerging', 'persistent', or 'cooling'")
    dominant_driver: str
    dominant_driver_pct: float
    mean_lst_c: float
    max_lst_c: float
    mean_ndvi: float
    canopy_cover_pct: float
    thermal_anomaly_c: float
    confidence_score: float = 0.94
    center_coords: List[float]
    urgency: str
    data_source: str = Field(
        default="WeatherAPI + NASA FIRMS + OpenStreetMap",
        description="Active satellite and telemetry sources",
    )
    observation_date: str = Field(
        default="2024-05-15",
        description="Observation date of satellite scene",
    )
    last_update_timestamp: str = Field(
        default="2026-09-09T03:00:00Z",
        description="Timestamp of hotspot update",
    )
    methodology: str = Field(
        default="Composite Heat Risk Index (CHRI) v3.0: Multi-Criteria Analytical Hierarchy Process fusing Land Surface Temperature (30%), Vegetation Deficit (20%), Building Density (15%), Population Exposure (15%), Water Distance (10%), and Weather Telemetry (10%)",
        description="Exact deterministic calculation methodology",
    )
    water_distance_km: Optional[float] = Field(default=None, description="Distance to nearest major cooling water body in km")
    weather_condition: Optional[str] = Field(default=None, description="Live meteorological condition summary")


class HotspotTrendsSummary(BaseModel):
    """Citywide hotspot trend intelligence comparing live raster metrics to baseline."""
    total_zones: int
    emerging_hotspots_count: int
    persistent_hotspots_count: int
    cooling_zones_count: int
    citywide_mean_lst_c: float
    citywide_mean_ndvi: float
    emerging_hotspots: List[LiveHeatHotspot]
    persistent_hotspots: List[LiveHeatHotspot]
    cooling_zones: List[LiveHeatHotspot]
    timestamp: str

