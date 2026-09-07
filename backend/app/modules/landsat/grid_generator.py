"""Analytical urban grid generation for Landsat thermal characterization.

Decomposes an Area of Interest (AOI) into uniform metric grid cells (e.g. 500m x 500m)
projected in local UTM CRS with RFC 7946 GeoJSON WGS84 outputs.
"""
from dataclasses import dataclass
from typing import List, Tuple, Optional
import numpy as np
import shapely.geometry
import shapely.ops
import pyproj

from backend.app.schemas.common import GeoJSONPolygon
from backend.app.modules.landsat.constants import (
    DEFAULT_GRID_RESOLUTION_M,
)


def compute_utm_epsg(lon: float, lat: float) -> int:
    """Determine the optimal WGS 84 / UTM zone EPSG code for a given coordinate.

    Args:
        lon: Longitude in degrees (-180.0 to +180.0).
        lat: Latitude in degrees (-80.0 to +84.0).

    Returns:
        EPSG integer code (e.g. 32644 for UTM zone 44N in South India / Chennai).
    """
    zone = int(np.floor((lon + 180.0) / 6.0)) + 1
    zone = max(1, min(60, zone))
    if lat >= 0:
        return 32600 + zone
    else:
        return 32700 + zone


@dataclass
class GridCell:
    """Single spatial analysis unit in the urban thermal grid."""
    cell_id: str
    row: int
    col: int
    area_sqkm: float
    centroid: List[float]  # [longitude, latitude] in EPSG:4326
    geometry: GeoJSONPolygon
    shapely_geom_wgs84: shapely.geometry.Polygon
    shapely_geom_utm: shapely.geometry.Polygon
    utm_epsg: int


def generate_grid_cells(
    aoi_bbox: Tuple[float, float, float, float],
    grid_resolution_m: float = DEFAULT_GRID_RESOLUTION_M,
    aoi_polygon: Optional[shapely.geometry.Polygon] = None,
) -> List[GridCell]:
    """Partition a bounding box into a regular grid of metric cells.

    Args:
        aoi_bbox: Bounding box as (min_lon, min_lat, max_lon, max_lat) in EPSG:4326.
        grid_resolution_m: Cell size in meters (default: 500m).
        aoi_polygon: Optional boundary polygon in EPSG:4326 to clip cells against.

    Returns:
        List of GridCell objects with WGS84 GeoJSON geometry and UTM representations.
    """
    min_lon, min_lat, max_lon, max_lat = aoi_bbox

    center_lon = (min_lon + max_lon) / 2.0
    center_lat = (min_lat + max_lat) / 2.0
    utm_epsg = compute_utm_epsg(center_lon, center_lat)

    # Transformers between EPSG:4326 and UTM
    to_utm = pyproj.Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True)
    to_wgs84 = pyproj.Transformer.from_crs(f"EPSG:{utm_epsg}", "EPSG:4326", always_xy=True)

    # Project AOI corners to UTM coordinates
    utm_min_x, utm_min_y = to_utm.transform(min_lon, min_lat)
    utm_max_x, utm_max_y = to_utm.transform(max_lon, max_lat)

    # Ensure min < max in UTM space
    x_start = min(utm_min_x, utm_max_x)
    x_end = max(utm_min_x, utm_max_x)
    y_start = min(utm_min_y, utm_max_y)
    y_end = max(utm_min_y, utm_max_y)

    # Generate regular 1D steps
    x_steps = np.arange(x_start, x_end, grid_resolution_m)
    y_steps = np.arange(y_start, y_end, grid_resolution_m)

    # Pre-transform AOI polygon to UTM if provided for fast spatial filtering
    aoi_polygon_utm = None
    if aoi_polygon is not None:
        aoi_polygon_utm = shapely.ops.transform(to_utm.transform, aoi_polygon)

    cells: List[GridCell] = []
    cell_idx = 1
    area_sqkm = round((grid_resolution_m * grid_resolution_m) / 1e6, 4)

    for row_idx, y0 in enumerate(reversed(y_steps)):
        y1 = y0 + grid_resolution_m
        for col_idx, x0 in enumerate(x_steps):
            x1 = x0 + grid_resolution_m

            # Create square cell polygon in UTM coordinates
            utm_poly = shapely.geometry.box(x0, y0, x1, y1)

            # Filter if an AOI polygon boundary is provided
            if aoi_polygon_utm is not None and not utm_poly.intersects(aoi_polygon_utm):
                continue

            # Reproject cell polygon back to EPSG:4326 (WGS84)
            wgs84_poly = shapely.ops.transform(to_wgs84.transform, utm_poly)

            # Extract outer ring coordinates [lon, lat] with proper rounding
            coords = [
                [round(coord[0], 6), round(coord[1], 6)]
                for coord in wgs84_poly.exterior.coords
            ]

            centroid_pt = wgs84_poly.centroid
            centroid = [round(centroid_pt.x, 6), round(centroid_pt.y, 6)]

            geojson_poly = GeoJSONPolygon(coordinates=[coords])
            cell_id = f"GRID-{cell_idx:04d}"

            cells.append(
                GridCell(
                    cell_id=cell_id,
                    row=row_idx,
                    col=col_idx,
                    area_sqkm=area_sqkm,
                    centroid=centroid,
                    geometry=geojson_poly,
                    shapely_geom_wgs84=wgs84_poly,
                    shapely_geom_utm=utm_poly,
                    utm_epsg=utm_epsg,
                )
            )
            cell_idx += 1

    return cells
