"""Comprehensive unit and integration test suite for the Landsat Real-Data Vertical Slice."""
import json
import pytest
import numpy as np
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.schemas.common import Typology, DataClassification
from backend.app.modules.landsat.constants import (
    ST_SCALE_FACTOR,
    ST_ADD_OFFSET,
    KELVIN_TO_CELSIUS,
    QA_CLEAR_BIT,
    QA_CLOUD_BIT,
    QA_CLOUD_SHADOW_BIT,
)
from backend.app.modules.landsat.st_converter import (
    dn_to_lst_celsius,
    read_landsat_st_and_convert,
)
from backend.app.modules.landsat.grid_generator import (
    compute_utm_epsg,
    generate_grid_cells,
)
from backend.app.modules.landsat.zonal_stats import (
    extract_cell_stats,
    compute_baseline_temperature,
    apply_anomalies_and_hotspots,
)
from backend.app.modules.landsat.pipeline import LandsatPipeline
from backend.app.data.repository import ZoneRepository
from tests.fixtures.synthetic_landsat_fixture import (
    create_synthetic_landsat_scene,
    celsius_to_dn,
)


@pytest.fixture
def synthetic_scene(tmp_path):
    """Fixture providing temporary synthetic Landsat ST and QA GeoTIFFs."""
    st_path, qa_path, ground_truth = create_synthetic_landsat_scene(tmp_path)
    return {
        "st_path": st_path,
        "qa_path": qa_path,
        "ground_truth": ground_truth,
        "dir": tmp_path,
    }


def test_radiometric_scaling_and_qa_masking():
    """Verify USGS Collection 2 Level-2 ST formula and QA cloud filtering."""
    # Test temperature conversion for 30.0°C
    target_c = 30.0
    dn = celsius_to_dn(target_c)
    dn_arr = np.array([[dn]], dtype=np.uint16)

    # Without QA
    lst_c = dn_to_lst_celsius(dn_arr)
    assert abs(lst_c[0, 0] - target_c) < 0.05

    # Test nodata (DN=0) returns NaN
    dn_zero = np.array([[0]], dtype=np.uint16)
    lst_zero = dn_to_lst_celsius(dn_zero)
    assert np.isnan(lst_zero[0, 0])

    # Test clear sky QA pixel preserves value
    qa_clear = np.array([[QA_CLEAR_BIT]], dtype=np.uint16)
    lst_clear = dn_to_lst_celsius(dn_arr, qa=qa_clear, mask_clouds=True)
    assert abs(lst_clear[0, 0] - target_c) < 0.05

    # Test cloud QA pixel masks value to NaN
    qa_cloud = np.array([[QA_CLOUD_BIT]], dtype=np.uint16)
    lst_cloud = dn_to_lst_celsius(dn_arr, qa=qa_cloud, mask_clouds=True)
    assert np.isnan(lst_cloud[0, 0])

    # Test cloud shadow QA pixel masks value to NaN
    qa_shadow = np.array([[QA_CLOUD_SHADOW_BIT]], dtype=np.uint16)
    lst_shadow = dn_to_lst_celsius(dn_arr, qa=qa_shadow, mask_clouds=True)
    assert np.isnan(lst_shadow[0, 0])


def test_utm_epsg_calculation():
    """Test accurate UTM zone calculation across geographical locations."""
    # Chennai (80.27°E, 13.08°N) -> UTM Zone 44N
    assert compute_utm_epsg(80.27, 13.08) == 32644

    # Delhi (77.21°E, 28.63°N) -> UTM Zone 43N
    assert compute_utm_epsg(77.21, 28.63) == 32643

    # Southern Hemisphere: Sydney (151.2°E, -33.8°S) -> UTM Zone 56S
    assert compute_utm_epsg(151.2, -33.8) == 32756


def test_grid_generator():
    """Test regular metric grid cell generation and GeoJSON compliance."""
    bbox = (80.15, 12.80, 80.20, 12.85)  # South Chennai region
    cells = generate_grid_cells(aoi_bbox=bbox, grid_resolution_m=500.0)

    assert len(cells) > 0
    cell = cells[0]

    # Verify ID and area
    assert cell.cell_id.startswith("GRID-")
    assert cell.area_sqkm == 0.25  # 500m x 500m = 0.25 km²

    # Verify GeoJSON polygon format
    assert cell.geometry.type == "Polygon"
    ring = cell.geometry.coordinates[0]
    assert len(ring) == 5  # Closed 4-corner polygon
    assert ring[0] == ring[-1]  # Closed ring

    # Verify centroid is inside bounding range
    lon, lat = cell.centroid
    assert 80.14 <= lon <= 80.21
    assert 12.79 <= lat <= 12.86


