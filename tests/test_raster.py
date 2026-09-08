"""Unit tests for Phase 3A Multispectral Raster Intelligence & NDVI Service.

Tests:
- Web Mercator tile bounding box projections
- Continuous RdYlGn colormap color mapping
- RFC 2083 standard PNG byte buffer encoding
- Dynamic 256x256 Web Mercator NDVI tile generation
- TiTiler dynamic raster URL construction
- STAC scene catalog discovery & curated fallback
- Zonal NDVI analytics and canopy cooling estimation
- REST API endpoints (/api/raster/ndvi/...) and versioned routes (/api/v1/raster/ndvi/...)
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.modules.raster.ndvi_service import (
    ndvi_raster_service,
    tile_to_latlon_bounds,
    ndvi_to_rdylgn_rgba,
    encode_png_rgba,
)
from backend.app.schemas.raster import STACScene, TileJSON, NDVIZonalStats, NDVIColormapBreak
from backend.app.schemas.zone import Zone


# ---------------------------------------------------------------------------
# 1. Coordinate Projections & Color Mapping Unit Tests
# ---------------------------------------------------------------------------

def test_tile_to_latlon_bounds_z0():
    """Verify zoom 0 tile covers the entire Web Mercator world extent."""
    lon_min, lat_min, lon_max, lat_max = tile_to_latlon_bounds(0, 0, 0)
    assert pytest.approx(lon_min, 0.01) == -180.0
    assert pytest.approx(lon_max, 0.01) == 180.0
    assert pytest.approx(lat_min, 0.01) == -85.0511
    assert pytest.approx(lat_max, 0.01) == 85.0511


def test_tile_to_latlon_bounds_chennai_z10():
    """Verify Chennai metropolitan tile coordinate falls within Tamil Nadu coordinates."""
    # At zoom 10, Chennai (~80.27, 13.08) is around tile x=740, y=474
    lon_min, lat_min, lon_max, lat_max = tile_to_latlon_bounds(10, 740, 474)
    assert 79.8 <= lon_min <= 80.5
    assert 12.5 <= lat_min <= 13.5


def test_ndvi_to_rdylgn_rgba_classes():
    """Verify spectral classification breaks for water, built-up, sparse, moderate, and dense."""
    # Water (< 0) -> Blue
    r, g, b, a = ndvi_to_rdylgn_rgba(-0.1)
    assert r == 2 and g == 132 and b == 199 and a > 0

    # Barren / Built-up (0.0 - 0.15)
    r_barren, g_barren, b_barren, a_barren = ndvi_to_rdylgn_rgba(0.05)
    assert r_barren > 200 and a_barren > 0

    # Sparse vegetation (0.15 - 0.30)
    r_sp, g_sp, b_sp, a_sp = ndvi_to_rdylgn_rgba(0.20)
    assert r_sp > 150 and g_sp > 150

    # Moderate canopy (0.30 - 0.50)
    r_mod, g_mod, b_mod, a_mod = ndvi_to_rdylgn_rgba(0.40)
    assert g_mod > r_mod

    # Dense tree canopy (> 0.50) -> Deep Forest Green
    r_dense, g_dense, b_dense, a_dense = ndvi_to_rdylgn_rgba(0.65)
    assert r_dense == 21 and g_dense == 128 and b_dense == 61

    # Out-of-bounds transparent
    assert ndvi_to_rdylgn_rgba(0.5, in_bounds=False) == (0, 0, 0, 0)


# ---------------------------------------------------------------------------
# 2. Pure-Python PNG Encoder Unit Tests
# ---------------------------------------------------------------------------

def test_encode_png_rgba_validity():
    """Verify RFC 2083 standard PNG structure and signature bytes."""
    width, height = 4, 4
    # 4x4 RGBA solid red
    raw = bytes([255, 0, 0, 255] * (width * height))
    png_bytes = encode_png_rgba(width, height, raw)

    # Standard PNG magic number: 89 50 4E 47 0D 0A 1A 0A
    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    # Contains IHDR, IDAT, IEND chunks
    assert b"IHDR" in png_bytes
    assert b"IDAT" in png_bytes
    assert png_bytes.endswith(b"IEND\xaeB`\x82")


def test_generate_ndvi_tile_structure():
    """Verify generate_ndvi_tile returns a valid non-empty PNG byte stream."""
    # Chennai tile at z=10, x=740, y=474
    tile_bytes = ndvi_raster_service.generate_ndvi_tile(10, 740, 474)
    assert isinstance(tile_bytes, bytes)
    assert len(tile_bytes) > 100
    assert tile_bytes[:8] == b"\x89PNG\r\n\x1a\n"


def test_generate_ndvi_tile_out_of_bounds():
    """Verify out-of-bounds tile generates a transparent PNG without crashing."""
    # Out of bounds tile in Atlantic Ocean
    tile_bytes = ndvi_raster_service.generate_ndvi_tile(10, 100, 100)
    assert isinstance(tile_bytes, bytes)
    assert tile_bytes[:8] == b"\x89PNG\r\n\x1a\n"


# ---------------------------------------------------------------------------
# 3. TiTiler & STAC Scene Intelligence Tests
# ---------------------------------------------------------------------------

def test_build_titiler_tile_url():
    """Verify dynamic TiTiler URL string conforms to Microsoft Planetary Computer specification."""
    url = ndvi_raster_service.build_titiler_tile_url(
        scene_id="S2B_MSIL2A_TEST",
        colormap="rdylgn",
        rescale_min=-0.2,
        rescale_max=0.8,
    )
    assert "collection=sentinel-2-l2a" in url
    assert "item=S2B_MSIL2A_TEST" in url
    assert "assets=B08" in url
    assert "assets=B04" in url
    assert "expression=(B08-B04)/(B08%2BB04)" in url
    assert "rescale=-0.2,0.8" in url
    assert "colormap_name=rdylgn" in url
    assert "format=png" in url


import asyncio


def test_discover_stac_scenes():
    """Verify STAC discovery returns valid Sentinel-2 scenes with metadata."""
    scenes = asyncio.run(ndvi_raster_service.discover_stac_scenes(limit=3))
    assert len(scenes) >= 1
    scene = scenes[0]
    assert isinstance(scene, STACScene)
    assert scene.collection == "sentinel-2-l2a"
    assert "Sentinel-2" in scene.satellite
    assert scene.cloud_cover_percentage >= 0.0
    assert scene.resolution_meters == 10
    assert len(scene.bbox) == 4
    assert "titiler" in scene.titiler_tile_url or "planetarycomputer" in scene.titiler_tile_url


def test_compute_zonal_ndvi(sample_zone: Zone, cool_zone: Zone):
    """Verify zonal vegetation analytics for industrial vs vegetated zones."""
    # sample_zone has 4% canopy, 4% grass, 90% impervious
    ind_stats = ndvi_raster_service.compute_zonal_ndvi(sample_zone)
    assert isinstance(ind_stats, NDVIZonalStats)
    assert ind_stats.zone_id == sample_zone.id
    assert ind_stats.canopy_cover_percentage == 4.0
    assert ind_stats.mean_ndvi < 0.20
    assert ind_stats.vegetation_health in ("Sparse", "Stressed", "Barren")

    # cool_zone has high canopy and grass
    park_stats = ndvi_raster_service.compute_zonal_ndvi(cool_zone)
    assert park_stats.canopy_cover_percentage > 20.0
    assert park_stats.mean_ndvi > ind_stats.mean_ndvi
    assert park_stats.thermal_mitigation_cooling_c > ind_stats.thermal_mitigation_cooling_c


def test_colormap_breaks():
    """Verify colormap breaks provide 5 distinct visual stops."""
    breaks = ndvi_raster_service.get_colormap_breaks()
    assert len(breaks) == 5
    assert breaks[0].value == -0.2
    assert breaks[-1].value == 0.50
    for b in breaks:
        assert isinstance(b, NDVIColormapBreak)
        assert b.color.startswith("#")


# ---------------------------------------------------------------------------
# 4. REST API Endpoint Tests
# ---------------------------------------------------------------------------

def test_api_ndvi_scenes(client: TestClient):
    """Verify GET /api/raster/ndvi/scenes returns 200 with list of scenes."""
    response = client.get("/api/raster/ndvi/scenes?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["collection"] == "sentinel-2-l2a"


def test_api_ndvi_tilejson(client: TestClient):
    """Verify GET /api/raster/ndvi/tilejson returns valid TileJSON specification."""
    response = client.get("/api/raster/ndvi/tilejson")
    assert response.status_code == 200
    data = response.json()
    assert data["tilejson"] == "2.2.0"
    assert "tiles" in data
    assert len(data["tiles"]) >= 1
    assert any("{z}/{x}/{y}.png" in t for t in data["tiles"])
    assert data["minzoom"] <= data["maxzoom"]


def test_api_ndvi_tile_png(client: TestClient):
    """Verify GET /api/raster/ndvi/tiles/{z}/{x}/{y}.png returns PNG image."""
    response = client.get("/api/raster/ndvi/tiles/10/740/474.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_api_ndvi_tile_out_of_bounds_validation(client: TestClient):
    """Verify invalid tile coordinates return 400."""
    response = client.get("/api/raster/ndvi/tiles/2/100/100.png")
    assert response.status_code == 400


def test_api_ndvi_zonal_stats(client: TestClient):
    """Verify GET /api/raster/ndvi/zonal-stats/{zone_id} returns accurate stats."""
    # Test with known zone
    response = client.get("/api/raster/ndvi/zonal-stats/ZONE-01")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-01"
    assert "mean_ndvi" in data
    assert "canopy_cover_percentage" in data
    assert "thermal_mitigation_cooling_c" in data

    # Test with non-existent zone
    err = client.get("/api/raster/ndvi/zonal-stats/ZONE-NONEXISTENT")
    assert err.status_code == 404


def test_api_ndvi_colormap(client: TestClient):
    """Verify GET /api/raster/ndvi/colormap returns color breaks."""
    response = client.get("/api/raster/ndvi/colormap")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    assert data[0]["value"] == -0.2


def test_versioned_raster_endpoints(client: TestClient):
    """Verify /api/v1/raster/... endpoints are fully functional."""
    resp1 = client.get("/api/v1/raster/ndvi/tilejson")
    assert resp1.status_code == 200
    assert resp1.json()["tilejson"] == "2.2.0"

    resp2 = client.get("/api/v1/raster/ndvi/colormap")
    assert resp2.status_code == 200
    assert len(resp2.json()) == 5


# ---------------------------------------------------------------------------
# 5. Landsat 8/9 LST Unit & Integration Tests
# ---------------------------------------------------------------------------

from backend.app.modules.raster.lst_service import (
    lst_raster_service,
    classify_thermal_anomaly,
    lst_to_thermal_rgba,
)
from backend.app.schemas.raster import LSTZonalStats, LSTColormapBreak


def test_classify_thermal_anomaly_tiers():
    """Verify classification thresholds for thermal anomaly."""
    assert classify_thermal_anomaly(9.2) == "Extreme"
    assert classify_thermal_anomaly(6.5) == "Severe"
    assert classify_thermal_anomaly(3.8) == "High"
    assert classify_thermal_anomaly(1.5) == "Moderate"
    assert classify_thermal_anomaly(0.4) == "Low"


def test_lst_to_thermal_rgba_colors():
    """Verify thermal colormap stops for marine, cool refuge, moderate, elevated, and critical."""
    # Marine / Bay of Bengal (< 27°C) -> Azure blue
    r1, g1, b1, a1 = lst_to_thermal_rgba(25.0)
    assert r1 == 2 and g1 == 132 and b1 == 199

    # Cool refuge (27 - 32°C)
    r2, g2, b2, a2 = lst_to_thermal_rgba(29.5)
    assert b2 > 150

    # Moderate built-up (32 - 37°C)
    r3, g3, b3, a3 = lst_to_thermal_rgba(35.0)
    assert r3 > 200 and g3 > 150

    # Elevated surface heat (37 - 42°C)
    r4, g4, b4, a4 = lst_to_thermal_rgba(39.5)
    assert r4 > 200 and g4 < 100

    # Critical heat island (>= 42°C) -> Crimson
    r5, g5, b5, a5 = lst_to_thermal_rgba(44.0)
    assert r5 == 153 and g5 == 27 and b5 == 27

    # Out of bounds transparent
    assert lst_to_thermal_rgba(35.0, in_bounds=False) == (0, 0, 0, 0)


def test_generate_lst_tile_structure():
    """Verify generate_lst_tile returns a valid non-empty PNG byte stream."""
    tile_bytes = lst_raster_service.generate_lst_tile(10, 740, 474)
    assert isinstance(tile_bytes, bytes)
    assert len(tile_bytes) > 100
    assert tile_bytes[:8] == b"\x89PNG\r\n\x1a\n"


def test_build_titiler_lst_tile_url():
    """Verify dynamic TiTiler URL string conforms to Landsat Collection 2 specification."""
    url = lst_raster_service.build_titiler_tile_url(
        scene_id="LC09_L2SP_TEST",
        colormap="magma",
        rescale_min=295.0,
        rescale_max=325.0,
    )
    assert "collection=landsat-c2-l2" in url
    assert "item=LC09_L2SP_TEST" in url
    assert "assets=lwir11" in url
    assert "rescale=295.0,325.0" in url
    assert "colormap_name=magma" in url
    assert "format=png" in url


def test_discover_stac_scenes_lst():
    """Verify Landsat scene discovery returns valid scenes."""
    scenes = asyncio.run(lst_raster_service.discover_stac_scenes(limit=2))
    assert len(scenes) >= 1
    scene = scenes[0]
    assert isinstance(scene, STACScene)
    assert scene.collection == "landsat-c2-l2"
    assert "Landsat" in scene.satellite
    assert scene.resolution_meters == 30


def test_compute_zonal_lst(sample_zone: Zone, cool_zone: Zone):
    """Verify zonal LST calculations for high-risk vs cool refuge zones."""
    ind_stats = lst_raster_service.compute_zonal_lst(sample_zone)
    assert isinstance(ind_stats, LSTZonalStats)
    assert ind_stats.zone_id == sample_zone.id
    assert ind_stats.mean_lst_c == sample_zone.thermal_observation.land_surface_temp_c
    assert ind_stats.thermal_anomaly_c == sample_zone.thermal_observation.thermal_anomaly_c
    assert ind_stats.heat_stress_tier in ("Extreme", "Severe")

    cool_stats = lst_raster_service.compute_zonal_lst(cool_zone)
    assert cool_stats.mean_lst_c < ind_stats.mean_lst_c
    assert cool_stats.thermal_anomaly_c < ind_stats.thermal_anomaly_c


def test_colormap_breaks_lst():
    """Verify LST colormap breaks provide 5 distinct visual stops."""
    breaks = lst_raster_service.get_colormap_breaks()
    assert len(breaks) == 5
    assert breaks[0].value == 25.0
    assert breaks[-1].value == 45.0
    for b in breaks:
        assert isinstance(b, LSTColormapBreak)
        assert b.color.startswith("#")


def test_api_lst_scenes(client: TestClient):
    """Verify GET /api/raster/lst/scenes returns 200 with list of Landsat scenes."""
    response = client.get("/api/raster/lst/scenes?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["collection"] == "landsat-c2-l2"


def test_api_lst_tilejson(client: TestClient):
    """Verify GET /api/raster/lst/tilejson returns valid TileJSON."""
    response = client.get("/api/raster/lst/tilejson")
    assert response.status_code == 200
    data = response.json()
    assert data["tilejson"] == "2.2.0"
    assert "tiles" in data
    assert any("{z}/{x}/{y}.png" in t for t in data["tiles"])


def test_api_lst_tile_png(client: TestClient):
    """Verify GET /api/raster/lst/tiles/{z}/{x}/{y}.png returns thermal PNG."""
    response = client.get("/api/raster/lst/tiles/10/740/474.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_api_lst_zonal_stats(client: TestClient):
    """Verify GET /api/raster/lst/zonal-stats/{zone_id} returns thermal metrics."""
    response = client.get("/api/raster/lst/zonal-stats/ZONE-01")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-01"
    assert "mean_lst_c" in data
    assert "thermal_anomaly_c" in data
    assert "heat_stress_tier" in data

    err = client.get("/api/raster/lst/zonal-stats/ZONE-UNKNOWN")
    assert err.status_code == 404


def test_api_lst_colormap(client: TestClient):
    """Verify GET /api/raster/lst/colormap returns 5 color breaks."""
    response = client.get("/api/raster/lst/colormap")
    assert response.status_code == 200
    assert len(response.json()) == 5


def test_versioned_lst_endpoints(client: TestClient):
    """Verify /api/v1/raster/lst/... endpoints function identically."""
    resp1 = client.get("/api/v1/raster/lst/tilejson")
    assert resp1.status_code == 200
    assert resp1.json()["tilejson"] == "2.2.0"

    resp2 = client.get("/api/v1/raster/lst/colormap")
    assert resp2.status_code == 200
    assert len(resp2.json()) == 5

