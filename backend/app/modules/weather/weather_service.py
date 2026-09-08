"""Weather Service: Ingests live atmospheric conditions from WeatherAPI.com.

Provides real-time ambient temperature, humidity, wind velocity, and computes
bioclimatic heat index indicators.
"""
import time
from typing import Dict, Tuple, Optional
import httpx
from backend.app.schemas.weather import CurrentWeatherResponse


def calculate_heat_index(temp_c: float, rh_pct: float) -> Tuple[float, str]:
    """Calculate Rothfusz Heat Index / Apparent Temperature and classify bioclimatic stress."""
    # Convert Celsius to Fahrenheit for standard NOAA formula
    t_f = (temp_c * 9 / 5) + 32
    rh = rh_pct

    if t_f < 80.0:
        hi_f = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
    else:
        hi_f = (
            -42.379
            + (2.04901523 * t_f)
            + (10.14333127 * rh)
            - (0.22475541 * t_f * rh)
            - (0.00683783 * t_f * t_f)
            - (0.05481717 * rh * rh)
            + (0.00122874 * t_f * t_f * rh)
            + (0.00085282 * t_f * rh * rh)
            - (0.00000199 * t_f * t_f * rh * rh)
        )

    hi_c = round((hi_f - 32) * 5 / 9, 1)

    if hi_c < 27.0:
        stress = "Normal"
    elif hi_c < 32.0:
        stress = "Caution"
    elif hi_c < 41.0:
        stress = "Extreme Caution"
    elif hi_c < 54.0:
        stress = "Danger"
    else:
        stress = "Extreme Danger"

    return hi_c, stress


class WeatherService:
    """Service client fetching live meteorological conditions from WeatherAPI.com (Primary), Cache (Secondary), and Baseline (Fallback)."""

    def __init__(self):
        pass

    async def get_current_weather(
        self,
        latitude: float = 13.0827,
        longitude: float = 80.2707,
    ) -> CurrentWeatherResponse:
        """Fetch current weather according to priority order: WeatherAPI -> Cache -> Fallback."""
        from backend.app.modules.weather.weatherapi_service import weatherapi_service
        return await weatherapi_service.get_current_weather_async(latitude=latitude, longitude=longitude)


weather_service = WeatherService()

