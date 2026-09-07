"""Scenario Simulation Engine: Evaluates counterfactual cooling interventions on urban zones."""
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.schemas.zone import Zone
from backend.app.schemas.risk import HeatRiskScore
from backend.app.schemas.intervention import InterventionEstimate
from backend.app.schemas.common import DataClassification
from backend.app.modules.risk.risk_engine import compute_heat_risk


class SimulationScenarioResult(BaseModel):
    """Result of simulating interventions on an urban zone."""
    zone_id: str
    scenario_name: str
    baseline_lst_c: float
    simulated_lst_c: float
    lst_reduction_c: float
    baseline_risk_score: float
    simulated_risk_score: float
    risk_reduction_pct: float
    total_investment_usd: float
    applied_interventions: List[str]
    classification: DataClassification = Field(default=DataClassification.SIMULATED)


def simulate_intervention_scenario(
    zone: Zone,
    selected_estimates: List[InterventionEstimate],
    scenario_name: str = "Standard Heat Mitigation Scenario",
) -> SimulationScenarioResult:
    """Evaluate counterfactual thermal and risk delta after deploying interventions."""
    baseline_risk = compute_heat_risk(zone)
    baseline_lst = zone.thermal_observation.land_surface_temp_c

    total_cooling_delta = 0.0
    total_cost = 0.0
    intervention_names = []

    # Calculate compounded cooling with diminishing marginal returns
    for est in selected_estimates:
        total_cooling_delta += est.expected_local_lst_reduction_c
        total_cost += est.estimated_total_cost_usd
        intervention_names.append(est.intervention_name)

    # Diminishing returns factor: cooling cannot exceed 8.0°C in aggregate
    effective_cooling = min(8.0, total_cooling_delta * 0.85)
    simulated_lst = max(26.0, round(baseline_lst - effective_cooling, 2))

    # Construct counterfactual modified zone copy
    counterfactual_zone = zone.model_copy(deep=True)
    counterfactual_zone.thermal_observation.land_surface_temp_c = simulated_lst
    counterfactual_zone.thermal_observation.thermal_anomaly_c = round(
        simulated_lst - zone.thermal_observation.baseline_temp_c, 2
    )

    simulated_risk = compute_heat_risk(counterfactual_zone)
    risk_delta = baseline_risk.score - simulated_risk.score
    risk_reduction_pct = round((risk_delta / baseline_risk.score) * 100.0, 1) if baseline_risk.score > 0 else 0.0

    return SimulationScenarioResult(
        zone_id=zone.id,
        scenario_name=scenario_name,
        baseline_lst_c=baseline_lst,
        simulated_lst_c=simulated_lst,
        lst_reduction_c=round(effective_cooling, 2),
        baseline_risk_score=baseline_risk.score,
        simulated_risk_score=simulated_risk.score,
        risk_reduction_pct=risk_reduction_pct,
        total_investment_usd=round(total_cost, 0),
        applied_interventions=intervention_names,
        classification=DataClassification.SIMULATED,
    )
