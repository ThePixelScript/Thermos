"""Production Weather & Global Location Provider for THERMOS.

Integrates:
1. OpenStreetMap Nominatim for forward & reverse geocoding
2. WeatherAPI.com for global real-time atmospheric telemetry

Key Features:
- Location-driven: Works anywhere on Earth. Zero hardcoded coordinates.
- Caching:
    - Nominatim geocoding: data/cache/geocoding/
    - WeatherAPI per-coordinate cache: data/cache/weather/{lat}_{lon}.json (30-minute TTL)
- Resilient:
    - 10s timeout, 3 retries with exponential backoff
    - Custom User-Agent for Nominatim compliance
    - Graceful fallback to cached weather if API fails
    - Baseline fallback if completely offline
- Credentials: Read dynamically from WEATHER_API_KEY / WEATHERAPI_KEY. Never hardcoded.
"""
import asyncio
import hashlib
import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx

from backend.app.core.config import PROJECT_ROOT, settings

logger = logging.getLogger(__name__)

CACHE_DIR_WEATHER = PROJECT_ROOT / "data" / "cache" / "weather"
CACHE_DIR_GEOCODING = PROJECT_ROOT / "data" / "cache" / "geocoding"
WEATHER_CACHE_TTL_SECONDS = 1800.0  # 30 minutes
GEOCODING_CACHE_TTL_SECONDS = 86400.0 * 7  # 7 days for geographic coordinates

DATA_SOURCE_METADATA = "WeatherAPI + NASA FIRMS + OpenStreetMap"
NOMINATIM_USER_AGENT = "THERMOS-Global-Location-Intelligence/2.0 (contact: admin@thermos.org)"


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


