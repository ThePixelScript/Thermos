import React from 'react';
import { RefreshCw, Sliders, Building2 } from 'lucide-react';
import type { BackendHealth, WeatherData } from '../types';
import { WeatherWidget } from './weather/WeatherWidget';
import { ThemeSelector } from './ThemeSelector';
import { useLocation } from '../context/LocationContext';

interface HeaderProps {
  health: BackendHealth | null;
  loading: boolean;
  onRefresh: () => void;
  onWeatherLoaded?: (weather: WeatherData) => void;
  onOpenCommandCenter?: () => void;
  onOpenScenarioPlanner?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  loading,
  onRefresh,
  onWeatherLoaded,
  onOpenCommandCenter,
  onOpenScenarioPlanner,
}) => {
  const { selectedLocation } = useLocation();

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-badge">PS13</div>
        <div>
          <div className="brand-title-row">
            <h1 className="brand-title">THERMOS</h1>
            <span className="brand-stage-tag">RESONANCE 1.0</span>
          </div>
          <p className="brand-subtitle">Metropolitan Heat Mitigation &amp; Climate Intelligence</p>
        </div>
      </div>

      <div className="header-weather-slot">
        <WeatherWidget
          latitude={selectedLocation.lat}
          longitude={selectedLocation.lon}
          cityLabel={selectedLocation.name || selectedLocation.display_name.split(',')[0]}
          onWeatherLoaded={onWeatherLoaded}
        />
      </div>

      <div className="header-actions">
        {onOpenScenarioPlanner && (
          <button
            className="btn-scenario-planner-trigger"
            onClick={onOpenScenarioPlanner}
            title="Open Digital Twin Scenario Simulator"
          >
            <Sliders size={14} className="header-btn-icon" />
            <span>Scenario Planner</span>
          </button>
        )}

        {onOpenCommandCenter && (
          <button
            className="btn-command-center-trigger"
            onClick={onOpenCommandCenter}
            title="Open Executive Municipal Command Center"
          >
            <Building2 size={14} className="header-btn-icon" />
            <span>City Command Center</span>
          </button>
        )}

        <div className={`health-pill ${health?.status === 'healthy' ? 'online' : 'offline'}`}>
          <span className="dot"></span>
          <span>
            {health?.status === 'healthy'
              ? `Online · ${health.zones_loaded} Sectors`
              : 'Connecting to Core...'}
          </span>
        </div>

        <button
          className="btn-refresh"
          onClick={onRefresh}
          disabled={loading}
          title="Synchronize Platform Telemetry"
        >
          <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
          <span>{loading ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Enterprise Theme & Display Controls */}
        <ThemeSelector />
      </div>
    </header>
  );
};
