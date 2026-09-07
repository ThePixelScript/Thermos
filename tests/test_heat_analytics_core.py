"""Comprehensive Unit Tests for THERMOS Heat Analytics Core.

Covers:
- normal inputs
- boundary values (min, max, extreme outliers)
- missing values
- invalid values (strict & safe mode)
- hotspot classification & tiering
- configurable normalization
"""
import math
import pytest
from backend.app.schemas.zone import Zone, LandCover, ThermalObservation, Demographics
from backend.app.schemas.common import Typology, GeoJSONPolygon, RiskLevel
from backend.app.modules.heat.normalization import (
    NormalizationConfig,
    DEFAULT_CONFIG,
    clamp,
    normalize_min_max,
    safe_extract_metric,
)
from backend.app.modules.heat.hotspot_detection import (
    classify_risk_level,
    is_hotspot,
    classify_hotspot_tier,
    build_hotspot_summary,
)
from backend.app.modules.risk.risk_engine import compute_heat_risk, evaluate_zone_risk


@pytest.fixture
def base_zone() -> Zone:
    """Fixture providing a standard valid zone."""
    return Zone(
        id="ZONE-NORM-01",
        name="Standard Urban District",
        typology=Typology.MIXED_USE,
        area_sqkm=2.0,
        geometry=GeoJSONPolygon(
            type="Polygon",
            coordinates=[[[77.20, 28.60], [77.22, 28.60], [77.22, 28.62], [77.20, 28.62], [77.20, 28.60]]],
        ),
        land_cover=LandCover(
            impervious_surface_fraction=0.65,
            tree_canopy_fraction=0.15,
            vegetation_grass_fraction=0.10,
            water_fraction=0.00,
            average_albedo=0.18,
            building_density=0.55,
        ),
        thermal_observation=ThermalObservation(
            land_surface_temp_c=37.5,
            baseline_temp_c=31.5,
            thermal_anomaly_c=6.0,
            sensor_source="Landsat-9 TIRS",
        ),
        demographics=Demographics(
            population_density_per_sqkm=18000.0,
            total_population=36000,
            vulnerable_ratio=0.22,
            outdoor_worker_density_per_sqkm=2500.0,
            low_ac_coverage_ratio=0.35,
        ),
    )


# =====================================================================
# 1. Normal Inputs
# =====================================================================
class TestNormalInputs:
    def test_normal_risk_score_in_valid_range(self, base_zone: Zone):
        risk = compute_heat_risk(base_zone)
        assert 0.0 <= risk.score <= 100.0
        assert risk.risk_level in [RiskLevel.HIGH, RiskLevel.MODERATE]

    def test_component_scores_populated(self, base_zone: Zone):
        risk = compute_heat_risk(base_zone)
        expected_keys = [
            "hazard", "exposure", "vulnerability",
            "thermal_hazard", "impervious_hazard", "albedo_deficit",
            "population_exposure", "worker_exposure",
            "canopy_deficit", "demographic_vulnerability", "cooling_deficit",
        ]
        for key in expected_keys:
            assert key in risk.component_scores
            assert 0.0 <= risk.component_scores[key] <= 100.0

    def test_driver_contributions_and_evidence(self, base_zone: Zone):
        risk = compute_heat_risk(base_zone)
        assert len(risk.driver_contributions) == 7
        assert len(risk.evidence) == 7

        # Sum of contributions should be 100% (+-0.5% due to rounding)
        total_pct = sum(d.contribution_pct for d in risk.driver_contributions)
        assert 99.5 <= total_pct <= 100.5

        # Drivers are sorted descending
        pcts = [d.contribution_pct for d in risk.driver_contributions]
        assert pcts == sorted(pcts, reverse=True)

        # Evidence fields are well-formed and audited
        for ev in risk.evidence:
            assert ev.factor_name != ""
            assert ev.evidence_statement != ""
            assert 0.0 <= ev.confidence <= 1.0
            assert "Synthetic Demonstration Data" in ev.data_source
            assert "proxy" in ev.data_source
            assert not any(bad in ev.unit for bad in ["┬", "Ã", "Â"])

        # Specific unit encoding check
        units = {ev.driver_key: ev.unit for ev in risk.evidence}
        assert units["thermal_anomaly"] == "°C"
        assert units["population_density"] == "people/km²"
        assert units["outdoor_workers"] == "workers/km²"

    def test_confidence_and_assumptions(self, base_zone: Zone):
        risk = compute_heat_risk(base_zone)
        assert risk.confidence >= 0.90
        assert len(risk.assumptions) >= 6
        assert any("synthetic demonstration data" in a.lower() for a in risk.assumptions)

    def test_evaluate_zone_risk_wrapper(self, base_zone: Zone):
        assessment = evaluate_zone_risk(base_zone)
        assert assessment.zone_id == base_zone.id
        assert assessment.confidence == assessment.risk_score.confidence
        assert len(assessment.assumptions) == len(assessment.risk_score.assumptions)