def test_synthetic_scene_zonal_stats(synthetic_scene):
    """Test zonal statistical extraction over synthetic Landsat scene."""
    st_path = synthetic_scene["st_path"]
    qa_path = synthetic_scene["qa_path"]

    lst_array, transform, crs = read_landsat_st_and_convert(st_path, qa_path, mask_clouds=True)
    assert lst_array.shape == (40, 40)

    # 40x40 raster @ 30m = 1200m x 1200m.
    # We generate 500m grid cells covering this scene.
    # Extract bounds in WGS84
    import pyproj
    to_wgs = pyproj.Transformer.from_crs(crs, "EPSG:4326", always_xy=True)
    min_x = transform.c
    max_y = transform.f
    max_x = min_x + 40 * 30.0
    min_y = max_y - 40 * 30.0

    w_min_lon, w_min_lat = to_wgs.transform(min_x, min_y)
    w_max_lon, w_max_lat = to_wgs.transform(max_x, max_y)
    bbox = (min(w_min_lon, w_max_lon), min(w_min_lat, w_max_lat), max(w_min_lon, w_max_lon), max(w_min_lat, w_max_lat))

    cells = generate_grid_cells(bbox, grid_resolution_m=500.0)
    assert len(cells) >= 4

    stats_list = []
    for cell in cells:
        stats = extract_cell_stats(cell, lst_array, transform, crs)
        stats_list.append(stats)

    valid_stats = [s for s in stats_list if s.is_valid]
    assert len(valid_stats) > 0

    # At least one cell should have mean temp near 42°C (hotspot quadrant)
    temps = [s.mean_lst_c for s in valid_stats if s.mean_lst_c is not None]
    assert any(abs(t - 42.0) < 1.0 for t in temps)
    # At least one cell should have mean temp near 30°C (baseline quadrant)
    assert any(abs(t - 30.0) < 1.0 for t in temps)


