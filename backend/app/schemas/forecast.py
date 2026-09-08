"""Schemas for Phase 4: Predictive Urban Heat Intelligence.

Defines:
- ForecastDriverImpact: Explanatory attribution for forecasted CHRI shift
- ForecastPoint: Single horizon projection (24h, 72h, 7d)
- CHRIForecast: Multi-horizon forecast entity for an urban zone
- ForecastAlert: Early heatwave & risk surge alert
- CitywideForecastSummary: Metropolitan aggregation of predictive heat dynamics
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ForecastDriverImpact(BaseModel):
    """Specific factor contributing to predicted CHRI delta."""
    driver: str = Field(..., description="Driver key: 'thermal_lst', 'vegetation_stress', 'aqi_stagnation', etc.")
    driver_name: str = Field(..., description="Human-readable driver name")
    delta_impact: float = Field(..., description="Points added or subtracted from CHRI")
    description: str = Field(..., description="Explainable physical rationale")


class ForecastPoint(BaseModel):
    """Predictive snapshot for a specific time horizon (+24h, +72h, +7d)."""
    horizon: str = Field(..., description="'24h', '72h', or '7d'")
    forecast_timestamp: str = Field(..., description="ISO 8601 target timestamp")
    projected_chri: float = Field(..., ge=0.0, le=100.0, description="Projected CHRI score")
    projected_lst_c: float = Field(..., description="Predicted Land Surface Temperature in °C")
    projected_ambient_temp_c: float = Field(..., description="Predicted ambient 2m air temperature in °C")
    projected_heat_index_c: float = Field(..., description="Projected apparent heat index in °C")
    delta_chri: float = Field(..., description="Score difference from current live CHRI")
    risk_level: str = Field(..., description="LOW, MODERATE, HIGH, SEVERE, CRITICAL")
    escalation: str = Field(..., description="'Stable', 'Rising', 'Severe Rise', or 'Cooling'")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Predictive certainty score (decaying with horizon)")
    driver_breakdown: List[ForecastDriverImpact] = Field(default_factory=list)


class CHRIForecast(BaseModel):
    """Comprehensive multi-horizon predictive heat intelligence for a zone."""
    zone_id: str
    zone_name: str
    current_chri: float
    current_lst_c: float
    current_risk_level: str
    horizons: List[ForecastPoint] = Field(..., description="Array of projections: 24h, 72h, 7d")
    peak_risk_horizon: str = Field(..., description="Horizon where CHRI reaches maximum")
    peak_chri: float = Field(..., description="Maximum projected CHRI score")
    primary_escalation_driver: str = Field(..., description="Dominant physical force causing predicted risk change")
    overall_escalation: str = Field(..., description="Overall trend: 'Stable', 'Rising', 'Severe Rise', or 'Cooling'")
    generated_at: str


class ForecastAlert(BaseModel):
    """Predictive early-warning alert for rapid heat risk escalation."""
    alert_id: str
    zone_id: str
    zone_name: str
    severity: str = Field(..., description="'WATCH', 'WARNING', or 'EMERGENCY'")
    headline: str
    escalation: str
    trigger_horizon: str
    current_chri: float
    projected_chri: float
    primary_driver: str
    recommended_early_action: str
    timestamp: str


class CitywideForecastSummary(BaseModel):
    """Citywide predictive overview aggregated across all urban zones."""
    generated_at: str
    total_zones: int
    zones_escalating: int
    zones_severe_rise: int
    zones_cooling: int
    zones_stable: int
    citywide_mean_chri_current: float
    citywide_mean_chri_24h: float
    citywide_mean_chri_72h: float
    citywide_mean_chri_7d: float
    active_alerts: List[ForecastAlert] = Field(default_factory=list)
    high_risk_zones_forecast: List[CHRIForecast] = Field(default_factory=list)