# =====================================================================
# 2. Boundary Values
# =====================================================================
class TestBoundaryValues:
    def test_absolute_minimum_boundary(self, base_zone: Zone):
        """Zone with zero hazard, zero exposure, zero vulnerability -> score 0.0."""
        min_zone = base_zone.model_copy(deep=True)
        min_zone.thermal_observation.thermal_anomaly_c = -2.0  # Cool refuge
        min_zone.land_cover.impervious_surface_fraction = 0.0
        min_zone.land_cover.average_albedo = 0.40  # Maximum reflective
        min_zone.land_cover.tree_canopy_fraction = 0.50  # Optimal canopy
        min_zone.demographics.population_density_per_sqkm = 0.0
        min_zone.demographics.outdoor_worker_density_per_sqkm = 0.0
        min_zone.demographics.vulnerable_ratio = 0.0
        min_zone.demographics.low_ac_coverage_ratio = 0.0

        risk = compute_heat_risk(min_zone)
        assert risk.score == 0.0
        assert risk.risk_level == RiskLevel.LOW
        assert risk.subscores.hazard_score == 0.0
        assert risk.subscores.exposure_score == 0.0
        assert risk.subscores.vulnerability_score == 0.0

    def test_absolute_maximum_boundary(self, base_zone: Zone):
        """Zone at max calibration limits -> score 100.0, CRITICAL."""
        max_zone = base_zone.model_copy(deep=True)
        max_zone.thermal_observation.thermal_anomaly_c = 15.0  # Max anomaly
        max_zone.land_cover.impervious_surface_fraction = 1.0  # Fully paved
        max_zone.land_cover.average_albedo = 0.10  # Max absorption
        max_zone.land_cover.tree_canopy_fraction = 0.0   # Zero shade
        max_zone.demographics.population_density_per_sqkm = 50000.0  # Max pop
        max_zone.demographics.outdoor_worker_density_per_sqkm = 10000.0  # Max workers
        max_zone.demographics.vulnerable_ratio = 0.50   # Max vulnerable
        max_zone.demographics.low_ac_coverage_ratio = 1.0  # Zero AC

        risk = compute_heat_risk(max_zone)
        assert risk.score == 100.0
        assert risk.risk_level == RiskLevel.CRITICAL
        assert risk.subscores.hazard_score == 100.0
        assert risk.subscores.exposure_score == 100.0
        assert risk.subscores.vulnerability_score == 100.0

    def test_extreme_outlier_clamping(self, base_zone: Zone):
        """Extreme values far exceeding bounds must clamp to 100.0 without overflow or NaN."""
        extreme_zone = base_zone.model_copy(deep=True)
        extreme_zone.thermal_observation.thermal_anomaly_c = 85.0
        extreme_zone.land_cover.impervious_surface_fraction = 1.0
        extreme_zone.land_cover.tree_canopy_fraction = 0.0
        extreme_zone.demographics.population_density_per_sqkm = 500000.0
        extreme_zone.demographics.outdoor_worker_density_per_sqkm = 100000.0

        risk = compute_heat_risk(extreme_zone)
        assert not math.isnan(risk.score)
        assert not math.isinf(risk.score)
        assert risk.score <= 100.0
        assert risk.risk_level == RiskLevel.CRITICAL


