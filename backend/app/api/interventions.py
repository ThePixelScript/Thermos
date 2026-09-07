"""Interventions endpoints: cooling catalog and zone-specific estimates."""
from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.schemas.intervention import (
    Intervention,
    InterventionEstimate,
    SimulationRequest,
    SimulationResponse,
)
from backend.app.modules.interventions.catalog import INTERVENTION_CATALOG, get_intervention_by_id
from backend.app.modules.interventions.recommender import recommend_interventions_for_zone
from backend.app.modules.simulation.scenario_engine import simulate_scenario
from backend.app.modules.risk.risk_engine import compute_heat_risk
from backend.app.data.repository import repository

router = APIRouter(prefix="/interventions", tags=["Interventions"])


@router.get("/catalog", response_model=List[Intervention])
def get_catalog() -> List[Intervention]:
    """Retrieve full catalog of evidence-based urban cooling interventions."""
    return INTERVENTION_CATALOG


@router.get("/catalog/{intervention_id}", response_model=Intervention)
def get_intervention(intervention_id: str) -> Intervention:
    """Retrieve specifications for a single cooling intervention."""
    item = get_intervention_by_id(intervention_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Intervention '{intervention_id}' not found")
    return item


@router.get("/recommendations/{zone_id}", response_model=List[InterventionEstimate])
def get_recommendations_for_zone(zone_id: str) -> List[InterventionEstimate]:
    """Calculate site-specific cooling intervention estimates for a target zone."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    
    risk = compute_heat_risk(zone)
    return recommend_interventions_for_zone(zone, risk)


@router.post("/simulate", response_model=SimulationResponse)
def simulate_intervention_scenario(payload: SimulationRequest) -> SimulationResponse:
    """Simulate cooling impact, budget utilization, and implementation phases for a selected portfolio."""
    if payload.budget_inr_lakhs <= 0:
        raise HTTPException(status_code=400, detail="Budget must be greater than zero (₹ Lakhs)")

    zone = repository.get_zone_by_id(payload.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{payload.zone_id}' not found")

    # Validate selected intervention IDs
    for int_id in payload.selected_intervention_ids:
        if not get_intervention_by_id(int_id):
            raise HTTPException(status_code=400, detail=f"Unknown intervention ID '{int_id}'")

    return simulate_scenario(zone, payload.selected_intervention_ids, payload.budget_inr_lakhs)

