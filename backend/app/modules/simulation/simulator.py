"""Urban Climate Digital Twin & Scenario Simulation Engine.

Phase 6: Deterministic Biophysical Counterfactual Simulator.
Provides:
- Deterministic impact equations for 6 core cooling interventions
- Counterfactual dynamic CHRI and multi-horizon forecast re-computation
- Multi-scenario side-by-side comparison matrix with decision ranking
- Citywide impact portfolio simulator across budget tiers
- Pure physics-inspired, explainable calculations (no black-box ML)
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from backend.app.schemas.zone import Zone
from backend.app.schemas.simulation import (
    SimulationRequest,
    SimulationResult,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    CitywideSimulationResult,
    ZoneSimulationMetadata,
)
from backend.app.modules.chri.chri_service import (
    chri_service,
    compute_chri_score,
    classify_risk,
    normalize_lst,
    normalize_ndvi,
    normalize_aqi,
)
from backend.app.modules.forecast.forecast_service import heat_forecast_engine


INTERVENTION_NAMES: Dict[str, str] = {
    "urban_forestry": "Native Urban Tree Canopy & Avenue Greening",
    "cool_roofs": "High-Albedo Solar-Reflective Cool Roof Coatings",
    "reflective_pavements": "Permeable High-Albedo Cool Pavement Surfacing",
    "shade_corridors": "Tensile Solar-Reflective Transit Shade Corridors",
    "water_body_restoration": "Wetland, Lake & Urban Blue Space Revitalization",
    "water_bodies_restoration": "Wetland, Lake & Urban Blue Space Revitalization",
    "aqi_reduction": "Clean Air Micro-Zone & Green Particulate Buffer",
    "aqi_mitigation": "Clean Air Micro-Zone & Green Particulate Buffer",
}

BUDGET_CAPS: Dict[str, float] = {
    "LOW": 500_000.0,
    "MEDIUM": 2_000_000.0,
    "HIGH": 5_000_000.0,
}


def normalize_intervention_type(raw_type: str) -> str:
    """Normalizes intervention identifier to canonical key."""
    cleaned = raw_type.lower().strip().replace("-", "_")
    if cleaned in ["water_bodies_restoration", "water_restoration"]:
        return "water_body_restoration"
    if cleaned in ["aqi_mitigation", "clean_air"]:
        return "aqi_reduction"
    return cleaned


class ScenarioSimulatorEngine:
    """Deterministic Digital Twin engine for counterfactual urban heat planning."""

    def compute_counterfactual_deltas(
        self,
        zone: Zone,
        intervention_type: str,
        coverage_pct: float,
    ) -> Tuple[float, float, float]:
        """Calculates deterministic physical impact deltas: (lst_reduction_c, ndvi_increase, aqi_reduction)."""
        norm_type = normalize_intervention_type(intervention_type)
        cov_frac = min(1.0, max(0.01, coverage_pct / 100.0))
        canopy = zone.land_cover.tree_canopy_fraction
        impervious = zone.land_cover.impervious_surface_fraction
        building_density = zone.land_cover.building_density
        water_frac = zone.land_cover.water_fraction

        if norm_type == "urban_forestry":
            tree_gain = cov_frac * 0.28 * max(0.1, 1.0 - canopy)
            lst_reduction = min(5.5, (cov_frac * 3.2) + (tree_gain * 4.5))
            ndvi_increase = min(0.35, tree_gain * 0.85)
            aqi_reduction = min(25.0, cov_frac * 18.0)

        elif norm_type == "cool_roofs":
            lst_reduction = min(6.5, cov_frac * 4.6 * max(0.35, building_density))
            ndvi_increase = 0.0
            aqi_reduction = min(8.0, cov_frac * 5.0)

        elif norm_type == "reflective_pavements":
            lst_reduction = min(4.8, cov_frac * 3.8 * max(0.35, impervious))
            ndvi_increase = 0.0
            aqi_reduction = min(6.0, cov_frac * 3.5)

        elif norm_type == "shade_corridors":
            lst_reduction = min(4.2, cov_frac * 2.8)
            ndvi_increase = min(0.06, cov_frac * 0.04)
            aqi_reduction = min(5.0, cov_frac * 3.0)

        elif norm_type == "water_body_restoration":
            water_boost = min(1.0, water_frac * 10.0) * 1.5
            lst_reduction = min(6.0, (cov_frac * 3.8) + water_boost)
            ndvi_increase = min(0.12, cov_frac * 0.08)
            aqi_reduction = min(10.0, cov_frac * 6.0)

        elif norm_type == "aqi_reduction":
            aqi_reduction = min(50.0, cov_frac * 38.0)
            lst_reduction = min(1.8, cov_frac * 1.2)
            ndvi_increase = min(0.04, cov_frac * 0.03)

        else:
            # Fallback general greening & shading
            lst_reduction = min(3.5, cov_frac * 2.5)
            ndvi_increase = min(0.10, cov_frac * 0.06)
            aqi_reduction = min(10.0, cov_frac * 8.0)

        return (
            round(lst_reduction, 2),
            round(ndvi_increase, 3),
            round(aqi_reduction, 1),
        )

    def simulate_zone(
        self,
        zone: Zone,
        request: SimulationRequest,
    ) -> SimulationResult:
        """Evaluates counterfactual digital twin impact for a single zone."""
        live_baseline = chri_service.evaluate_live_zone(zone)
        forecast_baseline = heat_forecast_engine.predict_zone_forecast(zone)

        base_lst = live_baseline.raster_metrics.mean_lst_c
        base_ndvi = live_baseline.raster_metrics.mean_ndvi
        base_aqi = live_baseline.raw_metrics["aqi"]
        base_chri = live_baseline.score
        base_forecast_peak = forecast_baseline.peak_chri
        pop = zone.demographics.total_population

        # Compute physical deltas
        lst_red, ndvi_inc, aqi_red = self.compute_counterfactual_deltas(
            zone=zone,
            intervention_type=request.intervention_type,
            coverage_pct=request.coverage_pct,
        )

        # Counterfactual simulated indicators
        sim_lst = round(max(22.0, base_lst - lst_red), 2)
        sim_ndvi = round(min(0.85, max(0.01, base_ndvi + ndvi_inc)), 3)
        sim_aqi = round(max(20.0, base_aqi - aqi_red), 1)

        # Re-evaluate CHRI with counterfactual inputs
        norm_lst_sim = normalize_lst(sim_lst)
        norm_ndvi_sim = normalize_ndvi(sim_ndvi)
        norm_aqi_sim = normalize_aqi(sim_aqi)

        sim_chri = compute_chri_score(
            norm_lst=norm_lst_sim,
            norm_pop=live_baseline.normalized_population_density,
            norm_bld=live_baseline.normalized_building_density,
            norm_ndvi=norm_ndvi_sim,
            norm_aqi=norm_aqi_sim,
        )

        proj_chri_red = round(max(0.0, base_chri - sim_chri), 2)
        sim_risk_tier = classify_risk(sim_chri)

        # Re-simulate forecast on counterfactual zone
        sim_zone = zone.model_copy(deep=True)
        sim_zone.thermal_observation.land_surface_temp_c = sim_lst
        sim_zone.thermal_observation.thermal_anomaly_c = round(
            sim_lst - zone.thermal_observation.baseline_temp_c, 2
        )
        sim_forecast = heat_forecast_engine.predict_zone_forecast(sim_zone)
        sim_forecast_peak = sim_forecast.peak_chri
        forecast_imp = round(max(0.0, base_forecast_peak - sim_forecast_peak), 2)

        # Protected population
        if base_chri >= 40.0 and sim_chri < 40.0:
            exposed_pop_red = pop
        else:
            exposed_pop_red = int(round(pop * min(1.0, proj_chri_red / max(1.0, base_chri))))

        # Economic and health benefit calculation ($8.50/°C-person + $12.00/CHRI-pt-person)
        econ_benefit = round(
            (lst_red * pop * 8.50) + (proj_chri_red * pop * 12.00),
            2,
        )

        # ROI score ratio
        budget_effective = max(1_000.0, request.budget)
        roi_ratio = round((econ_benefit / budget_effective) * 10.0, 2)

        intervention_title = INTERVENTION_NAMES.get(
            normalize_intervention_type(request.intervention_type),
            request.intervention_type.replace("_", " ").title(),
        )

        return SimulationResult(
            zone_id=zone.id,
            zone_name=zone.name,
            scenario_name=request.scenario_name or f"Simulated {request.coverage_pct}% {request.intervention_type}",
            intervention_type=request.intervention_type,
            coverage_pct=request.coverage_pct,
            budget=request.budget,
            implementation_horizon=request.implementation_horizon,
            baseline_chri=base_chri,
            simulated_chri=sim_chri,
            projected_chri_reduction=proj_chri_red,
            baseline_lst_c=base_lst,
            simulated_lst_c=sim_lst,
            projected_lst_reduction=lst_red,
            baseline_ndvi=base_ndvi,
            simulated_ndvi=sim_ndvi,
            projected_ndvi_increase=ndvi_inc,
            baseline_aqi=base_aqi,
            simulated_aqi=sim_aqi,
            projected_aqi_reduction=aqi_red,
            baseline_risk_level=live_baseline.risk_level,
            simulated_risk_level=sim_risk_tier,
            baseline_forecast_peak=base_forecast_peak,
            simulated_forecast_peak=sim_forecast_peak,
            forecast_improvement=forecast_imp,
            exposed_population_reduction=exposed_pop_red,
            economic_benefit_usd=econ_benefit,
            roi=roi_ratio,
            applied_interventions=[intervention_title],
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def compare_scenarios(
        self,
        zone: Zone,
        comparison: ScenarioComparisonRequest,
    ) -> ScenarioComparisonResponse:
        """Evaluates Baseline vs Scenario A vs Scenario B with side-by-side ranking."""
        # Baseline as an identity simulation
        baseline_req = SimulationRequest(
            zone_id=zone.id,
            intervention_type="cool_roofs",
            coverage_pct=1.0,
            budget=0.0,
            implementation_horizon="immediate",
            scenario_name="Baseline Status Quo",
        )
        res_base = self.simulate_zone(zone, baseline_req)
        # Reset baseline simulation deltas to 0 for true status-quo representation
        res_base.simulated_chri = res_base.baseline_chri
        res_base.projected_chri_reduction = 0.0
        res_base.simulated_lst_c = res_base.baseline_lst_c
        res_base.projected_lst_reduction = 0.0
        res_base.simulated_ndvi = res_base.baseline_ndvi
        res_base.projected_ndvi_increase = 0.0
        res_base.simulated_aqi = res_base.baseline_aqi
        res_base.projected_aqi_reduction = 0.0
        res_base.simulated_risk_level = res_base.baseline_risk_level
        res_base.simulated_forecast_peak = res_base.baseline_forecast_peak
        res_base.forecast_improvement = 0.0
        res_base.exposed_population_reduction = 0
        res_base.economic_benefit_usd = 0.0
        res_base.roi = 0.0

        res_a = self.simulate_zone(zone, comparison.scenario_a)
        res_b = self.simulate_zone(zone, comparison.scenario_b)

        delta_chri = round(res_a.projected_chri_reduction - res_b.projected_chri_reduction, 2)
        delta_cooling = round(res_a.projected_lst_reduction - res_b.projected_lst_reduction, 2)
        delta_roi = round(res_a.roi - res_b.roi, 2)

        # Multi-criteria decision rule
        score_a = (res_a.projected_chri_reduction * 2.0) + (res_a.projected_lst_reduction * 3.0) + (res_a.roi * 0.1)
        score_b = (res_b.projected_chri_reduction * 2.0) + (res_b.projected_lst_reduction * 3.0) + (res_b.roi * 0.1)

        if score_a > score_b + 0.1:
            winner = "Scenario A"
            winning_metric = (
                f"Superior CHRI Reduction (-{res_a.projected_chri_reduction} pts vs -{res_b.projected_chri_reduction} pts) "
                f"and localized cooling (-{res_a.projected_lst_reduction}°C)"
            )
            recommendation = (
                f"Deploy {res_a.scenario_name}. It yields {delta_cooling}°C greater cooling impact "
                f"and protects {res_a.exposed_population_reduction} citizens with an ROI of {res_a.roi}."
            )
        elif score_b > score_a + 0.1:
            winner = "Scenario B"
            winning_metric = (
                f"Superior CHRI Reduction (-{res_b.projected_chri_reduction} pts vs -{res_a.projected_chri_reduction} pts) "
                f"and localized cooling (-{res_b.projected_lst_reduction}°C)"
            )
            recommendation = (
                f"Deploy {res_b.scenario_name}. It yields {-delta_cooling}°C greater cooling impact "
                f"and protects {res_b.exposed_population_reduction} citizens with an ROI of {res_b.roi}."
            )
        else:
            winner = "Tie"
            winning_metric = "Equivalent Performance"
            recommendation = "Both scenarios provide comparable cooling dividends. Select based on municipal procurement ease."

        return ScenarioComparisonResponse(
            zone_id=zone.id,
            zone_name=zone.name,
            baseline=res_base,
            scenario_a=res_a,
            scenario_b=res_b,
            winner_scenario=winner,
            winning_metric=winning_metric,
            delta_chri_a_vs_b=delta_chri,
            delta_cooling_a_vs_b=delta_cooling,
            delta_roi_a_vs_b=delta_roi,
            recommendation=recommendation,
        )

    def simulate_citywide_portfolio(
        self,
        zones: List[Zone],
        budget_tier: str = "MEDIUM",
    ) -> CitywideSimulationResult:
        """Estimates citywide digital twin what-if impact under budget tier portfolios."""
        tier = budget_tier.upper()
        cap = BUDGET_CAPS.get(tier, BUDGET_CAPS["MEDIUM"])

        if not zones:
            return CitywideSimulationResult(
                budget_tier=tier,
                budget_limit_usd=cap,
                total_cost_usd=0.0,
                city_chri_change=0.0,
                city_mean_chri_baseline=0.0,
                city_mean_chri_simulated=0.0,
                hotspot_reduction=0,
                population_protected=0,
                economic_benefit_usd=0.0,
                temperature_reduction=0.0,
                zones_simulated=0,
                roi_score=0.0,
            )

        live_scores = [chri_service.evaluate_live_zone(z) for z in zones]
        baseline_mean_chri = round(sum(s.score for s in live_scores) / len(live_scores), 2)

        # Tier coverage scaling
        coverage_map = {"LOW": 25.0, "MEDIUM": 50.0, "HIGH": 80.0}
        cov_pct = coverage_map.get(tier, 50.0)

        # Allocate budget across zones prioritized by current risk
        sorted_zones = sorted(zones, key=lambda z: chri_service.evaluate_live_zone(z).score, reverse=True)
        budget_per_zone = cap / max(1, len(sorted_zones))

        sim_results: List[SimulationResult] = []
        for z in sorted_zones:
            # Pick dominant driver intervention
            live = chri_service.evaluate_live_zone(z)
            int_type = "cool_roofs"
            if live.dominant_driver == "low_ndvi":
                int_type = "urban_forestry"
            elif live.dominant_driver == "poor_air_quality":
                int_type = "aqi_reduction"
            elif live.dominant_driver == "high_population":
                int_type = "shade_corridors"

            req = SimulationRequest(
                zone_id=z.id,
                intervention_type=int_type,
                coverage_pct=cov_pct,
                budget=budget_per_zone,
                implementation_horizon="short_term",
            )
            sim_results.append(self.simulate_zone(z, req))

        tot_cost = round(min(cap, sum(r.budget for r in sim_results)), 2)
        sim_mean_chri = round(sum(r.simulated_chri for r in sim_results) / len(sim_results), 2)
        chri_delta = round(baseline_mean_chri - sim_mean_chri, 2)
        avg_temp_red = round(sum(r.projected_lst_reduction for r in sim_results) / len(sim_results), 2)
        tot_pop_prot = sum(r.exposed_population_reduction for r in sim_results)
        tot_econ = round(sum(r.economic_benefit_usd for r in sim_results), 2)

        # Hotspots remediated below 40.0 CHRI threshold
        base_hotspots = sum(1 for s in live_scores if s.score >= 40.0)
        sim_hotspots = sum(1 for r in sim_results if r.simulated_chri >= 40.0)
        hotspot_red = max(0, base_hotspots - sim_hotspots)

        roi_score = round(min(100.0, (tot_econ / max(1.0, tot_cost)) * 10.0), 1)

        return CitywideSimulationResult(
            budget_tier=tier,
            budget_limit_usd=cap,
            total_cost_usd=tot_cost,
            city_chri_change=chri_delta,
            city_mean_chri_baseline=baseline_mean_chri,
            city_mean_chri_simulated=sim_mean_chri,
            hotspot_reduction=hotspot_red,
            population_protected=tot_pop_prot,
            economic_benefit_usd=tot_econ,
            temperature_reduction=avg_temp_red,
            zones_simulated=len(zones),
            roi_score=roi_score,
        )

    def get_zone_simulation_metadata(self, zone: Zone) -> ZoneSimulationMetadata:
        """Returns baseline parameter bounds and available intervention levers for a zone."""
        live = chri_service.evaluate_live_zone(zone)
        return ZoneSimulationMetadata(
            zone_id=zone.id,
            zone_name=zone.name,
            current_chri=live.score,
            current_lst_c=live.raster_metrics.mean_lst_c,
            current_ndvi=live.raster_metrics.mean_ndvi,
            current_aqi=live.raw_metrics["aqi"],
            tree_canopy_fraction=zone.land_cover.tree_canopy_fraction,
            impervious_surface_fraction=zone.land_cover.impervious_surface_fraction,
            building_density=zone.land_cover.building_density,
            water_fraction=zone.land_cover.water_fraction,
            total_population=zone.demographics.total_population,
            available_interventions=[
                "urban_forestry",
                "cool_roofs",
                "reflective_pavements",
                "shade_corridors",
                "water_body_restoration",
                "aqi_reduction",
            ],
        )


scenario_simulator_engine = ScenarioSimulatorEngine()
