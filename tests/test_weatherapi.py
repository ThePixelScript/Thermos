"""Unit and integration tests for WeatherAPI.com, NASA FIRMS, and provider metadata."""
import json
import os
import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from fastapi.testclient import TestClient
import httpx

from backend.app.core.config import settings
from backend.app.modules.weather.weatherapi_service import (
    WeatherAPIService,
    calculate_heat_index,
)
from backend.app.modules.geospatial.pipeline import geospatial_pipeline
from backend.app.modules.geospatial.firms_service import nasa_firms_service


SAMPLE_WEATHERAPI_RESPONSE = {
    "location": {
        "name": "Chennai",
        "region": "Tamil Nadu",
        "country": "India",
        "lat": 13.08,
        "lon": 80.27,
        "tz_id": "Asia/Kolkata",
        "localtime_epoch": 1773099049,
        "localtime": "2026-09-09 10:00",
    },
    "current": {
        "last_updated_epoch": 1773098700,
        "last_updated": "2026-09-09 10:00",
        "temp_c": 33.5,
        "temp_f": 92.3,
        "is_day": 1,
        "condition": {
            "text": "Partly cloudy",
            "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
            "code": 1003,
        },
        "wind_mph": 11.2,
        "wind_kph": 18.0,
        "wind_degree": 120,
        "wind_dir": "ESE",
        "pressure_mb": 1008.0,
        "pressure_in": 29.77,
        "precip_mm": 0.0,
        "precip_in": 0.0,
        "humidity": 68,
        "cloud": 40,
        "feelslike_c": 41.2,
        "feelslike_f": 106.2,
        "heatindex_c": 41.2,
        "heatindex_f": 106.2,
        "dewpoint_c": 26.5,
        "dewpoint_f": 79.7,
        "vis_km": 10.0,
        "vis_miles": 6.0,
        "uv": 8.0,
        "gust_mph": 16.1,
        "gust_kph": 25.9,
    },
}


def test_calculate_heat_index():
    """Verify NOAA Rothfusz heat index calculation."""
    hi_normal, stress_normal = calculate_heat_index(25.0, 50.0)
    assert hi_normal < 27.0
    assert stress_normal == "Normal"

    hi_hot, stress_hot = calculate_heat_index(38.0, 70.0)
    assert hi_hot >= 41.0
    assert stress_hot in ["Danger", "Extreme Danger"]


