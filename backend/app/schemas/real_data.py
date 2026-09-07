"""Schemas for real satellite data ingestion, thermal grid cells, and real hotspots."""
from typing import List, Optional
from pydantic import BaseModel, Field


class RealDataMetadata(BaseModel):
    """Metadata and statistical provenance of real satellite data ingestion."""
    scene_id: str = Field(..., description="USGS Landsat Scene ID / Product Identifier")
    satellite: str = Field(default="Landsat-9", description="Satellite platform")
    sensor: str = Field(default="TIRS-2", description="Thermal Infrared Sensor")
    acquisition_date: Optional[str] = Field(None, description="Observation acquisition timestamp")
    crs: str = Field(default="EPSG:4326", description="Coordinate reference system of exported zones")
    grid_resolution_m: float = Field(default=500.0, description="Analytical cell size in meters")
    aoi_bbox: List[float] = Field(..., description="Bounding box [min_lon, min_lat, max_lon, max_lat]")
    total_cells: int = Field(..., description="Total grid cells generated across AOI")
    valid_cells: int = Field(..., description="Number of cells meeting cloud and data completeness criteria")
    baseline_temp_c: float = Field(..., description="City/AOI reference baseline temperature in °C")
    mean_lst_c: float = Field(..., description="Mean observed LST across valid cells in °C")
    min_lst_c: float = Field(..., description="Minimum observed cell LST in °C")
    max_lst_c: float = Field(..., description="Maximum observed cell LST in °C")
    hotspots_count: int = Field(..., description="Number of qualified thermal hotspots")
    data_status: str = Field(default="REAL_SATELLITE_DERIVED", description="Verification status of the dataset")
    is_synthetic: bool = Field(default=False, description="Flag indicating synthetic/calibrated sample fixture origin")
    verification_status: str = Field(
        default="SATELLITE_OBSERVED",
        description="Scientific verification level: 'ACTUAL_SATELLITE_DERIVED' or 'SYNTHETIC_SAMPLE_FOR_PIPELINE_VERIFICATION'",
    )


class RealThermalHotspot(BaseModel):
    """Thermal hotspot identified from real satellite radiometric observation."""
    rank: int = Field(..., ge=1, description="Thermal urgency rank based on Delta T")
    zone_id: str
    name: str
    temperature: float = Field(..., description="Observed cell Land Surface Temperature in °C")
    baseline_temp_c: float = Field(..., description="AOI reference baseline in °C")
    thermal_anomaly_c: float = Field(..., description="Thermal anomaly Delta T in °C")
    hotspot_tier: str = Field(..., description="Thermal hotspot tier (CRITICAL, SEVERE, HIGH, MODERATE)")
    is_hotspot: bool = Field(default=True)
    center_coords: List[float] = Field(..., description="Centroid [lon, lat]")
    area_sqkm: float = Field(..., description="Cell area in sq km")
    valid_pixel_pct: float = Field(..., description="Percentage of clear, valid pixels in cell")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Data quality / clear-sky observation confidence")


class RealDataPipelineSummary(BaseModel):
    """Execution response from real satellite processing pipeline."""
    status: str
    metadata: RealDataMetadata
    output_path: str
