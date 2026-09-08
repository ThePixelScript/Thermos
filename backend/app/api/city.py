"""FastAPI Router for Phase 5: Municipal Decision Intelligence.

Exposes endpoints:
- GET /api/city/overview
- GET /api/city/interventions
- GET /api/city/resources
- GET /api/city/executive-summary
(Dual mounted on /api/v1/city/* and /api/city/*)
"""
from typing import List, Optional, Union, Dict
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.city import (
    CityCommandOverview,
    PriorityIntervention,
    MunicipalAction,
    ResourcePortfolio,
    ExecutiveSummary,
)
from backend.app.data.repository import repository
from backend.app.modules.city.city_service import city_decision_engine, BUDGET_TIERS

router = APIRouter(prefix="/city", tags=["Municipal Decision Intelligence"])


@router.get("/overview", response_model=CityCommandOverview)
def get_city_overview() -> CityCommandOverview:
    """Retrieve citywide executive intelligence metrics across all urban zones."""
    zones = repository.list_zones()
    city_name = repository.city_metadata.get("city", "Chennai Metropolis")
    return city_decision_engine.get_city_command_overview(zones, city_name=city_name)


@router.get("/interventions", response_model=List[PriorityIntervention])
def get_priority_interventions(
    limit: Optional[int] = Query(None, ge=1, le=100, description="Optional maximum number of zones to return"),
    urgency: Optional[str] = Query(None, description="Filter by urgency: IMMEDIATE, URGENT, PLANNED, ROUTINE"),
) -> List[PriorityIntervention]:
    """Retrieve prioritized intervention queue ranked deterministically by priority score."""
    zones = repository.list_zones()
    ranked = city_decision_engine.get_ranked_priority_interventions(zones)

    if urgency:
        ranked = [item for item in ranked if item.urgency.upper() == urgency.upper()]

    if limit:
        ranked = ranked[:limit]

    return ranked


@router.get("/actions", response_model=List[MunicipalAction])
def get_municipal_actions() -> List[MunicipalAction]:
    """Retrieve the catalog of 6 core municipal mitigation actions with target zones and impacts."""
    zones = repository.list_zones()
    return city_decision_engine.generate_municipal_actions(zones)


@router.get("/resources", response_model=Union[ResourcePortfolio, Dict[str, ResourcePortfolio]])
def get_resource_allocation(
    budget_tier: Optional[str] = Query(
        "MEDIUM",
        description="Budget tier: 'LOW' ($500k), 'MEDIUM' ($2.0M), 'HIGH' ($5.0M), or 'ALL'",
    ),
) -> Union[ResourcePortfolio, Dict[str, ResourcePortfolio]]:
    """Compute optimal municipal intervention portfolio under specified budget constraints."""
    zones = repository.list_zones()
    actions = city_decision_engine.generate_municipal_actions(zones)

    if budget_tier and budget_tier.upper() == "ALL":
        return {
            tier: city_decision_engine.optimize_resource_allocation(actions, budget_tier=tier)
            for tier in ["LOW", "MEDIUM", "HIGH"]
        }

    tier = (budget_tier or "MEDIUM").upper()
    if tier not in BUDGET_TIERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid budget tier '{budget_tier}'. Supported tiers: LOW, MEDIUM, HIGH, ALL",
        )

    return city_decision_engine.optimize_resource_allocation(actions, budget_tier=tier)


@router.get("/executive-summary", response_model=ExecutiveSummary)
def get_executive_summary() -> ExecutiveSummary:
    """Retrieve complete executive decision briefing combining KPIs, top priorities, and policy directives."""
    zones = repository.list_zones()
    city_name = repository.city_metadata.get("city", "Chennai Metropolis")
    return city_decision_engine.generate_executive_summary(zones, city_name=city_name)