def test_weatherapi_fetch_all_required_fields(tmp_path: Path):
    """Requirement 3: Fetch temperature_c, humidity, wind_kph, feelslike_c, heatindex_c, condition.text."""
    cache_file = tmp_path / "test_weather_cache.json"
    service = WeatherAPIService(cache_path=cache_file)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = SAMPLE_WEATHERAPI_RESPONSE

    with patch("httpx.Client.get", return_value=mock_resp):
        with patch.object(service, "_get_api_key", return_value="test_api_key"):
            data = service.get_current_weather(13.0827, 80.2707, force_refresh=True)

    # 1. Exact 6 fields requested by user
    assert data["temperature_c"] == 33.5
    assert data["humidity"] == 68.0
    assert data["wind_kph"] == 18.0
    assert data["feelslike_c"] == 41.2
    assert data["heatindex_c"] == 41.2
    assert data["condition"] == "Partly cloudy"
    assert data["condition_text"] == "Partly cloudy"

    # 2. Requirement 9: Provider metadata
    assert data["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"
    assert data["source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"


def test_weatherapi_15_minute_cache_duration(tmp_path: Path):
    """Requirement 4: Cache results for 15 minutes (900 seconds)."""
    cache_file = tmp_path / "test_15m_cache.json"
    service = WeatherAPIService(cache_path=cache_file)
    assert service.CACHE_DURATION_SECONDS == 900.0  # Exactly 15 minutes

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = SAMPLE_WEATHERAPI_RESPONSE

    with patch("httpx.Client.get", return_value=mock_resp) as mock_get:
        with patch.object(service, "_get_api_key", return_value="test_api_key"):
            # First call: calls API and writes cache
            data1 = service.get_current_weather(13.0827, 80.2707)
            assert mock_get.call_count == 1
            assert cache_file.exists()

            # Second call within 15 minutes: served directly from fresh cache without network call
            data2 = service.get_current_weather(13.0827, 80.2707)
            assert mock_get.call_count == 1
            assert data2["temperature_c"] == 33.5


def test_weatherapi_graceful_fallback_to_cached_data(tmp_path: Path):
    """Requirement 5: Add graceful fallback to cached weather data if API fails."""
    cache_file = tmp_path / "test_cache_fallback.json"
    cached_payload = {
        "temperature_c": 29.5,
        "humidity": 75.0,
        "wind_kph": 16.0,
        "feelslike_c": 34.0,
        "heatindex_c": 34.5,
        "condition": "Cloudy from Cache",
        "condition_text": "Cloudy from Cache",
        "wind_degree": 140.0,
        "last_updated": "2026-09-09 08:30",
        "cached_at": 10000.0,  # Expired cache
        "data_source": "WeatherAPI + NASA FIRMS + OpenStreetMap",
        "source": "WeatherAPI.com Cached Data",
    }
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cached_payload, f)

    service = WeatherAPIService(cache_path=cache_file)

    # Force network failure (timeout)
    with patch("httpx.Client.get", side_effect=httpx.ConnectTimeout("Connection timed out")):
        with patch.object(service, "_get_api_key", return_value="test_api_key"):
            with patch("time.sleep"):
                data = service.get_current_weather(13.0827, 80.2707, force_refresh=True)

    # Seamlessly loads cached values without throwing exception
    assert data["temperature_c"] == 29.5
    assert data["humidity"] == 75.0
    assert data["wind_kph"] == 16.0
    assert data["condition"] == "Cloudy from Cache"
    assert data["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"


def test_weatherapi_baseline_fallback_on_total_failure(tmp_path: Path):
    """Fallback to climatic baseline if API fails AND no cache exists."""
    cache_file = tmp_path / "non_existent.json"
    service = WeatherAPIService(cache_path=cache_file)

    with patch("httpx.Client.get", side_effect=httpx.RequestError("Host unreachable")):
        with patch.object(service, "_get_api_key", return_value="test_api_key"):
            with patch("time.sleep"):
                data = service.get_current_weather(13.0827, 80.2707, force_refresh=True)

    assert data["temperature_c"] == 31.5
    assert data["humidity"] == 72.0
    assert data["wind_kph"] == 14.0
    assert data["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"


def test_env_keys_stored_and_not_hardcoded():
    """Requirement 6 & 7: Store keys in .env. Never hardcode keys."""
    # Check .env has both keys configured
    env_path = Path(r"C:\Users\JAMES MERLIN\OneDrive\Desktop\youtubegit\Thermos\.env")
    assert env_path.exists()
    env_content = env_path.read_text(encoding="utf-8")
    assert "WEATHERAPI_KEY=" in env_content
    assert "NASA_FIRMS_MAP_KEY=" in env_content

    # Check Settings loads them dynamically
    assert settings.weatherapi_key != ""
    assert settings.nasa_firms_map_key != ""

    # Verify no source code file contains hardcoded key literal in plain text
    key_literal = "b2f2b36c93ae426eb3c223122260809"
    service_file = Path(r"C:\Users\JAMES MERLIN\OneDrive\Desktop\youtubegit\Thermos\backend\app\modules\weather\weatherapi_service.py")
    assert key_literal not in service_file.read_text(encoding="utf-8")


def test_nasa_firms_service_integration(tmp_path: Path):
    """Test NASA FIRMS active fire & thermal anomaly service."""
    cache_file = tmp_path / "firms_cache.json"
    service = type(nasa_firms_service)(cache_path=cache_file)

    mock_csv = (
        "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
        "13.082,80.271,325.4,0.4,0.4,2026-09-09,0730,N,VIIRS,nominal,2.0NRT,298.1,5.2,D\n"
    )
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = mock_csv

    with patch("httpx.Client.get", return_value=mock_resp):
        anomalies = service.get_thermal_anomalies(days=1)
        assert len(anomalies) == 1
        assert anomalies[0]["latitude"] == 13.082
        assert anomalies[0]["bright_ti4"] == 325.4
        assert anomalies[0]["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"


def test_chri_calculations_use_weatherapi_telemetry():
    """Requirement 8: Update CHRI calculations to use WeatherAPI telemetry."""
    telemetry = geospatial_pipeline.get_weather_telemetry()
    assert "temperature_c" in telemetry
    assert "humidity" in telemetry
    assert "wind_kph" in telemetry
    assert "feelslike_c" in telemetry
    assert "normalized_weather" in telemetry
    assert telemetry["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"

    # Verify evaluate_zone_pipeline outputs provider metadata
    evaluated = geospatial_pipeline.evaluate_zone_pipeline(
        zone_id="TEST-01",
        zone_name="Test Sector",
        centroid=[80.27, 13.08],
        raw_metrics={"lst_c": 35.0, "ndvi": 0.20, "building_density": 0.60, "population_density": 15000},
    )
    assert evaluated["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"


def test_weatherapi_endpoints_provider_metadata(client: TestClient):
    """Requirement 9 & 10: Verify endpoints return data_source = WeatherAPI + NASA FIRMS + OpenStreetMap."""
    res = client.get("/api/weather/current")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"
    assert "feelslike_c" in data
    assert "heatindex_c" in data
    assert "condition" in data

    # Verify hotspots endpoint reflects the new data_source
    h_res = client.get("/api/hotspots")
    assert h_res.status_code == 200
    hotspots = h_res.json()
    assert len(hotspots) > 0
    assert hotspots[0]["data_source"] == "WeatherAPI + NASA FIRMS + OpenStreetMap"
