"""CHRI Calculation & Analytics Service.

Implements the Composite Heat Risk Index (CHRI) mathematical core:
CHRI = 0.35 * norm_lst + 0.20 * norm_pop + 0.20 * norm_bld - 0.15 * norm_ndvi + 0.10 * norm_aqi

Features:
- Normalized inputs on [0.0, 100.0] scale
- Hotspot classification tiers:
    0-20 LOW
    20-40 MODERATE
    40-60 HIGH
    60-80 SEVERE
    80-100 CRITICAL
- Mathematical driver attribution across 5 drivers:
    - high_lst
    - low_ndvi
    - high_population
    - high_building_density
    - poor_air_quality
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from backend.app.schemas.zone import Zone
from backend.app.schemas.chri import (
    CHRIScore,
    HeatHotspot,
    LiveRasterMetrics,
    LiveCHRIScore,
    LiveHeatHotspot,
    HotspotTrendsSummary,
)
from backend.app.modules.raster.ndvi_service import ndvi_raster_service
from backend.app.modules.raster.lst_service import lst_raster_service


def clamp(val: float, min_val: float, max_val: float) -> float:
    """Clamps a floating point value within [min_val, max_val]."""
    return max(min_val, min(val, max_val))


def normalize_lst(lst_c: float) -> float:
    """Normalizes Land Surface Temperature (°C) to [0.0, 100.0].
    
    Reference bounds: 20°C (low thermal baseline) to 50°C (extreme surface heat anomaly).
    """
    return round(clamp(((lst_c - 20.0) / (50.0 - 20.0)) * 100.0, 0.0, 100.0), 2)


def normalize_population_density(pop_density: float) -> float:
    """Normalizes Population Density (people/km²) to [0.0, 100.0].
    
    Reference bound: 50,000 people/km² (extreme urban crowding benchmark).
    """
    if pop_density <= 1.0:
        return round(clamp(pop_density * 100.0, 0.0, 100.0), 2)
    return round(clamp((pop_density / 50000.0) * 100.0, 0.0, 100.0), 2)


def normalize_building_density(bld_density: float) -> float:
    """Normalizes Building Footprint Density [0.0, 1.0] to [0.0, 100.0]."""
    if bld_density <= 1.0:
        return round(clamp(bld_density * 100.0, 0.0, 100.0), 2)
    return round(clamp(bld_density, 0.0, 100.0), 2)


def normalize_ndvi(ndvi: float) -> float:
    """Normalizes NDVI vegetation greenness to [0.0, 100.0].
    
    Reference bound: 0.70 (dense vigorous canopy).
    """
    if ndvi <= 1.0:
        return round(clamp((max(0.0, ndvi) / 0.70) * 100.0, 0.0, 100.0), 2)
    return round(clamp(ndvi, 0.0, 100.0), 2)


def normalize_aqi(aqi: float) -> float:
    """Normalizes Air Quality Index (AQI) to [0.0, 100.0].
    
    Reference bound: 200.0 (Unhealthy / Severe air quality threshold).
    """
    if aqi <= 1.0:
        return round(clamp(aqi * 100.0, 0.0, 100.0), 2)
    return round(clamp((aqi / 200.0) * 100.0, 0.0, 100.0), 2)


def classify_risk(score: float) -> str:
    """Classifies CHRI score into standard 5-tier hotspot urgency classification:
    
    0-20 LOW
    20-40 MODERATE
    40-60 HIGH
    60-80 SEVERE
    80-100 CRITICAL
    """
    if score < 20.0:
        return "LOW"
    elif score < 40.0:
        return "MODERATE"
    elif score < 60.0:
        return "HIGH"
    elif score < 80.0:
        return "SEVERE"
    else:
        return "CRITICAL"


def compute_chri_score(
    norm_lst: float,
    norm_pop: float,
    norm_bld: float,
    norm_ndvi: float,
    norm_aqi: float = 50.0,
    norm_water_dist: Optional[float] = None,
    norm_weather: Optional[float] = None,
) -> float:
    """Executes the exact CHRI analytical formula.
    
    If norm_water_dist and norm_weather are provided, executes the 6-factor formula:
    CHRI = 0.30*lst + 0.20*(100-ndvi) + 0.15*bld + 0.15*pop + 0.10*water_dist + 0.10*weather
    
    Otherwise executes the 5-factor formula for backward compatibility:
    CHRI = 0.35 * norm_lst + 0.20 * norm_pop + 0.20 * norm_bld - 0.15 * norm_ndvi + 0.10 * norm_aqi
    """
    if norm_water_dist is not None or norm_weather is not None:
        w_water = norm_water_dist if norm_water_dist is not None else 20.0
        w_weather = norm_weather if norm_weather is not None else 50.0
        raw_score = (
            (0.30 * norm_lst)
            + (0.20 * (100.0 - norm_ndvi))
            + (0.15 * norm_bld)
            + (0.15 * norm_pop)
            + (0.10 * w_water)
            + (0.10 * w_weather)
        )
    else:
        raw_score = (
            (0.35 * norm_lst)
            + (0.20 * norm_pop)
            + (0.20 * norm_bld)
            - (0.15 * norm_ndvi)
            + (0.10 * norm_aqi)
        )
    return round(clamp(raw_score, 0.0, 100.0), 2)


def decompose_drivers(
    norm_lst: float,
    norm_pop: float,
    norm_bld: float,
    norm_ndvi: float,
    norm_aqi: float = 50.0,
    norm_water_dist: Optional[float] = None,
    norm_weather: Optional[float] = None,
) -> Tuple[Dict[str, float], str, float]:
    """Performs mathematical driver attribution explaining the risk score.
    
    Identifies the share each risk-elevating factor contributes and selects the dominant driver.
    """
    if norm_water_dist is not None or norm_weather is not None:
        w_water = norm_water_dist if norm_water_dist is not None else 20.0
        w_weather = norm_weather if norm_weather is not None else 50.0
        c_lst = 0.30 * norm_lst
        c_ndvi_deficit = 0.20 * (100.0 - norm_ndvi)
        c_bld = 0.15 * norm_bld
        c_pop = 0.15 * norm_pop
        c_water = 0.10 * w_water
        c_weather = 0.10 * w_weather

        drivers = {
            "high_lst": round(c_lst, 2),
            "low_ndvi": round(c_ndvi_deficit, 2),
            "high_building_density": round(c_bld, 2),
            "high_population": round(c_pop, 2),
            "water_distance": round(c_water, 2),
            "adverse_weather": round(c_weather, 2),
        }
    else:
        c_lst = 0.35 * norm_lst
        c_pop = 0.20 * norm_pop
        c_bld = 0.20 * norm_bld
        c_aqi = 0.10 * norm_aqi
        c_ndvi_deficit = 0.15 * (100.0 - norm_ndvi)

        drivers = {
            "high_lst": round(c_lst, 2),
            "low_ndvi": round(c_ndvi_deficit, 2),
            "high_population": round(c_pop, 2),
            "high_building_density": round(c_bld, 2),
            "poor_air_quality": round(c_aqi, 2),
        }

    total_risk_pressure = sum(drivers.values())
    if total_risk_pressure <= 0.0:
        return drivers, "high_lst", 20.0

    sorted_drivers = sorted(drivers.items(), key=lambda x: x[1], reverse=True)
    top_driver, top_val = sorted_drivers[0]
    dominant_pct = round((top_val / total_risk_pressure) * 100.0, 1)

    return drivers, top_driver, dominant_pct


def extract_zone_metrics(zone: Zone) -> Dict[str, float]:
    """Extracts raw thermal, physical, and environmental metrics from a Zone domain entity."""
    lst_c = zone.thermal_observation.land_surface_temp_c
    pop_density = zone.demographics.population_density_per_sqkm
    bld_density = zone.land_cover.building_density
    
    # Vegetation index proxy (tree canopy + grass fraction)
    ndvi = round(zone.land_cover.tree_canopy_fraction + (0.5 * zone.land_cover.vegetation_grass_fraction), 3)
    
    # AQI proxy derived from imperviousness and typology (industrial/commercial higher, parks lower)
    # Default baseline ~90, scaled by impervious surface and building density
    aqi = round(70.0 + (zone.land_cover.impervious_surface_fraction * 75.0) + (zone.land_cover.building_density * 35.0), 1)

    return {
        "lst_c": lst_c,
        "population_density": pop_density,
        "building_density": bld_density,
        "ndvi": ndvi,
        "aqi": aqi,
    }


class CHRIAnalyticsService:
    """Singleton service for executing CHRI evaluations, driver decomposition, and hotspot ranking."""

    def __init__(self):
        self._zonal_cache: Dict[str, LiveRasterMetrics] = {}

    def clear_cache(self) -> None:
        """Clears the in-memory zonal raster metrics cache."""
        self._zonal_cache.clear()

    def evaluate_zone(self, zone: Zone) -> CHRIScore:
        """Evaluates a single urban zone and returns its complete CHRIScore entity."""
        raw = extract_zone_metrics(zone)

        norm_lst = normalize_lst(raw["lst_c"])
        norm_pop = normalize_population_density(raw["population_density"])
        norm_bld = normalize_building_density(raw["building_density"])
        norm_ndvi = normalize_ndvi(raw["ndvi"])
        norm_aqi = normalize_aqi(raw["aqi"])

        score = compute_chri_score(norm_lst, norm_pop, norm_bld, norm_ndvi, norm_aqi)
        risk_level = classify_risk(score)
        driver_contribs, dominant_driver, dominant_pct = decompose_drivers(
            norm_lst, norm_pop, norm_bld, norm_ndvi, norm_aqi
        )

        return CHRIScore(
            zone_id=zone.id,
            zone_name=zone.name,
            score=score,
            risk_level=risk_level,
            normalized_lst=norm_lst,
            normalized_population_density=norm_pop,
            normalized_building_density=norm_bld,
            normalized_ndvi=norm_ndvi,
            normalized_aqi=norm_aqi,
            raw_metrics=raw,
            driver_contributions=driver_contribs,
            dominant_driver=dominant_driver,
            dominant_driver_pct=dominant_pct,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def evaluate_zones(
        self,
        zones: List[Zone],
        min_score: Optional[float] = None,
        risk_level: Optional[str] = None,
    ) -> List[CHRIScore]:
        """Evaluates all provided zones, with optional score or classification filtering."""
        results: List[CHRIScore] = []
        for zone in zones:
            score_obj = self.evaluate_zone(zone)
            if min_score is not None and score_obj.score < min_score:
                continue
            if risk_level is not None and score_obj.risk_level.upper() != risk_level.upper():
                continue
            results.append(score_obj)
        return results

    def get_ranked_hotspots(
        self,
        zones: List[Zone],
        min_score: float = 30.0,
        limit: int = 30,
    ) -> List[HeatHotspot]:
        """Generates ranked HeatHotspot entities sorted by CHRI score in descending order."""
        scored: List[Tuple[Zone, CHRIScore]] = []
        for zone in zones:
            chri = self.evaluate_zone(zone)
            if chri.score >= min_score:
                scored.append((zone, chri))

        # Sort descending by CHRI score
        scored.sort(key=lambda item: item[1].score, reverse=True)

        hotspots: List[HeatHotspot] = []
        for rank_idx, (zone, chri) in enumerate(scored[:limit], start=1):
            coords = zone.geometry.coordinates[0]
            avg_lon = sum(p[0] for p in coords) / len(coords)
            avg_lat = sum(p[1] for p in coords) / len(coords)

            if chri.score >= 80.0:
                urgency = "Immediate Action"
            elif chri.score >= 50.0:
                urgency = "Priority Intervention"
            else:
                urgency = "Routine Monitoring"

            hotspots.append(
                HeatHotspot(
                    rank=rank_idx,
                    zone_id=zone.id,
                    zone_name=zone.name,
                    chri_score=chri.score,
                    risk_level=chri.risk_level,
                    dominant_driver=chri.dominant_driver,
                    dominant_driver_pct=chri.dominant_driver_pct,
                    surface_temperature_c=chri.raw_metrics["lst_c"],
                    canopy_cover_pct=round(zone.land_cover.tree_canopy_fraction * 100.0, 1),
                    population_density=chri.raw_metrics["population_density"],
                    building_density=chri.raw_metrics["building_density"],
                    aqi=chri.raw_metrics["aqi"],
                    center_coords=[avg_lon, avg_lat],
                    urgency=urgency,
                )
            )

        return hotspots

    def aggregate_zonal_raster_metrics(self, zone: Zone) -> LiveRasterMetrics:
        """Aggregates multi-spectral Sentinel-2 NDVI and Landsat 8/9 LST with in-memory caching."""
        if zone.id in self._zonal_cache:
            return self._zonal_cache[zone.id]

        ndvi_stats = ndvi_raster_service.compute_zonal_ndvi(zone)
        lst_stats = lst_raster_service.compute_zonal_lst(zone)

        baseline_temp = zone.thermal_observation.baseline_temp_c
        anomaly_c = lst_stats.thermal_anomaly_c
        anomaly_pct = round((anomaly_c / max(1.0, baseline_temp)) * 100.0, 1)

        metrics = LiveRasterMetrics(
            mean_lst_c=lst_stats.mean_lst_c,
            max_lst_c=lst_stats.max_lst_c,
            mean_ndvi=ndvi_stats.mean_ndvi,
            vegetation_coverage_pct=ndvi_stats.canopy_cover_percentage,
            thermal_anomaly_c=anomaly_c,
            thermal_anomaly_pct=anomaly_pct,
            lst_sensor="Landsat 8/9 TIRS 30m",
            ndvi_sensor="Copernicus Sentinel-2 MSI 10m",
        )
        self._zonal_cache[zone.id] = metrics
        return metrics

    def classify_hotspot_trend(
        self,
        live_score: float,
        baseline_score: float,
        anomaly_c: float,
        mean_ndvi: float,
        bld_density: float,
    ) -> str:
        """Classifies urban microclimate trend into 'emerging', 'persistent', or 'cooling'."""
        delta = round(live_score - baseline_score, 2)
        # 1. Cooling zones: low overall risk, high canopy dampening, or negative delta
        if delta <= -2.0 or mean_ndvi >= 0.35 or anomaly_c <= 1.5 or live_score < 30.0:
            return "cooling"
        # 2. Persistent hotspots: chronic high building density and high LST
        if live_score >= 55.0 and bld_density >= 0.40 and anomaly_c >= 3.5:
            return "persistent"
        # 3. Emerging hotspots: rapid temperature divergence or low canopy vulnerability
        if delta >= 1.5 or (anomaly_c >= 4.0 and mean_ndvi < 0.20):
            return "emerging"
        # Default boundary resolution
        return "persistent" if live_score >= 45.0 else "emerging"

    def evaluate_live_zone(self, zone: Zone) -> LiveCHRIScore:
        """Computes dynamic live CHRI using real-time satellite raster aggregations."""
        baseline = self.evaluate_zone(zone)
        raster_m = self.aggregate_zonal_raster_metrics(zone)

        # Dynamic normalized factors driven by live satellite rasters
        norm_lst = normalize_lst(raster_m.mean_lst_c)
        norm_ndvi = normalize_ndvi(raster_m.mean_ndvi)
        norm_pop = normalize_population_density(zone.demographics.population_density_per_sqkm)
        norm_bld = normalize_building_density(zone.land_cover.building_density)

        raw_aqi = round(70.0 + (zone.land_cover.impervious_surface_fraction * 75.0) + (zone.land_cover.building_density * 35.0), 1)
        norm_aqi = normalize_aqi(raw_aqi)

        live_score = compute_chri_score(norm_lst, norm_pop, norm_bld, norm_ndvi, norm_aqi)
        risk_level = classify_risk(live_score)
        driver_contribs, dominant_driver, dominant_pct = decompose_drivers(
            norm_lst, norm_pop, norm_bld, norm_ndvi, norm_aqi
        )

        delta = round(live_score - baseline.score, 2)
        trend = self.classify_hotspot_trend(
            live_score,
            baseline.score,
            raster_m.thermal_anomaly_c,
            raster_m.mean_ndvi,
            zone.land_cover.building_density,
        )

        raw_metrics = {
            "lst_c": raster_m.mean_lst_c,
            "population_density": zone.demographics.population_density_per_sqkm,
            "building_density": zone.land_cover.building_density,
            "ndvi": raster_m.mean_ndvi,
            "aqi": raw_aqi,
        }

        confidence = 0.96

        return LiveCHRIScore(
            zone_id=zone.id,
            zone_name=zone.name,
            score=live_score,
            baseline_score=baseline.score,
            delta_from_baseline=delta,
            risk_level=risk_level,
            hotspot_trend=trend,
            confidence_score=confidence,
            normalized_lst=norm_lst,
            normalized_population_density=norm_pop,
            normalized_building_density=norm_bld,
            normalized_ndvi=norm_ndvi,
            normalized_aqi=norm_aqi,
            raw_metrics=raw_metrics,
            driver_contributions=driver_contribs,
            dominant_driver=dominant_driver,
            dominant_driver_pct=dominant_pct,
            raster_metrics=raster_m,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def evaluate_live_zones(
        self,
        zones: List[Zone],
        min_score: Optional[float] = None,
        risk_level: Optional[str] = None,
        trend: Optional[str] = None,
    ) -> List[LiveCHRIScore]:
        """Evaluates live dynamic CHRI for all zones with optional filtering."""
        results: List[LiveCHRIScore] = []
        for zone in zones:
            live = self.evaluate_live_zone(zone)
            if min_score is not None and live.score < min_score:
                continue
            if risk_level is not None and live.risk_level.upper() != risk_level.upper():
                continue
            if trend is not None and live.hotspot_trend.lower() != trend.lower():
                continue
            results.append(live)
        return results

    def get_live_ranked_hotspots(
        self,
        zones: List[Zone],
        limit: int = 30,
        trend: Optional[str] = None,
    ) -> List[LiveHeatHotspot]:
        """Generates real-time ranked hotspot entities driven by live raster CHRI."""
        scored: List[Tuple[Zone, LiveCHRIScore]] = []
        for zone in zones:
            live = self.evaluate_live_zone(zone)
            if trend is not None and live.hotspot_trend.lower() != trend.lower():
                continue
            scored.append((zone, live))

        scored.sort(key=lambda x: x[1].score, reverse=True)

        hotspots: List[LiveHeatHotspot] = []
        for rank_idx, (zone, live) in enumerate(scored[:limit], start=1):
            coords = zone.geometry.coordinates[0]
            avg_lon = sum(p[0] for p in coords) / len(coords)
            avg_lat = sum(p[1] for p in coords) / len(coords)

            if live.score >= 80.0:
                urgency = "Immediate Action"
            elif live.score >= 50.0:
                urgency = "Priority Intervention"
            else:
                urgency = "Routine Monitoring"

            hotspots.append(
                LiveHeatHotspot(
                    rank=rank_idx,
                    zone_id=zone.id,
                    zone_name=zone.name,
                    live_chri_score=live.score,
                    baseline_chri_score=live.baseline_score,
                    delta_score=live.delta_from_baseline,
                    risk_level=live.risk_level,
                    hotspot_trend=live.hotspot_trend,
                    dominant_driver=live.dominant_driver,
                    dominant_driver_pct=live.dominant_driver_pct,
                    mean_lst_c=live.raster_metrics.mean_lst_c,
                    max_lst_c=live.raster_metrics.max_lst_c,
                    mean_ndvi=live.raster_metrics.mean_ndvi,
                    canopy_cover_pct=live.raster_metrics.vegetation_coverage_pct,
                    thermal_anomaly_c=live.raster_metrics.thermal_anomaly_c,
                    confidence_score=live.confidence_score,
                    center_coords=[avg_lon, avg_lat],
                    urgency=urgency,
                )
            )
        return hotspots

    def get_hotspot_trends_summary(self, zones: List[Zone]) -> HotspotTrendsSummary:
        """Analyzes citywide live hotspot trends and aggregates thermal dynamics."""
        all_live = [self.evaluate_live_zone(z) for z in zones]
        ranked_hotspots = self.get_live_ranked_hotspots(zones, limit=len(zones))

        emerging = [h for h in ranked_hotspots if h.hotspot_trend == "emerging"]
        persistent = [h for h in ranked_hotspots if h.hotspot_trend == "persistent"]
        cooling = [h for h in ranked_hotspots if h.hotspot_trend == "cooling"]

        city_mean_lst = round(sum(l.raster_metrics.mean_lst_c for l in all_live) / max(1, len(all_live)), 2)
        city_mean_ndvi = round(sum(l.raster_metrics.mean_ndvi for l in all_live) / max(1, len(all_live)), 3)

        return HotspotTrendsSummary(
            total_zones=len(zones),
            emerging_hotspots_count=len(emerging),
            persistent_hotspots_count=len(persistent),
            cooling_zones_count=len(cooling),
            citywide_mean_lst_c=city_mean_lst,
            citywide_mean_ndvi=city_mean_ndvi,
            emerging_hotspots=emerging,
            persistent_hotspots=persistent,
            cooling_zones=cooling,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


chri_service = CHRIAnalyticsService()
