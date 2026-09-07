"""Tests for health check endpoints."""
from fastapi.testclient import TestClient


def test_health_endpoint_status(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["zones_loaded"] >= 10
    assert data["hotspots_count"] >= 1
    assert "geospatial" in data["engine_status"]
    assert data["engine_status"]["risk_scoring"] == "active_deterministic"


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "endpoints" in data
    assert data["endpoints"]["zones"] == "/api/v1/zones"
