"""Zonal thermal statistical extraction across satellite imagery grid cells.

Calculates descriptive statistics (mean, median, min, max, std) for each grid cell,
verifies data completeness thresholds, computes study-area thermal baselines,
and calculates relative thermal anomalies (Delta T).
"""
from dataclasses import dataclass
from typing import List, Tuple, Optional, Union
import numpy as np
import shapely.geometry
import shapely.ops
import pyproj
import rasterio.features
import rasterio.windows
from rasterio.transform import Affine
from rasterio.crs import CRS

from backend.app.modules.landsat.grid_generator import GridCell
from backend.app.modules.landsat.constants import (
    MIN_VALID_PIXEL_PCT,
    THERMAL_HOTSPOT_ANOMALY_THRESHOLD_C,
)
from backend.app.modules.heat.hotspot_detection import is_hotspot, classify_hotspot_tier


@dataclass
class CellThermalStats:
    """Thermal statistical summary for a single urban grid cell."""
    cell_id: str
    mean_lst_c: Optional[float]
    median_lst_c: Optional[float]
    min_lst_c: Optional[float]
    max_lst_c: Optional[float]
    std_lst_c: Optional[float]
    valid_pixel_count: int
    total_pixel_count: int
    valid_pixel_pct: float
    is_valid: bool
    thermal_anomaly_c: Optional[float] = None
    is_hotspot: bool = False
    hotspot_tier: str = "NOT_HOTSPOT"


def extract_cell_stats(
    cell: GridCell,
    lst_array: np.ndarray,
    raster_transform: Affine,
    raster_crs: Union[CRS, str],
    min_valid_pct: float = MIN_VALID_PIXEL_PCT,
) -> CellThermalStats:
    """Extract zonal LST statistics for a single grid cell from a 2D Celsius raster.

    Args:
        cell: The GridCell spatial unit.
        lst_array: 2D numpy array of LST in Celsius (with NaNs for invalid/cloudy pixels).
        raster_transform: Affine transform of the raster.
        raster_crs: Coordinate Reference System of the raster.
        min_valid_pct: Minimum percentage of valid pixels needed to qualify the cell.

    Returns:
        CellThermalStats object.
    """
    # Standardize raster CRS string
    r_crs = CRS.from_user_input(raster_crs) if not isinstance(raster_crs, CRS) else raster_crs

    # Choose the geometry representation matching raster CRS or reproject
    cell_utm_crs = CRS.from_user_input(f"EPSG:{cell.utm_epsg}")
    if r_crs == cell_utm_crs:
        geom_in_raster = cell.shapely_geom_utm
    elif r_crs == CRS.from_user_input("EPSG:4326"):
        geom_in_raster = cell.shapely_geom_wgs84
    else:
        # Reproject from WGS84 to raster CRS
        transformer = pyproj.Transformer.from_crs("EPSG:4326", r_crs, always_xy=True)
        geom_in_raster = shapely.ops.transform(transformer.transform, cell.shapely_geom_wgs84)

    # Compute raster window corresponding to polygon bounds
    min_x, min_y, max_x, max_y = geom_in_raster.bounds

    try:
        window = rasterio.windows.from_bounds(
            min_x, min_y, max_x, max_y, transform=raster_transform
        )
        # Pad and round window to integer coordinates
        window = window.round_offsets().round_lengths()

        # Clamp window to raster dimensions
        h, w = lst_array.shape
        col_off = max(0, min(int(window.col_off), w))
        row_off = max(0, min(int(window.row_off), h))
        win_w = max(0, min(int(window.width), w - col_off))
        win_h = max(0, min(int(window.height), h - row_off))

        if win_w <= 0 or win_h <= 0:
            return CellThermalStats(
                cell_id=cell.cell_id,
                mean_lst_c=None,
                median_lst_c=None,
                min_lst_c=None,
                max_lst_c=None,
                std_lst_c=None,
                valid_pixel_count=0,
                total_pixel_count=0,
                valid_pixel_pct=0.0,
                is_valid=False,
            )

        # Slice sub-array and sub-transform
        sub_array = lst_array[row_off : row_off + win_h, col_off : col_off + win_w]
        sub_transform = rasterio.windows.transform(
            rasterio.windows.Window(col_off, row_off, win_w, win_h), raster_transform
        )

        # Create geometry mask (True = inside polygon)
        in_poly_mask = rasterio.features.geometry_mask(
            [geom_in_raster],
            out_shape=sub_array.shape,
            transform=sub_transform,
            invert=True,
        )

        cell_pixels = sub_array[in_poly_mask]
        total_pixels = len(cell_pixels)

        if total_pixels == 0:
            return CellThermalStats(
                cell_id=cell.cell_id,
                mean_lst_c=None,
                median_lst_c=None,
                min_lst_c=None,
                max_lst_c=None,
                std_lst_c=None,
                valid_pixel_count=0,
                total_pixel_count=0,
                valid_pixel_pct=0.0,
                is_valid=False,
            )

        valid_pixels = cell_pixels[~np.isnan(cell_pixels)]
        valid_count = len(valid_pixels)
        valid_pct = round((valid_count / total_pixels) * 100.0, 1)

        if valid_pct < min_valid_pct or valid_count == 0:
            return CellThermalStats(
                cell_id=cell.cell_id,
                mean_lst_c=None,
                median_lst_c=None,
                min_lst_c=None,
                max_lst_c=None,
                std_lst_c=None,
                valid_pixel_count=valid_count,
                total_pixel_count=total_pixels,
                valid_pixel_pct=valid_pct,
                is_valid=False,
            )

        mean_c = round(float(np.mean(valid_pixels)), 2)
        median_c = round(float(np.median(valid_pixels)), 2)
        min_c = round(float(np.min(valid_pixels)), 2)
        max_c = round(float(np.max(valid_pixels)), 2)
        std_c = round(float(np.std(valid_pixels)), 2)

        return CellThermalStats(
            cell_id=cell.cell_id,
            mean_lst_c=mean_c,
            median_lst_c=median_c,
            min_lst_c=min_c,
            max_lst_c=max_c,
            std_lst_c=std_c,
            valid_pixel_count=valid_count,
            total_pixel_count=total_pixels,
            valid_pixel_pct=valid_pct,
            is_valid=True,
        )
    except Exception:
        return CellThermalStats(
            cell_id=cell.cell_id,
            mean_lst_c=None,
            median_lst_c=None,
            min_lst_c=None,
            max_lst_c=None,
            std_lst_c=None,
            valid_pixel_count=0,
            total_pixel_count=0,
            valid_pixel_pct=0.0,
            is_valid=False,
        )