class WeatherProvider:
    """Production provider integrating Nominatim geocoding and WeatherAPI.com."""

    NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
    NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
    WEATHER_URL = "https://api.weatherapi.com/v1/current.json"

    TIMEOUT_SECONDS = 10.0
    RETRIES = 3
    BACKOFF_BASE = 1.0

    def __init__(
        self,
        weather_cache_dir: Optional[Path] = None,
        geocoding_cache_dir: Optional[Path] = None,
    ):
        self.weather_cache_dir = weather_cache_dir or CACHE_DIR_WEATHER
        self.geocoding_cache_dir = geocoding_cache_dir or CACHE_DIR_GEOCODING
        self.weather_cache_dir.mkdir(parents=True, exist_ok=True)
        self.geocoding_cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_api_key(self) -> str:
        """Read API key from environment variable (WEATHER_API_KEY or WEATHERAPI_KEY). Never hardcoded."""
        key = os.getenv("WEATHER_API_KEY", "").strip() or os.getenv("WEATHERAPI_KEY", "").strip()
        if not key and hasattr(settings, "weatherapi_key"):
            key = settings.weatherapi_key.strip()
        return key

    # -------------------------------------------------------------------------
    # Geocoding: Forward & Reverse (Nominatim OpenStreetMap)
    # -------------------------------------------------------------------------
    def _hash_slug(self, text: str) -> str:
        clean = re.sub(r"[^a-zA-Z0-9_-]", "_", text.lower().strip())[:40]
        digest = hashlib.md5(text.lower().strip().encode("utf-8")).hexdigest()[:8]
        return f"{clean}_{digest}"

    def get_coordinates(self, place_name: str) -> List[Dict[str, Any]]:
        """Convert place name to latitude/longitude using OpenStreetMap Nominatim with caching."""
        if not place_name or not place_name.strip():
            return []

        query = place_name.strip()
        cache_key = f"search_{self._hash_slug(query)}.json"
        cache_file = self.geocoding_cache_dir / cache_key

        # Check local cache
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if time.time() - data.get("cached_at", 0) < GEOCODING_CACHE_TTL_SECONDS:
                        return data.get("results", [])
            except Exception:
                pass

        headers = {"User-Agent": NOMINATIM_USER_AGENT}
        params = {
            "q": query,
            "format": "jsonv2",
            "limit": 5,
            "addressdetails": 1,
        }

        results: List[Dict[str, Any]] = []
        for attempt in range(self.RETRIES):
            try:
                with httpx.Client(timeout=self.TIMEOUT_SECONDS, headers=headers) as client:
                    resp = client.get(self.NOMINATIM_SEARCH_URL, params=params)
                    if resp.status_code == 200:
                        raw = resp.json()
                        for item in raw:
                            try:
                                lat = float(item["lat"])
                                lon = float(item["lon"])
                                bbox_raw = item.get("boundingbox", [])
                                bbox = [float(b) for b in bbox_raw] if len(bbox_raw) == 4 else None
                                display_name = item.get("display_name", query)
                                name = item.get("name") or display_name.split(",")[0]
                                results.append({
                                    "name": name,
                                    "display_name": display_name,
                                    "lat": lat,
                                    "lon": lon,
                                    "bbox": bbox,
                                    "type": item.get("type"),
                                    "category": item.get("category"),
                                    "importance": item.get("importance", 0.0),
                                    "source": "Nominatim OpenStreetMap",
                                })
                            except (ValueError, KeyError):
                                continue
                        # Cache positive results
                        if results:
                            try:
                                with open(cache_file, "w", encoding="utf-8") as f:
                                    json.dump({"cached_at": time.time(), "results": results}, f, indent=2)
                            except Exception:
                                pass
                        return results
            except Exception as err:
                logger.warning(f"Nominatim search attempt {attempt+1} failed: {err}")
                if attempt < self.RETRIES - 1:
                    time.sleep(self.BACKOFF_BASE * (2 ** attempt))

        return results

    def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        """Convert latitude/longitude to place name using OpenStreetMap Nominatim with caching."""
        cache_key = f"rev_{round(lat, 3):.3f}_{round(lon, 3):.3f}.json"
        cache_file = self.geocoding_cache_dir / cache_key

        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if time.time() - data.get("cached_at", 0) < GEOCODING_CACHE_TTL_SECONDS:
                        return data.get("data", {})
            except Exception:
                pass

        headers = {"User-Agent": NOMINATIM_USER_AGENT}
        params = {
            "lat": lat,
            "lon": lon,
            "format": "jsonv2",
        }

        for attempt in range(self.RETRIES):
            try:
                with httpx.Client(timeout=self.TIMEOUT_SECONDS, headers=headers) as client:
                    resp = client.get(self.NOMINATIM_REVERSE_URL, params=params)
                    if resp.status_code == 200:
                        raw = resp.json()
                        display_name = raw.get("display_name", f"Coordinate {lat:.4f}°, {lon:.4f}°")
                        name = raw.get("name") or display_name.split(",")[0]
                        bbox_raw = raw.get("boundingbox", [])
                        bbox = [float(b) for b in bbox_raw] if len(bbox_raw) == 4 else None
                        res = {
                            "name": name,
                            "display_name": display_name,
                            "lat": lat,
                            "lon": lon,
                            "bbox": bbox,
                            "source": "Nominatim OpenStreetMap",
                        }
                        try:
                            with open(cache_file, "w", encoding="utf-8") as f:
                                json.dump({"cached_at": time.time(), "data": res}, f, indent=2)
                        except Exception:
                            pass
                        return res
            except Exception as err:
                logger.warning(f"Nominatim reverse attempt {attempt+1} failed: {err}")
                if attempt < self.RETRIES - 1:
                    time.sleep(self.BACKOFF_BASE * (2 ** attempt))

        # Fallback location object
        return {
            "name": f"Location ({lat:.3f}°, {lon:.3f}°)",
            "display_name": f"Coordinates: {lat:.4f}, {lon:.4f}",
            "lat": lat,
            "lon": lon,
            "bbox": [lat - 0.05, lat + 0.05, lon - 0.05, lon + 0.05],
            "source": "Coordinate Fallback",
        }

    # -------------------------------------------------------------------------
    # Weather Integration: WeatherAPI.com (Per-coordinate 30-minute caching)
    # -------------------------------------------------------------------------
    def _get_weather_cache_file(self, lat: float, lon: float) -> Path:
        filename = f"{round(lat, 2):.2f}_{round(lon, 2):.2f}.json"
        return self.weather_cache_dir / filename

    def _load_weather_cache(self, lat: float, lon: float) -> Optional[Tuple[Dict[str, Any], bool]]:
        """Loads cached weather file. Returns (data, is_valid_fresh)."""
        cache_file = self._get_weather_cache_file(lat, lon)
        if not cache_file.exists():
            return None
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            cached_at = float(data.get("cached_at", 0))
            is_fresh = (time.time() - cached_at) < WEATHER_CACHE_TTL_SECONDS
            return data, is_fresh
        except Exception as err:
            logger.warning(f"Error loading weather cache for ({lat}, {lon}): {err}")
            return None

    def _save_weather_cache(self, lat: float, lon: float, payload: Dict[str, Any]) -> None:
        cache_file = self._get_weather_cache_file(lat, lon)
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as err:
            logger.warning(f"Error writing weather cache for ({lat}, {lon}): {err}")

    def _format_weather_response(
        self,
        raw_api_data: Dict[str, Any],
        lat: float,
        lon: float,
        cached: bool = False,
        stale: bool = False,
    ) -> Dict[str, Any]:
        current = raw_api_data.get("current", {})
        location = raw_api_data.get("location", {})

        temp_c = float(current.get("temp_c", 31.5))
        feelslike_c = float(current.get("feelslike_c", temp_c))
        humidity = float(current.get("humidity", 72.0))
        wind_kph = float(current.get("wind_kph", 14.0))
        wind_degree = float(current.get("wind_degree", 115.0))
        pressure_mb = float(current.get("pressure_mb", 1010.0))
        uv = float(current.get("uv", 5.0))

        condition_obj = current.get("condition", {})
        if isinstance(condition_obj, dict):
            condition_text = condition_obj.get("text", "Partly cloudy")
            condition_icon = condition_obj.get("icon", "")
        else:
            condition_text = str(condition_obj)
            condition_icon = ""

        localtime = str(location.get("localtime", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")))
        last_updated = str(current.get("last_updated", localtime))

        hi_c, stress = calculate_heat_index(temp_c, humidity)
        raw_heatindex = current.get("heatindex_c")
        heatindex_c = float(raw_heatindex) if raw_heatindex is not None else hi_c

        data_obj = {
            "temperature_c": temp_c,
            "feelslike_c": feelslike_c,
            "humidity": humidity,
            "wind_kph": wind_kph,
            "wind_degree": wind_degree,
            "pressure_mb": pressure_mb,
            "uv": uv,
            "heatindex_c": heatindex_c,
            "condition": {
                "text": condition_text,
                "icon": condition_icon,
            },
            "localtime": localtime,
            "last_updated": last_updated,
        }

        return {
            "source": DATA_SOURCE_METADATA,
            "cached": cached,
            "stale": stale,
            "last_updated": last_updated,
            "data": data_obj,
            # Top-level requested fields
            "temperature_c": temp_c,
            "feelslike_c": feelslike_c,
            "humidity": humidity,
            "wind_kph": wind_kph,
            "wind_degree": wind_degree,
            "pressure_mb": pressure_mb,
            "uv": uv,
            "heatindex_c": heatindex_c,
            "condition": condition_text,
            "condition_text": condition_text,
            "condition_icon": condition_icon,
            "localtime": localtime,
            # Legacy compatibility aliases
            "temperature": temp_c,
            "wind_speed": wind_kph,
            "wind_direction": wind_degree,
            "heat_index_c": heatindex_c,
            "bioclimatic_stress": stress,
            "latitude": round(lat, 3),
            "longitude": round(lon, 3),
            "timestamp": last_updated,
            "data_source": DATA_SOURCE_METADATA,
        }

    def _get_baseline_fallback(self, lat: float, lon: float) -> Dict[str, Any]:
        """Climatic baseline fallback when offline and no cache exists."""
        temp_c = 28.5
        rh = 68.0
        wind_kph = 12.0
        hi_c, stress = calculate_heat_index(temp_c, rh)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

        data_obj = {
            "temperature_c": temp_c,
            "feelslike_c": hi_c,
            "humidity": rh,
            "wind_kph": wind_kph,
            "wind_degree": 115.0,
            "pressure_mb": 1012.0,
            "uv": 4.0,
            "heatindex_c": hi_c,
            "condition": {"text": "Climatic Baseline", "icon": ""},
            "localtime": now_str,
            "last_updated": now_str,
        }

        return {
            "source": "Climatic Baseline (Fallback)",
            "cached": False,
            "stale": False,
            "fallback": True,
            "last_updated": now_str,
            "data": data_obj,
            "temperature_c": temp_c,
            "feelslike_c": hi_c,
            "humidity": rh,
            "wind_kph": wind_kph,
            "wind_degree": 115.0,
            "pressure_mb": 1012.0,
            "uv": 4.0,
            "heatindex_c": hi_c,
            "condition": "Climatic Baseline",
            "condition_text": "Climatic Baseline",
            "condition_icon": "",
            "localtime": now_str,
            "temperature": temp_c,
            "wind_speed": wind_kph,
            "wind_direction": 115.0,
            "heat_index_c": hi_c,
            "bioclimatic_stress": stress,
            "latitude": round(lat, 3),
            "longitude": round(lon, 3),
            "timestamp": now_str,
            "data_source": DATA_SOURCE_METADATA,
        }

    def get_current_weather(self, lat: float, lon: float, force_refresh: bool = False) -> Dict[str, Any]:
        """Fetch current weather for any coordinate globally with 30-min per-coordinate cache."""
        lat_rounded = round(lat, 4)
        lon_rounded = round(lon, 4)

        # 1. Check local cache
        cache_entry = self._load_weather_cache(lat_rounded, lon_rounded)
        if cache_entry is not None and not force_refresh:
            data, is_fresh = cache_entry
            if is_fresh:
                return {**data, "cached": True, "stale": False}

        # 2. Try WeatherAPI
        api_key = self._get_api_key()
        if api_key:
            params = {
                "key": api_key,
                "q": f"{lat_rounded},{lon_rounded}",
                "aqi": "yes",
            }
            for attempt in range(self.RETRIES):
                try:
                    with httpx.Client(timeout=self.TIMEOUT_SECONDS) as client:
                        resp = client.get(self.WEATHER_URL, params=params)
                        if resp.status_code == 200:
                            raw_data = resp.json()
                            formatted = self._format_weather_response(
                                raw_data, lat_rounded, lon_rounded, cached=False, stale=False
                            )
                            # Save cache with timestamp
                            cache_payload = {**formatted, "cached_at": time.time()}
                            self._save_weather_cache(lat_rounded, lon_rounded, cache_payload)
                            return formatted
                except Exception as err:
                    logger.warning(f"WeatherAPI attempt {attempt+1} failed for ({lat}, {lon}): {err}")
                    if attempt < self.RETRIES - 1:
                        time.sleep(self.BACKOFF_BASE * (2 ** attempt))

        # 3. Graceful fallback to latest cached file even if stale
        if cache_entry is not None:
            data, _ = cache_entry
            return {**data, "cached": True, "stale": True}

        # 4. Total fallback baseline
        return self._get_baseline_fallback(lat_rounded, lon_rounded)

    async def get_current_weather_async(self, lat: float, lon: float, force_refresh: bool = False) -> Dict[str, Any]:
        """Asynchronous fetch for FastAPI endpoints."""
        lat_rounded = round(lat, 4)
        lon_rounded = round(lon, 4)

        cache_entry = self._load_weather_cache(lat_rounded, lon_rounded)
        if cache_entry is not None and not force_refresh:
            data, is_fresh = cache_entry
            if is_fresh:
                return {**data, "cached": True, "stale": False}

        api_key = self._get_api_key()
        if api_key:
            params = {
                "key": api_key,
                "q": f"{lat_rounded},{lon_rounded}",
                "aqi": "yes",
            }
            for attempt in range(self.RETRIES):
                try:
                    async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
                        resp = await client.get(self.WEATHER_URL, params=params)
                        if resp.status_code == 200:
                            raw_data = resp.json()
                            formatted = self._format_weather_response(
                                raw_data, lat_rounded, lon_rounded, cached=False, stale=False
                            )
                            cache_payload = {**formatted, "cached_at": time.time()}
                            self._save_weather_cache(lat_rounded, lon_rounded, cache_payload)
                            return formatted
                except Exception as err:
                    logger.warning(f"Async WeatherAPI attempt {attempt+1} failed for ({lat}, {lon}): {err}")
                    if attempt < self.RETRIES - 1:
                        await asyncio.sleep(self.BACKOFF_BASE * (2 ** attempt))

        if cache_entry is not None:
            data, _ = cache_entry
            return {**data, "cached": True, "stale": True}

        return self._get_baseline_fallback(lat_rounded, lon_rounded)


# Global singleton instance
weather_provider = WeatherProvider()

# Required module functions matching exact specification
def get_coordinates(place_name: str) -> List[Dict[str, Any]]:
    return weather_provider.get_coordinates(place_name)


def get_current_weather(lat: float, lon: float) -> Dict[str, Any]:
    return weather_provider.get_current_weather(lat, lon)
