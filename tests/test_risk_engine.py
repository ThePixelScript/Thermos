"""Unit tests for the deterministic heat risk engine."""
from backend.app.modules.risk.risk_engine import compute_heat_risk
from backend.app.schemas.common import RiskLevel
from backend.app.schemas.zone import Zone


def test_high_risk_zone_calculation(sample_zone: Zone):
    risk = compute_heat_risk(sample_zone)
    assert 0.0 <= risk.score <= 100.0
    assert risk.score >= 60.0  # Dense industrial hotspot with 12°C anomaly should be high/severe
    assert risk.risk_level in [RiskLevel.HIGH, RiskLevel.SEVERE, RiskLevel.CRITICAL]
    assert risk.subscores.hazard_score > 50.0


def test_cool_refuge_calculation(cool_zone: Zone):
    risk = compute_heat_risk(cool_zone)
    assert 0.0 <= risk.score <= 100.0
    assert risk.score < 30.0  # Forest park with negative anomaly should be low risk
    assert risk.risk_level == RiskLevel.LOW
    assert risk.subscores.hazard_score < 20.0


def test_driver_contributions_sum_to_100(sample_zone: Zone):
    risk = compute_heat_risk(sample_zone)
    assert len(risk.driver_contributions) > 0
    total_pct = sum(d.contribution_pct for d in risk.driver_contributions)
    # Allows minor floating point rounding deviation
    assert 99.0 <= total_pct <= 101.0


def test_driver_contributions_are_sorted(sample_zone: Zone):
    risk = compute_heat_risk(sample_zone)
    pcts = [d.contribution_pct for d in risk.driver_contributions]
    assert pcts == sorted(pcts, reverse=True)


def test_risk_score_is_deterministic(sample_zone: Zone):
    r1 = compute_heat_risk(sample_zone)
    r2 = compute_heat_risk(sample_zone)
    assert r1.score == r2.score
    assert r1.subscores.hazard_score == r2.subscores.hazard_score
    assert r1.subscores.exposure_score == r2.subscores.exposure_score
    assert r1.subscores.vulnerability_score == r2.subscores.vulnerability_score
    assert len(r1.driver_contributions) == len(r2.driver_contributions)


def test_extreme_boundary_values(sample_zone: Zone):
    # Test with extreme values far exceeding reference bounds
    extreme_zone = sample_zone.model_copy(deep=True)
    extreme_zone.thermal_observation.thermal_anomaly_c = 40.0
    extreme_zone.land_cover.impervious_surface_fraction = 1.0
    extreme_zone.demographics.population_density_per_sqkm = 200000.0
    extreme_zone.demographics.vulnerable_ratio = 1.0

    risk = compute_heat_risk(extreme_zone)
    assert risk.score <= 100.0
    assert risk.risk_level == RiskLevel.CRITICAL
