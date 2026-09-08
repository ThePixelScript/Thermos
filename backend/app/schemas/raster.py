"""Schemas for Raster Intelligence & Satellite Remote Sensing.

Defines schemas for:
- STACScene: Sentinel-2 & Landsat-8/9 scene metadata
- TileJSON: OpenGIS TileJSON 2.2.0 specification
- NDVIZonalStats: Multi-spectral zonal vegetation analytics
- NDVIColormapBreak: Color ramp breaks for cartographic visualization
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class STACScene(BaseModel):
    """Satellite scene metadata discovered via STAC catalog."""
    scene_id: str = Field(..., description="Unique STAC item identifier")
    collection: str = Field(..., description="STAC collection ID (e.g. 'sentinel-2-l2a')")
    satellite: str = Field(..., description="Satellite platform name (e.g. 'Sentinel-2B')")
    acquisition_date: str = Field(..., description="ISO 8601 acquisition timestamp")
    cloud_cover_percentage: float = Field(..., ge=0.0, le=100.0, description="Cloud cover percentage")
    sun_elevation_deg: float = Field(..., description="Solar elevation angle in degrees")
    resolution_meters: int = Field(default=10, description="Spatial pixel resolution in meters")
    bbox: List[float] = Field(..., description="Bounding box [minLon, minLat, maxLon, maxLat]")
    titiler_tile_url: str = Field(..., description="Dynamic TiTiler tile URL template")
    assets: List[str] = Field(default_factory=list, description="Available spectral bands")


class TileJSON(BaseModel):
    """TileJSON 2.2.0 specification for MapLibre GL JS integration."""
    tilejson: str = Field(default="2.2.0")
    name: str = Field(..., description="Layer display name")
    description: str = Field(..., description="Layer summary description")
    tiles: List[str] = Field(..., description="Array of tile URL templates containing {z}/{x}/{y}")
    minzoom: int = Field(default=0, ge=0)
    maxzoom: int = Field(default=18, le=24)
    bounds: List[float] = Field(default=[-180.0, -85.0511, 180.0, 85.0511])
    format: str = Field(default="png")
    attribution: str = Field(default="&copy; Copernicus Sentinel-2 / European Space Agency")


class NDVIColormapBreak(BaseModel):
    """Color ramp classification stop for NDVI visualization."""
    value: float
    color: str
    label: str


class NDVIZonalStats(BaseModel):
    """Zonal statistics calculated from Sentinel-2 multispectral vegetation index."""
    zone_id: str
    zone_name: str
    mean_ndvi: float = Field(..., ge=-1.0, le=1.0, description="Mean NDVI across zone footprint")
    min_ndvi: float = Field(..., ge=-1.0, le=1.0)
    max_ndvi: float = Field(..., ge=-1.0, le=1.0)
    canopy_cover_percentage: float = Field(..., ge=0.0, le=100.0, description="Canopy cover fraction expressed as percentage")
    vegetation_health: str = Field(..., description="'Vigorous', 'Moderate', 'Sparse', 'Stressed', or 'Barren'")
    thermal_mitigation_cooling_c: float = Field(..., description="Estimated surface cooling contribution from canopy shading in °C")


class LSTColormapBreak(BaseModel):
    """Color ramp classification stop for Land Surface Temperature visualization."""
    value: float
    color: str
    label: str


class LSTZonalStats(BaseModel):
    """Zonal Land Surface Temperature statistics derived from Landsat 8/9 Thermal Infrared (TIRS)."""
    zone_id: str
    zone_name: str
    mean_lst_c: float = Field(..., description="Mean Land Surface Temperature in °C")
    min_lst_c: float = Field(..., description="Minimum LST in °C within zone boundary")
    max_lst_c: float = Field(..., description="Maximum LST in °C within zone boundary")
    thermal_anomaly_c: float = Field(..., description="Thermal anomaly relative to rural baseline in °C")
    uhi_intensity_c: float = Field(..., description="Urban Heat Island intensity differential in °C")
    heat_stress_tier: str = Field(..., description="'Low', 'Moderate', 'High', 'Severe', or 'Extreme'")
