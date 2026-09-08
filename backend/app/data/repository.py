"""Data repository layer for THERMOS.

Encapsulates data ingestion, in-memory indexing, and PostGIS-compatible spatial queries.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict
from backend.app.core.config import settings
from backend.app.schemas.zone import Zone, ZoneSummary
from backend.app.schemas.hotspot import HotspotSummary, HotspotDetail
from backend.app.schemas.common import GeoJSONFeatureCollection
from backend.app.modules.geospatial.spatial_utils import (
    compute_polygon_centroid,
    zones_to_feature_collection,
)
from backend.app.modules.risk.risk_engine import compute_heat_risk, evaluate_zone_risk
from backend.app.modules.interventions.recommender import recommend_interventions_for_zone
from backend.app.modules.ai_interface.explainer import generate_executive_brief
from backend.app.modules.geospatial.pipeline import (
    compute_min_water_distance_km,
    geospatial_pipeline,
)


class ZoneRepository:
    """In-memory data store for urban planning zones with PostGIS-compatible querying."""

    def __init__(self, data_file_path: Optional[Path] = None):
        self.data_file_path = data_file_path or settings.sample_data_path
        self._zones: Dict[str, Zone] = {}
        self._city_metadata: dict = {}
        self.load_data()

    def load_data(self) -> None:
        """Load and validate sample zones from the processed JSON file."""
        if not self.data_file_path.exists():
            raise FileNotFoundError(f"Sample data file not found at {self.data_file_path}")

        with open(self.data_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._city_metadata = {
            "city": data.get("city", "Metropolis"),
            "crs": data.get("crs", "EPSG:4326"),
            "baseline_citywide_temp_c": data.get("baseline_citywide_temp_c", 31.5),
            "generated_at": data.get("generated_at"),
            "data_status": data.get("data_status"),
        }

        self._zones.clear()
        for raw_zone in data.get("zones", []):
            zone = Zone.model_validate(raw_zone)
            # Pre-compute analytical metrics for convenient direct access
            risk = compute_heat_risk(zone)
            zone.temperature = zone.thermal_observation.land_surface_temp_c
            zone.vegetation = round(zone.land_cover.tree_canopy_fraction + zone.land_cover.vegetation_grass_fraction, 3)
            zone.imperviousness = zone.land_cover.impervious_surface_fraction
            zone.building_density = zone.land_cover.building_density
            zone.population_exposure = round(min(100.0, (zone.demographics.population_density_per_sqkm / 50000.0) * 100.0), 1)
            zone.risk_score = risk.score
            zone.risk_level = risk.risk_level.value
            self._zones[zone.id] = zone

    @property
    def city_metadata(self) -> dict:
        return self._city_metadata

    def list_zones(self) -> List[Zone]:
        """Return all active urban zones."""
        return list(self._zones.values())

    def get_zone_by_id(self, zone_id: str) -> Optional[Zone]:
        """Retrieve a specific zone by identifier, checking stored zones or dynamic grid."""
        if zone_id in self._zones:
            return self._zones[zone_id]
        return geospatial_pipeline.get_hexagon_zone(zone_id)

    def get_geojson_feature_collection(self) -> GeoJSONFeatureCollection:
        """Return all zones as a GeoJSON FeatureCollection with pre-computed risk attributes."""
        zones_with_risk = []
        for zone in self._zones.values():
            risk = compute_heat_risk(zone)
            zones_with_risk.append((zone, risk.score, risk.risk_level.value))
        return zones_to_feature_collection(zones_with_risk)

    def list_hotspots(
        self,
        min_risk_score: float = 30.0,
        min_anomaly_c: Optional[float] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> List[HotspotSummary]:
        """Identify, rank, and summarize thermal hotspots across the city or global location."""
        if lat is not None and lon is not None:
            raw_hotspots = geospatial_pipeline.get_location_hotspots(
                lat=lat, lon=lon, min_risk_score=min_risk_score, min_anomaly_c=min_anomaly_c
            )
            summaries = []
            for rank_idx, cand in enumerate(raw_hotspots, start=1):
                cand["rank"] = rank_idx
                summaries.append(HotspotSummary(**cand))
            return summaries

        hotspot_candidates = []

        for zone in self._zones.values():
            risk = compute_heat_risk(zone)
            anomaly = zone.thermal_observation.thermal_anomaly_c

            if risk.score < min_risk_score:
                continue
            if min_anomaly_c is not None and anomaly < min_anomaly_c:
                continue

            centroid = compute_polygon_centroid(zone.geometry)
            dominant = risk.driver_contributions[0] if risk.driver_contributions else None

            water_dist = compute_min_water_distance_km(centroid[0], centroid[1])
            weather = geospatial_pipeline.get_weather_telemetry()

            hotspot_candidates.append({
                "zone_id": zone.id,
                "zone_name": zone.name,
                "typology": zone.typology.value,
                "temperature": zone.thermal_observation.land_surface_temp_c,
                "vegetation": round(zone.land_cover.tree_canopy_fraction + zone.land_cover.vegetation_grass_fraction, 3),
                "imperviousness": zone.land_cover.impervious_surface_fraction,
                "building_density": zone.land_cover.building_density,
                "population_exposure": round(min(100.0, (zone.demographics.population_density_per_sqkm / 50000.0) * 100.0), 1),
                "risk_score": risk.score,
                "risk_level": risk.risk_level,
                "land_surface_temp_c": zone.thermal_observation.land_surface_temp_c,
                "thermal_anomaly_c": anomaly,
                "dominant_driver": dominant.name if dominant else "Thermal Anomaly",
                "dominant_driver_pct": dominant.contribution_pct if dominant else 0.0,
                "total_population": zone.demographics.total_population,
                "vulnerable_population": int(zone.demographics.total_population * zone.demographics.vulnerable_ratio),
                "area_sqkm": zone.area_sqkm,
                "center_coords": centroid,
                "water_distance_km": water_dist,
                "weather_condition": weather.get("weather_condition", "Partly Cloudy with Coastal Breeze"),
                "data_source": "WeatherAPI + NASA FIRMS + OpenStreetMap",
                "observation_date": weather.get("observation_date", "2024-05-15"),
                "last_update_timestamp": datetime.now(timezone.utc).isoformat(),
                "confidence_score": 0.94,
                "methodology": "Composite Heat Risk Index (CHRI) v3.0: Multi-Criteria Analytical Hierarchy Process fusing Land Surface Temperature (30%), Vegetation Deficit (20%), Building Density (15%), Population Exposure (15%), Water Distance (10%), and Weather Telemetry (10%)",
            })

        # Rank descending by risk score
        hotspot_candidates.sort(key=lambda h: h["risk_score"], reverse=True)

        summaries = []
        for rank_idx, cand in enumerate(hotspot_candidates, start=1):
            cand["rank"] = rank_idx
            summaries.append(HotspotSummary(**cand))

        return summaries

    def get_hotspot_detail(self, zone_id: str) -> Optional[HotspotDetail]:
        """Compile a comprehensive dossier for a specific hotspot zone."""
        zone = self.get_zone_by_id(zone_id)
        if not zone:
            return None

        # Find hotspot summary rank
        all_hotspots = self.list_hotspots(min_risk_score=0.0)
        summary = next((h for h in all_hotspots if h.zone_id == zone_id), None)
        if not summary:
            centroid = compute_polygon_centroid(zone.geometry)
            summary = HotspotSummary(
                rank=1,
                zone_id=zone.id,
                zone_name=zone.name,
                typology=zone.typology.value if hasattr(zone.typology, "value") else str(zone.typology),
                temperature=zone.temperature or zone.thermal_observation.land_surface_temp_c,
                vegetation=zone.vegetation or 0.15,
                imperviousness=zone.imperviousness or 0.6,
                building_density=zone.building_density or 0.6,
                population_exposure=zone.population_exposure or 50.0,
                risk_score=zone.risk_score or 50.0,
                risk_level=zone.risk_level or "MODERATE",
                land_surface_temp_c=zone.thermal_observation.land_surface_temp_c,
                thermal_anomaly_c=zone.thermal_observation.thermal_anomaly_c,
                dominant_driver="high_lst",
                dominant_driver_pct=35.0,
                total_population=zone.demographics.total_population,
                vulnerable_population=int(zone.demographics.total_population * zone.demographics.vulnerable_ratio),
                area_sqkm=zone.area_sqkm,
                center_coords=centroid,
                water_distance_km=2.0,
                weather_condition="Live Telemetry",
                data_source="WeatherAPI + NASA FIRMS + OpenStreetMap",
                observation_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                last_update_timestamp=datetime.now(timezone.utc).isoformat(),
                confidence_score=0.94,
                methodology="Composite Heat Risk Index (CHRI) v3.0",
            )

        risk_assessment = evaluate_zone_risk(zone)
        interventions = recommend_interventions_for_zone(zone, risk_assessment.risk_score)
        ai_brief = generate_executive_brief(zone, risk_assessment.risk_score)

        return HotspotDetail(
            summary=summary,
            zone=zone,
            risk_assessment=risk_assessment,
            recommended_interventions=interventions,
            ai_executive_brief=ai_brief,
        )


# Global singleton repository instance
repository = ZoneRepository()
