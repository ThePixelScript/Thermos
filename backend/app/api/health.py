"""System health and runtime status endpoint."""
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.core.config import settings
from backend.app.data.repository import repository

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    zones_loaded: int
    hotspots_count: int
    engine_status: dict


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return backend operational health and analytical engine status."""
    zones = repository.list_zones()
    hotspots = repository.list_hotspots(min_risk_score=50.0)

    return HealthResponse(
        status="healthy",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        zones_loaded=len(zones),
        hotspots_count=len(hotspots),
        engine_status={
            "geospatial": "active",
            "heat_analytics": "active",
            "risk_scoring": "active_deterministic",
            "interventions": "catalog_ready",
            "simulation": "ready_phase_2",
            "optimization": "ready_phase_2",
            "ai_interface": "active_decoupled",
        },
    )
