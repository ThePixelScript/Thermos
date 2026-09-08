"""Unit and integration tests for Weather API and service."""
from fastapi.testclient import TestClient
from backend.app.modules.weather.weather_service import calculate_heat_index


def test_heat_index_calculation():
    """Verify NOAA Rothfusz heat index calculation and bioclimatic tiers."""
    # Test comfortable condition
    hi_normal, stress_normal = calculate_heat_index(24.0, 50.0)
    assert hi_normal < 27.0
    assert stress_normal == "Normal"

    # Test extreme caution / danger heat condition
    hi_hot, stress_hot = calculate_heat_index(38.0, 70.0)
    assert hi_hot >= 41.0
    assert stress_hot in ["Danger", "Extreme Danger"]


def test_get_current_weather_endpoint(client: TestClient):
    """Verify GET /api/v1/weather/current returns required meteorological metrics."""
    response = client.get("/api/v1/weather/current?latitude=13.0827&longitude=80.2707")
    assert response.status_code == 200
    data = response.json()

    assert "temperature" in data
    assert "humidity" in data
    assert "wind_speed" in data
    assert "wind_direction" in data
    assert "heat_index_c" in data
    assert "bioclimatic_stress" in data

    # Sanity checks on physical ranges
    assert -10.0 <= data["temperature"] <= 60.0
    assert 0.0 <= data["humidity"] <= 100.0
    assert 0.0 <= data["wind_speed"] <= 200.0
    assert 0.0 <= data["wind_direction"] <= 360.0


def test_weather_backward_compatibility_endpoint(client: TestClient):
    """Verify /api/weather/current also responds."""
    response = client.get("/api/weather/current")
    assert response.status_code == 200
    data = response.json()
    assert data["latitude"] == 13.083
    assert data["longitude"] == 80.271
