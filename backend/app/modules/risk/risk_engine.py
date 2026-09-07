"""Deterministic Heat Risk Scoring Engine with Mathematical Driver Attribution.

Implements the Composite Heat Risk Index (CHRI) according to reproducible,
transparent formulas that separate physical hazard, human exposure, and
socio-ecological vulnerability.
"""
from datetime import datetime, timezone
from typing import List, Tuple
from backend.app.schemas.common import RiskLevel, DataClassification
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import (
    DriverContribution,
    SubscoreBreakdown,
    HeatRiskScore,
    RiskAssessment,
)
from backend.app.core.config import settings


def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(val, max_val))


def compute_heat_risk(
    zone: Zone,
    w_hazard: float = settings.weight_hazard,
    w_exposure: float = settings.weight_exposure,
    w_vulnerability: float = settings.weight_vulnerability,
) -> HeatRiskScore:
    """Compute deterministic Composite Heat Risk Index (CHRI) with driver attribution.
    
    All inputs are normalized into [0.0, 100.0] scales using documented reference bounds.
    """
    # 1. Hazard Dimension (Physical Thermal Environment)
    # H1: Thermal Anomaly: 0°C (or below) -> 0.0, 15°C anomaly -> 100.0
    anomaly = zone.thermal_observation.thermal_anomaly_c
    h_thermal = clamp((anomaly / 15.0) * 100.0, 0.0, 100.0)
    
    # H2: Impervious Surface: 0% -> 0.0, 100% -> 100.0
    h_impervious = clamp(zone.land_cover.impervious_surface_fraction * 100.0, 0.0, 100.0)
    
    # H3: Low Albedo / Surface Heat Trapping: albedo 0.40 -> 0.0, albedo 0.10 -> 100.0
    albedo = zone.land_cover.average_albedo
    h_albedo = clamp(((0.40 - albedo) / (0.40 - 0.10)) * 100.0, 0.0, 100.0)
    
    w_h_thermal, w_h_impervious, w_h_albedo = 0.50, 0.30, 0.20
    hazard_score = (w_h_thermal * h_thermal) + (w_h_impervious * h_impervious) + (w_h_albedo * h_albedo)

    # 2. Exposure Dimension (Human Footprint)
    # E1: Population Density: 0 -> 0, 50,000/km² -> 100
    pop_dens = zone.demographics.population_density_per_sqkm
    e_pop = clamp((pop_dens / 50000.0) * 100.0, 0.0, 100.0)
    
    # E2: Outdoor Worker Density: 0 -> 0, 10,000/km² -> 100
    worker_dens = zone.demographics.outdoor_worker_density_per_sqkm
    e_worker = clamp((worker_dens / 10000.0) * 100.0, 0.0, 100.0)
    
    w_e_pop, w_e_worker = 0.60, 0.40
    exposure_score = (w_e_pop * e_pop) + (w_e_worker * e_worker)

    # 3. Vulnerability Dimension (Susceptibility & Lack of Adaptive Capacity)
    # V1: Canopy Deficit: >= 50% canopy -> 0 deficit, 0% canopy -> 100 deficit
    canopy = zone.land_cover.tree_canopy_fraction
    v_canopy_deficit = clamp(((0.50 - canopy) / 0.50) * 100.0, 0.0, 100.0)
    
    # V2: Demographic Sensitivity (Elderly + Children fraction): 0% -> 0, 50% -> 100
    vuln_ratio = zone.demographics.vulnerable_ratio
    v_demographics = clamp((vuln_ratio / 0.50) * 100.0, 0.0, 100.0)
    
    # V3: Lack of Cooling (No AC coverage): 0% -> 0, 100% -> 100
    low_ac = zone.demographics.low_ac_coverage_ratio
    v_ac = clamp(low_ac * 100.0, 0.0, 100.0)
    
    w_v_canopy, w_v_demo, w_v_ac = 0.40, 0.35, 0.25
    vulnerability_score = (w_v_canopy * v_canopy_deficit) + (w_v_demo * v_demographics) + (w_v_ac * v_ac)

    # Composite Heat Risk Index (CHRI)
    # Normalize global weights if needed
    total_w = w_hazard + w_exposure + w_vulnerability
    w_h_norm = w_hazard / total_w
    w_e_norm = w_exposure / total_w
    w_v_norm = w_vulnerability / total_w
    
    composite_score = (w_h_norm * hazard_score) + (w_e_norm * exposure_score) + (w_v_norm * vulnerability_score)
    composite_score = round(clamp(composite_score, 0.0, 100.0), 1)

    # Categorize Risk Level
    if composite_score < 30.0:
        level = RiskLevel.LOW
    elif composite_score < 50.0:
        level = RiskLevel.MODERATE
    elif composite_score < 70.0:
        level = RiskLevel.HIGH
    elif composite_score < 85.0:
        level = RiskLevel.SEVERE
    else:
        level = RiskLevel.CRITICAL

    # Driver Attribution (Exact mathematical share of composite score)
    # Each subfactor's absolute contribution = global_weight * subfactor_weight * normalized_val
    factors = [
        (
            "thermal_anomaly",
            "Thermal Heat Anomaly",
            w_h_norm * w_h_thermal * h_thermal,
            zone.thermal_observation.thermal_anomaly_c,
            "°C",
            "Hazard",
            f"Land surface temperature is {zone.thermal_observation.thermal_anomaly_c:+.1f}°C relative to the regional baseline.",
        ),
        (
            "canopy_deficit",
            "Tree Canopy Deficit",
            w_v_norm * w_v_canopy * v_canopy_deficit,
            (1.0 - zone.land_cover.tree_canopy_fraction) * 100.0,
            "%",
            "Vulnerability",
            f"Only {zone.land_cover.tree_canopy_fraction * 100.0:.1f}% vegetative shade exists in this urban footprint.",
        ),
        (
            "impervious_surface",
            "Impervious Built Surface",
            w_h_norm * w_h_impervious * h_impervious,
            zone.land_cover.impervious_surface_fraction * 100.0,
            "%",
            "Hazard",
            f"{zone.land_cover.impervious_surface_fraction * 100.0:.0f}% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
        ),
        (
            "population_density",
            "Residential Population Exposure",
            w_e_norm * w_e_pop * e_pop,
            zone.demographics.population_density_per_sqkm,
            "people/km²",
            "Exposure",
            f"Dense residential population of {zone.demographics.population_density_per_sqkm:,.0f} residents per km².",
        ),
        (
            "demographic_vulnerability",
            "Age-Vulnerable Population",
            w_v_norm * w_v_demo * v_demographics,
            zone.demographics.vulnerable_ratio * 100.0,
            "%",
            "Vulnerability",
            f"{zone.demographics.vulnerable_ratio * 100.0:.1f}% of residents are young infants (<5) or seniors (>65).",
        ),
        (
            "outdoor_workers",
            "Outdoor Physical Workers",
            w_e_norm * w_e_worker * e_worker,
            zone.demographics.outdoor_worker_density_per_sqkm,
            "workers/km²",
            "Exposure",
            f"Concentration of {zone.demographics.outdoor_worker_density_per_sqkm:,.0f} laborers working in unshaded ambient conditions.",
        ),
        (
            "low_ac_coverage",
            "Lack of Cooling Infrastructure",
            w_v_norm * w_v_ac * v_ac,
            zone.demographics.low_ac_coverage_ratio * 100.0,
            "%",
            "Vulnerability",
            f"{zone.demographics.low_ac_coverage_ratio * 100.0:.0f}% of households lack mechanical air conditioning or passive cooling.",
        ),
    ]

    total_abs_contribution = sum(f[2] for f in factors)
    driver_contributions: List[DriverContribution] = []

    for key, name, abs_val, raw_val, unit, dimension, explanation in factors:
        if total_abs_contribution > 0:
            pct = round((abs_val / total_abs_contribution) * 100.0, 1)
        else:
            pct = 0.0
        
        driver_contributions.append(
            DriverContribution(
                driver_key=key,
                name=name,
                contribution_pct=pct,
                raw_value=round(raw_val, 2),
                unit=unit,
                dimension=dimension,
                explanation=explanation,
                classification=DataClassification.DERIVED,
            )
        )

    # Sort drivers descending by contribution percentage
    driver_contributions.sort(key=lambda d: d.contribution_pct, reverse=True)

    return HeatRiskScore(
        score=composite_score,
        risk_level=level,
        subscores=SubscoreBreakdown(
            hazard_score=round(hazard_score, 1),
            exposure_score=round(exposure_score, 1),
            vulnerability_score=round(vulnerability_score, 1),
        ),
        driver_contributions=driver_contributions,
        formula_version="CHRI-v1.0-deterministic",
        calculation_timestamp=datetime.now(timezone.utc).isoformat(),
    )


def evaluate_zone_risk(zone: Zone) -> RiskAssessment:
    """Create complete RiskAssessment for a zone."""
    score = compute_heat_risk(zone)
    return RiskAssessment(
        zone_id=zone.id,
        zone_name=zone.name,
        risk_score=score,
        classification=DataClassification.DERIVED,
    )
