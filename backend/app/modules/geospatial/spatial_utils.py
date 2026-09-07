"""Geospatial processing utilities: centroids, bounding boxes, and GeoJSON formatters."""
from typing import List, Tuple
from backend.app.schemas.common import GeoJSONPolygon, GeoJSONFeature, GeoJSONFeatureCollection
from backend.app.schemas.zone import Zone


def compute_polygon_centroid(polygon: GeoJSONPolygon) -> List[float]:
    """Compute the arithmetic centroid [lon, lat] of a GeoJSON polygon outer ring."""
    coordinates = polygon.coordinates[0]
    if not coordinates:
        return [0.0, 0.0]
    
    # Exclude redundant closing coordinate if present
    pts = coordinates[:-1] if len(coordinates) > 1 and coordinates[0] == coordinates[-1] else coordinates
    
    avg_lon = sum(p[0] for p in pts) / len(pts)
    avg_lat = sum(p[1] for p in pts) / len(pts)
    return [round(avg_lon, 6), round(avg_lat, 6)]


def compute_bounding_box(polygon: GeoJSONPolygon) -> Tuple[float, float, float, float]:
    """Return bounding box as (min_lon, min_lat, max_lon, max_lat)."""
    coordinates = polygon.coordinates[0]
    lons = [p[0] for p in coordinates]
    lats = [p[1] for p in coordinates]
    return (min(lons), min(lats), max(lons), max(lats))


def zone_to_geojson_feature(zone: Zone, risk_score: float | None = None, risk_level: str | None = None) -> GeoJSONFeature:
    """Transform a Zone domain entity into a standard GeoJSON Feature for MapLibre GL."""
    properties = {
        "id": zone.id,
        "name": zone.name,
        "typology": zone.typology.value,
        "area_sqkm": zone.area_sqkm,
        "land_surface_temp_c": zone.thermal_observation.land_surface_temp_c,
        "thermal_anomaly_c": zone.thermal_observation.thermal_anomaly_c,
        "tree_canopy_fraction": zone.land_cover.tree_canopy_fraction,
        "impervious_surface_fraction": zone.land_cover.impervious_surface_fraction,
        "population_density": zone.demographics.population_density_per_sqkm,
        "total_population": zone.demographics.total_population,
        "vulnerable_ratio": zone.demographics.vulnerable_ratio,
    }
    if risk_score is not None:
        properties["risk_score"] = round(risk_score, 1)
    if risk_level is not None:
        properties["risk_level"] = risk_level

    return GeoJSONFeature(
        id=zone.id,
        geometry=zone.geometry,
        properties=properties,
    )


def zones_to_feature_collection(zones_with_risk: List[Tuple[Zone, float | None, str | None]]) -> GeoJSONFeatureCollection:
    """Create a GeoJSON FeatureCollection from a list of zones and their risk attributes."""
    features = [
        zone_to_geojson_feature(zone, score, level)
        for zone, score, level in zones_with_risk
    ]
    return GeoJSONFeatureCollection(features=features)
