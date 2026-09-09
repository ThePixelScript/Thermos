/**
 * THERMOS Geospatial Platform — Google Maps / Mapbox Inspired Clean Top Bar
 * 
 * Minimalist 48px-52px header:
 * - Left: Location & Platform Title
 * - Center: Clean Search Bar (Google Maps style)
 * - Right: System status & Settings trigger
 * - Removed all unnecessary pills, badges, and clutter.
 */
import React from 'react';
import {
  MapPin,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { LocationSearchBar } from '../search/LocationSearchBar';
import type { BackendHealth } from '../../types';

export interface TopHeaderProps {
  health: BackendHealth | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenSettings?: () => void;
  onOpenCommandCenter?: () => void;
  onOpenScenarioPlanner?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  health,
  loading,
  onRefresh,
  onOpenSettings,
}) => {
  const { selectedLocation } = useLocation();
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="enterprise-top-header">
      {/* 1. Left: Brand & Active Location */}
      <div className="top-header-left">
        <div className="header-brand-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <span className="header-product-name">THERMOS</span>

        <div className="header-location-breadcrumb">
          <MapPin size={13} className="header-location-pin" />
          <span className="header-location-label" title={selectedLocation.display_name}>
            {selectedLocation.name || selectedLocation.display_name.split(',')[0]}
          </span>
          <span className="header-location-coords font-mono">
            {selectedLocation.lat.toFixed(3)}°, {selectedLocation.lon.toFixed(3)}°
          </span>
        </div>
      </div>

      {/* 2. Center: Google Maps Style Search Bar */}
      <div className="top-header-center">
        <LocationSearchBar placeholder="Search city, district, ward, or coordinates..." />
      </div>

      {/* 3. Right: System Status & Settings Trigger */}
      <div className="top-header-right">
        {/* Compact Single Status Indicator */}
        <div className={`header-system-status ${isHealthy ? 'online' : 'offline'}`} title="Real-time data pipeline status">
          <span className="status-pip"></span>
          <span>{isHealthy ? 'Connected' : 'Connecting'}</span>
        </div>

        {/* Sync Telemetry */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Synchronize live meteorological telemetry"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenSettings}
            title="Preferences & GIS Settings"
          >
            <Settings size={15} />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopHeader;