def compute_baseline_temperature(
    cell_stats: List[CellThermalStats],
    explicit_baseline: Optional[float] = None,
) -> float:
    """Compute regional study-area reference baseline temperature in Celsius.

    If an explicit baseline is provided, it is returned. Otherwise, computes
    the arithmetic mean of all valid cells in the AOI.
    """
    if explicit_baseline is not None:
        return round(float(explicit_baseline), 2)

    valid_means = [s.mean_lst_c for s in cell_stats if s.is_valid and s.mean_lst_c is not None]
    if not valid_means:
        return 30.0  # Fallback reference

    return round(float(np.mean(valid_means)), 2)


def apply_anomalies_and_hotspots(
    cell_stats: List[CellThermalStats],
    baseline_temp_c: float,
    anomaly_threshold_c: float = THERMAL_HOTSPOT_ANOMALY_THRESHOLD_C,
) -> None:
    """Compute thermal anomaly and qualify hotspots for all cell statistics in-place."""
    for s in cell_stats:
        if s.is_valid and s.mean_lst_c is not None:
            anomaly = round(s.mean_lst_c - baseline_temp_c, 2)
            s.thermal_anomaly_c = anomaly
            # Qualify hotspot using centralized thermal anomaly threshold
            s.is_hotspot = is_hotspot(risk_score=0.0, thermal_anomaly_c=anomaly)
            s.hotspot_tier = classify_hotspot_tier(risk_score=0.0, thermal_anomaly_c=anomaly)
        else:
            s.thermal_anomaly_c = None
            s.is_hotspot = False
            s.hotspot_tier = "NOT_HOTSPOT"
