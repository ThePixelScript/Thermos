"""Hotspots endpoints: Ranked city-wide hotspots and detailed analytical dossiers."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.hotspot import HotspotSummary, HotspotDetail
from backend.app.data.repository import repository

router = APIRouter(prefix="/hotspots", tags=["Hotspots"])


@router.get("", response_model=List[HotspotSummary])
def get_all_hotspots(
    min_risk: float = Query(default=30.0, ge=0.0, le=100.0, description="Minimum Composite Heat Risk Index score"),
    min_anomaly: Optional[float] = Query(default=None, description="Minimum thermal anomaly in °C"),
    lat: Optional[float] = Query(default=None, description="Latitude for location-driven hotspots"),
    lon: Optional[float] = Query(default=None, description="Longitude for location-driven hotspots"),
) -> List[HotspotSummary]:
    """Retrieve ranked urban thermal hotspots prioritized by composite heat risk."""
    return repository.list_hotspots(min_risk_score=min_risk, min_anomaly_c=min_anomaly, lat=lat, lon=lon)


@router.get("/{zone_id}", response_model=HotspotDetail)
def get_hotspot_detail(zone_id: str) -> HotspotDetail:
    """Retrieve full hotspot intelligence dossier with explainable driver breakdown and cooling recommendations."""
    detail = repository.get_hotspot_detail(zone_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Hotspot zone '{zone_id}' not found")
    return detail
