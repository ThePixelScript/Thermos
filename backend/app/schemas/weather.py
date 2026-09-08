"""Weather data schemas for live atmospheric conditions from WeatherAPI.com."""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class CurrentWeatherResponse(BaseModel):
    """Real-time current meteorological observations from WeatherAPI.com."""
    temperature_c: float = Field(..., description="Ambient air temperature in °C")
    humidity: float = Field(..., description="Relative humidity percentage [0-100%]")
    wind_kph: float = Field(..., description="Wind speed in km/h")
    wind_degree: float = Field(..., description="Wind direction in degrees [0-360]")
    condition: str = Field(..., description="Atmospheric condition description (e.g. Sunny, Light rain)")
    condition_text: Optional[str] = Field(None, description="Atmospheric condition text from condition.text")
    condition_icon: Optional[str] = Field(None, description="Weather icon URL")
    feelslike_c: float = Field(..., description="Perceived / apparent temperature in °C")
    heatindex_c: Optional[float] = Field(None, description="Bioclimatic heat index in °C")
    pressure_mb: Optional[float] = Field(1012.0, description="Surface atmospheric pressure in mb")
    uv: Optional[float] = Field(5.0, description="UV Index")
    localtime: Optional[str] = Field(None, description="Local observation timestamp")
    last_updated: str = Field(..., description="Timestamp of the latest meteorological observation")

    # Resilience and caching state
    cached: bool = Field(default=False, description="Whether telemetry was retrieved from cache")
    stale: bool = Field(default=False, description="Whether cache is stale due to upstream network failure")
    data: Optional[dict] = Field(default=None, description="Structured data payload")

    # Backward compatibility and analytical fields
    temperature: Optional[float] = Field(None, description="Legacy alias for temperature_c")
    wind_speed: Optional[float] = Field(None, description="Legacy alias for wind_kph")
    wind_direction: Optional[float] = Field(None, description="Legacy alias for wind_degree")
    heat_index_c: Optional[float] = Field(None, description="Apparent temperature / Heat Index in °C")
    bioclimatic_stress: Optional[str] = Field(None, description="Heat stress tier: Normal, Caution, Extreme Caution, Danger, Extreme Danger")
    latitude: Optional[float] = Field(13.083, description="Target latitude coordinate")
    longitude: Optional[float] = Field(80.271, description="Target longitude coordinate")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")
    data_source: str = Field(default="WeatherAPI + NASA FIRMS + OpenStreetMap")
    source: str = Field(default="WeatherAPI + NASA FIRMS + OpenStreetMap")
    provider_metadata: Optional[dict] = Field(default=None)

    @model_validator(mode="after")
    def populate_aliases(self) -> "CurrentWeatherResponse":
        if self.temperature is None:
            self.temperature = self.temperature_c
        if self.wind_speed is None:
            self.wind_speed = self.wind_kph
        if self.wind_direction is None:
            self.wind_direction = self.wind_degree
        if self.timestamp is None:
            self.timestamp = self.last_updated
        if self.condition_text is None:
            self.condition_text = self.condition
        if self.heatindex_c is None:
            self.heatindex_c = self.heat_index_c or self.feelslike_c
        if self.heat_index_c is None:
            self.heat_index_c = self.heatindex_c or self.feelslike_c
        if self.bioclimatic_stress is None:
            self.bioclimatic_stress = "Caution" if self.feelslike_c > 32.0 else "Normal"
        return self