# =====================================================================
# 3. Missing Values Handling
# =====================================================================
class TestMissingValues:
    def test_missing_worker_density_imputation(self, base_zone: Zone):
        """Zone missing outdoor_worker_density must gracefully impute and penalize confidence."""
        missing_zone = base_zone.model_copy(deep=True)
        missing_zone.demographics.outdoor_worker_density_per_sqkm = None

        risk = compute_heat_risk(missing_zone)
        assert 0.0 <= risk.score <= 100.0
        # Confidence should be penalized from base 0.98
        assert risk.confidence < 0.95
        # An assumption must be documented
        assert any("Missing 'outdoor_worker_density_per_sqkm'" in a for a in risk.assumptions)

    def test_missing_multiple_demographic_fields(self, base_zone: Zone):
        """Zone missing multiple optional/census metrics still computes deterministically."""
        missing_zone = base_zone.model_copy(deep=True)
        missing_zone.demographics.outdoor_worker_density_per_sqkm = None
        missing_zone.demographics.low_ac_coverage_ratio = None

        risk = compute_heat_risk(missing_zone)
        assert 0.0 <= risk.score <= 100.0
        assert risk.confidence <= 0.85
        assert len(risk.assumptions) >= 7


# =====================================================================
# 4. Invalid Values Handling
# =====================================================================
class TestInvalidValues:
    def test_strict_mode_rejects_negative_population(self, base_zone: Zone):
        """Strict validation mode raises ValueError on invalid negative population."""
        invalid_zone = base_zone.model_copy(deep=True)
        invalid_zone.demographics.population_density_per_sqkm = -500.0

        with pytest.raises(ValueError, match="below allowed minimum"):
            compute_heat_risk(invalid_zone, strict=True)

    def test_strict_mode_rejects_nan_anomaly(self, base_zone: Zone):
        """Strict validation mode raises ValueError on NaN thermal anomaly."""
        invalid_zone = base_zone.model_copy(deep=True)
        invalid_zone.thermal_observation.thermal_anomaly_c = float("nan")

        with pytest.raises(ValueError, match="Non-finite value"):
            compute_heat_risk(invalid_zone, strict=True)

    def test_safe_mode_clamps_invalid_impervious_fraction(self, base_zone: Zone):
        """Non-strict (safe) mode clamps out-of-bounds fraction and penalizes confidence."""
        invalid_zone = base_zone.model_copy(deep=True)
        invalid_zone.land_cover.impervious_surface_fraction = 1.45

        risk = compute_heat_risk(invalid_zone, strict=False)
        assert 0.0 <= risk.score <= 100.0
        assert risk.confidence < 0.98
        assert any("clamped to maximum allowed 1.0" in a for a in risk.assumptions)

    def test_safe_mode_handles_nan_gracefully(self, base_zone: Zone):
        """Non-strict mode replaces NaN with default and records assumption."""
        invalid_zone = base_zone.model_copy(deep=True)
        invalid_zone.land_cover.average_albedo = float("nan")

        risk = compute_heat_risk(invalid_zone, strict=False)
        assert not math.isnan(risk.score)
        assert any("Non-finite value" in a for a in risk.assumptions)


