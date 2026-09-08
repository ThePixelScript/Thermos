from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.zone import Zone, ZoneSummary
from backend.app.schemas.common import GeoJSONFeatureCollection
from backend.app.data.repository import repository
from backend.app.modules.risk.risk_engine import compute_heat_risk
from backend.app.modules.geospatial.pipeline import geospatial_pipeline

router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("", response_model=List[ZoneSummary])
def get_all_zones() -> List[ZoneSummary]:
    """Retrieve all urban zones with summary metrics, analytical indicators, and risk scores."""
    zones = repository.list_zones()
    summaries = []
    for zone in zones:
        risk = compute_heat_risk(zone)
        veg = round(zone.land_cover.tree_canopy_fraction + zone.land_cover.vegetation_grass_fraction, 3)
        exposure = round(min(100.0, (zone.demographics.population_density_per_sqkm / 50000.0) * 100.0), 1)

        summaries.append(
            ZoneSummary(
                id=zone.id,
                name=zone.name,
                typology=zone.typology,
                area_sqkm=zone.area_sqkm,
                temperature=zone.thermal_observation.land_surface_temp_c,
                vegetation=veg,
                imperviousness=zone.land_cover.impervious_surface_fraction,
                building_density=zone.land_cover.building_density,
                population_exposure=exposure,
                risk_score=risk.score,
                risk_level=risk.risk_level.value,
                land_surface_temp_c=zone.thermal_observation.land_surface_temp_c,
                thermal_anomaly_c=zone.thermal_observation.thermal_anomaly_c,
                tree_canopy_fraction=zone.land_cover.tree_canopy_fraction,
                impervious_surface_fraction=zone.land_cover.impervious_surface_fraction,
                total_population=zone.demographics.total_population,
            )
        )
    return summaries


@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_zones_geojson() -> GeoJSONFeatureCollection:
    """Retrieve all zones formatted as an RFC 7946 GeoJSON FeatureCollection for MapLibre GL JS."""
    return repository.get_geojson_feature_collection()


@router.get("/hexagons", response_model=GeoJSONFeatureCollection)
def get_zones_hexagons(
    resolution_km: float = Query(default=2.5, ge=1.0, le=10.0, description="Hexagonal grid cell diameter in km"),
    lat: Optional[float] = Query(default=None, description="Latitude for hexagonal grid center"),
    lon: Optional[float] = Query(default=None, description="Longitude for hexagonal grid center"),
) -> GeoJSONFeatureCollection:
    """Dynamically generate H3-style hexagonal grid tessellation globally with real Earth Observation analytics."""
    if lat is not None and lon is not None:
        fc_dict = geospatial_pipeline.generate_location_hexagons(lat=lat, lon=lon, step_km=resolution_km)
    else:
        fc_dict = geospatial_pipeline.generate_chennai_hexagons(step_km=resolution_km)
    return GeoJSONFeatureCollection.model_validate(fc_dict)


@router.get("/{zone_id}", response_model=Zone)
def get_zone_by_id(zone_id: str) -> Zone:
    """Retrieve complete physical, thermal, and demographic data for a single zone."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return zone
