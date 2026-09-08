"""Location API Router: Global forward and reverse geocoding via OpenStreetMap Nominatim."""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.modules.weather.weather_provider import weather_provider

router = APIRouter(prefix="/location", tags=["Location"])


@router.get("/search")
def search_location(
    q: str = Query(..., min_length=1, description="Location search term (city, ward, landmark, or address)")
) -> Dict[str, Any]:
    """Resolve location place name to geographic coordinates [lat, lon, bbox] via Nominatim."""
    results = weather_provider.get_coordinates(q)
    return {
        "source": "Nominatim OpenStreetMap",
        "query": q,
        "count": len(results),
        "results": results,
    }


@router.get("/reverse")
def reverse_geocode_location(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate"),
) -> Dict[str, Any]:
    """Resolve latitude/longitude coordinates to place name and administrative boundary."""
    resolved = weather_provider.reverse_geocode(lat, lon)
    return {
        "source": "Nominatim OpenStreetMap",
        "data": resolved,
        **resolved,
    }
