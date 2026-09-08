"""Unit and Integration Tests for Phase 5: Municipal Decision Intelligence.

Tests:
- Priority score formula mathematical accuracy & component weighting
- Vulnerability & Feasibility normalization boundaries
- Ranked priority intervention queue ordering
- Municipal action planner across all 6 core categories
- Resource allocation portfolio optimization under LOW, MEDIUM, HIGH budgets
- REST API endpoints (/api/v1/city/* and /api/city/*)
- Error handling and edge cases
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data.repository import repository
from backend.app.modules.city.city_service import (
    city_decision_engine,
    calculate_priority_score,
    calculate_vulnerability_index,
    calculate_feasibility_index,
    classify_urgency,
    BUDGET_TIERS,
)


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. Mathematical Formulas & Normalization Tests
# ---------------------------------------------------------------------------

def test_priority_score_exact_calculation():
    """Verify exact weighted linear combination:
    Priority Score = 0.35*CHRI + 0.25*Forecast + 0.20*Pop + 0.10*Vuln + 0.10*Feas
    """
    # Vector: CHRI=80, Forecast=90, Pop=70, Vuln=60, Feas=50
    # Expected: 0.35(80) + 0.25(90) + 0.20(70) + 0.10(60) + 0.10(50)
    #         = 28.0 + 22.5 + 14.0 + 6.0 + 5.0 = 75.50
    score = calculate_priority_score(
        chri=80.0,
        forecast_risk=90.0,
        pop_exposure=70.0,
        vulnerability=60.0,
        feasibility=50.0,
    )
    assert score == 75.50


def test_priority_score_clamping_boundaries():
    # Maximum extreme
    max_score = calculate_priority_score(100.0, 100.0, 100.0, 100.0, 100.0)
    assert max_score == 100.0

    # Minimum extreme
    min_score = calculate_priority_score(0.0, 0.0, 0.0, 0.0, 0.0)
    assert min_score == 0.0


def test_vulnerability_index_bounds():
    zones = repository.list_zones()
    assert len(zones) > 0
    for z in zones:
        v = calculate_vulnerability_index(z)
        assert 0.0 <= v <= 100.0


def test_feasibility_index_bounds():
    zones = repository.list_zones()
    for z in zones:
        f = calculate_feasibility_index(z)
        assert 10.0 <= f <= 100.0


def test_urgency_classification_tiers():
    assert classify_urgency(75.0) == "IMMEDIATE"
    assert classify_urgency(70.0) == "IMMEDIATE"
    assert classify_urgency(65.0) == "URGENT"
    assert classify_urgency(55.0) == "URGENT"
    assert classify_urgency(45.0) == "PLANNED"
    assert classify_urgency(40.0) == "PLANNED"
    assert classify_urgency(35.0) == "ROUTINE"


# ---------------------------------------------------------------------------
# 2. Priority Intervention Engine Tests
# ---------------------------------------------------------------------------

def test_get_ranked_priority_interventions_ordering():
    zones = repository.list_zones()
    queue = city_decision_engine.get_ranked_priority_interventions(zones)

    assert len(queue) == len(zones)
    # Check descending sort order
    for i in range(len(queue) - 1):
        assert queue[i].priority_score >= queue[i + 1].priority_score
        assert queue[i].rank == i + 1

    # Verify component scores are populated
    first = queue[0]
    assert 0.0 <= first.priority_score <= 100.0
    assert 0.0 <= first.chri_component <= 100.0
    assert 0.0 <= first.forecast_risk_component <= 100.0
    assert 0.0 <= first.population_exposure_component <= 100.0
    assert 0.0 <= first.vulnerability_component <= 100.0
    assert 0.0 <= first.feasibility_component <= 100.0
    assert first.urgency in ["IMMEDIATE", "URGENT", "PLANNED", "ROUTINE"]


# ---------------------------------------------------------------------------
# 3. Municipal Action Planner Tests
# ---------------------------------------------------------------------------

def test_generate_municipal_actions_coverage():
    zones = repository.list_zones()
    actions = city_decision_engine.generate_municipal_actions(zones)

    assert len(actions) == 6
    action_types = {a.action_type for a in actions}
    expected_types = {
        "cool_roofs",
        "urban_forestry",
        "shade_corridors",
        "water_bodies_restoration",
        "aqi_mitigation",
        "reflective_pavements",
    }
    assert action_types == expected_types

    for a in actions:
        assert a.action_id.startswith("ACT-MUN-")
        assert len(a.target_zones) > 0
        assert a.estimated_chri_reduction > 0.0
        assert a.estimated_temperature_reduction > 0.0
        assert a.affected_population >= 0
        assert a.estimated_cost_usd > 0.0
        assert 0.0 <= a.feasibility_score <= 100.0
        assert len(a.co_benefits) > 0


# ---------------------------------------------------------------------------
# 4. Resource Allocation Engine Tests
# ---------------------------------------------------------------------------

def test_resource_allocation_budget_tiers():
    zones = repository.list_zones()
    actions = city_decision_engine.generate_municipal_actions(zones)

    portfolio_low = city_decision_engine.optimize_resource_allocation(actions, budget_tier="LOW")
    portfolio_med = city_decision_engine.optimize_resource_allocation(actions, budget_tier="MEDIUM")
    portfolio_high = city_decision_engine.optimize_resource_allocation(actions, budget_tier="HIGH")

    # Verify cost caps
    assert portfolio_low.total_cost_usd <= BUDGET_TIERS["LOW"]
    assert portfolio_med.total_cost_usd <= BUDGET_TIERS["MEDIUM"]
    assert portfolio_high.total_cost_usd <= BUDGET_TIERS["HIGH"]

    assert portfolio_low.unallocated_budget_usd >= 0.0
    assert portfolio_med.unallocated_budget_usd >= 0.0
    assert portfolio_high.unallocated_budget_usd >= 0.0

    # Monotonicity check: larger budget allows equal or more actions & cooling
    assert portfolio_med.total_cost_usd >= portfolio_low.total_cost_usd
    assert portfolio_med.projected_cooling >= portfolio_low.projected_cooling
    assert portfolio_high.projected_cooling >= portfolio_med.projected_cooling

    assert portfolio_low.roi_score >= 0.0
    assert portfolio_med.roi_score >= 0.0
    assert portfolio_high.roi_score >= 0.0


# ---------------------------------------------------------------------------
# 5. REST API Endpoint Tests
# ---------------------------------------------------------------------------

def test_api_city_overview(client):
    res = client.get("/api/v1/city/overview")
    assert res.status_code == 200
    data = res.json()

    assert data["total_zones"] > 0
    assert 0.0 <= data["current_city_chri"] <= 100.0
    assert 0.0 <= data["forecast_city_chri_24h"] <= 100.0
    assert 0.0 <= data["forecast_city_chri_72h"] <= 100.0
    assert 0.0 <= data["forecast_city_chri_7d"] <= 100.0
    assert data["population_exposed"] <= data["total_population"]
    assert data["average_lst"] > 0.0
    assert 0.0 <= data["average_ndvi"] <= 1.0


def test_api_city_interventions_queue(client):
    res = client.get("/api/v1/city/interventions?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data) <= 5
    if len(data) >= 2:
        assert data[0]["priority_score"] >= data[1]["priority_score"]
        assert data[0]["rank"] == 1


def test_api_city_interventions_filter_urgency(client):
    res = client.get("/api/v1/city/interventions?urgency=IMMEDIATE")
    assert res.status_code == 200
    data = res.json()
    for item in data:
        assert item["urgency"] == "IMMEDIATE"


def test_api_city_actions(client):
    res = client.get("/api/v1/city/actions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 6


def test_api_city_resources_single_tier(client):
    res = client.get("/api/v1/city/resources?budget_tier=MEDIUM")
    assert res.status_code == 200
    data = res.json()
    assert data["budget_tier"] == "MEDIUM"
    assert data["total_cost_usd"] <= BUDGET_TIERS["MEDIUM"]
    assert len(data["selected_actions"]) > 0


def test_api_city_resources_all_tiers(client):
    res = client.get("/api/v1/city/resources?budget_tier=ALL")
    assert res.status_code == 200
    data = res.json()
    assert "LOW" in data
    assert "MEDIUM" in data
    assert "HIGH" in data


def test_api_city_resources_invalid_tier(client):
    res = client.get("/api/v1/city/resources?budget_tier=ULTRA")
    assert res.status_code == 400
    assert "invalid budget tier" in res.json()["detail"].lower()


def test_api_city_executive_summary(client):
    res = client.get("/api/v1/city/executive-summary")
    assert res.status_code == 200
    data = res.json()
    assert "city_name" in data
    assert "overview" in data
    assert "top_priority_interventions" in data
    assert len(data["top_priority_interventions"]) <= 5
    assert "recommended_portfolio" in data
    assert "executive_directives" in data
    assert len(data["executive_directives"]) >= 3


def test_api_city_backward_compatible_mirrors(client):
    res1 = client.get("/api/city/overview")
    assert res1.status_code == 200

    res2 = client.get("/api/city/interventions?limit=3")
    assert res2.status_code == 200
    assert len(res2.json()) <= 3

    res3 = client.get("/api/city/resources")
    assert res3.status_code == 200

    res4 = client.get("/api/city/executive-summary")
    assert res4.status_code == 200


def test_root_discovery_includes_city_endpoints(client):
    res = client.get("/")
    assert res.status_code == 200
    endpoints = res.json()["endpoints"]
    assert "city_overview" in endpoints
    assert "city_interventions" in endpoints
    assert "city_resources" in endpoints
    assert "city_executive_summary" in endpoints


# ---------------------------------------------------------------------------
# 6. Edge Cases
# ---------------------------------------------------------------------------

def test_city_overview_empty_zones():
    empty_overview = city_decision_engine.get_city_command_overview([], city_name="Test City")
    assert empty_overview.total_zones == 0
    assert empty_overview.current_city_chri == 0.0
    assert empty_overview.population_exposed == 0


def test_resource_allocation_empty_actions():
    empty_portfolio = city_decision_engine.optimize_resource_allocation([], budget_tier="LOW")
    assert empty_portfolio.total_cost_usd == 0.0
    assert empty_portfolio.selected_actions == []
    assert empty_portfolio.roi_score == 0.0
