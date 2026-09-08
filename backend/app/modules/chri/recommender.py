"""CHRI Urban Heat Mitigation Recommendation Engine.

Synthesizes prescriptive climate resilience interventions based on a zone's
dominant risk drivers:
- high_lst
- low_ndvi
- high_population
- high_building_density
- poor_air_quality
"""
from typing import Dict, List
from backend.app.schemas.zone import Zone
from backend.app.schemas.chri import CHRIScore, MitigationAction, ZoneRecommendation


# Action catalog keyed by dominant driver
DRIVER_ACTION_CATALOG: Dict[str, List[MitigationAction]] = {
    "high_lst": [
        MitigationAction(
            action_id="ACT-LST-01",
            title="High-Albedo Cool Roof Retrofit",
            category="Urban Fabric",
            driver_addressed="high_lst",
            description="Apply elastomeric high-reflectance coatings (Solar Reflectance Index SRI ≥ 82) to commercial and residential flat rooftops to suppress radiant thermal absorption.",
            cooling_impact_c=2.1,
            cost_tier="$$",
            implementation_time="Short-term (3-6 months)",
            co_benefits=["Building HVAC energy reduction (15-25%)", "Extended roof membrane durability", "Peak electrical grid load relief"],
        ),
        MitigationAction(
            action_id="ACT-LST-02",
            title="Cool Pavement & Porous Surfacing",
            category="Infrastructure",
            driver_addressed="high_lst",
            description="Resurface asphalt parking lots and transit corridors with light-colored, permeable coatings to decrease daytime heat storage and nighttime thermal re-radiation.",
            cooling_impact_c=1.4,
            cost_tier="$$$",
            implementation_time="Mid-term (6-12 months)",
            co_benefits=["Stormwater runoff absorption", "Enhanced nighttime street visibility", "Reduced vehicle tire wear"],
        ),
    ],
    "low_ndvi": [
        MitigationAction(
            action_id="ACT-NDVI-01",
            title="Native Urban Tree Canopy Expansion",
            category="Nature-Based Solutions",
            driver_addressed="low_ndvi",
            description="Establish dense multi-tier avenue plantations with drought-tolerant indigenous trees (Neem, Peepal, Pongamia) along right-of-ways to provide continuous pedestrian shade.",
            cooling_impact_c=1.8,
            cost_tier="$",
            implementation_time="Short-term (3-6 months)",
            co_benefits=["Direct shading of sidewalks", "Air filtration of PM2.5/PM10", "Urban biodiversity corridor enhancement"],
        ),
        MitigationAction(
            action_id="ACT-NDVI-02",
            title="Pocket Parks & Vegetated Bioswales",
            category="Nature-Based Solutions",
            driver_addressed="low_ndvi",
            description="Convert underutilized vacant lots and wide road margins into vegetated micro-parks and bioswales to maximize local evaporative cooling.",
            cooling_impact_c=1.3,
            cost_tier="$$",
            implementation_time="Mid-term (6-18 months)",
            co_benefits=["Rainwater infiltration and aquifer recharge", "Recreational civic green spaces", "Urban flood risk mitigation"],
        ),
    ],
    "high_population": [
        MitigationAction(
            action_id="ACT-POP-01",
            title="Climate-Controlled Community Cooling Shelters",
            category="Social & Emergency Protection",
            driver_addressed="high_population",
            description="Designate and equip community halls, public libraries, and metro transit stations as subsidized, daytime heat refuge hubs with filtered air and medical triage.",
            cooling_impact_c=0.6,
            cost_tier="$",
            implementation_time="Immediate (0-3 months)",
            co_benefits=["Immediate reduction in heat stroke emergencies", "Safe gathering spaces for vulnerable elderly/children", "Equitable civic disaster response"],
        ),
        MitigationAction(
            action_id="ACT-POP-02",
            title="Outdoor Worker Hydration & Tensile Shading Kiosks",
            category="Social Protection",
            driver_addressed="high_population",
            description="Deploy decentralized tensile shade sails and free chilled drinking water points at high-density bus stands, street markets, and construction hubs.",
            cooling_impact_c=0.9,
            cost_tier="$",
            implementation_time="Immediate (1-3 months)",
            co_benefits=["Occupational heat stress reduction", "Dehydration prevention", "Increased public transit commuter comfort"],
        ),
    ],
    "high_building_density": [
        MitigationAction(
            action_id="ACT-BLD-01",
            title="Extensive Green Roofs & Vertical Living Walls",
            category="Urban Architecture",
            driver_addressed="high_building_density",
            description="Incentivize commercial high-rises to install extensive modular green roofs and trellis-supported climbing vine facades on blank masonry facades.",
            cooling_impact_c=1.5,
            cost_tier="$$",
            implementation_time="Mid-term (6-18 months)",
            co_benefits=["Acoustic noise dampening", "Building thermal insulation", "Urban wildlife micro-habitats"],
        ),
        MitigationAction(
            action_id="ACT-BLD-02",
            title="Breezeway Corridor Zoning & Setback Preservation",
            category="Zoning & Urban Form",
            driver_addressed="high_building_density",
            description="Mandate minimum architectural separation and building orientation aligned with prevailing coastal sea breezes to prevent heat stagnation canyon traps.",
            cooling_impact_c=1.1,
            cost_tier="$",
            implementation_time="Long-term (1-3 years)",
            co_benefits=["Natural atmospheric ventilation", "Reduced reliance on artificial air conditioning", "Dilution of localized air pollutants"],
        ),
    ],
    "poor_air_quality": [
        MitigationAction(
            action_id="ACT-AQI-01",
            title="Low-Emission Mobility Zones & Peak Heavy Vehicle Divergence",
            category="Atmospheric & Traffic",
            driver_addressed="poor_air_quality",
            description="Reroute heavy diesel freight vehicles around residential cores during high-insolation midday hours and prioritize electric transit feeders to reduce ozone and PM2.5.",
            cooling_impact_c=0.7,
            cost_tier="$",
            implementation_time="Short-term (3-6 months)",
            co_benefits=["Curtailed cardiopulmonary hospital admissions", "Reduced urban canyon noise pollution", "Lower greenhouse gas emissions"],
        ),
        MitigationAction(
            action_id="ACT-AQI-02",
            title="Roadside Vegetative Particulate & Noise Barriers",
            category="Environmental Buffer",
            driver_addressed="poor_air_quality",
            description="Install evergreen shrub hedgerows and dense bamboo buffers between high-volume arterials and pedestrian sidewalks to capture particulates and provide micro-shade.",
            cooling_impact_c=0.9,
            cost_tier="$$",
            implementation_time="Mid-term (6-12 months)",
            co_benefits=["Up to 30% reduction in roadside PM2.5 exposure", "Visual buffering of asphalt corridors", "Trapping of fugitive dust"],
        ),
    ],
}


