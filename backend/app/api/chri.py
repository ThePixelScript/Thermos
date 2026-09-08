"""FastAPI Router for Phase 2A CHRI Analytics Engine.

Exposes endpoints:
- GET /api/chri/zones
- GET /api/chri/hotspots
- GET /api/chri/{zone_id}
- GET /api/chri/recommendations/{zone_id}
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.chri import (
    CHRIScore,
    HeatHotspot,
    ZoneRecommendation,
    LiveCHRIScore,
    LiveHeatHotspot,
    HotspotTrendsSummary,
)
from backend.app.data.repository import repository
from backend.app.modules.chri.chri_service import chri_service
from backend.app.modules.chri.recommender import recommendation_engine

router = APIRouter(prefix="/chri", tags=["CHRI Analytics Engine"])


# ---------------------------------------------------------------------------
# Phase 3B: Dynamic Live Raster CHRI Endpoints
# ---------------------------------------------------------------------------

@router.get("/live/zones", response_model=List[LiveCHRIScore])
def get_live_chri_zones(
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Filter zones with live CHRI score >= min_score"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: LOW, MODERATE, HIGH, SEVERE, CRITICAL"),
    trend: Optional[str] = Query(None, description="Filter by trend: emerging, persistent, cooling"),
) -> List[LiveCHRIScore]:
    """Retrieve all urban zones evaluated with dynamic live raster-driven CHRI."""
    zones = repository.list_zones()
    return chri_service.evaluate_live_zones(zones, min_score=min_score, risk_level=risk_level, trend=trend)


@router.get("/live/hotspots", response_model=List[LiveHeatHotspot])
def get_live_chri_hotspots(
    limit: int = Query(30, ge=1, le=100, description="Maximum number of hotspots to return"),
    trend: Optional[str] = Query(None, description="Filter by trend: emerging, persistent, cooling"),
) -> List[LiveHeatHotspot]:
    """Retrieve prioritized real-time heat hotspots ranked by live raster CHRI."""
    zones = repository.list_zones()
    return chri_service.get_live_ranked_hotspots(zones, limit=limit, trend=trend)


@router.get("/live/trends", response_model=HotspotTrendsSummary)
def get_live_hotspot_trends() -> HotspotTrendsSummary:
    """Retrieve citywide thermal trends classifying emerging, persistent, and cooling zones."""
    zones = repository.list_zones()
    return chri_service.get_hotspot_trends_summary(zones)


@router.get("/live/{zone_id}", response_model=LiveCHRIScore)
def get_live_chri_by_zone_id(zone_id: str) -> LiveCHRIScore:
    """Retrieve live satellite-driven CHRI score and raster metrics for a specific zone."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return chri_service.evaluate_live_zone(zone)


# ---------------------------------------------------------------------------
# Phase 2A: Baseline CHRI Endpoints
# ---------------------------------------------------------------------------


@router.get("/zones", response_model=List[CHRIScore])
def get_chri_zones(
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Filter zones with CHRI score >= min_score"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: LOW, MODERATE, HIGH, SEVERE, CRITICAL"),
) -> List[CHRIScore]:
    """Retrieve all urban zones evaluated with the Composite Heat Risk Index (CHRI) and driver attribution."""
    zones = repository.list_zones()
    return chri_service.evaluate_zones(zones, min_score=min_score, risk_level=risk_level)


@router.get("/hotspots", response_model=List[HeatHotspot])
def get_chri_hotspots(
    limit: int = Query(30, ge=1, le=100, description="Maximum number of hotspots to return"),
    min_score: float = Query(30.0, ge=0.0, le=100.0, description="Minimum CHRI score threshold to classify as active hotspot"),
) -> List[HeatHotspot]:
    """Retrieve citywide prioritized heat hotspots ranked in descending order of CHRI severity."""
    zones = repository.list_zones()
    return chri_service.get_ranked_hotspots(zones, min_score=min_score, limit=limit)


@router.get("/{zone_id}", response_model=CHRIScore)
def get_chri_by_zone_id(zone_id: str) -> CHRIScore:
    """Retrieve the comprehensive CHRI score calculation and driver breakdown for a specific zone."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return chri_service.evaluate_zone(zone)


@router.get("/recommendations/{zone_id}", response_model=ZoneRecommendation)
def get_zone_recommendations(zone_id: str) -> ZoneRecommendation:
    """Generate prescriptive urban cooling mitigation recommendations tailored to the zone's dominant drivers."""
    zone = repository.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    
    chri = chri_service.evaluate_zone(zone)
    return recommendation_engine.generate_recommendations(zone, chri)
