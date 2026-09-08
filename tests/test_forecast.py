"""Unit and Integration Tests for Phase 4: Predictive Urban Heat Intelligence.

Tests:
- Escalation classification tiers
- Heat Forecast Engine multi-horizon projections (24h, 72h, 7d)
- Explainable driver attribution deltas
- Citywide forecast aggregation and early warning alerts
- REST API endpoints (/api/v1/forecast/* and /api/forecast/*)
- 404 error handling for non-existent zones
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data.repository import repository
from backend.app.modules.forecast.forecast_service import (
    classify_escalation,
    heat_forecast_engine,
)


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. Escalation Classifier Tests
# ---------------------------------------------------------------------------

def test_classify_escalation_severe_rise():
    assert classify_escalation(delta_chri=5.2, projected_chri=65.0) == "Severe Rise"
    # High baseline boundary rule: projected >= 70 and delta >= 2.5
    assert classify_escalation(delta_chri=2.8, projected_chri=72.0) == "Severe Rise"


def test_classify_escalation_rising():
    assert classify_escalation(delta_chri=2.0, projected_chri=55.0) == "Rising"
    assert classify_escalation(delta_chri=1.5, projected_chri=45.0) == "Rising"


def test_classify_escalation_cooling():
    assert classify_escalation(delta_chri=-2.0, projected_chri=50.0) == "Cooling"
    assert classify_escalation(delta_chri=-1.5, projected_chri=40.0) == "Cooling"


def test_classify_escalation_stable():
    assert classify_escalation(delta_chri=0.5, projected_chri=50.0) == "Stable"
    assert classify_escalation(delta_chri=-1.0, projected_chri=50.0) == "Stable"


# ---------------------------------------------------------------------------
# 2. Heat Forecast Engine Core Tests
# ---------------------------------------------------------------------------

def test_predict_zone_forecast_structure():
    zone = repository.get_zone_by_id("ZONE-01")
    assert zone is not None

    forecast = heat_forecast_engine.predict_zone_forecast(zone)
    assert forecast.zone_id == zone.id
    assert forecast.zone_name == zone.name
    assert len(forecast.horizons) == 3

    horizons = [p.horizon for p in forecast.horizons]
    assert horizons == ["24h", "72h", "7d"]

    # Verify confidence decay
    confidences = [p.confidence_score for p in forecast.horizons]
    assert confidences == [0.94, 0.88, 0.78]

    # Check bounds
    for p in forecast.horizons:
        assert 0.0 <= p.projected_chri <= 100.0
        assert p.escalation in ["Severe Rise", "Rising", "Cooling", "Stable"]
        assert len(p.driver_breakdown) == 3
        driver_keys = [d.driver for d in p.driver_breakdown]
        assert "thermal_lst" in driver_keys
        assert "vegetation_stress" in driver_keys
        assert "aqi_stagnation" in driver_keys

    assert forecast.peak_risk_horizon in ["24h", "72h", "7d"]
    assert forecast.peak_chri >= forecast.current_chri - 5.0
    assert forecast.primary_escalation_driver != ""


def test_predict_hotspots_forecast_ranking():
    zones = repository.list_zones()
    assert len(zones) > 0

    hotspots = heat_forecast_engine.predict_hotspots_forecast(zones, limit=5)
    assert len(hotspots) <= 5
    # Verify ranked order (descending peak CHRI)
    for i in range(len(hotspots) - 1):
        assert hotspots[i].peak_chri >= hotspots[i + 1].peak_chri


def test_predict_hotspots_forecast_filter():
    zones = repository.list_zones()
    rising = heat_forecast_engine.predict_hotspots_forecast(zones, min_escalation="Rising")
    for f in rising:
        assert f.overall_escalation.lower() == "rising"


def test_predict_citywide_forecast_summary():
    zones = repository.list_zones()
    summary = heat_forecast_engine.predict_citywide_forecast(zones)

    assert summary.total_zones == len(zones)
    assert summary.zones_escalating == summary.zones_severe_rise + (
        summary.total_zones - summary.zones_severe_rise - summary.zones_stable - summary.zones_cooling
    )
    assert 0.0 <= summary.citywide_mean_chri_current <= 100.0
    assert 0.0 <= summary.citywide_mean_chri_24h <= 100.0
    assert 0.0 <= summary.citywide_mean_chri_72h <= 100.0
    assert 0.0 <= summary.citywide_mean_chri_7d <= 100.0


# ---------------------------------------------------------------------------
# 3. REST API Endpoint Tests
# ---------------------------------------------------------------------------

def test_api_v1_get_zone_forecast(client):
    res = client.get("/api/v1/forecast/ZONE-01")
    assert res.status_code == 200
    data = res.json()
    assert data["zone_id"] == "ZONE-01"
    assert len(data["horizons"]) == 3
    assert data["horizons"][0]["horizon"] == "24h"
    assert data["horizons"][1]["horizon"] == "72h"
    assert data["horizons"][2]["horizon"] == "7d"

    # Case-insensitive check
    res_lower = client.get("/api/v1/forecast/zone-01")
    assert res_lower.status_code == 200
    assert res_lower.json()["zone_id"] == "ZONE-01"


def test_api_v1_get_zone_forecast_not_found(client):
    res = client.get("/api/v1/forecast/nonexistent-zone-xyz")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_api_v1_get_forecast_hotspots(client):
    res = client.get("/api/v1/forecast/hotspots?limit=4")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) <= 4
    if len(data) >= 2:
        assert data[0]["peak_chri"] >= data[1]["peak_chri"]


def test_api_v1_get_citywide_forecast(client):
    res = client.get("/api/v1/forecast/citywide")
    assert res.status_code == 200
    data = res.json()
    assert "total_zones" in data
    assert "citywide_mean_chri_24h" in data
    assert "high_risk_zones_forecast" in data


def test_api_forecast_mirror_routes(client):
    # Test mirror /api/forecast routes for backward compatibility
    res1 = client.get("/api/forecast/ZONE-01")
    assert res1.status_code == 200

    res2 = client.get("/api/forecast/hotspots?limit=2")
    assert res2.status_code == 200
    assert len(res2.json()) <= 2

    res3 = client.get("/api/forecast/citywide")
    assert res3.status_code == 200
    assert "active_alerts" in res3.json()


def test_root_discovery_includes_forecast(client):
    res = client.get("/")
    assert res.status_code == 200
    endpoints = res.json()["endpoints"]
    assert "forecast_hotspots" in endpoints
    assert "forecast_citywide" in endpoints
