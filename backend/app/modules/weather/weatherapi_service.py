"""WeatherAPI Service for THERMOS.

Integrates authoritative live atmospheric telemetry from WeatherAPI.com:
- temperature_c: Ambient air temperature (°C)
- humidity: Relative humidity (%)
- wind_kph: Wind speed (km/h)
- feelslike_c: Apparent / perceived temperature (°C)
- heatindex_c: Bioclimatic heat index (°C)
- condition.text: Textual weather condition (e.g. Sunny, Partly cloudy)

Architecture & Reliability:
- Priority order:
    1. WeatherAPI.com (Primary)
    2. Cached weather telemetry (Secondary)
    3. Baseline climatic fallback (Last resort)
- Cache duration: 15 minutes (900 seconds)
- Graceful degradation: Automatic fallback to cached weather data on failure.
- Provider Metadata:
    data_source = "WeatherAPI + NASA FIRMS + OpenStreetMap"
- Credentials: Read dynamically from .env (WEATHERAPI_KEY). Never hardcoded.
"""
import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import httpx

from backend.app.core.config import PROJECT_ROOT, settings
from backend.app.schemas.weather import CurrentWeatherResponse

logger = logging.getLogger(__name__)

CACHE_FILE_PATH = PROJECT_ROOT / "data" / "cache" / "weather_cache.json"
CACHE_TTL_SECONDS = 900.0  # 15 minutes
DATA_SOURCE_METADATA = "WeatherAPI + NASA FIRMS + OpenStreetMap"


def calculate_heat_index(temp_c: float, rh_pct: float) -> Tuple[float, str]:
    """Calculate Rothfusz Heat Index / Apparent Temperature and classify bioclimatic stress."""
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


