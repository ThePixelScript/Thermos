"""Synthetic Landsat raster fixture generator for high-speed, deterministic unit testing.

Generates small, georeferenced GeoTIFFs (40x40 pixels @ 30m resolution in UTM 44N)
with known temperatures, nodata pixels, and QA cloud/shadow bitmasks.
"""
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.crs import CRS

from backend.app.modules.landsat.constants import (
    ST_SCALE_FACTOR,
    ST_ADD_OFFSET,
    KELVIN_TO_CELSIUS,
    QA_CLEAR_BIT,
    QA_CLOUD_BIT,
    QA_CLOUD_SHADOW_BIT,
    QA_FILL_BIT,
)


def celsius_to_dn(celsius: float) -> int:
    """Convert temperature in Celsius to corresponding Landsat Level-2 DN."""
    kelvin = celsius + KELVIN_TO_CELSIUS
    dn = int(round((kelvin - ST_ADD_OFFSET) / ST_SCALE_FACTOR))
    return max(1, min(65535, dn))


def create_synthetic_landsat_scene(
    target_dir: Path,
    width: int = 40,
    height: int = 40,
    origin_x: float = 407000.0,
    origin_y: float = 1420000.0,
    pixel_size: float = 30.0,
    utm_epsg: int = 32644,
) -> Tuple[Path, Path, Dict[str, Any]]:
    """Generate synthetic ST and QA_PIXEL GeoTIFFs for testing.

    Spatial layout (40x40 pixels = 1200m x 1200m):
    - Top-left quadrant (20x20): Baseline urban area (30.0°C)
    - Top-right quadrant (20x20): High-intensity hotspot (42.0°C)
    - Bottom-left quadrant (20x20): Cloud-contaminated region (marked in QA_PIXEL)
    - Bottom-right quadrant (20x20): Moderate heat area (35.0°C), with a 2-pixel fill border (DN=0)

    Returns:
        Tuple of (st_tif_path, qa_tif_path, ground_truth_dict).
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    st_path = target_dir / "LC09_L2SP_142051_SYNTHETIC_ST_B10.TIF"
    qa_path = target_dir / "LC09_L2SP_142051_SYNTHETIC_QA_PIXEL.TIF"

    transform = from_origin(origin_x, origin_y, pixel_size, pixel_size)
    crs = CRS.from_epsg(utm_epsg)

    # Base arrays (uint16 for standard Landsat Collection 2)
    st_data = np.zeros((height, width), dtype=np.uint16)
    qa_data = np.full((height, width), QA_CLEAR_BIT, dtype=np.uint16)

    dn_30c = celsius_to_dn(30.0)
    dn_42c = celsius_to_dn(42.0)
    dn_35c = celsius_to_dn(35.0)

    # Top-left: Baseline 30.0°C, clear sky
    st_data[0:20, 0:20] = dn_30c

    # Top-right: Severe hotspot 42.0°C, clear sky
    st_data[0:20, 20:40] = dn_42c

    # Bottom-left: Cloud contaminated area
    st_data[20:40, 0:20] = dn_30c
    qa_data[20:30, 0:20] = QA_CLOUD_BIT          # Cloud
    qa_data[30:40, 0:20] = QA_CLOUD_SHADOW_BIT   # Cloud Shadow

    # Bottom-right: Moderate heat 35.0°C with nodata edge
    st_data[20:40, 20:40] = dn_35c
    st_data[38:40, 20:40] = 0                    # DN=0 Fill/Nodata
    qa_data[38:40, 20:40] = QA_FILL_BIT

    # Write ST GeoTIFF
    with rasterio.open(
        st_path,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=1,
        dtype=st_data.dtype,
        crs=crs,
        transform=transform,
        nodata=0,
    ) as dst:
        dst.write(st_data, 1)

    # Write QA_PIXEL GeoTIFF
    with rasterio.open(
        qa_path,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=1,
        dtype=qa_data.dtype,
        crs=crs,
        transform=transform,
        nodata=1,
    ) as dst:
        dst.write(qa_data, 1)

    ground_truth = {
        "st_path": str(st_path),
        "qa_path": str(qa_path),
        "utm_epsg": utm_epsg,
        "pixel_size_m": pixel_size,
        "baseline_temp_c": 30.0,
        "hotspot_temp_c": 42.0,
        "moderate_temp_c": 35.0,
        "cloud_quadrant": "bottom-left",
        "dn_30c": dn_30c,
        "dn_42c": dn_42c,
        "dn_35c": dn_35c,
    }

    return st_path, qa_path, ground_truth
