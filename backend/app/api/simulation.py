"""FastAPI Router for Phase 6: Urban Climate Digital Twin & Scenario Simulator.

Exposes endpoints:
- GET /api/simulation/zone/{zone_id}
- POST /api/simulation/run
- POST /api/simulation/compare
- GET /api/simulation/citywide
(Dual mounted on /api/v1/simulation/* and /api/simulation/*)
"""
from typing import Optional, Union, Dict
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.simulation import (
    SimulationRequest,
    SimulationResult,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    CitywideSimulationResult,
    ZoneSimulationMetadata,
)
from backend.app.data.repository import repository
from backend.app.modules.simulation.simulator import (
    scenario_simulator_engine,
    BUDGET_CAPS,
)

router = APIRouter(prefix="/simulation", tags=["Urban Climate Digital Twin & Scenario Simulator"])


@router.get("/zone/{zone_id}", response_model=ZoneSimulationMetadata)
def get_zone_simulation_metadata(zone_id: str) -> ZoneSimulationMetadata:
    """Retrieve zone baseline biophysical status and available simulation levers."""
    zone = repository.get_zone_by_id(zone_id) or repository.get_zone_by_id(zone_id.upper())
    if not zone:
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{zone_id}' not found in geospatial registry",
        )
    return scenario_simulator_engine.get_zone_simulation_metadata(zone)


@router.post("/run", response_model=SimulationResult)
def run_simulation(request: SimulationRequest) -> SimulationResult:
    """Simulate counterfactual cooling intervention on a target zone."""
    zone = repository.get_zone_by_id(request.zone_id) or repository.get_zone_by_id(request.zone_id.upper())
    if not zone:
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{request.zone_id}' not found in geospatial registry",
        )
    return scenario_simulator_engine.simulate_zone(zone, request)


@router.post("/compare", response_model=ScenarioComparisonResponse)
def compare_scenarios(request: ScenarioComparisonRequest) -> ScenarioComparisonResponse:
    """Evaluate Baseline vs Scenario A vs Scenario B with side-by-side decision ranking."""
    zone = repository.get_zone_by_id(request.zone_id) or repository.get_zone_by_id(request.zone_id.upper())
    if not zone:
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{request.zone_id}' not found in geospatial registry",
        )
    return scenario_simulator_engine.compare_scenarios(zone, request)


@router.get("/citywide", response_model=Union[CitywideSimulationResult, Dict[str, CitywideSimulationResult]])
def simulate_citywide(
    budget_tier: Optional[str] = Query(
        "MEDIUM",
        description="Budget tier: 'LOW' ($500k), 'MEDIUM' ($2.0M), 'HIGH' ($5.0M), or 'ALL'",
    ),
) -> Union[CitywideSimulationResult, Dict[str, CitywideSimulationResult]]:
    """Estimate citywide digital twin what-if impact across budget portfolios."""
    zones = repository.list_zones()

    if budget_tier and budget_tier.upper() == "ALL":
        return {
            tier: scenario_simulator_engine.simulate_citywide_portfolio(zones, budget_tier=tier)
            for tier in ["LOW", "MEDIUM", "HIGH"]
        }

    tier = (budget_tier or "MEDIUM").upper()
    if tier not in BUDGET_CAPS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid budget tier '{budget_tier}'. Supported tiers: LOW, MEDIUM, HIGH, ALL",
        )

    return scenario_simulator_engine.simulate_citywide_portfolio(zones, budget_tier=tier)
