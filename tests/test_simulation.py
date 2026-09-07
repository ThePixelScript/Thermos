"""Unit and integration tests for the THERMOS scenario simulation engine and API."""
from fastapi.testclient import TestClient


def test_simulation_valid(client: TestClient):
    """Verify POST /api/interventions/simulate returns complete, calibrated scenario output."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-TREE-CANOPY", "INT-COOL-ROOF"],
        "budget_inr_lakhs": 50.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["zone_id"] == "ZONE-01"
    assert data["budget_inr_lakhs"] == 50.0
    assert data["total_cost_inr_lakhs"] > 0
    assert data["remaining_budget_inr_lakhs"] > 0
    assert data["is_budget_exceeded"] is False
    assert data["deficit_inr_lakhs"] == 0.0

    assert data["modeled_lst_reduction_c"] > 0.0
    assert data["modeled_ambient_reduction_c"] > 0.0
    assert data["population_benefited"] > 0
    assert len(data["active_interventions"]) == 2
    assert len(data["phased_roadmap"]) > 0


def test_simulation_unknown_zone_404(client: TestClient):
    """Verify 404 is returned when simulating an unknown zone ID."""
    payload = {
        "zone_id": "ZONE-NONEXISTENT",
        "selected_intervention_ids": ["INT-COOL-ROOF"],
        "budget_inr_lakhs": 50.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_simulation_invalid_intervention_400(client: TestClient):
    """Verify 400 is returned when an invalid intervention ID is supplied."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-DOES-NOT-EXIST"],
        "budget_inr_lakhs": 50.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 400
    assert "unknown intervention" in response.json()["detail"].lower()


def test_simulation_zero_and_negative_budget_validation(client: TestClient):
    """Verify non-positive budgets are rejected with 400."""
    res_zero = client.post(
        "/api/interventions/simulate",
        json={"zone_id": "ZONE-01", "selected_intervention_ids": ["INT-COOL-ROOF"], "budget_inr_lakhs": 0},
    )
    assert res_zero.status_code == 400

    res_neg = client.post(
        "/api/interventions/simulate",
        json={"zone_id": "ZONE-01", "selected_intervention_ids": ["INT-COOL-ROOF"], "budget_inr_lakhs": -15.0},
    )
    assert res_neg.status_code == 400


def test_simulation_cost_calculation(client: TestClient):
    """Verify total cost matches sum of active intervention package costs."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-COOL-ROOF", "INT-TRANSIT-SHADE"],
        "budget_inr_lakhs": 100.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # INT-COOL-ROOF is 8.5L, INT-TRANSIT-SHADE is 6.5L = 15.0L
    expected_sum = sum(item["cost_inr_lakhs"] for item in data["active_interventions"])
    assert round(data["total_cost_inr_lakhs"], 2) == round(expected_sum, 2)
    assert data["total_cost_inr_lakhs"] == 15.0


def test_simulation_budget_exceeded(client: TestClient):
    """Verify budget exceeded flag and deficit calculation when cost > budget."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-TREE-CANOPY", "INT-COOL-ROOF"],  # 14.5 + 8.5 = 23.0L
        "budget_inr_lakhs": 15.0,  # Below 23.0L
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_budget_exceeded"] is True
    assert data["remaining_budget_inr_lakhs"] == -8.0
    assert data["deficit_inr_lakhs"] == 8.0
    assert data["budget_utilization_pct"] > 100.0


def test_simulation_budget_remaining(client: TestClient):
    """Verify positive remaining budget and zero deficit when cost <= budget."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-COOL-ROOF"],  # 8.5L
        "budget_inr_lakhs": 50.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_budget_exceeded"] is False
    assert data["remaining_budget_inr_lakhs"] == 41.5
    assert data["deficit_inr_lakhs"] == 0.0
    assert data["budget_utilization_pct"] == 17.0


def test_simulation_area_constraints(client: TestClient):
    """Verify implementation area values and constraint validation flags."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-TREE-CANOPY", "INT-COOL-ROOF", "INT-PERM-PAVEMENT"],
        "budget_inr_lakhs": 100.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_implementation_area_sqm"] > 0
    assert data["total_implementation_area_hectares"] > 0
    assert data["zone_area_coverage_pct"] <= 100.0
    for item in data["active_interventions"]:
        assert "surface_constraint_checked" in item
        assert isinstance(item["surface_constraint_checked"], bool)


def test_simulation_deterministic_repeated_result(client: TestClient):
    """Verify repeated execution produces 100% identical deterministic output."""
    payload = {
        "zone_id": "ZONE-10",
        "selected_intervention_ids": ["INT-TREE-CANOPY", "INT-TRANSIT-SHADE", "INT-POCKET-PARK"],
        "budget_inr_lakhs": 60.0,
    }
    res1 = client.post("/api/interventions/simulate", json=payload).json()
    res2 = client.post("/api/interventions/simulate", json=payload).json()

    assert res1["total_cost_inr_lakhs"] == res2["total_cost_inr_lakhs"]
    assert res1["modeled_lst_reduction_c"] == res2["modeled_lst_reduction_c"]
    assert res1["modeled_ambient_reduction_c"] == res2["modeled_ambient_reduction_c"]
    assert res1["population_benefited"] == res2["population_benefited"]
    assert res1["remaining_budget_inr_lakhs"] == res2["remaining_budget_inr_lakhs"]


def test_simulation_lst_and_ambient_outputs(client: TestClient):
    """Verify scientific distinction and bounds between LST and ambient air reduction."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-COOL-ROOF", "INT-TREE-CANOPY"],
        "budget_inr_lakhs": 50.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Localized surface cooling (LST) is higher than diffuse 2m air cooling
    assert data["modeled_lst_reduction_c"] >= data["modeled_ambient_reduction_c"]
    # Ambient cooling does not exceed physical saturation ceiling (3.0°C)
    assert data["modeled_ambient_reduction_c"] <= 3.0
    # Synergy bonus is credited for co-locating nature-based and reflective materials
    assert data["synergy_factor_c"] > 0.0


def test_simulation_provenance_and_classification(client: TestClient):
    """Verify scientific provenance disclaimer and SIMULATED classification."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": ["INT-COOL-ROOF"],
        "budget_inr_lakhs": 25.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"] == "SIMULATED"
    assert "not field-validated" in data["provenance"].lower()
    assert len(data["assumptions"]) >= 4
    for assumption in data["assumptions"]:
        assert isinstance(assumption, str)
        assert len(assumption) > 10


def test_simulation_empty_selection(client: TestClient):
    """Verify zero cost and zero cooling when no interventions are selected."""
    payload = {
        "zone_id": "ZONE-01",
        "selected_intervention_ids": [],
        "budget_inr_lakhs": 40.0,
    }
    response = client.post("/api/interventions/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_cost_inr_lakhs"] == 0.0
    assert data["remaining_budget_inr_lakhs"] == 40.0
    assert data["modeled_lst_reduction_c"] == 0.0
    assert data["modeled_ambient_reduction_c"] == 0.0
    assert data["population_benefited"] == 0
    assert data["active_interventions"] == []
