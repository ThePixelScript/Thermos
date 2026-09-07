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

# Versioned API routes
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(zones_router, prefix=settings.api_prefix)
app.include_router(hotspots_router, prefix=settings.api_prefix)
app.include_router(interventions_router, prefix=settings.api_prefix)


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
        },
    }
