"""Zone endpoints: GeoJSON feature collection and individual zone queries."""
from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.schemas.zone import Zone, ZoneSummary
from backend.app.schemas.common import GeoJSONFeatureCollection
from backend.app.data.repository import repository
from backend.app.modules.risk.risk_engine import compute_heat_risk

router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("", response_model=List[ZoneSummary])
def get_all_zones() -> List[ZoneSummary]:
    """Retrieve all urban zones with summary metrics, analytical indicators, and risk scores."""
    zones = repository.list_zones()
    summaries = []
    for zone in zones:
        risk = compute_heat_risk(zone)
        lc = zone.land_cover
        demo = zone.demographics
        veg = round(lc.tree_canopy_fraction + lc.vegetation_grass_fraction, 3) if lc else None
        exposure = round(min(100.0, (demo.population_density_per_sqkm / 50000.0) * 100.0), 1) if demo else None

        summaries.append(
            ZoneSummary(
                id=zone.id,
                name=zone.name,
                typology=zone.typology,
                area_sqkm=zone.area_sqkm,
                temperature=zone.thermal_observation.land_surface_temp_c,
                vegetation=veg,
                imperviousness=lc.impervious_surface_fraction if lc else None,
                building_density=lc.building_density if lc else None,
                population_exposure=exposure,
                risk_score=risk.score,
                risk_level=risk.risk_level.value,
                land_surface_temp_c=zone.thermal_observation.land_surface_temp_c,
                thermal_anomaly_c=zone.thermal_observation.thermal_anomaly_c,
                tree_canopy_fraction=lc.tree_canopy_fraction if lc else None,
                impervious_surface_fraction=lc.impervious_surface_fraction if lc else None,
                total_population=demo.total_population if demo else None,
            )
        )
    return summaries


@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_zones_geojson() -> GeoJSONFeatureCollection:
    """Retrieve all zones formatted as an RFC 7946 GeoJSON FeatureCollection for MapLibre GL JS."""
    return repository.get_geojson_feature_collection()


@router.get("/{zone_id}", response_model=Zone)
def get_zone_by_id(zone_id: str) -> Zone:
    """Retrieve complete physical, thermal, and demographic data for a single zone."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return zone
