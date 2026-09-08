"""Unit tests for Phase 2A CHRI Analytics Engine.

Tests:
- CHRI formula mathematical accuracy
- Hotspot classification tiers (0-20, 20-40, 40-60, 60-80, 80-100)
- Normalization calibration
- Driver attribution across 5 dominant drivers
- Recommendation engine intervention synthesis
- REST API endpoints (/api/chri/zones, /api/chri/hotspots, /api/chri/{zone_id}, /api/chri/recommendations/{zone_id})
- API versioning backward compatibility (/api/v1/chri/...)
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.modules.chri.chri_service import (
    chri_service,
    compute_chri_score,
    classify_risk,
    decompose_drivers,
    normalize_lst,
    normalize_population_density,
    normalize_building_density,
    normalize_ndvi,
    normalize_aqi,
)
from backend.app.modules.chri.recommender import recommendation_engine
from backend.app.schemas.zone import Zone


# ---------------------------------------------------------------------------
# 1. Formula & Normalization Unit Tests
# ---------------------------------------------------------------------------

def test_chri_formula_exact_evaluation():
    """Verify exact weighted linear combination:
    CHRI = 0.35*lst + 0.20*pop + 0.20*bld - 0.15*ndvi + 0.10*aqi
    """
    # Baseline test vector: lst=80, pop=60, bld=70, ndvi=20, aqi=50
    # Expected = 0.35(80) + 0.20(60) + 0.20(70) - 0.15(20) + 0.10(50)
    #          = 28.0 + 12.0 + 14.0 - 3.0 + 5.0 = 56.0
    score = compute_chri_score(
        norm_lst=80.0,
        norm_pop=60.0,
        norm_bld=70.0,
        norm_ndvi=20.0,
        norm_aqi=50.0,
    )
    assert score == 56.0


def test_chri_formula_clamping_boundaries():
    """Verify clamping to [0.0, 100.0]."""
    # Max risk: lst=100, pop=100, bld=100, ndvi=0, aqi=100 -> 85.0 (Critical)
    max_score = compute_chri_score(100.0, 100.0, 100.0, 0.0, 100.0)
    assert 80.0 <= max_score <= 100.0

    # Ultra-vegetated park: lst=0, pop=0, bld=0, ndvi=100, aqi=0 -> -15.0 clamped to 0.0
    min_score = compute_chri_score(0.0, 0.0, 0.0, 100.0, 0.0)
    assert min_score == 0.0


def test_hotspot_classification_tiers():
    """Verify 5-tier classification criteria:
    0-20 LOW
    20-40 MODERATE
    40-60 HIGH
    60-80 SEVERE
    80-100 CRITICAL
    """
    assert classify_risk(0.0) == "LOW"
    assert classify_risk(19.9) == "LOW"
    assert classify_risk(20.0) == "MODERATE"
    assert classify_risk(39.9) == "MODERATE"
    assert classify_risk(40.0) == "HIGH"
    assert classify_risk(59.9) == "HIGH"
    assert classify_risk(60.0) == "SEVERE"
    assert classify_risk(79.9) == "SEVERE"
    assert classify_risk(80.0) == "CRITICAL"
    assert classify_risk(95.5) == "CRITICAL"


def test_normalization_functions():
    """Verify normalization scales inputs to [0.0, 100.0] correctly."""
    # LST: 20°C -> 0.0, 35°C -> 50.0, 50°C -> 100.0
    assert normalize_lst(20.0) == 0.0
    assert normalize_lst(35.0) == 50.0
    assert normalize_lst(50.0) == 100.0
    assert normalize_lst(15.0) == 0.0   # clamp lower
    assert normalize_lst(60.0) == 100.0 # clamp upper

    # Population density: 0 -> 0.0, 25,000 -> 50.0, 50,000 -> 100.0
    assert normalize_population_density(0.0) == 0.0
    assert normalize_population_density(25000.0) == 50.0
    assert normalize_population_density(50000.0) == 100.0
    assert normalize_population_density(0.75) == 75.0 # direct fraction

    # Building density: 0.0 -> 0.0, 0.50 -> 50.0, 1.0 -> 100.0
    assert normalize_building_density(0.0) == 0.0
    assert normalize_building_density(0.50) == 50.0
    assert normalize_building_density(1.0) == 100.0

    # NDVI: 0.0 -> 0.0, 0.35 -> 50.0, 0.70 -> 100.0
    assert normalize_ndvi(0.0) == 0.0
    assert normalize_ndvi(0.35) == 50.0
    assert normalize_ndvi(0.70) == 100.0

    # AQI: 0.0 -> 0.0, 100.0 -> 50.0, 200.0 -> 100.0
    assert normalize_aqi(0.0) == 0.0
    assert normalize_aqi(100.0) == 50.0
    assert normalize_aqi(200.0) == 100.0


# ---------------------------------------------------------------------------
# 2. Driver Attribution & Recommender Tests
# ---------------------------------------------------------------------------

def test_driver_attribution_and_dominant_detection():
    """Verify driver attribution identifies dominant drivers across scenarios."""
    # Scenario A: Dominant LST
    drivers, top_driver, pct = decompose_drivers(
        norm_lst=95.0, norm_pop=20.0, norm_bld=20.0, norm_ndvi=80.0, norm_aqi=20.0
    )
    assert top_driver == "high_lst"
    assert pct > 40.0
    assert "high_lst" in drivers
    assert "low_ndvi" in drivers
    assert "high_population" in drivers
    assert "high_building_density" in drivers
    assert "poor_air_quality" in drivers

    # Scenario B: Dominant Low NDVI (Canopy deficit)
    _, top_driver_b, _ = decompose_drivers(
        norm_lst=20.0, norm_pop=10.0, norm_bld=10.0, norm_ndvi=0.0, norm_aqi=10.0
    )
    assert top_driver_b == "low_ndvi"


def test_recommendation_engine_generates_valid_plan(sample_zone: Zone):
    """Verify recommendation engine synthesizes targeted interventions."""
    chri = chri_service.evaluate_zone(sample_zone)
    recommendation = recommendation_engine.generate_recommendations(sample_zone, chri)

    assert recommendation.zone_id == sample_zone.id
    assert recommendation.zone_name == sample_zone.name
    assert recommendation.chri_score == chri.score
    assert len(recommendation.recommended_actions) > 0
    assert recommendation.projected_cooling_c > 0.0
    assert recommendation.projected_chri_reduction > 0.0
    assert len(recommendation.summary) > 20

    # Verify actions target the identified dominant drivers
    addressed = [act.driver_addressed for act in recommendation.recommended_actions]
    assert any(driver in addressed for driver in recommendation.dominant_drivers)


# ---------------------------------------------------------------------------
# 3. REST API Endpoint Tests
# ---------------------------------------------------------------------------

def test_api_get_chri_zones(client: TestClient):
    """GET /api/chri/zones returns list of evaluated zones."""
    response = client.get("/api/chri/zones")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "zone_id" in first
    assert "score" in first
    assert "risk_level" in first
    assert "normalized_lst" in first
    assert "dominant_driver" in first
    assert "driver_contributions" in first
    assert first["risk_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]


def test_api_get_chri_zones_filtered(client: TestClient):
    """GET /api/chri/zones with min_score and risk_level filtering."""
    response = client.get("/api/chri/zones?min_score=40.0")
    assert response.status_code == 200
    data = response.json()
    for z in data:
        assert z["score"] >= 40.0


def test_api_get_chri_hotspots(client: TestClient):
    """GET /api/chri/hotspots returns prioritized, sorted hotspots."""
    response = client.get("/api/chri/hotspots?limit=10")
    assert response.status_code == 200
    hotspots = response.json()
    assert isinstance(hotspots, list)
    assert len(hotspots) <= 10

    # Ensure rank order is strictly descending by score
    scores = [h["chri_score"] for h in hotspots]
    assert scores == sorted(scores, reverse=True)

    if len(hotspots) > 0:
        first = hotspots[0]
        assert first["rank"] == 1
        assert "urgency" in first
        assert "center_coords" in first
        assert len(first["center_coords"]) == 2


def test_api_get_chri_by_zone_id(client: TestClient):
    """GET /api/chri/{zone_id} returns detailed calculation for single zone."""
    response = client.get("/api/chri/ZONE-01")
    assert response.status_code == 200
    chri = response.json()
    assert chri["zone_id"] == "ZONE-01"
    assert 0.0 <= chri["score"] <= 100.0
    assert "raw_metrics" in chri
    assert "dominant_driver_pct" in chri


def test_api_get_chri_by_zone_id_404(client: TestClient):
    """GET /api/chri/{zone_id} returns 404 for unknown zone."""
    response = client.get("/api/chri/NONEXISTENT-ZONE-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_api_get_chri_recommendations(client: TestClient):
    """GET /api/chri/recommendations/{zone_id} returns prescriptive mitigation plan."""
    response = client.get("/api/chri/recommendations/ZONE-01")
    assert response.status_code == 200
    rec = response.json()
    assert rec["zone_id"] == "ZONE-01"
    assert len(rec["recommended_actions"]) > 0
    assert rec["projected_cooling_c"] > 0.0
    assert rec["projected_chri_reduction"] > 0.0
    assert "summary" in rec


def test_api_get_chri_recommendations_404(client: TestClient):
    """GET /api/chri/recommendations/{zone_id} returns 404 for unknown zone."""
    response = client.get("/api/chri/recommendations/INVALID-ZONE")
    assert response.status_code == 404


def test_api_versioned_chri_routes(client: TestClient):
    """Verify versioned /api/v1/chri/... routes function identically."""
    res_v1_zones = client.get("/api/v1/chri/zones")
    assert res_v1_zones.status_code == 200

    res_v1_hotspots = client.get("/api/v1/chri/hotspots")
    assert res_v1_hotspots.status_code == 200

    res_v1_detail = client.get("/api/v1/chri/ZONE-01")
    assert res_v1_detail.status_code == 200

    res_v1_rec = client.get("/api/v1/chri/recommendations/ZONE-01")
    assert res_v1_rec.status_code == 200


# ---------------------------------------------------------------------------
# 6. Phase 3B: Dynamic Raster-Driven CHRI & Trend Intelligence Tests
# ---------------------------------------------------------------------------

from backend.app.schemas.chri import (
    LiveRasterMetrics,
    LiveCHRIScore,
    LiveHeatHotspot,
    HotspotTrendsSummary,
)


def test_zonal_raster_aggregation_and_caching(sample_zone: Zone):
    """Verify live zonal raster aggregation derives metrics from Sentinel-2 & Landsat with caching."""
    chri_service.clear_cache()
    metrics = chri_service.aggregate_zonal_raster_metrics(sample_zone)
    assert isinstance(metrics, LiveRasterMetrics)
    assert metrics.mean_lst_c == sample_zone.thermal_observation.land_surface_temp_c
    assert metrics.thermal_anomaly_c == sample_zone.thermal_observation.thermal_anomaly_c
    assert metrics.mean_ndvi >= -1.0
    assert metrics.vegetation_coverage_pct == 4.0
    assert "Landsat" in metrics.lst_sensor
    assert "Sentinel-2" in metrics.ndvi_sensor

    # Verify cached retrieval
    cached_metrics = chri_service.aggregate_zonal_raster_metrics(sample_zone)
    assert cached_metrics is metrics


def test_classify_hotspot_trend_detection():
    """Verify classification of emerging, persistent, and cooling zones."""
    # 1. Cooling zone: high NDVI or negative delta
    trend_cool = chri_service.classify_hotspot_trend(
        live_score=25.0, baseline_score=28.0, anomaly_c=0.5, mean_ndvi=0.45, bld_density=0.15
    )
    assert trend_cool == "cooling"

    # 2. Persistent hotspot: severe chronic heat with high density
    trend_persist = chri_service.classify_hotspot_trend(
        live_score=68.0, baseline_score=67.0, anomaly_c=6.5, mean_ndvi=0.10, bld_density=0.65
    )
    assert trend_persist == "persistent"

    # 3. Emerging hotspot: rapid delta jump or elevated anomaly with deficient canopy
    trend_emerge = chri_service.classify_hotspot_trend(
        live_score=52.0, baseline_score=48.0, anomaly_c=4.5, mean_ndvi=0.12, bld_density=0.30
    )
    assert trend_emerge == "emerging"


def test_evaluate_live_zone_recalculation(sample_zone: Zone):
    """Verify end-to-end dynamic CHRI recalculation using live raster inputs."""
    live = chri_service.evaluate_live_zone(sample_zone)
    assert isinstance(live, LiveCHRIScore)
    assert live.zone_id == sample_zone.id
    assert 0.0 <= live.score <= 100.0
    assert live.confidence_score >= 0.90
    assert live.hotspot_trend in ("emerging", "persistent", "cooling")
    assert "lst_c" in live.raw_metrics
    assert "ndvi" in live.raw_metrics
    assert live.raster_metrics.mean_lst_c == sample_zone.thermal_observation.land_surface_temp_c


def test_get_live_ranked_hotspots(sample_zone: Zone, cool_zone: Zone):
    """Verify ranking order and attributes of live raster-driven hotspots."""
    zones = [sample_zone, cool_zone]
    hotspots = chri_service.get_live_ranked_hotspots(zones, limit=10)
    assert len(hotspots) == 2
    assert hotspots[0].rank == 1
    assert hotspots[0].live_chri_score >= hotspots[1].live_chri_score
    assert isinstance(hotspots[0], LiveHeatHotspot)
    assert len(hotspots[0].center_coords) == 2
    assert hotspots[0].confidence_score >= 0.90


def test_get_hotspot_trends_summary(sample_zone: Zone, cool_zone: Zone):
    """Verify citywide summary aggregation of hotspot trends."""
    zones = [sample_zone, cool_zone]
    summary = chri_service.get_hotspot_trends_summary(zones)
    assert isinstance(summary, HotspotTrendsSummary)
    assert summary.total_zones == 2
    assert summary.emerging_hotspots_count + summary.persistent_hotspots_count + summary.cooling_zones_count == 2
    assert summary.citywide_mean_lst_c > 0.0
    assert summary.citywide_mean_ndvi > 0.0


def test_api_get_live_chri_zones(client: TestClient):
    """GET /api/chri/live/zones returns live dynamically evaluated zones."""
    response = client.get("/api/chri/live/zones")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "confidence_score" in data[0]
    assert "hotspot_trend" in data[0]
    assert "raster_metrics" in data[0]

    # Filter by trend
    res_filtered = client.get("/api/chri/live/zones?trend=persistent")
    assert res_filtered.status_code == 200
    for z in res_filtered.json():
        assert z["hotspot_trend"] == "persistent"


def test_api_get_live_chri_hotspots(client: TestClient):
    """GET /api/chri/live/hotspots returns ranked live hotspots."""
    response = client.get("/api/chri/live/hotspots?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 5
    assert data[0]["rank"] == 1
    assert data[0]["live_chri_score"] >= data[-1]["live_chri_score"]
    assert "thermal_anomaly_c" in data[0]


def test_api_get_live_chri_by_zone_id(client: TestClient):
    """GET /api/chri/live/{zone_id} returns live CHRI with raster attribution."""
    response = client.get("/api/chri/live/ZONE-01")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-01"
    assert "raster_metrics" in data
    assert "hotspot_trend" in data
    assert "delta_from_baseline" in data

    # 404 for nonexistent zone
    res_404 = client.get("/api/chri/live/ZONE-UNKNOWN-999")
    assert res_404.status_code == 404


def test_api_get_live_hotspot_trends(client: TestClient):
    """GET /api/chri/live/trends returns citywide trends breakdown."""
    response = client.get("/api/chri/live/trends")
    assert response.status_code == 200
    data = response.json()
    assert "emerging_hotspots" in data
    assert "persistent_hotspots" in data
    assert "cooling_zones" in data
    assert data["total_zones"] > 0
    assert data["citywide_mean_lst_c"] > 0.0


def test_versioned_live_chri_routes(client: TestClient):
    """Verify versioned /api/v1/chri/live/... routes function identically."""
    resp1 = client.get("/api/v1/chri/live/zones")
    assert resp1.status_code == 200

    resp2 = client.get("/api/v1/chri/live/hotspots")
    assert resp2.status_code == 200

    resp3 = client.get("/api/v1/chri/live/trends")
    assert resp3.status_code == 200

    resp4 = client.get("/api/v1/chri/live/ZONE-01")
    assert resp4.status_code == 200

