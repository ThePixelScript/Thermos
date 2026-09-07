"""Deterministic Heat Risk Scoring Engine with Mathematical Driver Attribution and Evidence Tracking.

Implements the Composite Heat Risk Index (CHRI-v1.0) according to reproducible,
transparent formulas that separate physical hazard, human exposure, and
socio-ecological vulnerability, with auditable confidence and assumptions.
"""
from datetime import datetime, timezone
from typing import List, Tuple, Optional, Dict
from backend.app.schemas.common import RiskLevel, DataClassification
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import (
    DriverContribution,
    EvidenceItem,
    SubscoreBreakdown,
    HeatRiskScore,
    RiskAssessment,
)
from backend.app.modules.heat.normalization import (
    NormalizationConfig,
    DEFAULT_CONFIG,
    clamp,
    normalize_min_max,
    safe_extract_metric,
)
from backend.app.modules.heat.hotspot_detection import classify_risk_level

# Standard scientific and planning assumptions documented for auditability
DEFAULT_ASSUMPTIONS = [
    "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
    "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
    "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
    "Thermal anomaly is clamped at 15.0°C as maximum expected micro-urban thermal differential.",
    "Population exposure reference upper-bound is calibrated to 50,000 residents per km².",
    "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys.",
]


def compute_heat_risk(
    zone: Zone,
    config: Optional[NormalizationConfig] = None,
    strict: bool = False,
) -> HeatRiskScore:
    """Compute deterministic Composite Heat Risk Index (CHRI) with driver attribution,
    component scores, empirical evidence records, and assessment confidence tracking.

    Confidence denotes assessment and input data confidence (penalizing missing or out-of-bound
    indicator values) rather than physical sensor precision.
    """
    cfg = config or DEFAULT_CONFIG
    assumptions: List[str] = list(DEFAULT_ASSUMPTIONS)
    confidence = 0.98  # Base assessment confidence for complete, validated zone records

    # ---------------------------------------------------------
    # 1. Feature Extraction & Validation (with missing/invalid checks)
    # ---------------------------------------------------------
    # H1: Thermal Anomaly
    raw_anomaly = getattr(zone.thermal_observation, "thermal_anomaly_c", None)
    anomaly_val, note, penalty = safe_extract_metric(
        raw_anomaly, "thermal_anomaly_c", default_val=0.0,
        min_bound=-10.0, max_bound=30.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # H2: Impervious Surface Fraction
    raw_imp = getattr(zone.land_cover, "impervious_surface_fraction", None)
    imp_val, note, penalty = safe_extract_metric(
        raw_imp, "impervious_surface_fraction", default_val=0.5,
        min_bound=0.0, max_bound=1.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # H3: Albedo
    raw_albedo = getattr(zone.land_cover, "average_albedo", None)
    albedo_val, note, penalty = safe_extract_metric(
        raw_albedo, "average_albedo", default_val=0.20,
        min_bound=0.05, max_bound=0.90, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # E1: Population Density
    raw_pop = getattr(zone.demographics, "population_density_per_sqkm", None)
    pop_val, note, penalty = safe_extract_metric(
        raw_pop, "population_density_per_sqkm", default_val=0.0,
        min_bound=0.0, max_bound=200000.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # E2: Outdoor Worker Density
    raw_worker = getattr(zone.demographics, "outdoor_worker_density_per_sqkm", None)
    worker_val, note, penalty = safe_extract_metric(
        raw_worker, "outdoor_worker_density_per_sqkm", default_val=0.0,
        min_bound=0.0, max_bound=50000.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # V1: Tree Canopy Fraction
    raw_canopy = getattr(zone.land_cover, "tree_canopy_fraction", None)
    canopy_val, note, penalty = safe_extract_metric(
        raw_canopy, "tree_canopy_fraction", default_val=0.15,
        min_bound=0.0, max_bound=1.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # V2: Vulnerable Demographic Ratio
    raw_vuln = getattr(zone.demographics, "vulnerable_ratio", None)
    vuln_val, note, penalty = safe_extract_metric(
        raw_vuln, "vulnerable_ratio", default_val=0.20,
        min_bound=0.0, max_bound=1.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    # V3: Lack of AC / Cooling Infrastructure
    raw_ac = getattr(zone.demographics, "low_ac_coverage_ratio", None)
    ac_val, note, penalty = safe_extract_metric(
        raw_ac, "low_ac_coverage_ratio", default_val=0.30,
        min_bound=0.0, max_bound=1.0, strict=strict,
    )
    if note:
        assumptions.append(note)
    confidence -= penalty

    confidence = round(clamp(confidence, 0.20, 1.0), 2)

    # ---------------------------------------------------------
    # 2. Configurable Feature Normalization [0.0, 100.0]
    # ---------------------------------------------------------
    # Hazard components
    h_thermal = normalize_min_max(anomaly_val, cfg.thermal_anomaly_min_c, cfg.thermal_anomaly_max_c)
    h_impervious = normalize_min_max(imp_val, 0.0, 1.0)
    # Albedo: lower albedo = higher heat trapping (inverted normalization)
    h_albedo = normalize_min_max(albedo_val, cfg.albedo_min, cfg.albedo_max, invert=True)
    hazard_score = (cfg.w_h_thermal * h_thermal) + (cfg.w_h_impervious * h_impervious) + (cfg.w_h_albedo * h_albedo)

    # Exposure components
    e_pop = normalize_min_max(pop_val, 0.0, cfg.pop_density_max)
    e_worker = normalize_min_max(worker_val, 0.0, cfg.worker_density_max)
    exposure_score = (cfg.w_e_pop * e_pop) + (cfg.w_e_worker * e_worker)

    # Vulnerability components
    # Canopy: lower canopy = higher deficit (inverted normalization against target)
    v_canopy = normalize_min_max(canopy_val, 0.0, cfg.target_canopy_ratio, invert=True)
    v_demo = normalize_min_max(vuln_val, 0.0, cfg.vulnerable_age_ratio_max)
    v_ac = normalize_min_max(ac_val, 0.0, 1.0)
    vulnerability_score = (cfg.w_v_canopy * v_canopy) + (cfg.w_v_demo * v_demo) + (cfg.w_v_ac * v_ac)

    # ---------------------------------------------------------
    # 3. Composite Heat Risk Index (CHRI) Calculation
    # ---------------------------------------------------------
    total_w = cfg.weight_hazard + cfg.weight_exposure + cfg.weight_vulnerability
    w_h_norm = cfg.weight_hazard / total_w
    w_e_norm = cfg.weight_exposure / total_w
    w_v_norm = cfg.weight_vulnerability / total_w

    composite_score = (w_h_norm * hazard_score) + (w_e_norm * exposure_score) + (w_v_norm * vulnerability_score)
    composite_score = round(clamp(composite_score, 0.0, 100.0), 1)

    # Risk level classification
    level = classify_risk_level(composite_score)

    # Component scores map
    component_scores: Dict[str, float] = {
        "hazard": round(hazard_score, 1),
        "exposure": round(exposure_score, 1),
        "vulnerability": round(vulnerability_score, 1),
        "thermal_hazard": round(h_thermal, 1),
        "impervious_hazard": round(h_impervious, 1),
        "albedo_deficit": round(h_albedo, 1),
        "population_exposure": round(e_pop, 1),
        "worker_exposure": round(e_worker, 1),
        "canopy_deficit": round(v_canopy, 1),
        "demographic_vulnerability": round(v_demo, 1),
        "cooling_deficit": round(v_ac, 1),
    }

    # ---------------------------------------------------------
    # 4. Driver Attribution Breakdown & Evidence
    # ---------------------------------------------------------
    factors = [
        (
            "thermal_anomaly",
            "Thermal Heat Anomaly",
            w_h_norm * cfg.w_h_thermal * h_thermal,
            anomaly_val,
            "°C",
            "Hazard",
            f"Land surface temperature is {anomaly_val:+.1f}°C relative to the regional baseline.",
            f"Thermal anomaly of {anomaly_val:+.1f}°C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            DataClassification.DERIVED,
        ),
        (
            "canopy_deficit",
            "Tree Canopy Deficit",
            w_v_norm * cfg.w_v_canopy * v_canopy,
            (1.0 - canopy_val) * 100.0,
            "%",
            "Vulnerability",
            f"Only {canopy_val * 100.0:.1f}% vegetative shade exists in this urban footprint.",
            f"Canopy coverage is {canopy_val * 100.0:.1f}%, leaving an urban vegetative deficit of {(1.0 - canopy_val) * 100.0:.1f}%.",
            "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            DataClassification.DERIVED,
        ),
        (
            "impervious_surface",
            "Impervious Built Surface",
            w_h_norm * cfg.w_h_impervious * h_impervious,
            imp_val * 100.0,
            "%",
            "Hazard",
            f"{imp_val * 100.0:.0f}% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            f"Ground sealing ratio of {imp_val * 100.0:.1f}% impedes evaporative cooling.",
            "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            DataClassification.DERIVED,
        ),
        (
            "population_density",
            "Residential Population Exposure",
            w_e_norm * cfg.w_e_pop * e_pop,
            pop_val,
            "people/km²",
            "Exposure",
            f"Dense residential population of {pop_val:,.0f} residents per km².",
            f"High resident exposure density of {pop_val:,.0f} individuals per square kilometer.",
            "Synthetic Demonstration Data (Census Demographics proxy)",
            DataClassification.ESTIMATED,
        ),
        (
            "demographic_vulnerability",
            "Age-Vulnerable Population",
            w_v_norm * cfg.w_v_demo * v_demo,
            vuln_val * 100.0,
            "%",
            "Vulnerability",
            f"{vuln_val * 100.0:.1f}% of residents are young infants (<5) or seniors (>65).",
            f"{vuln_val * 100.0:.1f}% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            DataClassification.ESTIMATED,
        ),
        (
            "outdoor_workers",
            "Outdoor Physical Workers",
            w_e_norm * cfg.w_e_worker * e_worker,
            worker_val,
            "workers/km²",
            "Exposure",
            f"Concentration of {worker_val:,.0f} laborers working in unshaded ambient conditions.",
            f"High occupational outdoor exposure with {worker_val:,.0f} active shift laborers per km².",
            "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            DataClassification.ESTIMATED,
        ),
        (
            "low_ac_coverage",
            "Lack of Cooling Infrastructure",
            w_v_norm * cfg.w_v_ac * v_ac,
            ac_val * 100.0,
            "%",
            "Vulnerability",
            f"{ac_val * 100.0:.0f}% of households lack mechanical air conditioning or passive cooling.",
            f"{ac_val * 100.0:.1f}% household mechanical cooling deficit amplifies indoor thermal danger.",
            "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            DataClassification.ESTIMATED,
        ),
    ]

    total_abs_contribution = sum(f[2] for f in factors)
    driver_contributions: List[DriverContribution] = []
    evidence_items: List[EvidenceItem] = []

    for key, name, abs_val, raw_val, unit, dimension, explanation, ev_stmt, source, classification in factors:
        pct = round((abs_val / total_abs_contribution) * 100.0, 1) if total_abs_contribution > 0 else 0.0

        driver_contributions.append(
            DriverContribution(
                driver_key=key,
                name=name,
                contribution_pct=pct,
                raw_value=round(raw_val, 2),
                unit=unit,
                dimension=dimension,
                explanation=explanation,
                classification=classification,
            )
        )

        evidence_items.append(
            EvidenceItem(
                driver_key=key,
                factor_name=name,
                observed_value=round(raw_val, 2),
                unit=unit,
                contribution_pct=pct,
                evidence_statement=ev_stmt,
                confidence=confidence,
                data_source=source,
                classification=classification,
            )
        )

    # Sort descending by contribution percentage
    driver_contributions.sort(key=lambda d: d.contribution_pct, reverse=True)
    evidence_items.sort(key=lambda e: e.contribution_pct, reverse=True)

    return HeatRiskScore(
        score=composite_score,
        risk_level=level,
        subscores=SubscoreBreakdown(
            hazard_score=round(hazard_score, 1),
            exposure_score=round(exposure_score, 1),
            vulnerability_score=round(vulnerability_score, 1),
        ),
        component_scores=component_scores,
        driver_contributions=driver_contributions,
        evidence=evidence_items,
        confidence=confidence,
        assumptions=assumptions,
        formula_version="CHRI-v1.0-deterministic",
        calculation_timestamp=datetime.now(timezone.utc).isoformat(),
    )


def evaluate_zone_risk(
    zone: Zone,
    config: Optional[NormalizationConfig] = None,
    strict: bool = False,
) -> RiskAssessment:
    """Create complete RiskAssessment domain bundle for an urban zone."""
    score = compute_heat_risk(zone, config=config, strict=strict)
    return RiskAssessment(
        zone_id=zone.id,
        zone_name=zone.name,
        risk_score=score,
        confidence=score.confidence,
        assumptions=score.assumptions,
        classification=DataClassification.DERIVED,
    )
