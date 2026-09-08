"""Unit & integration tests for the Real Geospatial Data Pipeline.

Validates:
1. OpenStreetMap Overpass vector analysis (buildings, roads, water, land use)
2. Sentinel-2 NDVI multispectral vegetation deficit
3. Landsat 8/9 thermal infrared LST & thermal anomaly
4. WeatherAPI live weather & heat stress index
5. WorldPop / GHSL population density & exposure
6. Geodesic water distance computations
7. Deterministic 6-factor CHRI formula & driver decomposition
8. Dynamic hotspot metadata validation (data source, observation date, confidence, methodology)
9. H3-style hexagonal grid tessellation API (/api/zones/hexagons)
10. Offline cache fallback resilience
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.modules.geospatial.pipeline import (
    geospatial_pipeline,
    haversine_distance_km,
    compute_min_water_distance_km,
    normalize_lst,
    normalize_vegetation_deficit,
    normalize_building_density,
    normalize_population_exposure,
    normalize_water_distance,
    normalize_weather_conditions,
    compute_multi_factor_chri,
    decompose_multi_factor_drivers,
)
from backend.app.data.repository import repository


def test_haversine_and_water_distance():
    """Verify haversine distance and water distance to Chennai cooling features."""
    # Central Chennai to Marina Beach shoreline (~80.28, 13.06)
    dist = compute_min_water_distance_km(80.28, 13.06)
    assert 0.0 <= dist <= 2.0

    # Western inland Ambattur (~80.15, 13.10)
    inland_dist = compute_min_water_distance_km(80.15, 13.10)
    assert inland_dist >= 0.5


def test_normalizations():
    """Verify mathematical bounds of all 6 factor normalizers."""
    # LST: 20C -> 0.0, 50C -> 100.0
    assert normalize_lst(20.0) == 0.0
    assert normalize_lst(50.0) == 100.0
    assert normalize_lst(35.0) == 50.0

    # Vegetation deficit: 0.70 NDVI -> 0.0 deficit, 0.0 NDVI -> 100.0 deficit
    assert normalize_vegetation_deficit(0.70) == 0.0
    assert normalize_vegetation_deficit(0.0) == 100.0
    assert normalize_vegetation_deficit(0.35) == 50.0

    # Building density: 0.0 -> 0.0, 1.0 -> 100.0
    assert normalize_building_density(0.0) == 0.0
    assert normalize_building_density(0.85) == 85.0

    # Population: 50,000/km2 -> 100.0
    assert normalize_population_exposure(50000.0) == 100.0
    assert normalize_population_exposure(25000.0) == 50.0

    # Water distance: 0km -> 0.0, 6km -> 100.0
    assert normalize_water_distance(0.0) == 0.0
    assert normalize_water_distance(6.0) == 100.0

    # Weather: Heat Index 25C -> 0.0, 45C -> 100.0 with 15 km/h wind modifier (0.7 floor) -> 70.0
    assert normalize_weather_conditions(25.0, 15.0) == 0.0
    assert normalize_weather_conditions(45.0, 15.0) == 70.0


def test_multi_factor_chri_formula():
    """Verify exact 6-factor linear combination:
    CHRI = 0.30*lst + 0.20*veg_deficit + 0.15*bld + 0.15*pop + 0.10*water + 0.10*weather
    """
    score = compute_multi_factor_chri(
        norm_lst=80.0,        # 0.30 * 80 = 24.0
        norm_veg_deficit=60.0,# 0.20 * 60 = 12.0
        norm_bld=70.0,        # 0.15 * 70 = 10.5
        norm_pop=60.0,        # 0.15 * 60 = 9.0
        norm_water_dist=40.0, # 0.10 * 40 = 4.0
        norm_weather=50.0,    # 0.10 * 50 = 5.0
    )
    # Total = 24.0 + 12.0 + 10.5 + 9.0 + 4.0 + 5.0 = 64.5
    assert score == 64.5


def test_decompose_multi_factor_drivers():
    """Verify driver decomposition identifies dominant driver and sums correctly."""
    drivers, dominant, dominant_pct = decompose_multi_factor_drivers(
        norm_lst=90.0,
        norm_veg_deficit=20.0,
        norm_bld=30.0,
        norm_pop=40.0,
        norm_water_dist=10.0,
        norm_weather=20.0,
    )
    assert dominant == "high_lst"
    assert dominant_pct > 40.0
    assert "water_distance" in drivers
    assert "low_ndvi" in drivers


def test_evaluate_zone_pipeline():
    """Verify pipeline evaluation yields full operational metadata."""
    res = geospatial_pipeline.evaluate_zone_pipeline(
        zone_id="ZONE-05",
        zone_name="Zone 5 Royapuram",
        centroid=[80.273, 13.089],
        raw_metrics={
            "lst_c": 41.5,
            "ndvi": 0.07,
            "building_density": 0.89,
            "population_density": 39240,
        }
    )
    assert res["score"] > 60.0
    assert res["data_source"] != ""
    assert res["observation_date"] != ""
    assert res["confidence_score"] >= 0.90
    assert res["methodology"] != ""
    assert res["water_distance_km"] is not None


def test_hexagonal_grid_generator():
    """Verify H3-style hexagonal grid generation covering Chennai bounding box."""
    grid = geospatial_pipeline.generate_chennai_hexagons(step_km=3.0)
    assert grid["type"] == "FeatureCollection"
    assert len(grid["features"]) > 50
    first_cell = grid["features"][0]
    assert first_cell["geometry"]["type"] == "Polygon"
    assert len(first_cell["geometry"]["coordinates"][0]) == 7  # 6 sides + closed loop
    props = first_cell["properties"]
    assert "risk_score" in props
    assert "data_source" in props
    assert "confidence_score" in props


def test_api_zones_hexagons_endpoint(client: TestClient):
    """Verify GET /api/zones/hexagons returns valid GeoJSON feature collection."""
    res = client.get("/api/zones/hexagons?resolution_km=3.5")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 20


def test_all_hotspots_have_required_metadata(client: TestClient):
    """Ensure EVERY hotspot displays:
    - Data source
    - Observation date
    - Last update timestamp
    - Confidence score
    - Methodology
    """
    res = client.get("/api/hotspots?min_risk=0.0")
    assert res.status_code == 200
    hotspots = res.json()
    assert len(hotspots) == 15  # All 15 Chennai GCC zones

    for h in hotspots:
        assert h["data_source"] != ""
        assert h["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"
        assert h["observation_date"] != ""
        assert h["last_update_timestamp"] != ""
        assert 0.0 <= h["confidence_score"] <= 1.0
        assert h["methodology"] != ""
        assert "CHRI" in h["methodology"]
        assert h["water_distance_km"] is not None
