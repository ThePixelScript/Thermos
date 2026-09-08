"""FastAPI Router for Phase 4: Predictive Urban Heat Intelligence.

Exposes endpoints:
- GET /api/forecast/hotspots
- GET /api/forecast/citywide
- GET /api/forecast/{zone_id}
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.forecast import (
    CHRIForecast,
    CitywideForecastSummary,
)
from backend.app.data.repository import repository
from backend.app.modules.forecast.forecast_service import heat_forecast_engine

router = APIRouter(prefix="/forecast", tags=["Predictive Urban Heat Intelligence"])


@router.get("/hotspots", response_model=List[CHRIForecast])
def get_forecast_hotspots(
    limit: int = Query(30, ge=1, le=100, description="Maximum number of hotspot zones to return"),
    min_escalation: Optional[str] = Query(None, description="Filter by escalation tier: 'Stable', 'Rising', 'Severe Rise', 'Cooling'"),
) -> List[CHRIForecast]:
    """Retrieve prioritized zones ranked by predicted peak CHRI severity."""
    zones = repository.list_zones()
    return heat_forecast_engine.predict_hotspots_forecast(
        zones=zones,
        limit=limit,
        min_escalation=min_escalation,
    )


@router.get("/citywide", response_model=CitywideForecastSummary)
def get_citywide_forecast() -> CitywideForecastSummary:
    """Retrieve citywide predictive overview across all urban zones."""
    zones = repository.list_zones()
    return heat_forecast_engine.predict_citywide_forecast(zones)


@router.get("/{zone_id}", response_model=CHRIForecast)
def get_zone_forecast(zone_id: str) -> CHRIForecast:
    """Retrieve multi-horizon predictive CHRI projections for a specific urban zone."""
    zone = repository.get_zone_by_id(zone_id) or repository.get_zone_by_id(zone_id.upper())
    if not zone:
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{zone_id}' not found in geospatial registry",
        )
    return heat_forecast_engine.predict_zone_forecast(zone)
