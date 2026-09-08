"""Comprehensive automated test suite for location intelligence and WeatherAPI provider."""
import json
import pytest
from unittest.mock import patch, MagicMock
import httpx
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.modules.weather.weather_provider import weather_provider, WeatherProvider


client = TestClient(app)


def test_nominatim_geocoding_returns_coordinates():
    """Test 1: Nominatim geocoding returns coordinates for a valid city."""
    fake_nominatim_resp = [
        {
            "display_name": "Paris, Île-de-France, France",
            "name": "Paris",
            "lat": "48.8566",
            "lon": "2.3522",
            "type": "city",
            "boundingbox": ["48.8155", "48.9021", "2.2241", "2.4699"],
        }
    ]

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = fake_nominatim_resp

    with patch.object(httpx.Client, "get", return_value=mock_resp):
        # Remove any cached file for paris_unique_test
        cache_key = f"search_{weather_provider._hash_slug('paris_unique_test')}.json"
        (weather_provider.geocoding_cache_dir / cache_key).unlink(missing_ok=True)

        res = weather_provider.get_coordinates("paris_unique_test")
        assert len(res) > 0
        first = res[0]
        assert abs(first["lat"] - 48.8566) < 0.01
        assert abs(first["lon"] - 2.3522) < 0.01
        assert "Paris" in first["name"] or "Paris" in first["display_name"]


def test_nominatim_reverse_geocoding_returns_place():
    """Test 2: Nominatim reverse geocoding returns place name."""
    fake_reverse_resp = {
        "display_name": "Tokyo Tower, Minato, Tokyo, Japan",
        "name": "Tokyo Tower",
        "boundingbox": ["35.6580", "35.6590", "139.7450", "139.7460"],
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = fake_reverse_resp

    lat, lon = 35.6586, 139.7454
    cache_file = weather_provider.geocoding_cache_dir / f"rev_{round(lat, 3):.3f}_{round(lon, 3):.3f}.json"
    cache_file.unlink(missing_ok=True)

    with patch.object(httpx.Client, "get", return_value=mock_resp):
        res = weather_provider.reverse_geocode(lat, lon)
        assert res is not None
        assert "Tokyo" in res["display_name"] or "Tokyo" in res["name"]


def test_geocoding_cache_returns_stored_result_without_api():
    """Test 3: Geocoding cache returns stored result without API call."""
    query = "cached_test_city"
    cache_key = f"search_{weather_provider._hash_slug(query)}.json"
    cache_file = weather_provider.geocoding_cache_dir / cache_key
    cached_payload = {
        "cached_at": 9999999999.0,
        "results": [
            {
                "name": "Cached Test City",
                "display_name": "Cached Test City, Region",
                "lat": 10.5,
                "lon": 20.5,
                "bbox": [10.0, 11.0, 20.0, 21.0],
                "source": "Nominatim OpenStreetMap",
            }
        ],
    }
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cached_payload, f)

    with patch.object(httpx.Client, "get") as mock_get:
        res = weather_provider.get_coordinates(query)
        mock_get.assert_not_called()
        assert len(res) == 1
        assert res[0]["name"] == "Cached Test City"
        assert res[0]["lat"] == 10.5


def test_geocoding_handles_rate_limit_and_network_errors():
    """Test 4: Geocoding handles rate limit and network errors gracefully with fallback."""
    with patch.object(httpx.Client, "get", side_effect=httpx.ConnectError("Network timeout")):
        # For an unknown location without cache, it returns [] gracefully without crashing
        res = weather_provider.get_coordinates("totally_unresolvable_error_city_xyz")
        assert res == []

        # For reverse geocoding on error, it provides a graceful synthetic fallback
        rev = weather_provider.reverse_geocode(40.7128, -74.0060)
        assert rev is not None
        assert rev["lat"] == 40.7128


