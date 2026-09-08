"""Weather API endpoints: Live meteorological conditions from WeatherAPI.com."""
from typing import Optional
from fastapi import APIRouter, Query
from backend.app.schemas.weather import CurrentWeatherResponse
from backend.app.modules.weather.weather_provider import weather_provider

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("", response_model=CurrentWeatherResponse)
@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    lat: Optional[float] = Query(default=None, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lon: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Longitude coordinate"),
    latitude: Optional[float] = Query(default=None, ge=-90.0, le=90.0, description="Legacy latitude alias"),
    longitude: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Legacy longitude alias"),
) -> CurrentWeatherResponse:
    """Fetch live meteorological conditions (temperature, humidity, wind velocity, uv) from WeatherAPI.com."""
    # Resolve coordinate: priority lat/lon -> latitude/longitude -> 13.0827/80.2707
    resolved_lat = lat if lat is not None else (latitude if latitude is not None else 13.0827)
    resolved_lon = lon if lon is not None else (longitude if longitude is not None else 80.2707)

    result_dict = await weather_provider.get_current_weather_async(lat=resolved_lat, lon=resolved_lon)
    return CurrentWeatherResponse(**result_dict)