class WeatherAPIService:
    """Service client fetching live meteorological conditions from WeatherAPI.com."""

    BASE_URL = "https://api.weatherapi.com/v1/current.json"
    TIMEOUT_SECONDS = 10.0
    RETRIES = 3
    BACKOFF_BASE = 1.0
    CACHE_DURATION_SECONDS = 900.0  # 15 minutes cache

    def __init__(self, cache_path: Optional[Path] = None):
        self.cache_path = cache_path or CACHE_FILE_PATH
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)

    def _get_api_key(self) -> str:
        """Read API key from environment variable or settings. Never hardcoded."""
        key = os.getenv("WEATHERAPI_KEY", "").strip()
        if not key and hasattr(settings, "weatherapi_key"):
            key = settings.weatherapi_key.strip()
        return key

    def _is_cache_fresh(self, cached: Dict[str, Any]) -> bool:
        """Check if cached weather data was retrieved within the 15-minute TTL window."""
        cached_at = cached.get("cached_at")
        if cached_at and isinstance(cached_at, (int, float)):
            return (time.time() - cached_at) < self.CACHE_DURATION_SECONDS
        return False

    def _format_weather_dict(
        self,
        raw_api_data: Dict[str, Any],
        latitude: float,
        longitude: float,
        source: str = DATA_SOURCE_METADATA,
    ) -> Dict[str, Any]:
        """Format raw WeatherAPI.com JSON extracting all 6 required fields:
        
        - temperature_c
        - humidity
        - wind_kph
        - feelslike_c
        - heatindex_c
        - condition.text
        """
        current = raw_api_data.get("current", {})
        location = raw_api_data.get("location", {})

        temp_c = float(current.get("temp_c", 31.5))
        humidity = float(current.get("humidity", 72.0))
        wind_kph = float(current.get("wind_kph", 14.0))
        wind_degree = float(current.get("wind_degree", 115.0))

        # Extract condition.text
        condition_obj = current.get("condition", {})
        if isinstance(condition_obj, dict):
            condition_text = condition_obj.get("text", "Partly cloudy")
        else:
            condition_text = str(condition_obj)

        feelslike_c = float(current.get("feelslike_c", temp_c))

        # Calculate heat index (fallback to NOAA formula if WeatherAPI heatindex_c is null/omitted)
        calculated_hi, stress = calculate_heat_index(temp_c, humidity)
        raw_heatindex = current.get("heatindex_c")
        heatindex_c = float(raw_heatindex) if raw_heatindex is not None else calculated_hi

        last_updated = str(current.get("last_updated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")))

        lat = round(latitude, 3)
        lon = round(longitude, 3)

        return {
            # 6 core requested fields
            "temperature_c": temp_c,
            "humidity": humidity,
            "wind_kph": wind_kph,
            "feelslike_c": feelslike_c,
            "heatindex_c": heatindex_c,
            "condition": condition_text,
            "condition_text": condition_text,
            # Supporting meteorological telemetry
            "wind_degree": wind_degree,
            "last_updated": last_updated,
            "data_source": DATA_SOURCE_METADATA,
            "source": source,
            "provider_metadata": {
                "provider": "WeatherAPI.com",
                "data_source": DATA_SOURCE_METADATA,
                "cache_duration_minutes": 15,
            },
            # Backward compatibility aliases
            "temperature": temp_c,
            "wind_speed": wind_kph,
            "wind_direction": wind_degree,
            "heat_index_c": heatindex_c,
            "bioclimatic_stress": stress,
            "latitude": lat,
            "longitude": lon,
            "timestamp": last_updated,
        }

    def _save_cache(self, weather_data: Dict[str, Any]) -> None:
        """Persist weather response into cache file with timestamp and 15-minute TTL."""
        try:
            cache_payload = {
                **weather_data,
                "cached_at": time.time(),
                "cached_iso": datetime.now(timezone.utc).isoformat(),
                "cache_ttl_seconds": self.CACHE_DURATION_SECONDS,
                "data_source": DATA_SOURCE_METADATA,
            }
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(cache_payload, f, indent=2)
        except Exception as exc:
            logger.warning(f"Failed to write weather cache: {exc}")

    def _load_cache(self) -> Optional[Dict[str, Any]]:
        """Load cached weather data from file."""
        if not self.cache_path.exists():
            return None
        try:
            with open(self.cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            temp = float(data.get("temperature_c", data.get("temperature", 31.5)))
            rh = float(data.get("humidity", data.get("relative_humidity_pct", 72.0)))
            ws = float(data.get("wind_kph", data.get("wind_speed_kmh", data.get("wind_speed", 14.0))))
            wd = float(data.get("wind_degree", data.get("wind_direction_deg", data.get("wind_direction", 115.0))))
            cond = str(data.get("condition", data.get("weather_condition", "Partly Cloudy (Cached)")))
            cond_text = str(data.get("condition_text", cond))
            feels = float(data.get("feelslike_c", temp))
            calc_hi, stress = calculate_heat_index(temp, rh)
            raw_hi = data.get("heatindex_c", data.get("heat_index_c"))
            hi = float(raw_hi) if raw_hi is not None else calc_hi
            updated = str(data.get("last_updated", data.get("timestamp", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"))))

            lat = float(data.get("latitude", data.get("station_lat", 13.0827)))
            lon = float(data.get("longitude", data.get("station_lon", 80.2707)))

            return {
                "temperature_c": temp,
                "humidity": rh,
                "wind_kph": ws,
                "feelslike_c": feels,
                "heatindex_c": hi,
                "condition": cond,
                "condition_text": cond_text,
                "wind_degree": wd,
                "last_updated": updated,
                "data_source": DATA_SOURCE_METADATA,
                "source": "WeatherAPI.com Cached Data",
                "cached_at": data.get("cached_at", time.time()),
                "temperature": temp,
                "wind_speed": ws,
                "wind_direction": wd,
                "heat_index_c": hi,
                "bioclimatic_stress": stress,
                "latitude": round(lat, 3),
                "longitude": round(lon, 3),
                "timestamp": updated,
            }
        except Exception as exc:
            logger.warning(f"Failed to read weather cache: {exc}")
            return None

    def _get_baseline_fallback(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Climatic baseline fallback for Chennai urban agglomeration (last resort)."""
        temp_c = 31.5
        rh = 72.0
        wind_kph = 14.0
        wind_deg = 115.0
        hi_c, stress = calculate_heat_index(temp_c, rh)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

        return {
            "temperature_c": temp_c,
            "humidity": rh,
            "wind_kph": wind_kph,
            "feelslike_c": hi_c,
            "heatindex_c": hi_c,
            "condition": "Humid Coastal Baseline",
            "condition_text": "Humid Coastal Baseline",
            "wind_degree": wind_deg,
            "last_updated": now_str,
            "data_source": DATA_SOURCE_METADATA,
            "source": "Climatic Baseline (Fallback)",
            "temperature": temp_c,
            "wind_speed": wind_kph,
            "wind_direction": wind_deg,
            "heat_index_c": hi_c,
            "bioclimatic_stress": stress,
            "latitude": round(latitude, 3),
            "longitude": round(longitude, 3),
            "timestamp": now_str,
        }

    def _fetch_from_api_sync(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Perform synchronous HTTP GET to WeatherAPI.com with timeout and retry with exponential backoff."""
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError("WEATHERAPI_KEY environment variable is not set or empty")

        url = self.BASE_URL
        params = {
            "key": api_key,
            "q": f"{latitude},{longitude}",
            "aqi": "no",
        }

        last_error = None
        for attempt in range(self.RETRIES):
            try:
                with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
                    response = client.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code in (401, 403):
                        raise ValueError(f"WeatherAPI Authentication Error (HTTP {response.status_code}): {response.text}")
                    else:
                        response.raise_for_status()
            except ValueError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < self.RETRIES - 1:
                    backoff = self.BACKOFF_BASE * (2 ** attempt)
                    time.sleep(backoff)

        raise RuntimeError(f"WeatherAPI request failed after {self.RETRIES} attempts: {last_error}")

    async def _fetch_from_api_async(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Perform asynchronous HTTP GET to WeatherAPI.com with timeout and retry with exponential backoff."""
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError("WEATHERAPI_KEY environment variable is not set or empty")

        url = self.BASE_URL
        params = {
            "key": api_key,
            "q": f"{latitude},{longitude}",
            "aqi": "no",
        }

        last_error = None
        for attempt in range(self.RETRIES):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
                    response = await client.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code in (401, 403):
                        raise ValueError(f"WeatherAPI Authentication Error (HTTP {response.status_code}): {response.text}")
                    else:
                        response.raise_for_status()
            except ValueError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < self.RETRIES - 1:
                    backoff = self.BACKOFF_BASE * (2 ** attempt)
                    await asyncio.sleep(backoff)

        raise RuntimeError(f"WeatherAPI request failed after {self.RETRIES} attempts: {last_error}")

    def get_current_weather(
        self,
        latitude: float = 13.0827,
        longitude: float = 80.2707,
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        """Fetch current weather with 15-minute cache and graceful fallback:
        
        1. If cache is fresh (< 15 mins) and not force_refresh: return cache.
        2. Attempt live WeatherAPI.com.
        3. If live API succeeds: save to cache (15-min TTL) and return.
        4. If live API fails: gracefully fall back to cached weather data (even if expired).
        5. If cache is unavailable: fall back to baseline.
        """
        if not force_refresh:
            cached = self._load_cache()
            if cached is not None and self._is_cache_fresh(cached):
                return cached

        # 1. Primary: WeatherAPI
        try:
            raw_data = self._fetch_from_api_sync(latitude, longitude)
            formatted = self._format_weather_dict(
                raw_data,
                latitude,
                longitude,
                source=DATA_SOURCE_METADATA,
            )
            self._save_cache(formatted)
            return formatted
        except Exception as err:
            logger.warning(f"Primary provider (WeatherAPI) failed: {err}. Falling back to cached data.")

        # 2. Secondary: Cached weather data (graceful fallback)
        cached = self._load_cache()
        if cached is not None:
            return cached

        # 3. Last resort: Baseline fallback
        logger.warning("Secondary provider (Cache) unavailable. Using baseline fallback.")
        return self._get_baseline_fallback(latitude, longitude)

    async def get_current_weather_async(
        self,
        latitude: float = 13.0827,
        longitude: float = 80.2707,
        force_refresh: bool = False,
    ) -> CurrentWeatherResponse:
        """Asynchronous entrypoint returning CurrentWeatherResponse following priority order and 15-min cache."""
        if not force_refresh:
            cached = self._load_cache()
            if cached is not None and self._is_cache_fresh(cached):
                return CurrentWeatherResponse(**cached)

        # 1. Primary: WeatherAPI
        try:
            raw_data = await self._fetch_from_api_async(latitude, longitude)
            formatted = self._format_weather_dict(
                raw_data,
                latitude,
                longitude,
                source=DATA_SOURCE_METADATA,
            )
            self._save_cache(formatted)
            return CurrentWeatherResponse(**formatted)
        except Exception as err:
            logger.warning(f"Primary provider (WeatherAPI) async failed: {err}. Falling back to cache.")

        # 2. Secondary: Cached weather data
        cached = self._load_cache()
        if cached is not None:
            return CurrentWeatherResponse(**cached)

        # 3. Last resort: Baseline fallback
        logger.warning("Secondary provider (Cache) unavailable. Using baseline fallback.")
        fallback = self._get_baseline_fallback(latitude, longitude)
        return CurrentWeatherResponse(**fallback)


weatherapi_service = WeatherAPIService()
