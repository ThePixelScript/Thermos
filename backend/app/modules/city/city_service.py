"""City Decision Intelligence Service.

Implements Phase 5: Municipal Decision Support Engine:
- Citywide executive intelligence command aggregation
- Deterministic priority intervention scoring
- Municipal action planner across 6 core urban cooling domains
- Budget-tiered resource portfolio optimization (LOW, MEDIUM, HIGH)
- Metropolitan executive briefing synthesis
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from backend.app.schemas.zone import Zone
from backend.app.schemas.city import (
    CityCommandOverview,
    PriorityIntervention,
    MunicipalAction,
    ResourcePortfolio,
    ExecutiveSummary,
)
from backend.app.modules.chri.chri_service import chri_service
from backend.app.modules.forecast.forecast_service import heat_forecast_engine


BUDGET_TIERS: Dict[str, float] = {
    "LOW": 500_000.0,
    "MEDIUM": 2_000_000.0,
    "HIGH": 5_000_000.0,
}


def calculate_vulnerability_index(zone: Zone) -> float:
    """Computes normalized demographic and socio-environmental vulnerability [0-100]."""
    d = zone.demographics
    ratio_vuln = d.vulnerable_ratio  # Fraction <5 or >65
    ratio_ac = d.low_ac_coverage_ratio  # Fraction without AC
    worker_factor = min(1.0, d.outdoor_worker_density_per_sqkm / 5000.0)

    raw_vuln = (0.50 * ratio_vuln) + (0.30 * ratio_ac) + (0.20 * worker_factor)
    return round(min(100.0, max(0.0, raw_vuln * 100.0)), 1)


def calculate_feasibility_index(zone: Zone) -> float:
    """Computes physical and infrastructural intervention feasibility [0-100]."""
    lc = zone.land_cover
    # Feasibility combines available roof/pavement area, space for canopy expansion, and water presence
    base = 35.0
    impervious_contrib = 35.0 * lc.impervious_surface_fraction
    canopy_room = 20.0 * max(0.0, 1.0 - lc.tree_canopy_fraction)
    water_presence = 10.0 * min(1.0, lc.water_fraction * 10.0)

    score = base + impervious_contrib + canopy_room + water_presence
    return round(min(100.0, max(10.0, score)), 1)


def calculate_priority_score(
    chri: float,
    forecast_risk: float,
    pop_exposure: float,
    vulnerability: float,
    feasibility: float,
) -> float:
    """Evaluates deterministic priority formula:
    Priority Score = 0.35*CHRI + 0.25*Forecast + 0.20*Pop + 0.10*Vuln + 0.10*Feas
    """
    score = (
        (0.35 * chri)
        + (0.25 * forecast_risk)
        + (0.20 * pop_exposure)
        + (0.10 * vulnerability)
        + (0.10 * feasibility)
    )
    return round(min(100.0, max(0.0, score)), 2)


def classify_urgency(priority_score: float) -> str:
    """Classifies operational intervention urgency based on priority score."""
    if priority_score >= 70.0:
        return "IMMEDIATE"
    elif priority_score >= 55.0:
        return "URGENT"
    elif priority_score >= 40.0:
        return "PLANNED"
    return "ROUTINE"


class CityDecisionEngine:
    """Municipal decision intelligence engine orchestrating executive analytics."""

    def evaluate_zone_priority(self, zone: Zone) -> PriorityIntervention:
        """Evaluates deterministic priority score for a single zone."""
        live_score = chri_service.evaluate_live_zone(zone)
        forecast = heat_forecast_engine.predict_zone_forecast(zone)

        chri_val = live_score.score
        forecast_risk = forecast.peak_chri
        pop_exposure = min(100.0, (zone.demographics.population_density_per_sqkm / 50000.0) * 100.0)
        vulnerability = calculate_vulnerability_index(zone)
        feasibility = calculate_feasibility_index(zone)

        score = calculate_priority_score(
            chri=chri_val,
            forecast_risk=forecast_risk,
            pop_exposure=pop_exposure,
            vulnerability=vulnerability,
            feasibility=feasibility,
        )

        # Determine primary operational recommendation
        rec = "Deploy reflective cool roofs and high-density canopy planting"
        if live_score.dominant_driver == "high_lst":
            rec = "Accelerate cool roof coatings and solar-reflective pavement retrofits"
        elif live_score.dominant_driver == "low_ndvi":
            rec = "Initiate native avenue tree canopy planting and pocket park bioswales"
        elif live_score.dominant_driver == "high_population":
            rec = "Deploy tensile transit shading corridors and decentralized cooling hubs"
        elif live_score.dominant_driver == "poor_air_quality":
            rec = "Implement clean-air green buffers and traffic emission diversion zones"
        elif live_score.dominant_driver == "high_building_density":
            rec = "Incentivize extensive vertical living walls and breezeway setback buffers"

        return PriorityIntervention(
            zone_id=zone.id,
            zone_name=zone.name,
            rank=0,  # Assigned after sorting
            priority_score=score,
            chri_component=round(chri_val, 1),
            forecast_risk_component=round(forecast_risk, 1),
            population_exposure_component=round(pop_exposure, 1),
            vulnerability_component=round(vulnerability, 1),
            feasibility_component=round(feasibility, 1),
            risk_level=live_score.risk_level,
            dominant_driver=live_score.dominant_driver,
            recommended_action=rec,
            urgency=classify_urgency(score),
        )

    def get_ranked_priority_interventions(self, zones: List[Zone]) -> List[PriorityIntervention]:
        """Returns citywide intervention queue ranked strictly descending by priority score."""
        items = [self.evaluate_zone_priority(z) for z in zones]
        items.sort(key=lambda x: x.priority_score, reverse=True)

        for i, item in enumerate(items, start=1):
            item.rank = i

        return items

    def get_city_command_overview(
        self,
        zones: List[Zone],
        city_name: str = "Chennai Metropolis",
    ) -> CityCommandOverview:
        """Aggregates executive KPIs across all urban zones."""
        if not zones:
            now_iso = datetime.now(timezone.utc).isoformat()
            return CityCommandOverview(
                city_name=city_name,
                total_zones=0,
                current_city_chri=0.0,
                forecast_city_chri_24h=0.0,
                forecast_city_chri_72h=0.0,
                forecast_city_chri_7d=0.0,
                active_hotspots=0,
                emerging_hotspots=0,
                cooling_zones=0,
                population_exposed=0,
                total_population=0,
                high_risk_zones_count=0,
                average_lst=0.0,
                average_ndvi=0.0,
                timestamp=now_iso,
            )

        live_scores = [chri_service.evaluate_live_zone(z) for z in zones]
        city_forecast = heat_forecast_engine.predict_citywide_forecast(zones)

        current_chri = round(sum(s.score for s in live_scores) / len(live_scores), 2)
        avg_lst = round(sum(s.raster_metrics.mean_lst_c for s in live_scores) / len(live_scores), 2)
        avg_ndvi = round(sum(s.raster_metrics.mean_ndvi for s in live_scores) / len(live_scores), 3)

        high_risk_tiers = {"HIGH", "SEVERE", "CRITICAL"}
        high_risk_zones = [z for z, s in zip(zones, live_scores) if s.risk_level in high_risk_tiers]
        pop_exposed = sum(z.demographics.total_population for z in high_risk_zones)
        total_pop = sum(z.demographics.total_population for z in zones)

        active_hotspots = sum(1 for s in live_scores if s.score >= 40.0 or s.risk_level in high_risk_tiers)
        emerging_hotspots = sum(1 for s in live_scores if s.hotspot_trend == "emerging")
        cooling_zones = sum(1 for s in live_scores if s.hotspot_trend == "cooling")

        return CityCommandOverview(
            city_name=city_name,
            total_zones=len(zones),
            current_city_chri=current_chri,
            forecast_city_chri_24h=city_forecast.citywide_mean_chri_24h,
            forecast_city_chri_72h=city_forecast.citywide_mean_chri_72h,
            forecast_city_chri_7d=city_forecast.citywide_mean_chri_7d,
            active_hotspots=active_hotspots,
            emerging_hotspots=emerging_hotspots,
            cooling_zones=cooling_zones,
            population_exposed=pop_exposed,
            total_population=total_pop,
            high_risk_zones_count=len(high_risk_zones),
            average_lst=avg_lst,
            average_ndvi=avg_ndvi,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def generate_municipal_actions(self, zones: List[Zone]) -> List[MunicipalAction]:
        """Generates operational mitigation actions across the 6 core municipal domains."""
        if not zones:
            return []

        # Group zones by suitability for each action
        cool_roof_targets = [
            z for z in zones
            if z.land_cover.building_density >= 0.40 or z.land_cover.impervious_surface_fraction >= 0.55
        ]
        forestry_targets = [
            z for z in zones
            if z.land_cover.tree_canopy_fraction < 0.20 and z.demographics.population_density_per_sqkm >= 8_000
        ]
        shade_corridor_targets = [
            z for z in zones
            if z.demographics.outdoor_worker_density_per_sqkm >= 1_200 or z.demographics.population_density_per_sqkm >= 15_000
        ]
        water_targets = [
            z for z in zones
            if z.land_cover.water_fraction >= 0.01 or z.typology.value in ["coastal_wetland", "peri_urban_transitional"]
        ]
        if not water_targets:
            water_targets = zones[:2]

        aqi_targets = [
            z for z in zones
            if z.typology.value in ["industrial_manufacturing", "dense_urban_core", "commercial_arterial"]
        ]
        if not aqi_targets:
            aqi_targets = zones[:3]

        pavement_targets = [
            z for z in zones
            if z.land_cover.impervious_surface_fraction >= 0.60
        ]

        def target_ids(zl: List[Zone]) -> List[str]:
            return [z.id for z in zl]

        def target_names(zl: List[Zone]) -> List[str]:
            return [z.name for z in zl]

        def pop_sum(zl: List[Zone]) -> int:
            return sum(z.demographics.total_population for z in zl)

        actions = [
            MunicipalAction(
                action_id="ACT-MUN-COOL-ROOF",
                action_type="cool_roofs",
                title="Municipal Cool Roof Incentive & High-Albedo Coating Program",
                description="Deployment of elastomeric reflective coatings (Solar Reflectance Index SRI ≥ 82) on residential and commercial rooftops to curtail solar heat absorption.",
                target_zones=target_ids(cool_roof_targets),
                target_zone_names=target_names(cool_roof_targets),
                estimated_chri_reduction=4.8,
                estimated_temperature_reduction=2.4,
                affected_population=pop_sum(cool_roof_targets),
                implementation_horizon="Short-term (3-6 mo)",
                cost_tier="MEDIUM",
                estimated_cost_usd=650_000.0,
                feasibility_score=88.0,
                co_benefits=["Building HVAC demand reduction (18%)", "Extended rooftop membrane life", "Peak electrical grid relief"],
            ),
            MunicipalAction(
                action_id="ACT-MUN-URBAN-FOREST",
                action_type="urban_forestry",
                title="Native Urban Tree Canopy & Avenue Greening Campaign",
                description="Planting dense multi-canopy native species (Neem, Peepal, Pongamia) along public easements, medians, and pedestrian pathways.",
                target_zones=target_ids(forestry_targets),
                target_zone_names=target_names(forestry_targets),
                estimated_chri_reduction=5.4,
                estimated_temperature_reduction=2.1,
                affected_population=pop_sum(forestry_targets),
                implementation_horizon="Mid-term (6-18 mo)",
                cost_tier="LOW",
                estimated_cost_usd=380_000.0,
                feasibility_score=82.0,
                co_benefits=["Sidewalk continuous pedestrian shading", "Particulate air filtration", "Urban biodiversity corridor enhancement"],
            ),
            MunicipalAction(
                action_id="ACT-MUN-SHADE-CORRIDORS",
                action_type="shade_corridors",
                title="Tensile Solar-Reflective Transit Shade Corridors & Hydration Kiosks",
                description="Erection of lightweight high-albedo tensile fabric awnings with integrated evaporative cooling misting nozzles at critical commuter transit stops.",
                target_zones=target_ids(shade_corridor_targets),
                target_zone_names=target_names(shade_corridor_targets),
                estimated_chri_reduction=3.2,
                estimated_temperature_reduction=1.8,
                affected_population=pop_sum(shade_corridor_targets),
                implementation_horizon="Immediate (0-3 mo)",
                cost_tier="LOW",
                estimated_cost_usd=220_000.0,
                feasibility_score=94.0,
                co_benefits=["Direct heatstroke prevention for outdoor workers", "Enhanced pedestrian walkability", "Rapid non-disruptive installation"],
            ),
            MunicipalAction(
                action_id="ACT-MUN-WATER-RESTORATION",
                action_type="water_bodies_restoration",
                title="Urban Wetland, Lake & Blue Space Ecological Revitalization",
                description="Desilting urban temple tanks and lake margins, restoring littoral marsh vegetation, and installing solar aerators to boost evaporative cooling.",
                target_zones=target_ids(water_targets),
                target_zone_names=target_names(water_targets),
                estimated_chri_reduction=4.2,
                estimated_temperature_reduction=2.6,
                affected_population=pop_sum(water_targets),
                implementation_horizon="Mid-term (6-24 mo)",
                cost_tier="HIGH",
                estimated_cost_usd=1_250_000.0,
                feasibility_score=76.0,
                co_benefits=["Urban flood retention capacity", "Groundwater aquifer recharge", "Civic recreational amenity enhancement"],
            ),
            MunicipalAction(
                action_id="ACT-MUN-AQI-MITIGATION",
                action_type="aqi_mitigation",
                title="Clean Air Micro-Zone & Vegetated Particulate Buffer Network",
                description="Establishing dense evergreen shrub hedgerows along industrial and arterial corridors combined with automated water-mist suppression.",
                target_zones=target_ids(aqi_targets),
                target_zone_names=target_names(aqi_targets),
                estimated_chri_reduction=3.0,
                estimated_temperature_reduction=1.2,
                affected_population=pop_sum(aqi_targets),
                implementation_horizon="Short-term (1-6 mo)",
                cost_tier="LOW",
                estimated_cost_usd=260_000.0,
                feasibility_score=85.0,
                co_benefits=["Roadside PM2.5 capture (up to 25%)", "Acoustic noise reduction", "Dust suppression"],
            ),
            MunicipalAction(
                action_id="ACT-MUN-REFLECTIVE-PAVEMENTS",
                action_type="reflective_pavements",
                title="Permeable High-Albedo Cool Pavement Surfacing",
                description="Resurfacing open public plazas, government parking facilities, and low-traffic streets with solar-reflective, evaporative porous pavers.",
                target_zones=target_ids(pavement_targets),
                target_zone_names=target_names(pavement_targets),
                estimated_chri_reduction=3.8,
                estimated_temperature_reduction=1.7,
                affected_population=pop_sum(pavement_targets),
                implementation_horizon="Mid-term (6-12 mo)",
                cost_tier="MEDIUM",
                estimated_cost_usd=580_000.0,
                feasibility_score=80.0,
                co_benefits=["Stormwater runoff interception", "Curtailment of nighttime reradiated thermal enthalpy", "Improved night driving reflectance"],
            ),
        ]

        return actions

    def optimize_resource_allocation(
        self,
        actions: List[MunicipalAction],
        budget_tier: str = "MEDIUM",
    ) -> ResourcePortfolio:
        """Solves optimal intervention portfolio selection within specified budget tier."""
        tier_normalized = budget_tier.upper()
        budget_limit = BUDGET_TIERS.get(tier_normalized, BUDGET_TIERS["MEDIUM"])

        if not actions:
            return ResourcePortfolio(
                budget_tier=tier_normalized,
                budget_limit_usd=budget_limit,
                total_cost_usd=0.0,
                unallocated_budget_usd=budget_limit,
                selected_actions=[],
                projected_chri_reduction=0.0,
                projected_cooling=0.0,
                beneficiary_population=0,
                roi_score=0.0,
            )

        # Calculate ROI index for each action:
        # ROI = (cooling * (affected_population / 10,000)) / (cost_usd / 100,000) * (feasibility / 100)
        scored_candidates = []
        for a in actions:
            cost = max(1.0, a.estimated_cost_usd)
            pop_scale = a.affected_population / 10_000.0
            cost_scale = cost / 100_000.0
            feas_scale = a.feasibility_score / 100.0
            roi = (a.estimated_temperature_reduction * pop_scale / cost_scale) * feas_scale
            scored_candidates.append((roi, a))

        # Sort candidates descending by ROI
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        spent = 0.0
        selected: List[MunicipalAction] = []
        covered_zones = set()

        for roi, a in scored_candidates:
            if spent + a.estimated_cost_usd <= budget_limit:
                spent += a.estimated_cost_usd
                selected.append(a)
                covered_zones.update(a.target_zones)

        tot_chri_red = round(sum(a.estimated_chri_reduction for a in selected), 2)
        tot_cooling = round(sum(a.estimated_temperature_reduction for a in selected), 2)
        tot_beneficiaries = sum(a.affected_population for a in selected)

        # Normalize overall portfolio ROI score (0 - 100 scale)
        if spent > 0:
            portfolio_roi = round(min(100.0, (tot_cooling * (tot_beneficiaries / 50_000.0) / (spent / 500_000.0)) * 10.0), 1)
        else:
            portfolio_roi = 0.0

        return ResourcePortfolio(
            budget_tier=tier_normalized,
            budget_limit_usd=budget_limit,
            total_cost_usd=round(spent, 2),
            unallocated_budget_usd=round(max(0.0, budget_limit - spent), 2),
            selected_actions=selected,
            projected_chri_reduction=tot_chri_red,
            projected_cooling=tot_cooling,
            beneficiary_population=tot_beneficiaries,
            roi_score=portfolio_roi,
        )

    def generate_executive_summary(
        self,
        zones: List[Zone],
        city_name: str = "Chennai Metropolis",
    ) -> ExecutiveSummary:
        """Synthesizes comprehensive executive decision briefing for municipal leadership."""
        overview = self.get_city_command_overview(zones, city_name=city_name)
        priority_interventions = self.get_ranked_priority_interventions(zones)
        actions = self.generate_municipal_actions(zones)

        portfolios = {
            tier: self.optimize_resource_allocation(actions, budget_tier=tier)
            for tier in ["LOW", "MEDIUM", "HIGH"]
        }

        # Operational executive policy directives
        top_hotspot_names = [p.zone_name for p in priority_interventions[:3]]
        directives = [
            f"Mobilize priority emergency heat action protocol for top-ranked high exposure zones: {', '.join(top_hotspot_names)}.",
            f"Activate Medium-Term capital portfolio ($2.0M tier) targeting projected {portfolios['MEDIUM'].projected_chri_reduction} CHRI points drop across {len(portfolios['MEDIUM'].selected_actions)} cross-sectoral actions.",
            f"Pre-deploy tensile shading corridors and hydration relief hubs in transit interchanges ahead of projected +72h heat surge (+{round(overview.forecast_city_chri_72h - overview.current_city_chri, 1)} pts).",
            f"Prioritize cool roof reflective elastomeric retrofits in dense commercial and residential fabric to suppress nocturnal boundary-layer re-radiation.",
        ]

        return ExecutiveSummary(
            city_name=city_name,
            generated_at=datetime.now(timezone.utc).isoformat(),
            overview=overview,
            top_priority_interventions=priority_interventions[:5],
            recommended_portfolio=portfolios["MEDIUM"],
            all_portfolios=portfolios,
            executive_directives=directives,
        )


city_decision_engine = CityDecisionEngine()
