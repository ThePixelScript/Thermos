"""Intervention Recommender: Matches zone characteristics with optimal cooling actions."""
from typing import List
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import HeatRiskScore
from backend.app.schemas.intervention import InterventionEstimate, InterventionCategory
from backend.app.schemas.common import DataClassification
from backend.app.modules.interventions.catalog import INTERVENTION_CATALOG


def recommend_interventions_for_zone(zone: Zone, risk_score: HeatRiskScore) -> List[InterventionEstimate]:
    """Generate prioritized, feasibility-checked cooling recommendations for an urban zone."""
    estimates: List[InterventionEstimate] = []
    zone_area_sqm = zone.area_sqkm * 1_000_000

    for item in INTERVENTION_CATALOG:
        suitability = 0.0
        rationale_parts = []
        target_area = 0.0

        if item.id == "INT-TREE-CANOPY":
            # Highly suitable if canopy < 25% and impervious > 30%
            if zone.land_cover.tree_canopy_fraction < 0.25:
                deficit = 0.30 - zone.land_cover.tree_canopy_fraction
                suitability += 50.0 + (deficit * 100)
                # Recommend targeting 10% of total zone area or roadside easements
                target_area = zone_area_sqm * min(0.08, deficit * 0.5)
                rationale_parts.append(
                    f"Existing tree canopy is only {zone.land_cover.tree_canopy_fraction * 100:.1f}%. "
                    "Street tree planting provides crucial shade to ground pedestrian corridors."
                )
            if zone.demographics.population_density_per_sqkm > 15000:
                suitability += 20.0
                rationale_parts.append("High pedestrian foot-traffic benefits directly from canopy shade.")

        elif item.id == "INT-COOL-ROOF":
            # Suitable if impervious surface is high and albedo is low
            if zone.land_cover.impervious_surface_fraction > 0.60 and zone.land_cover.average_albedo < 0.18:
                suitability += 60.0 + ((0.20 - zone.land_cover.average_albedo) * 200)
                # Estimate roof area as ~40% of impervious footprint
                target_area = zone_area_sqm * zone.land_cover.impervious_surface_fraction * 0.40 * 0.25
                rationale_parts.append(
                    f"Low surface albedo ({zone.land_cover.average_albedo:.2f}) and high roof density "
                    "make reflective white coatings the highest cooling ROI measure."
                )
            if zone.demographics.low_ac_coverage_ratio > 0.40:
                suitability += 25.0
                rationale_parts.append("Low air-conditioning penetration means passive indoor cooling will save lives.")

        elif item.id == "INT-PERM-PAVEMENT":
            if zone.land_cover.impervious_surface_fraction > 0.70:
                suitability += 45.0
                target_area = zone_area_sqm * 0.04  # 4% of zone
                rationale_parts.append(
                    "High ground sealing traps sensible heat overnight; permeable pavers restore evaporative cooling."
                )

        elif item.id == "INT-POCKET-PARK":
            if zone.demographics.population_density_per_sqkm > 20000 and zone.land_cover.tree_canopy_fraction < 0.15:
                suitability += 65.0
                target_area = min(15000.0, zone_area_sqm * 0.015)
                rationale_parts.append(
                    "Dense neighborhood requires accessible green thermal refuges within 5-minute walking radii."
                )

        elif item.id == "INT-TRANSIT-SHADE":
            if zone.demographics.outdoor_worker_density_per_sqkm > 3000 or zone.typology.value == "transit_hub":
                suitability += 80.0
                target_area = 5000.0
                rationale_parts.append(
                    f"Extreme outdoor exposure ({zone.demographics.outdoor_worker_density_per_sqkm:,} laborers/transit users) "
                    "demands rapid solar canopy shading and misting stations."
                )

        if suitability >= 30.0 and target_area > 0:
            total_cost = target_area * item.unit_cost_usd_per_sqm
            # Projected local LST reduction proportional to target area share and cooling potential
            area_fraction = target_area / zone_area_sqm
            lst_reduction = round(item.cooling_potential_c * min(1.0, area_fraction * 5.0), 2)
            ambient_reduction = round(item.air_temp_reduction_c * min(1.0, area_fraction * 4.0), 2)

            estimates.append(
                InterventionEstimate(
                    intervention_id=item.id,
                    intervention_name=item.name,
                    category=item.category,
                    recommended_area_sqm=round(target_area, 0),
                    estimated_total_cost_usd=round(total_cost, 0),
                    expected_local_lst_reduction_c=max(0.3, lst_reduction),
                    expected_ambient_reduction_c=max(0.1, ambient_reduction),
                    suitability_score=round(min(100.0, suitability), 1),
                    rationale=" ".join(rationale_parts),
                    classification=DataClassification.SIMULATED,
                )
            )

    # Sort descending by suitability score
    estimates.sort(key=lambda e: e.suitability_score, reverse=True)
    return estimates
