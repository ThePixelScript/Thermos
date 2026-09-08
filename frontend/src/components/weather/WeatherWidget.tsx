/**
 * THERMOS Geospatial Platform — Live Atmospheric Weather Widget
 * 
 * Ingests and renders live meteorological observations from WeatherAPI.com:
 * - Ambient 2m Air Temperature (°C)
 * - Relative Humidity (%)
 * - 10m Wind Speed (km/h) & Wind Direction (compass bearing)
 * - NOAA Rothfusz Heat Index & Bioclimatic thermal stress tier
 * - Automatic background refresh every 10 minutes
 */
import React, { useEffect, useState } from 'react';
import type { WeatherData } from '../../types';
import { fetchCurrentWeather } from '../../services/api';

export interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  cityLabel?: string;
  onWeatherLoaded?: (weather: WeatherData) => void;
}

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const getCompassDirection = (deg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
};

const getStressBadgeClass = (stress: string): string => {
  switch (stress) {
    case 'Extreme Danger':
      return 'stress-extreme-danger';
    case 'Danger':
      return 'stress-danger';
    case 'Extreme Caution':
      return 'stress-extreme-caution';
    case 'Caution':
      return 'stress-caution';
    default:
      return 'stress-normal';
  }
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  latitude = 13.0827,
  longitude = 80.2707,
  cityLabel = 'Chennai, India',
  onWeatherLoaded,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await fetchCurrentWeather(latitude, longitude);
      setWeather(data);
      setLastUpdated(new Date());
      setError(null);
      if (onWeatherLoaded) {
        onWeatherLoaded(data);
      }
    } catch (err: any) {
      console.warn('Weather fetch fallback notice:', err);
      setError(err?.message || 'Offline mode');
      // Fallback default so widget remains operational
      const fallback: WeatherData = {
        latitude,
        longitude,
        temperature: 31.5,
        humidity: 72,
        wind_speed: 14.0,
        wind_direction: 115,
        heat_index_c: 38.2,
        bioclimatic_stress: 'Extreme Caution',
        timestamp: new Date().toISOString(),
        source: 'Climatic Baseline (Offline)',
      };
      setWeather(fallback);
      setLastUpdated(new Date());
      if (onWeatherLoaded) {
        onWeatherLoaded(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
    const interval = setInterval(loadWeather, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  if (!weather && loading) {
    return (
      <div className="weather-widget loading">
        <span className="weather-spinner"></span>
        <span className="weather-label">Loading atmospheric telemetry...</span>
      </div>
    );
  }

  if (!weather) return null;

  const compass = getCompassDirection(weather.wind_direction);
  const stressClass = getStressBadgeClass(weather.bioclimatic_stress);

  return (
    <div className="weather-widget">
      <div className="weather-widget-top">
        <div className="weather-city-info">
          <span className="weather-pulse-dot"></span>
          <span className="weather-city-name">{cityLabel}</span>
          <span className={`weather-stress-pill ${stressClass}`}>
            {weather.bioclimatic_stress}
          </span>
        </div>

        <button
          className="btn-weather-refresh"
          onClick={loadWeather}
          disabled={loading}
          title="Refresh live weather telemetry"
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>

      <div className="weather-metrics-strip">
        <div className="weather-metric" title="2m Ambient Air Temperature">
          <span className="metric-icon">🌡️</span>
          <div className="metric-text-group">
            <span className="metric-title">Ambient Temp</span>
            <span className="metric-val">{weather.temperature.toFixed(1)}°C</span>
          </div>
        </div>

        <div className="weather-metric" title="Apparent Temperature / Heat Index">
          <span className="metric-icon">🔥</span>
          <div className="metric-text-group">
            <span className="metric-title">Heat Index</span>
            <span className="metric-val hot">{weather.heat_index_c.toFixed(1)}°C</span>
          </div>
        </div>

        <div className="weather-metric" title="Relative Humidity">
          <span className="metric-icon">💧</span>
          <div className="metric-text-group">
            <span className="metric-title">Humidity</span>
            <span className="metric-val">{weather.humidity.toFixed(0)}%</span>
          </div>
        </div>

        <div className="weather-metric" title="10m Surface Wind Velocity">
          <span className="metric-icon">💨</span>
          <div className="metric-text-group">
            <span className="metric-title">Wind</span>
            <span className="metric-val">
              {weather.wind_speed.toFixed(0)} <span className="unit">km/h</span> {compass}
            </span>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="weather-footer">
          <span>Source: {weather.source}</span>
          {error && <span className="weather-error-hint">({error})</span>}
          <span>•</span>
          <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
};
