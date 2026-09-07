"""API routers package."""
from backend.app.api.health import router as health_router
from backend.app.api.zones import router as zones_router
from backend.app.api.hotspots import router as hotspots_router
from backend.app.api.interventions import router as interventions_router

__all__ = [
    "health_router",
    "zones_router",
    "hotspots_router",
    "interventions_router",
]
