"""API integration tests for all REST endpoints."""
from fastapi.testclient import TestClient


def test_get_all_zones(client: TestClient):
    response = client.get("/api/v1/zones")
    assert response.status_code == 200
    zones = response.json()
    assert isinstance(zones, list)
    assert len(zones) >= 10
    first = zones[0]
    assert "id" in first
    assert "name" in first
    assert "typology" in first
    assert "land_surface_temp_c" in first
    assert "risk_score" in first


def test_get_zone_by_id(client: TestClient):
    response = client.get("/api/v1/zones/ZONE-01")
    assert response.status_code == 200
    zone = response.json()
    assert zone["id"] == "ZONE-01"
    assert "land_cover" in zone
    assert "thermal_observation" in zone
    assert "demographics" in zone


def test_get_nonexistent_zone(client: TestClient):
    response = client.get("/api/v1/zones/ZONE-NONEXISTENT")
    assert response.status_code == 404


def test_get_zones_geojson(client: TestClient):
    response = client.get("/api/v1/zones/geojson")
    assert response.status_code == 200
    geojson = response.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) >= 10
    first_feat = geojson["features"][0]
    assert first_feat["type"] == "Feature"
    assert "geometry" in first_feat
    assert first_feat["geometry"]["type"] == "Polygon"
    assert "properties" in first_feat
    assert "risk_score" in first_feat["properties"]


def test_get_hotspots(client: TestClient):
    response = client.get("/api/v1/hotspots?min_risk=40")
    assert response.status_code == 200
    hotspots = response.json()
    assert isinstance(hotspots, list)
    assert len(hotspots) > 0
    # Check ranking
    assert hotspots[0]["rank"] == 1
    assert hotspots[0]["risk_score"] >= hotspots[-1]["risk_score"]


def test_get_hotspot_detail(client: TestClient):
    # Fetch first hotspot ID
    list_res = client.get("/api/v1/hotspots")
    first_id = list_res.json()[0]["zone_id"]

    response = client.get(f"/api/v1/hotspots/{first_id}")
    assert response.status_code == 200
    detail = response.json()
    assert detail["summary"]["zone_id"] == first_id
    assert "risk_assessment" in detail
    assert "driver_contributions" in detail["risk_assessment"]["risk_score"]
    assert "recommended_interventions" in detail
    assert len(detail["recommended_interventions"]) > 0


def test_get_interventions_catalog(client: TestClient):
    response = client.get("/api/v1/interventions/catalog")
    assert response.status_code == 200
    catalog = response.json()
    assert len(catalog) >= 5
    first = catalog[0]
    assert "id" in first
    assert "name" in first
    assert "cooling_potential_c" in first
    assert "unit_cost_usd_per_sqm" in first


def test_get_recommendations_for_zone(client: TestClient):
    response = client.get("/api/v1/interventions/recommendations/ZONE-01")
    assert response.status_code == 200
    recommendations = response.json()
    assert isinstance(recommendations, list)
    assert len(recommendations) > 0
    first = recommendations[0]
    assert "estimated_total_cost_usd" in first
    assert "expected_local_lst_reduction_c" in first
    assert "rationale" in first
