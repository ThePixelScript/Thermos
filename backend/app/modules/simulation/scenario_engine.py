"""Scenario Engine: Deterministic, physics-informed simulation for urban cooling interventions.

PS13 — HeatScape: Urban Heat Reduction Planner
Team: CodePulse

Key Design Decisions & Scientific Principles:
1. Server-authoritative calculations:
   All budget tallies, spatial constraint verifications, and cooling estimates
   are computed deterministically in Python. The client sends user choices and renders server output.
2. Diminishing returns on ambient air cooling:
   Surface LST drop is localized to treated parcels. Ambient air temperature (2m UCL)
   drop is non-linear and saturates asymptotically:
     ambient_drop = T_limit * (1 - exp(- sum(k_i) / T_limit))
     where T_limit = 3.0°C.
3. Microclimate synergy coupling:
   Co-deploying nature-based measures (trees/parks) with reflective surfaces (cool roofs/pavements)
   adds a modest coupling bonus (+0.10°C to +0.20°C).
4. Physical surface constraints:
   Roof, pavement, corridor, and public space parcels cannot exceed the zone's
   available physical surface area.
5. Scientific provenance:
   Every simulation response is stamped with DataClassification.SIMULATED and an explicit
   disclaimer: "Modelled estimate under stated assumptions; not field-validated."
"""
import math
from typing import List, Dict, Optional
from backend.app.schemas.zone import Zone
from backend.app.schemas.intervention import (
    SimulationResponse,
    SimulatedInterventionItem,
    InterventionCategory,
)
from backend.app.schemas.common import DataClassification
from backend.app.modules.interventions.catalog import get_intervention_by_id


# Empirical saturation ceiling for neighborhood ambient air cooling (°C)
AMBIENT_COOLING_SATURATION_CEILING_C = 3.0

# Surface allocation proxies based on morphological properties
MIN_SURFACE_SLOT_SQM = 1_000.0


def compute_available_surfaces(zone: Zone) -> Dict[str, float]:
    """Calculate physically available surface area constraints for a zone in square meters."""
    zone_area_sqm = zone.area_sqkm * 1_000_000.0
    lc = zone.land_cover

    # Roof footprint: impervious ground fraction * building density * typical roof efficiency
    roof_sqm = zone_area_sqm * lc.impervious_surface_fraction * lc.building_density * 0.75

    # Pavement & streets: impervious surface not occupied by buildings
    pavement_sqm = zone_area_sqm * lc.impervious_surface_fraction * max(0.08, 1.0 - lc.building_density)

    # Street corridor easements for shade trees: unshaded linear roadway fraction
    corridor_sqm = zone_area_sqm * max(0.05, 0.20 * (1.0 - lc.tree_canopy_fraction))

    # Public/open spaces: unbuilt, non-water ground parcels
    public_sqm = zone_area_sqm * max(0.02, 1.0 - lc.impervious_surface_fraction - lc.water_fraction)

    return {
        "roof": max(MIN_SURFACE_SLOT_SQM, roof_sqm),
        "pavement": max(MIN_SURFACE_SLOT_SQM, pavement_sqm),
        "street_corridor": max(MIN_SURFACE_SLOT_SQM, corridor_sqm),
        "public_space": max(MIN_SURFACE_SLOT_SQM, public_sqm),
    }


