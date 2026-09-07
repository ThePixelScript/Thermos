"""Data repository layer for THERMOS.

Encapsulates data ingestion, in-memory indexing, and PostGIS-compatible spatial queries.
"""
import json
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
from backend.app.modules.heat import is_hotspot, classify_hotspot_tier
from backend.app.modules.interventions.recommender import recommend_interventions_for_zone
from backend.app.modules.ai_interface.explainer import generate_executive_brief


class ZoneRepository:
    """In-memory data store for urban planning zones with PostGIS-compatible querying."""

    def __init__(self, data_file_path: Optional[Path] = None):
        if data_file_path is not None:
            self.data_file_path = data_file_path
        elif settings.data_mode == "real" and settings.real_data_path.exists():
            self.data_file_path = settings.real_data_path
        else:
            self.data_file_path = settings.sample_data_path
        self._zones: Dict[str, Zone] = {}
        self._city_metadata: dict = {}
        self.load_data()

    def load_data(self) -> None:
        """Load and validate sample zones from the processed JSON file."""
        if not self.data_file_path.exists():
            raise FileNotFoundError(f"Data file not found at {self.data_file_path}")

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
            lc = zone.land_cover
            demo = zone.demographics
            # Pre-compute analytical metrics for convenient direct access
            risk = compute_heat_risk(zone)
            zone.temperature = zone.thermal_observation.land_surface_temp_c
            zone.vegetation = round(lc.tree_canopy_fraction + lc.vegetation_grass_fraction, 3) if lc else None
            zone.imperviousness = lc.impervious_surface_fraction if lc else None
            zone.building_density = lc.building_density if lc else None
            zone.population_exposure = round(min(100.0, (demo.population_density_per_sqkm / 50000.0) * 100.0), 1) if demo else None
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
        """Retrieve a specific zone by identifier."""
        return self._zones.get(zone_id)

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
    ) -> List[HotspotSummary]:
        """Identify, rank, and summarize thermal hotspots across the city."""
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
            is_hot = is_hotspot(risk.score, anomaly)
            tier = classify_hotspot_tier(risk.score, anomaly)

            lc = zone.land_cover
            demo = zone.demographics
            hotspot_candidates.append({
                "zone_id": zone.id,
                "zone_name": zone.name,
                "typology": zone.typology.value,
                "temperature": zone.thermal_observation.land_surface_temp_c,
                "vegetation": round(lc.tree_canopy_fraction + lc.vegetation_grass_fraction, 3) if lc else None,
                "imperviousness": lc.impervious_surface_fraction if lc else None,
                "building_density": lc.building_density if lc else None,
                "population_exposure": round(min(100.0, (demo.population_density_per_sqkm / 50000.0) * 100.0), 1) if demo else None,
                "risk_score": risk.score,
                "risk_level": risk.risk_level,
                "land_surface_temp_c": zone.thermal_observation.land_surface_temp_c,
                "thermal_anomaly_c": anomaly,
                "dominant_driver": dominant.name if dominant else "Thermal Anomaly",
                "dominant_driver_pct": dominant.contribution_pct if dominant else 0.0,
                "total_population": demo.total_population if demo else None,
                "vulnerable_population": int(demo.total_population * demo.vulnerable_ratio) if demo else None,
                "area_sqkm": zone.area_sqkm,
                "center_coords": centroid,
                "confidence": risk.confidence,
                "is_hotspot": is_hot,
                "hotspot_tier": tier,
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
            return None

        risk_assessment = evaluate_zone_risk(zone)
        interventions = recommend_interventions_for_zone(zone, risk_assessment.risk_score)
        ai_brief = generate_executive_brief(zone, risk_assessment.risk_score)

        return HotspotDetail(
            summary=summary,
            zone=zone,
            risk_assessment=risk_assessment,
            recommended_interventions=interventions,
            ai_executive_brief=ai_brief,
            confidence=risk_assessment.confidence,
            assumptions=risk_assessment.assumptions,
        )


# Global singleton repository instance
repository = ZoneRepository()
