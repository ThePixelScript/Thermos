"""THERMOS FastAPI Application Entrypoint.

PS13 — HeatScape: Urban Heat Reduction Planner
Team: CodePulse
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.health import router as health_router
from backend.app.api.zones import router as zones_router
from backend.app.api.hotspots import router as hotspots_router
from backend.app.api.interventions import router as interventions_router
from backend.app.api.weather import router as weather_router
from backend.app.api.chri import router as chri_router
from backend.app.api.raster import router as raster_router
from backend.app.api.forecast import router as forecast_router
from backend.app.api.city import router as city_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.location import router as location_router
from backend.app.data.repository import repository


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure data repository is loaded and verified
    repository.load_data()
    print(f"[{settings.app_name}] Initialized with {len(repository.list_zones())} urban zones.")
    yield
    # Shutdown logic if needed
    print(f"[{settings.app_name}] Shutdown complete.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Urban climate decision-intelligence engine for detecting hotspots and planning heat mitigation interventions.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend development and production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
# Direct health endpoint
app.include_router(health_router)

# Base API routes (/api/zones, /api/hotspots, /api/weather, /api/chri, /api/raster, /api/forecast, /api/city, /api/simulation, etc.)
app.include_router(zones_router, prefix="/api")
app.include_router(hotspots_router, prefix="/api")
app.include_router(interventions_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(chri_router, prefix="/api")
app.include_router(raster_router, prefix="/api")
app.include_router(forecast_router, prefix="/api")
app.include_router(city_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(location_router, prefix="/api")

# Versioned API routes (/api/v1/zones, /api/v1/hotspots, /api/v1/weather, /api/v1/chri, /api/v1/raster, /api/v1/forecast, /api/v1/city, /api/v1/simulation, etc.)
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(zones_router, prefix=settings.api_prefix)
app.include_router(hotspots_router, prefix=settings.api_prefix)
app.include_router(interventions_router, prefix=settings.api_prefix)
app.include_router(weather_router, prefix=settings.api_prefix)
app.include_router(chri_router, prefix=settings.api_prefix)
app.include_router(raster_router, prefix=settings.api_prefix)
app.include_router(forecast_router, prefix=settings.api_prefix)
app.include_router(city_router, prefix=settings.api_prefix)
app.include_router(simulation_router, prefix=settings.api_prefix)
app.include_router(location_router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "zones": f"{settings.api_prefix}/zones",
            "zones_geojson": f"{settings.api_prefix}/zones/geojson",
            "hotspots": f"{settings.api_prefix}/hotspots",
            "interventions": f"{settings.api_prefix}/interventions/catalog",
            "chri_zones": f"{settings.api_prefix}/chri/zones",
            "chri_hotspots": f"{settings.api_prefix}/chri/hotspots",
            "chri_live_zones": f"{settings.api_prefix}/chri/live/zones",
            "chri_live_hotspots": f"{settings.api_prefix}/chri/live/hotspots",
            "chri_live_trends": f"{settings.api_prefix}/chri/live/trends",
            "ndvi_tilejson": f"{settings.api_prefix}/raster/ndvi/tilejson",
            "ndvi_scenes": f"{settings.api_prefix}/raster/ndvi/scenes",
            "ndvi_colormap": f"{settings.api_prefix}/raster/ndvi/colormap",
            "lst_tilejson": f"{settings.api_prefix}/raster/lst/tilejson",
            "lst_scenes": f"{settings.api_prefix}/raster/lst/scenes",
            "lst_colormap": f"{settings.api_prefix}/raster/lst/colormap",
            "forecast_hotspots": f"{settings.api_prefix}/forecast/hotspots",
            "forecast_citywide": f"{settings.api_prefix}/forecast/citywide",
            "city_overview": f"{settings.api_prefix}/city/overview",
            "city_interventions": f"{settings.api_prefix}/city/interventions",
            "city_resources": f"{settings.api_prefix}/city/resources",
            "city_executive_summary": f"{settings.api_prefix}/city/executive-summary",
            "simulation_run": f"{settings.api_prefix}/simulation/run",
            "simulation_compare": f"{settings.api_prefix}/simulation/compare",
            "simulation_citywide": f"{settings.api_prefix}/simulation/citywide",
        },
    }
