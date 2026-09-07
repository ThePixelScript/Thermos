"""Hotspot Detection, Qualification, and Risk Classification Engine."""
from typing import List, Tuple, Optional
from backend.app.schemas.common import RiskLevel
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import HeatRiskScore
from backend.app.schemas.hotspot import HotspotSummary
from backend.app.modules.geospatial.spatial_utils import compute_polygon_centroid
from backend.app.modules.heat.normalization import NormalizationConfig, DEFAULT_CONFIG


def classify_risk_level(score: float) -> RiskLevel:
    """Classify Composite Heat Risk Index score into standard categorical tiers."""
    if score < 30.0:
        return RiskLevel.LOW
    elif score < 50.0:
        return RiskLevel.MODERATE
    elif score < 70.0:
        return RiskLevel.HIGH
    elif score < 85.0:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.CRITICAL


def is_hotspot(
    risk_score: float,
    thermal_anomaly_c: float,
    config: NormalizationConfig = DEFAULT_CONFIG,
) -> bool:
    """Determine whether an urban zone qualifies as an active heat hotspot."""
    return (
        risk_score >= config.hotspot_risk_threshold
        or thermal_anomaly_c >= config.hotspot_anomaly_threshold_c
    )


def classify_hotspot_tier(
    risk_score: float,
    thermal_anomaly_c: float,
    config: NormalizationConfig = DEFAULT_CONFIG,
) -> str:
    """Assign a multi-criteria hotspot priority tier."""
    if not is_hotspot(risk_score, thermal_anomaly_c, config):
        return "NOT_HOTSPOT"

    if risk_score >= 85.0 or thermal_anomaly_c >= 12.0:
        return "CRITICAL_HOTSPOT"
    elif risk_score >= 70.0 or thermal_anomaly_c >= 8.0:
        return "SEVERE_HOTSPOT"
    elif risk_score >= 50.0 or thermal_anomaly_c >= 4.0:
        return "HIGH_HOTSPOT"
    else:
        return "MODERATE_HOTSPOT"


def build_hotspot_summary(
    zone: Zone,
    risk: HeatRiskScore,
    rank: int,
    config: NormalizationConfig = DEFAULT_CONFIG,
) -> HotspotSummary:
    """Construct a complete, typed HotspotSummary domain object."""
    centroid = compute_polygon_centroid(zone.geometry)
    dominant = risk.driver_contributions[0] if risk.driver_contributions else None
    anomaly = zone.thermal_observation.thermal_anomaly_c
    is_hot = is_hotspot(risk.score, anomaly, config)
    tier = classify_hotspot_tier(risk.score, anomaly, config)

    veg = round(zone.land_cover.tree_canopy_fraction + zone.land_cover.vegetation_grass_fraction, 3)
    exposure = round(min(100.0, (zone.demographics.population_density_per_sqkm / 50000.0) * 100.0), 1)

    return HotspotSummary(
        rank=rank,
        zone_id=zone.id,
        zone_name=zone.name,
        typology=zone.typology.value,
        temperature=zone.thermal_observation.land_surface_temp_c,
        vegetation=veg,
        imperviousness=zone.land_cover.impervious_surface_fraction,
        building_density=zone.land_cover.building_density,
        population_exposure=exposure,
        risk_score=risk.score,
        risk_level=risk.risk_level,
        land_surface_temp_c=zone.thermal_observation.land_surface_temp_c,
        thermal_anomaly_c=anomaly,
        dominant_driver=dominant.name if dominant else "Thermal Anomaly",
        dominant_driver_pct=dominant.contribution_pct if dominant else 0.0,
        total_population=zone.demographics.total_population,
        vulnerable_population=int(zone.demographics.total_population * zone.demographics.vulnerable_ratio),
        area_sqkm=zone.area_sqkm,
        center_coords=centroid,
        confidence=risk.confidence,
        is_hotspot=is_hot,
        hotspot_tier=tier,
    )
