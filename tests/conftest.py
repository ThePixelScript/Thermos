"""Pytest fixtures and configuration."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data.repository import repository, ZoneRepository
from backend.app.schemas.zone import Zone, LandCover, ThermalObservation, Demographics
from backend.app.schemas.common import Typology, GeoJSONPolygon


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_zone():
    """Create a sample zone fixture with known test parameters."""
    return Zone(
        id="ZONE-TEST-01",
        name="Test Industrial Hotspot",
        typology=Typology.INDUSTRIAL_HEAVY,
        area_sqkm=2.0,
        geometry=GeoJSONPolygon(
            type="Polygon",
            coordinates=[
                [
                    [77.20, 28.60],
                    [77.22, 28.60],
                    [77.22, 28.62],
                    [77.20, 28.62],
                    [77.20, 28.60],
                ]
            ],
        ),
        land_cover=LandCover(
            impervious_surface_fraction=0.90,
            tree_canopy_fraction=0.04,
            vegetation_grass_fraction=0.04,
            water_fraction=0.00,
            average_albedo=0.12,
        ),
        thermal_observation=ThermalObservation(
            land_surface_temp_c=43.5,
            baseline_temp_c=31.5,
            thermal_anomaly_c=12.0,
            sensor_source="Test Landsat-9",
        ),
        demographics=Demographics(
            population_density_per_sqkm=20000.0,
            total_population=40000,
            vulnerable_ratio=0.25,
            outdoor_worker_density_per_sqkm=5000.0,
            low_ac_coverage_ratio=0.60,
        ),
    )


@pytest.fixture
def cool_zone():
    """Create a sample cool refuge zone fixture."""
    return Zone(
        id="ZONE-TEST-COOL",
        name="Test Forest Park",
        typology=Typology.PARK_RIPARIAN,
        area_sqkm=3.5,
        geometry=GeoJSONPolygon(
            type="Polygon",
            coordinates=[
                [
                    [77.23, 28.61],
                    [77.25, 28.61],
                    [77.25, 28.63],
                    [77.23, 28.63],
                    [77.23, 28.61],
                ]
            ],
        ),
        land_cover=LandCover(
            impervious_surface_fraction=0.10,
            tree_canopy_fraction=0.60,
            vegetation_grass_fraction=0.25,
            water_fraction=0.05,
            average_albedo=0.25,
        ),
        thermal_observation=ThermalObservation(
            land_surface_temp_c=27.5,
            baseline_temp_c=31.5,
            thermal_anomaly_c=-4.0,
            sensor_source="Test Landsat-9",
        ),
        demographics=Demographics(
            population_density_per_sqkm=500.0,
            total_population=1750,
            vulnerable_ratio=0.10,
            outdoor_worker_density_per_sqkm=50.0,
            low_ac_coverage_ratio=0.10,
        ),
    )
