"""Real Satellite Data Endpoints: Ingestion status, GeoJSON layers, and thermal hotspots."""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.core.config import settings
from backend.app.schemas.common import GeoJSONFeatureCollection
from backend.app.schemas.zone import Zone, ZoneSummary
from backend.app.schemas.real_data import (
    RealDataMetadata,
    RealThermalHotspot,
    RealDataPipelineSummary,
)
from backend.app.modules.landsat.pipeline import LandsatPipeline
from backend.app.modules.geospatial.spatial_utils import (
    zones_to_feature_collection,
    compute_polygon_centroid,
)

router = APIRouter(prefix="/real-data", tags=["Real Satellite Data"])


def _load_real_data_file() -> dict:
    """Load processed real satellite zones artifact if present."""
    if not settings.real_data_path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                f"Real satellite data artifact not found at '{settings.real_data_path}'. "
                "Run the Landsat processing pipeline or use demo mode."
            ),
        )
    with open(settings.real_data_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/metadata", response_model=RealDataMetadata)
def get_real_data_metadata() -> RealDataMetadata:
    """Retrieve acquisition metadata, spatial resolution, and statistical distribution of real Landsat data."""
    data = _load_real_data_file()
    meta = data.get("metadata")
    if not meta:
        raise HTTPException(status_code=404, detail="Metadata block missing from real data artifact.")
    return RealDataMetadata.model_validate(meta)


@router.get("/zones", response_model=List[ZoneSummary])
def get_real_zones() -> List[ZoneSummary]:
    """Retrieve all real satellite thermal grid zones with summary metrics."""
    data = _load_real_data_file()
    raw_zones = data.get("zones", [])
    summaries = []
    for rz in raw_zones:
        zone = Zone.model_validate(rz)
        obs = zone.thermal_observation
        summaries.append(
            ZoneSummary(
                id=zone.id,
                name=zone.name,
                typology=zone.typology,
                area_sqkm=zone.area_sqkm,
                temperature=obs.land_surface_temp_c,
                vegetation=None,
                imperviousness=None,
                building_density=None,
                population_exposure=None,
                risk_score=zone.risk_score,
                risk_level=zone.risk_level,
                land_surface_temp_c=obs.land_surface_temp_c,
                thermal_anomaly_c=obs.thermal_anomaly_c,
                tree_canopy_fraction=None,
                impervious_surface_fraction=None,
                total_population=None,
            )
        )
    return summaries


@router.get("/zones/geojson", response_model=GeoJSONFeatureCollection)
def get_real_zones_geojson() -> GeoJSONFeatureCollection:
    """Retrieve real satellite grid cells formatted as an RFC 7946 GeoJSON FeatureCollection for MapLibre GL JS."""
    data = _load_real_data_file()
    raw_zones = data.get("zones", [])
    zones_with_risk = []
    for rz in raw_zones:
        zone = Zone.model_validate(rz)
        zones_with_risk.append((zone, zone.risk_score, zone.risk_level))
    return zones_to_feature_collection(zones_with_risk)


@router.get("/hotspots", response_model=List[RealThermalHotspot])
def get_real_hotspots(
    min_anomaly: float = Query(
        default=3.0,
        description="Minimum thermal anomaly in °C above study-area baseline",
    ),
) -> List[RealThermalHotspot]:
    """Retrieve real thermal hotspots qualified purely from satellite radiometric observation."""
    data = _load_real_data_file()
    raw_zones = data.get("zones", [])
    baseline_c = data.get("baseline_citywide_temp_c", 30.0)

    candidates = []
    for rz in raw_zones:
        zone = Zone.model_validate(rz)
        obs = zone.thermal_observation
        anomaly = obs.thermal_anomaly_c
        if anomaly >= min_anomaly:
            centroid = compute_polygon_centroid(zone.geometry)
            # Find confidence from provenance if available
            conf = 1.0
            if zone.provenance:
                conf = zone.provenance[0].confidence

            candidates.append({
                "zone_id": zone.id,
                "name": zone.name,
                "temperature": obs.land_surface_temp_c,
                "baseline_temp_c": baseline_c,
                "thermal_anomaly_c": anomaly,
                "hotspot_tier": zone.risk_level or "HIGH_HOTSPOT",
                "is_hotspot": True,
                "center_coords": centroid,
                "area_sqkm": zone.area_sqkm,
                "valid_pixel_pct": round(conf * 100.0, 1),
                "confidence": conf,
            })

    # Rank descending by thermal anomaly
    candidates.sort(key=lambda c: c["thermal_anomaly_c"], reverse=True)

    hotspots = []
    for rank_idx, cand in enumerate(candidates, start=1):
        cand["rank"] = rank_idx
        hotspots.append(RealThermalHotspot(**cand))

    return hotspots


class IngestRequest(BaseModel):
    st_path: str = Field(..., description="Path to Landsat ST GeoTIFF (absolute or relative to data/external)")
    qa_path: Optional[str] = Field(None, description="Optional path to QA_PIXEL GeoTIFF")
    aoi_bbox: Optional[List[float]] = Field(None, description="Optional AOI [min_lon, min_lat, max_lon, max_lat]")
    grid_resolution_m: float = Field(default=500.0, description="Cell resolution in meters")
    city_name: str = Field(default="Chennai Metropolitan Area", description="Study area civic name")
    explicit_baseline_c: Optional[float] = Field(None, description="Optional reference baseline temperature")


@router.post("/ingest", response_model=RealDataPipelineSummary)
def ingest_landsat_scene(request: IngestRequest) -> RealDataPipelineSummary:
    """Execute on-demand ingestion of a Landsat ST scene into real urban grid zones."""
    st_file = Path(request.st_path)
    if not st_file.is_absolute():
        st_file = settings.external_data_dir / st_file

    if not st_file.exists():
        raise HTTPException(status_code=404, detail=f"ST raster not found at '{st_file}'")

    qa_file = None
    if request.qa_path:
        qa_file = Path(request.qa_path)
        if not qa_file.is_absolute():
            qa_file = settings.external_data_dir / qa_file
        if not qa_file.exists():
            raise HTTPException(status_code=404, detail=f"QA raster not found at '{qa_file}'")

    bbox = tuple(request.aoi_bbox) if request.aoi_bbox else None

    pipeline = LandsatPipeline(grid_resolution_m=request.grid_resolution_m)
    summary = pipeline.run(
        st_path=st_file,
        qa_path=qa_file,
        aoi_bbox=bbox,
        explicit_baseline_c=request.explicit_baseline_c,
        city_name=request.city_name,
    )
    return summary
