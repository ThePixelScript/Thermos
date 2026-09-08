"""Forecast module initialization."""
from backend.app.modules.forecast.forecast_service import (
    HeatForecastEngine,
    heat_forecast_engine,
    classify_escalation,
)

__all__ = [
    "HeatForecastEngine",
    "heat_forecast_engine",
    "classify_escalation",
]