def simulate_scenario(
    zone: Zone,
    selected_intervention_ids: List[str],
    budget_inr_lakhs: float,
) -> SimulationResponse:
    """Execute a deterministic, physics-informed intervention scenario simulation for an urban zone."""
    zone_area_sqm = zone.area_sqkm * 1_000_000.0
    available_surfaces = compute_available_surfaces(zone)

    active_items: List[SimulatedInterventionItem] = []
    has_nature_based = False
    has_reflective_surface = False

    raw_lst_contributions: List[float] = []
    raw_ambient_contributions: List[float] = []
    total_effective_area_sqm = 0.0

    # Process each selected intervention deterministically in catalog order of selection
    for int_id in selected_intervention_ids:
        item = get_intervention_by_id(int_id)
        if not item:
            continue

        target_surface = item.target_surface
        surface_cap = available_surfaces.get(target_surface, zone_area_sqm * 0.10)

        requested_area = item.typical_area_sqm or 10_000.0
        effective_area = min(requested_area, surface_cap)
        constraint_passed = (requested_area <= surface_cap)

        # Scale cost if physical area is constrained
        area_scale = effective_area / requested_area if requested_area > 0 else 1.0
        base_cost = item.cost_inr_lakhs or 10.0
        allocated_cost = round(base_cost * area_scale, 2)

        # Categorical synergies tracking
        if item.category in (InterventionCategory.NATURE_BASED, InterventionCategory.URBAN_DESIGN):
            has_nature_based = True
        if item.category in (InterventionCategory.MATERIAL_ENGINEERING, InterventionCategory.EMERGENCY_COOLING):
            has_reflective_surface = True

        # Localized parcel impacts
        area_fraction = effective_area / zone_area_sqm if zone_area_sqm > 0 else 0.0
        local_lst = round(item.cooling_potential_c * min(1.0, 4.0 * area_fraction), 2)
        local_ambient = round(item.air_temp_reduction_c * min(1.0, 3.0 * area_fraction), 2)

        raw_lst_contributions.append(local_lst)
        raw_ambient_contributions.append(local_ambient)
        total_effective_area_sqm += effective_area

        active_items.append(
            SimulatedInterventionItem(
                id=item.id,
                name=item.name,
                category=item.category.value,
                target_surface=item.target_surface,
                cost_inr_lakhs=allocated_cost,
                implementation_area_sqm=round(effective_area, 1),
                implementation_area_hectares=round(effective_area / 10_000.0, 2),
                surface_constraint_checked=constraint_passed,
                estimated_lst_drop_c=local_lst,
                estimated_ambient_drop_c=local_ambient,
                phase=item.phase or "Phase 2: Intermediate Rollout",
                timeframe=item.timeframe or "3 – 6 Months",
                co_benefits=item.co_benefits,
            )
        )

    # 1. Budget metrics
    total_cost_lakhs = round(sum(i.cost_inr_lakhs for i in active_items), 2)
    remaining_budget = round(budget_inr_lakhs - total_cost_lakhs, 2)
    is_exceeded = total_cost_lakhs > budget_inr_lakhs
    deficit_lakhs = round(max(0.0, total_cost_lakhs - budget_inr_lakhs), 2)
    budget_utilization = round((total_cost_lakhs / budget_inr_lakhs) * 100.0, 1) if budget_inr_lakhs > 0 else 0.0

    # 2. Cooling metrics with diminishing returns
    num_items = len(active_items)
    if num_items > 0:
        # LST: localized surface cooling with minor spatial dispersion penalty
        lst_sum = sum(raw_lst_contributions)
        lst_dispersion_damping = max(0.70, 1.0 - 0.04 * (num_items - 1))
        modeled_lst = round(min(6.5, lst_sum * lst_dispersion_damping), 2)

        # Ambient air (2m urban canopy layer): non-linear saturation curve
        sum_k = sum(raw_ambient_contributions)
        ambient_base = AMBIENT_COOLING_SATURATION_CEILING_C * (
            1.0 - math.exp(-sum_k / AMBIENT_COOLING_SATURATION_CEILING_C)
        )

        # Microclimate synergy coupling bonus
        if has_nature_based and has_reflective_surface:
            synergy_c = round(0.20 * (1.0 - math.exp(-num_items / 2.0)), 2)
        else:
            synergy_c = 0.0

        modeled_ambient = round(min(2.8, ambient_base + synergy_c), 2)
    else:
        modeled_lst = 0.0
        modeled_ambient = 0.0
        synergy_c = 0.0

    # 3. Spatial and demographic coverage
    total_hectares = round(total_effective_area_sqm / 10_000.0, 2)
    coverage_pct = round(min(100.0, (total_effective_area_sqm / zone_area_sqm) * 100.0), 1) if zone_area_sqm > 0 else 0.0

    pop_coverage_factor = min(1.0, (total_effective_area_sqm / zone_area_sqm) * 2.2) if zone_area_sqm > 0 else 0.0
    population_benefited = round(zone.demographics.total_population * pop_coverage_factor) if num_items > 0 else 0

    # 4. Phased Roadmap grouping
    phased_map: Dict[str, List[str]] = {}
    for item in active_items:
        phase_key = item.phase
        if phase_key not in phased_map:
            phased_map[phase_key] = []
        phased_map[phase_key].append(f"{item.name} (₹{item.cost_inr_lakhs:.1f}L, {item.timeframe})")

    # 5. Scientific Assumptions & Audit
    assumptions = [
        "Costs reflect standard Indian municipal public works schedule of rates for urban heat retrofits (INR Lakhs).",
        "Implementation footprints are bounded by zone-specific land cover fractions (imperviousness, building density, tree canopy deficit).",
        f"Ambient air temperature (2m UCL) is modeled using asymptotic diminishing returns (ceiling = {AMBIENT_COOLING_SATURATION_CEILING_C}°C) to capture boundary layer atmospheric mixing.",
        "Microclimate synergy bonus (+0.10°C to +0.20°C) is credited when nature-based and high-albedo material interventions are co-deployed.",
        "Population protected represents daytime residential and transit foot-traffic exposure within the intervention coverage radius.",
    ]

    return SimulationResponse(
        zone_id=zone.id,
        zone_name=zone.name,
        budget_inr_lakhs=round(budget_inr_lakhs, 2),
        total_cost_inr_lakhs=total_cost_lakhs,
        remaining_budget_inr_lakhs=remaining_budget,
        budget_utilization_pct=budget_utilization,
        is_budget_exceeded=is_exceeded,
        deficit_inr_lakhs=deficit_lakhs,
        modeled_lst_reduction_c=modeled_lst,
        modeled_ambient_reduction_c=modeled_ambient,
        synergy_factor_c=synergy_c,
        total_implementation_area_sqm=round(total_effective_area_sqm, 1),
        total_implementation_area_hectares=total_hectares,
        zone_area_coverage_pct=coverage_pct,
        population_benefited=population_benefited,
        active_interventions=active_items,
        phased_roadmap=phased_map,
        assumptions=assumptions,
        provenance="Modelled estimate under stated assumptions; not field-validated.",
        classification=DataClassification.SIMULATED,
    )
