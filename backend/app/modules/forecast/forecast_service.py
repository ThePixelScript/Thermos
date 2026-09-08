"""Heat Forecast Engine: Predictive Urban Heat & CHRI Escalation Intelligence.

Provides:
- Multi-horizon predictive CHRI modeling for +24h, +72h, and +7d
- Coupled biophysical and atmospheric thermal mass dynamics
- Explainable driver delta attribution
- Microclimate risk escalation classification (Stable, Rising, Severe Rise, Cooling)
- Early-warning alert synthesis for municipal intervention routing
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from backend.app.schemas.zone import Zone
from backend.app.schemas.forecast import (
    ForecastDriverImpact,
    ForecastPoint,
    CHRIForecast,
    ForecastAlert,
    CitywideForecastSummary,
)
from backend.app.modules.chri.chri_service import (
    chri_service,
    compute_chri_score,
    classify_risk,
    normalize_lst,
    normalize_ndvi,
    normalize_aqi,
)
from backend.app.modules.weather.weather_service import calculate_heat_index


def classify_escalation(delta_chri: float, projected_chri: float) -> str:
    """Classifies risk escalation trajectory into standard operational tiers."""
    if delta_chri >= 5.0 or (projected_chri >= 70.0 and delta_chri >= 2.5):
        return "Severe Rise"
    elif delta_chri >= 1.5:
        return "Rising"
    elif delta_chri <= -1.5:
        return "Cooling"
    return "Stable"


class HeatForecastEngine:
    """Deterministic forecasting engine modeling short-to-medium range urban heat risk."""

    HORIZONS: List[Tuple[str, int, float]] = [
        ("24h", 24, 0.94),
        ("72h", 72, 0.88),
        ("7d", 168, 0.78),
    ]

    def predict_zone_forecast(self, zone: Zone) -> CHRIForecast:
        """Projects multi-horizon CHRI trajectories for a specific urban zone."""
        live = chri_service.evaluate_live_zone(zone)
        now = datetime.now(timezone.utc)

        current_lst = live.raster_metrics.mean_lst_c
        current_ndvi = live.raster_metrics.mean_ndvi
        current_aqi = live.raw_metrics["aqi"]
        norm_pop = live.normalized_population_density
        norm_bld = live.normalized_building_density

        impervious = zone.land_cover.impervious_surface_fraction
        canopy = zone.land_cover.tree_canopy_fraction

        forecast_points: List[ForecastPoint] = []

        for horizon_key, hours, confidence in self.HORIZONS:
            target_time = (now + timedelta(hours=hours)).isoformat()

            # Physical biophysical & microclimate response functions
            if horizon_key == "24h":
                # Diurnal thermal inertia: impervious materials reradiate stored solar enthalpy
                delta_lst = round(0.6 + (1.6 * impervious) - (1.4 * canopy), 2)
                ambient_temp = round(34.2 + (0.8 * impervious), 1)
                delta_ndvi = 0.008 * (1.0 - canopy)
                delta_aqi = round(3.5 * impervious, 1)
            elif horizon_key == "72h":
                # Synoptic heat accumulation & boundary layer stagnation
                delta_lst = round(1.2 + (2.8 * impervious) - (2.1 * canopy), 2)
                ambient_temp = round(35.6 + (1.2 * impervious), 1)
                delta_ndvi = 0.022 * (1.0 - canopy)
                delta_aqi = round(7.5 * impervious, 1)
            else:  # "7d"
                # Multi-day cumulative heat wave & vegetative soil moisture depletion
                delta_lst = round(1.5 + (3.6 * impervious) - (2.6 * canopy), 2)
                ambient_temp = round(36.5 + (1.5 * impervious), 1)
                delta_ndvi = 0.038 * (1.0 - canopy)
                delta_aqi = round(11.0 * impervious, 1)

            proj_lst = round(max(24.0, min(54.0, current_lst + delta_lst)), 1)
            proj_ndvi = round(max(0.01, min(0.85, current_ndvi - delta_ndvi)), 3)
            proj_aqi = round(max(50.0, min(300.0, current_aqi + delta_aqi)), 1)

            # Projected apparent heat index
            heat_index, _ = calculate_heat_index(ambient_temp, 66.0)

            # Recompute normalized factors
            norm_lst_proj = normalize_lst(proj_lst)
            norm_ndvi_proj = normalize_ndvi(proj_ndvi)
            norm_aqi_proj = normalize_aqi(proj_aqi)

            proj_chri = compute_chri_score(
                norm_lst=norm_lst_proj,
                norm_pop=norm_pop,
                norm_bld=norm_bld,
                norm_ndvi=norm_ndvi_proj,
                norm_aqi=norm_aqi_proj,
            )

            delta_chri = round(proj_chri - live.score, 2)
            escalation = classify_escalation(delta_chri, proj_chri)
            risk_level = classify_risk(proj_chri)

            # Explainable Driver Impacts
            driver_breakdown = [
                ForecastDriverImpact(
                    driver="thermal_lst",
                    driver_name="Thermal Surface Heating",
                    delta_impact=round(0.35 * (norm_lst_proj - live.normalized_lst), 2),
                    description=f"Surface temperature shifting from {current_lst}°C to {proj_lst}°C (+{delta_lst}°C)",
                ),
                ForecastDriverImpact(
                    driver="vegetation_stress",
                    driver_name="Canopy Moisture Deficit",
                    delta_impact=round(-0.15 * (norm_ndvi_proj - live.normalized_ndvi), 2),
                    description=f"Photosynthetic canopy transpiration efficiency reduced by {round(delta_ndvi * 100, 1)}%",
                ),
                ForecastDriverImpact(
                    driver="aqi_stagnation",
                    driver_name="Atmospheric Stagnation",
                    delta_impact=round(0.10 * (norm_aqi_proj - live.normalized_aqi), 2),
                    description=f"Inversion stagnation adding {delta_aqi} AQI particulate concentration",
                ),
            ]

            forecast_points.append(
                ForecastPoint(
                    horizon=horizon_key,
                    forecast_timestamp=target_time,
                    projected_chri=proj_chri,
                    projected_lst_c=proj_lst,
                    projected_ambient_temp_c=ambient_temp,
                    projected_heat_index_c=heat_index,
                    delta_chri=delta_chri,
                    risk_level=risk_level,
                    escalation=escalation,
                    confidence_score=confidence,
                    driver_breakdown=driver_breakdown,
                )
            )

        # Determine peak risk horizon and overall escalation
        peak_pt = max(forecast_points, key=lambda p: p.projected_chri)
        
        # Priority order of overall escalation
        escalation_priority = {"Severe Rise": 4, "Rising": 3, "Stable": 2, "Cooling": 1}
        overall_esc = max(forecast_points, key=lambda p: escalation_priority.get(p.escalation, 0)).escalation

        # Primary physical driver of change
        primary_driver = "Thermal Surface Heating (LST)"
        if impervious > 0.65:
            primary_driver = "Asphalt Thermal Mass & High Imperviousness"
        elif canopy < 0.08:
            primary_driver = "Canopy Deficit & Vegetative Moisture Depletion"

        return CHRIForecast(
            zone_id=zone.id,
            zone_name=zone.name,
            current_chri=live.score,
            current_lst_c=current_lst,
            current_risk_level=live.risk_level,
            horizons=forecast_points,
            peak_risk_horizon=peak_pt.horizon,
            peak_chri=peak_pt.projected_chri,
            primary_escalation_driver=primary_driver,
            overall_escalation=overall_esc,
            generated_at=now.isoformat(),
        )

    def predict_hotspots_forecast(
        self,
        zones: List[Zone],
        limit: int = 30,
        min_escalation: Optional[str] = None,
    ) -> List[CHRIForecast]:
        """Returns prioritized zones ranked by predicted peak CHRI severity."""
        forecasts = [self.predict_zone_forecast(z) for z in zones]

        if min_escalation:
            forecasts = [f for f in forecasts if f.overall_escalation.lower() == min_escalation.lower()]

        forecasts.sort(key=lambda f: f.peak_chri, reverse=True)
        return forecasts[:limit]

    def create_forecast_alerts(self, forecasts: List[CHRIForecast]) -> List[ForecastAlert]:
        """Synthesizes actionable municipal early warnings for severe heat escalation."""
        alerts: List[ForecastAlert] = []
        now_str = datetime.now(timezone.utc).isoformat()

        for f in forecasts:
            peak_pt = max(f.horizons, key=lambda p: p.projected_chri)
            if f.overall_escalation == "Severe Rise" or peak_pt.projected_chri >= 75.0:
                severity = "EMERGENCY" if peak_pt.projected_chri >= 80.0 else "WARNING"
                action = (
                    "Deploy mobile hydration stations and open air-conditioned civic cooling shelters."
                    if severity == "EMERGENCY"
                    else "Initiate reflective road spraying and issue outdoor labor midday work curtailment."
                )

                alerts.append(
                    ForecastAlert(
                        alert_id=f"ALERT-{f.zone_id}-{peak_pt.horizon}",
                        zone_id=f.zone_id,
                        zone_name=f.zone_name,
                        severity=severity,
                        headline=f"{severity}: Rapid heat surge in {f.zone_name} projecting {peak_pt.projected_chri} CHRI by +{peak_pt.horizon}",
                        escalation=f.overall_escalation,
                        trigger_horizon=peak_pt.horizon,
                        current_chri=f.current_chri,
                        projected_chri=peak_pt.projected_chri,
                        primary_driver=f.primary_escalation_driver,
                        recommended_early_action=action,
                        timestamp=now_str,
                    )
                )

        return alerts

    def predict_citywide_forecast(self, zones: List[Zone]) -> CitywideForecastSummary:
        """Aggregates multi-horizon predictive heat dynamics across all city zones."""
        forecasts = [self.predict_zone_forecast(z) for z in zones]
        alerts = self.create_forecast_alerts(forecasts)
        now_str = datetime.now(timezone.utc).isoformat()

        severe = sum(1 for f in forecasts if f.overall_escalation == "Severe Rise")
        rising = sum(1 for f in forecasts if f.overall_escalation == "Rising")
        cooling = sum(1 for f in forecasts if f.overall_escalation == "Cooling")
        stable = sum(1 for f in forecasts if f.overall_escalation == "Stable")

        mean_curr = round(sum(f.current_chri for f in forecasts) / max(1, len(forecasts)), 2)
        mean_24h = round(sum(f.horizons[0].projected_chri for f in forecasts) / max(1, len(forecasts)), 2)
        mean_72h = round(sum(f.horizons[1].projected_chri for f in forecasts) / max(1, len(forecasts)), 2)
        mean_7d = round(sum(f.horizons[2].projected_chri for f in forecasts) / max(1, len(forecasts)), 2)

        # Ranked high risk forecasts
        high_risk_sorted = sorted(forecasts, key=lambda f: f.peak_chri, reverse=True)[:10]

        return CitywideForecastSummary(
            generated_at=now_str,
            total_zones=len(zones),
            zones_escalating=rising + severe,
            zones_severe_rise=severe,
            zones_cooling=cooling,
            zones_stable=stable,
            citywide_mean_chri_current=mean_curr,
            citywide_mean_chri_24h=mean_24h,
            citywide_mean_chri_72h=mean_72h,
            citywide_mean_chri_7d=mean_7d,
            active_alerts=alerts,
            high_risk_zones_forecast=high_risk_sorted,
        )


heat_forecast_engine = HeatForecastEngine()