def test_pipeline_end_to_end(synthetic_scene, tmp_path):
    """Test full pipeline execution, metadata creation, and honest provenance tracking."""
    st_path = synthetic_scene["st_path"]
    qa_path = synthetic_scene["qa_path"]
    out_json = tmp_path / "processed_real_zones.json"

    pipeline = LandsatPipeline(grid_resolution_m=500.0)
    summary = pipeline.run(
        st_path=st_path,
        qa_path=qa_path,
        city_name="Synthetic Test City",
        scene_metadata={"scene_id": "LC09_TEST_SCENE", "satellite": "Landsat-9"},
        output_json_path=out_json,
    )

    assert summary.status == "success"
    assert summary.metadata.scene_id == "LC09_TEST_SCENE"
    assert summary.metadata.valid_cells > 0
    assert summary.metadata.hotspots_count > 0
    assert out_json.exists()

    # Inspect generated JSON payload
    with open(out_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Synthetic fixture correctly marked as synthetic
    assert data["is_synthetic"] is True
    assert data["data_status"] == "SYNTHETIC_CALIBRATED_SAMPLE"
    assert len(data["zones"]) == summary.metadata.valid_cells

    first_zone = data["zones"][0]
    # Scientific integrity check: land_cover and demographics must NOT be fabricated
    assert first_zone.get("land_cover") is None
    assert first_zone.get("demographics") is None
    assert first_zone["typology"] == Typology.SATELLITE_GRID.value

    # Provenance auditability check
    prov = first_zone.get("provenance", [])
    assert len(prov) >= 2
    sources = [p["source"] for p in prov]
    assert any("Landsat" in s for s in sources)
    assert any("Not Observed" in s for s in sources)


def test_usgs_official_scene_parsing():
    """Verify parsing of official USGS Landsat Collection 2 product identifiers."""
    from backend.app.modules.landsat.pipeline import parse_landsat_metadata

    # Real USGS Landsat 9 scene for Chennai Path 142 Row 051
    real_scene_path = "LC09_L2SP_142051_20230520_20230522_02_T1_ST_B10.TIF"
    meta = parse_landsat_metadata(real_scene_path)
    assert meta["scene_id"] == "LC09_L2SP_142051_20230520_20230522_02_T1"
    assert meta["satellite"] == "Landsat-9"
    assert meta["sensor"] == "TIRS-2"
    assert meta["acquisition_date"] == "2023-05-20"
    assert meta["wrs_path"] == 142
    assert meta["wrs_row"] == 51
    assert meta["is_synthetic"] is False
    assert meta["data_status"] == "REAL_SATELLITE_DERIVED"
    assert meta["verification_status"] == "ACTUAL_SATELLITE_DERIVED"

    # Synthetic test scene
    synth_scene_path = "LC09_L2SP_142051_SYNTHETIC_ST_B10.TIF"
    synth_meta = parse_landsat_metadata(synth_scene_path)
    assert synth_meta["is_synthetic"] is True
    assert synth_meta["data_status"] == "SYNTHETIC_CALIBRATED_SAMPLE"


def test_real_data_api_endpoints(synthetic_scene, tmp_path, monkeypatch):
    """Test real-data API endpoints using TestClient."""
    # Generate real data file
    out_json = tmp_path / "real_zones.json"
    pipeline = LandsatPipeline(grid_resolution_m=500.0)
    pipeline.run(
        st_path=synthetic_scene["st_path"],
        qa_path=synthetic_scene["qa_path"],
        city_name="Chennai Metropolitan Area",
        scene_metadata={"scene_id": "LC09_API_TEST"},
        output_json_path=out_json,
    )

    # Point settings.real_data_path to the test generated file
    monkeypatch.setattr(settings, "real_data_path", out_json)

    client = TestClient(app)

    # 1. Test GET /api/v1/real-data/metadata
    resp_meta = client.get("/api/v1/real-data/metadata")
    assert resp_meta.status_code == 200
    meta_json = resp_meta.json()
    assert meta_json["scene_id"] == "LC09_API_TEST"
    assert meta_json["is_synthetic"] is True
    assert meta_json["data_status"] == "SYNTHETIC_CALIBRATED_SAMPLE"
    assert meta_json["hotspots_count"] > 0

    # 2. Test GET /api/v1/real-data/zones
    resp_zones = client.get("/api/v1/real-data/zones")
    assert resp_zones.status_code == 200
    zones_list = resp_zones.json()
    assert len(zones_list) > 0
    assert zones_list[0]["temperature"] > 0

    # 3. Test GET /api/v1/real-data/zones/geojson
    resp_geojson = client.get("/api/v1/real-data/zones/geojson")
    assert resp_geojson.status_code == 200
    fc = resp_geojson.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) > 0
    assert fc["features"][0]["geometry"]["type"] == "Polygon"

    # 4. Test GET /api/v1/real-data/hotspots
    resp_hotspots = client.get("/api/v1/real-data/hotspots?min_anomaly=3.0")
    assert resp_hotspots.status_code == 200
    hotspots = resp_hotspots.json()
    assert len(hotspots) > 0
    # Hotspots must be sorted descending by thermal anomaly
    anomalies = [h["thermal_anomaly_c"] for h in hotspots]
    assert anomalies == sorted(anomalies, reverse=True)
    assert hotspots[0]["rank"] == 1
    assert hotspots[0]["is_hotspot"] is True


def test_zone_repository_with_real_data(synthetic_scene, tmp_path, monkeypatch):
    """Verify ZoneRepository seamlessly loads real data when DATA_MODE=real."""
    out_json = tmp_path / "real_zones.json"
    pipeline = LandsatPipeline(grid_resolution_m=500.0)
    pipeline.run(
        st_path=synthetic_scene["st_path"],
        qa_path=synthetic_scene["qa_path"],
        city_name="Chennai Metropolitan Area",
        output_json_path=out_json,
    )

    # Switch to real data mode
    monkeypatch.setattr(settings, "data_mode", "real")
    monkeypatch.setattr(settings, "real_data_path", out_json)

    repo = ZoneRepository()
    assert repo.city_metadata["data_status"] == "SYNTHETIC_CALIBRATED_SAMPLE"
    zones = repo.list_zones()
    assert len(zones) > 0

    # Test GeoJSON export
    fc = repo.get_geojson_feature_collection()
    assert fc.type == "FeatureCollection"
    assert len(fc.features) == len(zones)

    # Test hotspot listing
    hotspots = repo.list_hotspots(min_risk_score=0.0)
    assert len(hotspots) > 0