def test_weatherapi_returns_live_data():
    """Test 5: WeatherAPI returns live data when available."""
    fake_weather_resp = {
        "location": {"name": "Berlin", "country": "Germany", "localtime": "2026-09-09 01:00"},
        "current": {
            "temp_c": 21.4,
            "feelslike_c": 22.1,
            "humidity": 65,
            "wind_kph": 12.5,
            "wind_degree": 180,
            "pressure_mb": 1014.0,
            "uv": 3.0,
            "condition": {"text": "Sunny", "icon": "//cdn.weatherapi.com/weather/64x64/day/113.png"},
            "last_updated": "2026-09-09 01:00",
        },
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = fake_weather_resp

    lat, lon = 52.52, 13.405
    cache_file = weather_provider._get_weather_cache_file(lat, lon)
    cache_file.unlink(missing_ok=True)

    with patch.object(httpx.Client, "get", return_value=mock_resp):
        weather = weather_provider.get_current_weather(lat, lon, force_refresh=True)
        assert weather["temperature_c"] == 21.4
        assert weather["feelslike_c"] == 22.1
        assert weather["humidity"] == 65
        assert weather["wind_kph"] == 12.5
        assert weather["condition"] == "Sunny"


def test_weatherapi_falls_back_to_cache_when_network_fails():
    """Test 6: WeatherAPI falls back to cache or baseline when network fails."""
    lat, lon = 34.0522, -118.2437
    cache_file = weather_provider._get_weather_cache_file(lat, lon)
    cache_payload = {
        "cached_at": 1000.0,  # Old / stale timestamp
        "source": "WeatherAPI + NASA FIRMS + OpenStreetMap",
        "temperature_c": 28.5,
        "feelslike_c": 29.0,
        "humidity": 45.0,
        "wind_kph": 8.0,
        "wind_degree": 270.0,
        "pressure_mb": 1012.0,
        "uv": 7.0,
        "condition": "Clear",
        "last_updated": "2026-09-08 12:00",
        "data": {
            "temperature_c": 28.5,
            "feelslike_c": 29.0,
            "humidity": 45.0,
            "wind_kph": 8.0,
            "wind_degree": 270.0,
            "pressure_mb": 1012.0,
            "uv": 7.0,
            "condition": {"text": "Clear", "icon": ""},
            "last_updated": "2026-09-08 12:00",
        },
    }
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache_payload, f)

    with patch.object(httpx.Client, "get", side_effect=httpx.ConnectTimeout("Connection timed out")):
        res = weather_provider.get_current_weather(lat, lon)
        assert res is not None
        assert res["temperature_c"] == 28.5
        assert res["cached"] is True
        assert res["stale"] is True


def test_location_pipeline_endpoints():
    """Test 7: Location update pipeline API endpoints function correctly."""
    fake_search_results = [
        {
            "display_name": "Singapore",
            "name": "Singapore",
            "lat": 1.3521,
            "lon": 103.8198,
            "bbox": [1.15, 1.47, 103.6, 104.0],
            "source": "Nominatim OpenStreetMap",
        }
    ]

    with patch.object(weather_provider, "get_coordinates", return_value=fake_search_results):
        # Search endpoint
        res = client.get("/api/location/search?q=Singapore_test")
        assert res.status_code == 200
        data = res.json()
        results = data if isinstance(data, list) else data.get("results", [])
        assert len(results) > 0
        assert "Singapore" in results[0]["display_name"]

    # Reverse geocoding endpoint
    fake_reverse_result = {
        "display_name": "Marina Bay, Singapore",
        "name": "Marina Bay",
        "lat": 1.2868,
        "lon": 103.8545,
        "bbox": [1.28, 1.29, 103.85, 103.86],
        "source": "Nominatim OpenStreetMap",
    }

    with patch.object(weather_provider, "reverse_geocode", return_value=fake_reverse_result):
        rev_res = client.get("/api/location/reverse?lat=1.2868&lon=103.8545")
        assert rev_res.status_code == 200
        rev_data = rev_res.json()
        lat_val = rev_data.get("lat") or rev_data.get("data", {}).get("lat")
        assert abs(lat_val - 1.2868) < 0.001
        display_str = str(rev_data.get("display_name") or rev_data.get("data", {}).get("display_name", ""))
        assert "Marina Bay" in display_str or "Singapore" in display_str

    # Dynamic global hexagons endpoint
    hex_res = client.get("/api/zones/hexagons?lat=1.3521&lon=103.8198&resolution_km=3.0")
    assert hex_res.status_code == 200
    hex_data = hex_res.json()
    assert hex_data["type"] == "FeatureCollection"
    assert len(hex_data["features"]) > 0

    # Dynamic global hotspots endpoint
    hotspot_res = client.get("/api/hotspots?lat=1.3521&lon=103.8198")
    assert hotspot_res.status_code == 200
    hotspots = hotspot_res.json()
    assert isinstance(hotspots, list)
    assert len(hotspots) > 0
