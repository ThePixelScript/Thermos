"""Unit and Integration Tests for Phase 6: Urban Climate Digital Twin & Scenario Simulator.

Tests:
- Deterministic delta calculations across all 6 intervention types
- Single zone digital twin counterfactual simulation engine
- Multi-scenario side-by-side comparison engine & decision logic
- Zone simulation metadata retrieval
- Citywide portfolio simulation across budget tiers (LOW, MEDIUM, HIGH, ALL)
- REST API endpoints (/api/v1/simulation/* and /api/simulation/*)
- Error handling (404 not found, 400 invalid tier, 422 validation error)
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data.repository import repository
from backend.app.schemas.simulation import (
    SimulationRequest,
    ScenarioComparisonRequest,
)
from backend.app.modules.simulation.simulator import (
    scenario_simulator_engine,
    normalize_intervention_type,
    BUDGET_CAPS,
)


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. Normalization & Physical Delta Physics Tests
# ---------------------------------------------------------------------------

def test_normalize_intervention_type():
    assert normalize_intervention_type("urban_forestry") == "urban_forestry"
    assert normalize_intervention_type("water_bodies_restoration") == "water_body_restoration"
    assert normalize_intervention_type("water-restoration") == "water_body_restoration"
    assert normalize_intervention_type("aqi_mitigation") == "aqi_reduction"
    assert normalize_intervention_type("clean_air") == "aqi_reduction"
    assert normalize_intervention_type("COOL_ROOFS") == "cool_roofs"


def test_compute_counterfactual_deltas_forestry():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    lst_red, ndvi_inc, aqi_red = scenario_simulator_engine.compute_counterfactual_deltas(
        zone=zone,
        intervention_type="urban_forestry",
        coverage_pct=50.0,
    )
    assert lst_red > 0.0
    assert ndvi_inc > 0.0
    assert aqi_red > 0.0


def test_compute_counterfactual_deltas_cool_roofs():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    lst_red, ndvi_inc, aqi_red = scenario_simulator_engine.compute_counterfactual_deltas(
        zone=zone,
        intervention_type="cool_roofs",
        coverage_pct=60.0,
    )
    assert lst_red > 0.0
    assert ndvi_inc == 0.0  # Cool roofs don't add vegetation
    assert aqi_red >= 0.0


def test_compute_counterfactual_deltas_reflective_pavements():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    lst_red, ndvi_inc, aqi_red = scenario_simulator_engine.compute_counterfactual_deltas(
        zone=zone,
        intervention_type="reflective_pavements",
        coverage_pct=40.0,
    )
    assert lst_red > 0.0
    assert ndvi_inc == 0.0


def test_compute_counterfactual_deltas_water_bodies():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    lst_red, ndvi_inc, aqi_red = scenario_simulator_engine.compute_counterfactual_deltas(
        zone=zone,
        intervention_type="water_body_restoration",
        coverage_pct=50.0,
    )
    assert lst_red > 0.0
    assert ndvi_inc > 0.0


def test_compute_counterfactual_deltas_aqi_reduction():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    lst_red, ndvi_inc, aqi_red = scenario_simulator_engine.compute_counterfactual_deltas(
        zone=zone,
        intervention_type="aqi_reduction",
        coverage_pct=75.0,
    )
    assert aqi_red > 10.0
    assert lst_red >= 0.0


# ---------------------------------------------------------------------------
# 2. Simulator Engine Core Tests
# ---------------------------------------------------------------------------

def test_simulate_zone_engine_basic():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    req = SimulationRequest(
        zone_id="ZONE-01",
        intervention_type="cool_roofs",
        coverage_pct=50.0,
        budget=150_000.0,
        implementation_horizon="short_term",
        scenario_name="50% Cool Roof Rollout",
    )

    result = scenario_simulator_engine.simulate_zone(zone, req)

    assert result.zone_id == "ZONE-01"
    assert result.scenario_name == "50% Cool Roof Rollout"
    assert result.simulated_chri <= result.baseline_chri
    assert result.projected_chri_reduction >= 0.0
    assert result.simulated_lst_c <= result.baseline_lst_c
    assert result.projected_lst_reduction >= 0.0
    assert result.exposed_population_reduction >= 0
    assert result.economic_benefit_usd > 0.0
    assert result.roi > 0.0
    assert len(result.applied_interventions) >= 1


def test_compare_scenarios_engine():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    comp_req = ScenarioComparisonRequest(
        zone_id="ZONE-01",
        scenario_a=SimulationRequest(
            zone_id="ZONE-01",
            intervention_type="cool_roofs",
            coverage_pct=80.0,
            budget=250_000.0,
            implementation_horizon="short_term",
            scenario_name="Aggressive Cool Roofs",
        ),
        scenario_b=SimulationRequest(
            zone_id="ZONE-01",
            intervention_type="shade_corridors",
            coverage_pct=30.0,
            budget=80_000.0,
            implementation_horizon="short_term",
            scenario_name="Light Transit Shading",
        ),
    )

    comparison = scenario_simulator_engine.compare_scenarios(zone, comp_req)

    assert comparison.zone_id == "ZONE-01"
    assert comparison.winner_scenario in ["Scenario A", "Scenario B", "Tie"]
    assert comparison.baseline.projected_chri_reduction == 0.0
    assert comparison.baseline.projected_lst_reduction == 0.0
    assert comparison.scenario_a.projected_chri_reduction > comparison.baseline.projected_chri_reduction
    assert len(comparison.winning_metric) > 0
    assert len(comparison.recommendation) > 0


def test_citywide_simulation_engine():
    zones = repository.list_zones()
    assert len(zones) > 0

    res_low = scenario_simulator_engine.simulate_citywide_portfolio(zones, "LOW")
    res_high = scenario_simulator_engine.simulate_citywide_portfolio(zones, "HIGH")

    assert res_low.budget_tier == "LOW"
    assert res_high.budget_tier == "HIGH"
    assert res_low.budget_limit_usd == BUDGET_CAPS["LOW"]
    assert res_high.budget_limit_usd == BUDGET_CAPS["HIGH"]
    assert res_high.city_chri_change >= res_low.city_chri_change
    assert res_high.temperature_reduction >= res_low.temperature_reduction
    assert res_high.zones_simulated == len(zones)


def test_zone_simulation_metadata_engine():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    meta = scenario_simulator_engine.get_zone_simulation_metadata(zone)
    assert meta.zone_id == "ZONE-01"
    assert meta.current_chri > 0.0
    assert meta.total_population > 0
    assert "cool_roofs" in meta.available_interventions
    assert "urban_forestry" in meta.available_interventions


# ---------------------------------------------------------------------------
# 3. API Integration Tests: /api/v1/simulation/* and /api/simulation/*
# ---------------------------------------------------------------------------

def test_api_get_zone_metadata(client):
    response = client.get("/api/v1/simulation/zone/ZONE-01")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-01"
    assert "current_chri" in data
    assert "available_interventions" in data
    assert len(data["available_interventions"]) == 6

    # Test case insensitivity
    response_lower = client.get("/api/v1/simulation/zone/zone-01")
    assert response_lower.status_code == 200

    # Test backward compatible mirror
    response_mirror = client.get("/api/simulation/zone/ZONE-01")
    assert response_mirror.status_code == 200


def test_api_get_zone_metadata_not_found(client):
    response = client.get("/api/v1/simulation/zone/NONEXISTENT-99")
    assert response.status_code == 404


def test_api_post_run_simulation(client):
    payload = {
        "zone_id": "ZONE-01",
        "intervention_type": "urban_forestry",
        "coverage_pct": 45.0,
        "budget": 200000.0,
        "implementation_horizon": "mid_term",
        "scenario_name": "Greening Phase 1",
    }

    # Test /api/v1
    res = client.post("/api/v1/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == "ZONE-01"
    assert data["intervention_type"] == "urban_forestry"
    assert data["projected_chri_reduction"] >= 0.0
    assert data["projected_lst_reduction"] >= 0.0
    assert data["simulated_chri"] <= data["baseline_chri"]

    # Test /api mirror
    res_mirror = client.post("/api/simulation/run", json=payload)
    assert res_mirror.status_code == 200


def test_api_post_run_simulation_validation_errors(client):
    # Coverage out of bounds (> 100)
    payload_bad_cov = {
        "zone_id": "ZONE-01",
        "intervention_type": "cool_roofs",
        "coverage_pct": 120.0,
        "budget": 50000.0,
    }
    res = client.post("/api/v1/simulation/run", json=payload_bad_cov)
    assert res.status_code == 422

    # Negative budget
    payload_bad_budget = {
        "zone_id": "ZONE-01",
        "intervention_type": "cool_roofs",
        "coverage_pct": 50.0,
        "budget": -100.0,
    }
    res2 = client.post("/api/v1/simulation/run", json=payload_bad_budget)
    assert res2.status_code == 422

    # Non-existent zone
    payload_bad_zone = {
        "zone_id": "UNKNOWN_ZONE",
        "intervention_type": "cool_roofs",
        "coverage_pct": 50.0,
        "budget": 50000.0,
    }
    res3 = client.post("/api/v1/simulation/run", json=payload_bad_zone)
    assert res3.status_code == 404


def test_api_post_compare_scenarios(client):
    payload = {
        "zone_id": "ZONE-01",
        "scenario_a": {
            "zone_id": "ZONE-01",
            "intervention_type": "cool_roofs",
            "coverage_pct": 70.0,
            "budget": 200000.0,
            "implementation_horizon": "short_term",
            "scenario_name": "Cool Roofs Option",
        },
        "scenario_b": {
            "zone_id": "ZONE-01",
            "intervention_type": "urban_forestry",
            "coverage_pct": 40.0,
            "budget": 200000.0,
            "implementation_horizon": "long_term",
            "scenario_name": "Canopy Greening Option",
        },
    }

    res = client.post("/api/v1/simulation/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == "ZONE-01"
    assert "baseline" in data
    assert "scenario_a" in data
    assert "scenario_b" in data
    assert data["winner_scenario"] in ["Scenario A", "Scenario B", "Tie"]
    assert "recommendation" in data

    # Mirror
    res_mirror = client.post("/api/simulation/compare", json=payload)
    assert res_mirror.status_code == 200


def test_api_get_citywide_simulation(client):
    # Default (MEDIUM)
    res_default = client.get("/api/v1/simulation/citywide")
    assert res_default.status_code == 200
    data_med = res_default.json()
    assert data_med["budget_tier"] == "MEDIUM"
    assert data_med["total_cost_usd"] <= BUDGET_CAPS["MEDIUM"]
    assert data_med["city_chri_change"] > 0.0

    # Explicit LOW
    res_low = client.get("/api/v1/simulation/citywide?budget_tier=LOW")
    assert res_low.status_code == 200
    assert res_low.json()["budget_tier"] == "LOW"

    # Explicit HIGH
    res_high = client.get("/api/v1/simulation/citywide?budget_tier=HIGH")
    assert res_high.status_code == 200
    assert res_high.json()["budget_tier"] == "HIGH"

    # ALL tiers
    res_all = client.get("/api/v1/simulation/citywide?budget_tier=ALL")
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert "LOW" in data_all
    assert "MEDIUM" in data_all
    assert "HIGH" in data_all

    # Invalid tier -> 400
    res_invalid = client.get("/api/v1/simulation/citywide?budget_tier=MEGA")
    assert res_invalid.status_code == 400

    # Mirror route
    res_mirror = client.get("/api/simulation/citywide")
    assert res_mirror.status_code == 200