class RecommendationEngine:
    """Generates prioritized, actionable climate resilience plans based on CHRI driver decomposition."""

    def generate_recommendations(self, zone: Zone, chri: CHRIScore) -> ZoneRecommendation:
        """Constructs an integrated ZoneRecommendation package tailored to the zone's risk profile."""
        # Rank drivers in descending order of weighted contribution
        sorted_drivers = sorted(
            chri.driver_contributions.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        dominant_driver_keys = [k for k, _ in sorted_drivers]

        recommended_actions: List[MitigationAction] = []
        # Pull top actions from dominant drivers
        for driver_key in dominant_driver_keys:
            actions = DRIVER_ACTION_CATALOG.get(driver_key, [])
            for act in actions:
                if act not in recommended_actions:
                    recommended_actions.append(act)
                if len(recommended_actions) >= 4:
                    break
            if len(recommended_actions) >= 4:
                break

        # Calculate projected combined cooling impact with realistic saturation factor
        raw_cooling = sum(act.cooling_impact_c for act in recommended_actions)
        # Diminishing returns scaling factor (interventions overlap in spatial effect)
        projected_cooling = round(min(raw_cooling * 0.72, 4.5), 1)

        # Calculate estimated CHRI point reduction following complete implementation
        # A 1°C cooling drop + canopy/albedo improvements reduce CHRI substantially
        projected_reduction = round(min(chri.score * 0.45, projected_cooling * 4.2 + len(recommended_actions) * 1.8), 1)

        top_driver_readable = chri.dominant_driver.replace("_", " ").title()
        summary = (
            f"Zone '{zone.name}' is categorized at {chri.risk_level} heat risk (CHRI: {chri.score}/100), "
            f"primarily propelled by {top_driver_readable} ({chri.dominant_driver_pct}% attribution). "
            f"Executing the {len(recommended_actions)} prioritized interventions is projected to yield "
            f"~{projected_cooling}°C surface cooling and reduce overall CHRI score by {projected_reduction} points."
        )

        return ZoneRecommendation(
            zone_id=zone.id,
            zone_name=zone.name,
            chri_score=chri.score,
            risk_level=chri.risk_level,
            dominant_drivers=dominant_driver_keys,
            recommended_actions=recommended_actions,
            projected_cooling_c=projected_cooling,
            projected_chri_reduction=projected_reduction,
            summary=summary,
        )


recommendation_engine = RecommendationEngine()