# =====================================================================
# 5. Hotspot Classification & Tiering
# =====================================================================
class TestHotspotClassification:
    def test_is_hotspot_by_risk_score(self):
        cfg = NormalizationConfig(hotspot_risk_threshold=50.0, hotspot_anomaly_threshold_c=3.0)
        assert is_hotspot(risk_score=55.0, thermal_anomaly_c=1.0, config=cfg) is True
        assert is_hotspot(risk_score=45.0, thermal_anomaly_c=1.0, config=cfg) is False

    def test_is_hotspot_by_thermal_anomaly(self):
        cfg = NormalizationConfig(hotspot_risk_threshold=50.0, hotspot_anomaly_threshold_c=3.0)
        # Even with low composite risk, high thermal anomaly qualifies as a hotspot
        assert is_hotspot(risk_score=35.0, thermal_anomaly_c=3.5, config=cfg) is True
        assert is_hotspot(risk_score=35.0, thermal_anomaly_c=2.0, config=cfg) is False

    def test_classify_hotspot_tiers(self):
        cfg = NormalizationConfig()
        assert classify_hotspot_tier(90.0, 14.0, cfg) == "CRITICAL_HOTSPOT"
        assert classify_hotspot_tier(75.0, 6.0, cfg) == "SEVERE_HOTSPOT"
        assert classify_hotspot_tier(55.0, 4.5, cfg) == "HIGH_HOTSPOT"
        assert classify_hotspot_tier(40.0, 3.5, cfg) == "MODERATE_HOTSPOT"
        assert classify_hotspot_tier(25.0, 1.0, cfg) == "NOT_HOTSPOT"

    def test_classify_risk_level_thresholds(self):
        assert classify_risk_level(15.0) == RiskLevel.LOW
        assert classify_risk_level(29.9) == RiskLevel.LOW
        assert classify_risk_level(30.0) == RiskLevel.MODERATE
        assert classify_risk_level(49.9) == RiskLevel.MODERATE
        assert classify_risk_level(50.0) == RiskLevel.HIGH
        assert classify_risk_level(69.9) == RiskLevel.HIGH
        assert classify_risk_level(70.0) == RiskLevel.SEVERE
        assert classify_risk_level(84.9) == RiskLevel.SEVERE
        assert classify_risk_level(85.0) == RiskLevel.CRITICAL
        assert classify_risk_level(99.0) == RiskLevel.CRITICAL

    def test_build_hotspot_summary(self, base_zone: Zone):
        risk = compute_heat_risk(base_zone)
        summary = build_hotspot_summary(base_zone, risk, rank=1)
        assert summary.rank == 1
        assert summary.zone_id == base_zone.id
        assert summary.risk_score == risk.score
        assert summary.is_hotspot is True
        assert summary.hotspot_tier in ["HIGH_HOTSPOT", "SEVERE_HOTSPOT", "CRITICAL_HOTSPOT"]
        assert summary.confidence == risk.confidence


# =====================================================================
# 6. Configurable Normalization & Re-weighting
# =====================================================================
class TestConfigurableNormalization:
    def test_custom_dimension_weights_alter_score_deterministically(self, base_zone: Zone):
        """Re-weighting dimensions produces predictable changes in composite score."""
        # Baseline balanced weights
        r_default = compute_heat_risk(base_zone, DEFAULT_CONFIG)

        # Hazard-heavy configuration
        cfg_hazard = NormalizationConfig(
            weight_hazard=0.90, weight_exposure=0.05, weight_vulnerability=0.05
        )
        r_hazard = compute_heat_risk(base_zone, cfg_hazard)

        # Vulnerability-heavy configuration
        cfg_vuln = NormalizationConfig(
            weight_hazard=0.05, weight_exposure=0.05, weight_vulnerability=0.90
        )
        r_vuln = compute_heat_risk(base_zone, cfg_vuln)

        assert r_default.score != r_hazard.score
        assert r_hazard.score != r_vuln.score
        # Re-calculating with same config is 100% deterministic
        assert compute_heat_risk(base_zone, cfg_hazard).score == r_hazard.score

    def test_custom_hotspot_thresholds(self, base_zone: Zone):
        strict_cfg = NormalizationConfig(hotspot_risk_threshold=90.0, hotspot_anomaly_threshold_c=10.0)
        lenient_cfg = NormalizationConfig(hotspot_risk_threshold=20.0, hotspot_anomaly_threshold_c=1.0)

        risk = compute_heat_risk(base_zone)
        anomaly = base_zone.thermal_observation.thermal_anomaly_c

        # Under strict threshold, zone is not a hotspot
        assert is_hotspot(risk.score, anomaly, strict_cfg) is False
        # Under lenient threshold, zone is a hotspot
        assert is_hotspot(risk.score, anomaly, lenient_cfg) is True


# =====================================================================
# 7. Centralized Hotspot Logic in Repository
# =====================================================================
class TestCentralizedHotspotLogic:
    def test_repository_uses_centralized_hotspot_functions(self):
        from backend.app.data.repository import repository
        hotspots = repository.list_hotspots(min_risk_score=0.0)
        assert len(hotspots) > 0
        for h in hotspots:
            assert h.is_hotspot == is_hotspot(h.risk_score, h.thermal_anomaly_c)
            assert h.hotspot_tier == classify_hotspot_tier(h.risk_score, h.thermal_anomaly_c)

