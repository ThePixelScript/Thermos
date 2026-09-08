"""FastAPI Router for Phase 3A Multispectral Raster Intelligence.

Exposes endpoints:
- GET /api/raster/ndvi/scenes: Discover Sentinel-2 STAC scenes
- GET /api/raster/ndvi/tilejson: OpenGIS TileJSON 2.2.0 metadata for MapLibre
- GET /api/raster/ndvi/tiles/{z}/{x}/{y}.png: Synthesized high-resolution Web Mercator PNG tile
- GET /api/raster/ndvi/zonal-stats/{zone_id}: Zonal NDVI analytics and canopy cooling
- GET /api/raster/ndvi/colormap: Color ramp classification breaks for map legend
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response
from backend.app.schemas.raster import (
    STACScene,
    TileJSON,
    NDVIZonalStats,
    NDVIColormapBreak,
    LSTZonalStats,
    LSTColormapBreak,
)
from backend.app.modules.raster.ndvi_service import ndvi_raster_service
from backend.app.modules.raster.lst_service import lst_raster_service
from backend.app.data.repository import repository

router = APIRouter(prefix="/raster", tags=["Raster Intelligence"])


@router.get("/ndvi/scenes", response_model=List[STACScene])
async def get_ndvi_scenes(
    min_lon: Optional[float] = Query(None, description="Minimum longitude"),
    min_lat: Optional[float] = Query(None, description="Minimum latitude"),
    max_lon: Optional[float] = Query(None, description="Maximum longitude"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude"),
    max_cloud_cover: float = Query(15.0, ge=0.0, le=100.0, description="Maximum cloud cover percentage"),
    limit: int = Query(5, ge=1, le=20, description="Max number of scenes to return"),
) -> List[STACScene]:
    """Discover cloud-free Sentinel-2 Level-2A scenes through STAC catalogs."""
    bbox = None
    if None not in (min_lon, min_lat, max_lon, max_lat):
        bbox = [min_lon, min_lat, max_lon, max_lat]

    return await ndvi_raster_service.discover_stac_scenes(
        bbox=bbox,
        max_cloud_cover=max_cloud_cover,
        limit=limit,
    )


@router.get("/ndvi/tilejson", response_model=TileJSON)
def get_ndvi_tilejson(request: Request) -> TileJSON:
    """Returns TileJSON 2.2.0 metadata for direct consumption by MapLibre GL JS."""
    base_url = str(request.base_url).rstrip("/")
    return ndvi_raster_service.get_tilejson(base_url=base_url)


@router.get(
    "/ndvi/tiles/{z}/{x}/{y}.png",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "Standard 256x256 Web Mercator PNG tile",
        }
    },
)
def get_ndvi_tile(z: int, x: int, y: int) -> Response:
    """Renders a 256x256 Web Mercator PNG tile with RdYlGn colormapping."""
    if z < 0 or z > 22:
        raise HTTPException(status_code=400, detail="Zoom level out of range (0-22)")
    max_coord = (1 << z) - 1
    if x < 0 or x > max_coord or y < 0 or y > max_coord:
        raise HTTPException(status_code=400, detail="Tile coordinates out of bounds for given zoom level")

    png_bytes = ndvi_raster_service.generate_ndvi_tile(z, x, y)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "Content-Type": "image/png",
        },
    )


@router.get("/ndvi/zonal-stats/{zone_id}", response_model=NDVIZonalStats)
def get_ndvi_zonal_stats(zone_id: str) -> NDVIZonalStats:
    """Calculates zonal vegetation statistics and thermal mitigation benefit for an urban zone."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return ndvi_raster_service.compute_zonal_ndvi(zone)


@router.get("/ndvi/colormap", response_model=List[NDVIColormapBreak])
def get_ndvi_colormap() -> List[NDVIColormapBreak]:
    """Returns standard cartographic color ramp classification stops for UI legend visualization."""
    return ndvi_raster_service.get_colormap_breaks()


# ---------------------------------------------------------------------------
# Landsat 8/9 Thermal Infrared (LST) Endpoints
# ---------------------------------------------------------------------------

@router.get("/lst/scenes", response_model=List[STACScene])
async def get_lst_scenes(
    min_lon: Optional[float] = Query(None, description="Minimum longitude"),
    min_lat: Optional[float] = Query(None, description="Minimum latitude"),
    max_lon: Optional[float] = Query(None, description="Maximum longitude"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude"),
    max_cloud_cover: float = Query(15.0, ge=0.0, le=100.0, description="Maximum cloud cover percentage"),
    limit: int = Query(5, ge=1, le=20, description="Max number of scenes to return"),
) -> List[STACScene]:
    """Discover cloud-free Landsat 8/9 Collection 2 Level-2 thermal scenes through STAC catalogs."""
    bbox = None
    if None not in (min_lon, min_lat, max_lon, max_lat):
        bbox = [min_lon, min_lat, max_lon, max_lat]

    return await lst_raster_service.discover_stac_scenes(
        bbox=bbox,
        max_cloud_cover=max_cloud_cover,
        limit=limit,
    )


@router.get("/lst/tilejson", response_model=TileJSON)
def get_lst_tilejson(request: Request) -> TileJSON:
    """Returns TileJSON 2.2.0 metadata for direct consumption by MapLibre GL JS."""
    base_url = str(request.base_url).rstrip("/")
    return lst_raster_service.get_tilejson(base_url=base_url)


@router.get(
    "/lst/tiles/{z}/{x}/{y}.png",
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "Standard 256x256 Web Mercator thermal PNG tile",
        }
    },
)
def get_lst_tile(z: int, x: int, y: int) -> Response:
    """Renders a 256x256 Web Mercator PNG tile with thermal colormapping."""
    if z < 0 or z > 22:
        raise HTTPException(status_code=400, detail="Zoom level out of range (0-22)")
    max_coord = (1 << z) - 1
    if x < 0 or x > max_coord or y < 0 or y > max_coord:
        raise HTTPException(status_code=400, detail="Tile coordinates out of bounds for given zoom level")

    png_bytes = lst_raster_service.generate_lst_tile(z, x, y)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "Content-Type": "image/png",
        },
    )


@router.get("/lst/zonal-stats/{zone_id}", response_model=LSTZonalStats)
def get_lst_zonal_stats(zone_id: str) -> LSTZonalStats:
    """Calculates zonal thermal metrics, anomaly differential, and heat stress tier."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return lst_raster_service.compute_zonal_lst(zone)


@router.get("/lst/colormap", response_model=List[LSTColormapBreak])
def get_lst_colormap() -> List[LSTColormapBreak]:
    """Returns standard cartographic color ramp classification stops for thermal UI legend."""
    return lst_raster_service.get_colormap_breaks()

