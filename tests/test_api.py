"""API integration tests for all REST endpoints, verifying /api and /api/v1 routes and analytical fields."""
from fastapi.testclient import TestClient


def test_get_api_zones_includes_required_analytical_fields(client: TestClient):
    """Verify GET /api/zones returns all required fields for urban heat reduction analysis."""
    response = client.get("/api/zones")
    assert response.status_code == 200
    zones = response.json()
    assert isinstance(zones, list)
    assert len(zones) >= 10

    for z in zones:
        # Check required fields needed for planning
        assert "temperature" in z, "Missing temperature field"
        assert "vegetation" in z, "Missing vegetation field"
        assert "imperviousness" in z, "Missing imperviousness field"
        assert "building_density" in z, "Missing building_density field"
        assert "population_exposure" in z, "Missing population_exposure field"
        assert "risk_score" in z, "Missing risk_score field"

        # Check valid numeric ranges
        assert 15.0 <= z["temperature"] <= 55.0
        assert 0.0 <= z["vegetation"] <= 1.0
        assert 0.0 <= z["imperviousness"] <= 1.0
        assert 0.0 <= z["building_density"] <= 1.0
        assert 0.0 <= z["population_exposure"] <= 100.0
        assert 0.0 <= z["risk_score"] <= 100.0


def test_get_api_zone_by_id(client: TestClient):
    """Verify GET /api/zones/{id} returns complete zone specifications."""
    response = client.get("/api/zones/ZONE-01")
    assert response.status_code == 200
    zone = response.json()
    assert zone["id"] == "ZONE-01"
    assert zone["name"] == "Downtown Financial District"
    assert "land_cover" in zone
    assert "building_density" in zone["land_cover"]
    assert "thermal_observation" in zone
    assert "demographics" in zone
    assert zone["temperature"] is not None
    assert zone["vegetation"] is not None
    assert zone["imperviousness"] is not None
    assert zone["building_density"] is not None
    assert zone["population_exposure"] is not None
    assert zone["risk_score"] is not None


def test_get_api_zone_by_id_404(client: TestClient):
    response = client.get("/api/zones/ZONE-999")
    assert response.status_code == 404


def test_get_api_hotspots_includes_required_analytical_fields(client: TestClient):
    """Verify GET /api/hotspots returns ranked hotspots with all analytical indicators."""
    response = client.get("/api/hotspots")
    assert response.status_code == 200
    hotspots = response.json()
    assert isinstance(hotspots, list)
    assert len(hotspots) >= 5

    # Check rank ordering
    for i in range(len(hotspots) - 1):
        assert hotspots[i]["rank"] < hotspots[i + 1]["rank"]
        assert hotspots[i]["risk_score"] >= hotspots[i + 1]["risk_score"]

    for h in hotspots:
        assert "temperature" in h
        assert "vegetation" in h
        assert "imperviousness" in h
        assert "building_density" in h
        assert "population_exposure" in h
        assert "risk_score" in h
        assert "dominant_driver" in h
        assert "center_coords" in h
        assert len(h["center_coords"]) == 2


def test_get_api_hotspot_by_id(client: TestClient):
    """Verify GET /api/hotspots/{id} returns comprehensive hotspot intelligence dossier."""
    response = client.get("/api/hotspots/ZONE-10")
    assert response.status_code == 200
    detail = response.json()
    assert detail["summary"]["zone_id"] == "ZONE-10"
    assert detail["summary"]["temperature"] is not None
    assert detail["summary"]["vegetation"] is not None
    assert detail["summary"]["imperviousness"] is not None
    assert detail["summary"]["building_density"] is not None
    assert detail["summary"]["population_exposure"] is not None
    assert detail["summary"]["risk_score"] is not None

    assert "risk_assessment" in detail
    assert "recommended_interventions" in detail
    assert len(detail["recommended_interventions"]) > 0
    first_inv = detail["recommended_interventions"][0]
    assert "intervention_id" in first_inv
    assert "estimated_total_cost_usd" in first_inv
    assert "expected_local_lst_reduction_c" in first_inv


def test_versioned_routes_backward_compatibility(client: TestClient):
    """Ensure /api/v1/zones and /api/v1/hotspots remain functional for backward compatibility."""
    res1 = client.get("/api/v1/zones")
    assert res1.status_code == 200
    res2 = client.get("/api/v1/hotspots")
    assert res2.status_code == 200
    res3 = client.get("/api/v1/zones/geojson")
    assert res3.status_code == 200
    assert res3.json()["type"] == "FeatureCollection"


def test_get_interventions_catalog(client: TestClient):
    """Verify GET /api/interventions/catalog returns valid cooling solutions."""
    response = client.get("/api/interventions/catalog")
    assert response.status_code == 200
    catalog = response.json()
    assert len(catalog) >= 5
    for item in catalog:
        assert "id" in item
        assert "cooling_potential_c" in item
        assert "unit_cost_usd_per_sqm" in item
        assert item["cooling_potential_c"] > 0
        assert item["unit_cost_usd_per_sqm"] > 0
