"""AI & Natural Language Interface Module.

Strictly decoupled translation bridge:
1. Translates natural language planning intents into structured PlanningConstraints.
2. Translates deterministic risk calculations and driver breakdowns into explainable executive narratives.
"""
from typing import Dict, Any, List
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import HeatRiskScore
from backend.app.schemas.intervention import PlanningConstraints, InterventionCategory


def generate_executive_brief(zone: Zone, risk: HeatRiskScore) -> str:
    """Generate a factual, explainable narrative summary for urban planners based solely on deterministic data."""
    top_driver = risk.driver_contributions[0] if risk.driver_contributions else None
    second_driver = risk.driver_contributions[1] if len(risk.driver_contributions) > 1 else None

    lines = [
        f"{zone.name} is currently designated at {risk.risk_level.value} thermal risk with a Composite Heat Risk Index of {risk.score:.1f}/100.",
        f"The primary heat-stress driver is {top_driver.name if top_driver else 'thermal intensity'}, accounting for {top_driver.contribution_pct:.1f}% of the cumulative score."
    ]

    if second_driver:
        lines.append(
            f"Compounding this risk is {second_driver.name} ({second_driver.contribution_pct:.1f}% contribution), with {second_driver.explanation}"
        )

    lines.append(
        f"Observed Land Surface Temperature is {zone.thermal_observation.land_surface_temp_c:.1f}°C ({zone.thermal_observation.thermal_anomaly_c:+.1f}°C vs regional baseline), affecting approximately {zone.demographics.total_population:,} residents and {zone.demographics.outdoor_worker_density_per_sqkm:,} outdoor laborers per square kilometer."
    )

    return " ".join(lines)


def parse_natural_language_intent(query_text: str) -> PlanningConstraints:
    """Parse unstructured user request text into typed, validated PlanningConstraints."""
    query = query_text.lower()
    constraints = PlanningConstraints()

    # Extract budget mentions, e.g. "$500,000", "500k", "1M"
    if "500k" in query or "500,000" in query:
        constraints.max_budget_usd = 500_000.0
    elif "1m" in query or "1,000,000" in query or "1 million" in query:
        constraints.max_budget_usd = 1_000_000.0
    elif "250k" in query or "250,000" in query:
        constraints.max_budget_usd = 250_000.0

    # Extract category preferences
    preferred = []
    if "tree" in query or "canopy" in query or "nature" in query or "green" in query:
        preferred.append(InterventionCategory.NATURE_BASED)
    if "roof" in query or "paint" in query or "coating" in query or "albedo" in query:
        preferred.append(InterventionCategory.MATERIAL_ENGINEERING)
    if "shade" in query or "mist" in query or "transit" in query:
        preferred.append(InterventionCategory.EMERGENCY_COOLING)
    if "park" in query or "square" in query:
        preferred.append(InterventionCategory.URBAN_DESIGN)

    if preferred:
        constraints.preferred_categories = preferred

    return constraints
