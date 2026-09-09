/**
 * THERMOS Geospatial Platform — Human-Designed Enterprise Architecture
 * 
 * Layout Structure:
 * ┌─────────────────────────────────────────┐
 * │ Top Header                              │
 * ├──────┬──────────────────────┬───────────┤
 * │      │                      │           │
 * │ Side │      Main Map        │ Insights  │
 * │ Bar  │   / Dashboard        │ Panel     │
 * │      │                      │           │
 * └──────┴──────────────────────┴───────────┘
 * 
 * - Full SaaS enterprise styling (Linear, Stripe, ArcGIS, Notion, Google Maps)
 * - Zero broken business logic, live WeatherAPI telemetry, STAC COG layers,
 *   geospatial H3 hexagons, dynamic reverse-geocoding, and simulation models.
 */
import React, { useEffect, useState, useCallback } from 'react';
import type {
  BackendHealth,
  GeoJSONFeatureCollection,
  HotspotSummary,
  WeatherData,
} from './types';
import {
  fetchHealth,
  fetchZonesGeoJSON,
  fetchHexagonsGeoJSON,
  fetchHotspots,
  fetchCurrentWeather,
} from './services/api';
import { TopHeader } from './components/layout/TopHeader';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightInsightPanel } from './components/layout/RightInsightPanel';
import { DashboardView } from './components/dashboard/DashboardView';
import { ThermosMap } from './components/map/ThermosMap';
import { CityCommandCenter } from './components/analytics/CityCommandCenter';
import { ScenarioPlanner } from './components/analytics/ScenarioPlanner';
import { useLocation } from './context/LocationContext';
import { PanelRightOpen } from 'lucide-react';
import './index.css';

export const App: React.FC = () => {
  const { selectedLocation } = useLocation();
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [hotspots, setHotspots] = useState<HotspotSummary[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [showCommandCenter, setShowCommandCenter] = useState<boolean>(false);
  const [showScenarioPlanner, setShowScenarioPlanner] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>('heatmap');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDataForLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isChennaiDefault =
        Math.abs(selectedLocation.lat - 13.0827) < 0.05 &&
        Math.abs(selectedLocation.lon - 80.2707) < 0.05;

      const [hRes, gRes, hotRes, wRes] = await Promise.all([
        fetchHealth().catch(() => null),
        isChennaiDefault
          ? fetchZonesGeoJSON().catch(() => fetchHexagonsGeoJSON(2.5, selectedLocation.lat, selectedLocation.lon))
          : fetchHexagonsGeoJSON(2.5, selectedLocation.lat, selectedLocation.lon),
        fetchHotspots(30, selectedLocation.lat, selectedLocation.lon),
        fetchCurrentWeather(selectedLocation.lat, selectedLocation.lon).catch(() => null),
      ]);

      if (hRes) setHealth(hRes);
      setGeoJsonData(gRes);
      setHotspots(hotRes);
      if (wRes) setCurrentWeather(wRes);

      // Auto-select highest risk hotspot in the active region if not set
      if (hotRes.length > 0) {
        setSelectedZoneId((prev) => prev && hotRes.some((h) => h.zone_id === prev) ? prev : hotRes[0].zone_id);
      } else {
        setSelectedZoneId(null);
      }
    } catch (err: any) {
      console.error('Failed to load location intelligence data:', err);
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation.lat, selectedLocation.lon]);

  useEffect(() => {
    loadDataForLocation();
  }, [loadDataForLocation]);

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setIsRightPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsRightPanelOpen(false);
  };

  return (
    <div className="app-enterprise-root">
      {/* 1. Top Header across full window (Google Maps style) */}
      <TopHeader
        health={health}
        loading={loading}
        onRefresh={loadDataForLocation}
        onOpenSettings={() => setIsSettingsOpen((prev) => !prev)}
        onOpenCommandCenter={() => setShowCommandCenter(true)}
        onOpenScenarioPlanner={() => setShowScenarioPlanner(true)}
      />

      {error && (
        <div className="enterprise-error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadDataForLocation} className="btn-retry-compact">
            Retry Telemetry
          </button>
        </div>
      )}

      {/* 2. Workspace Body: Left Sidebar + Center Map/Dashboard + Right Insights */}
      <div className="app-workspace-body">
        {/* Left Sidebar (240px) */}
        <LeftSidebar
          hotspots={hotspots}
          selectedZoneId={selectedZoneId}
          onSelectHotspot={handleSelectZone}
          onOpenScenarioPlanner={() => setShowScenarioPlanner(true)}
          onOpenCommandCenter={() => setShowCommandCenter(true)}
          activeNav={activeNav}
          onNavChange={setActiveNav}
          isSettingsOpen={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
        />

        {/* Center Stage: Dominant Geospatial Map or 5-Section Executive Dashboard */}
        <main className="app-center-stage">
          {activeNav === 'dashboard' ? (
            <DashboardView
              hotspots={hotspots}
              weather={currentWeather}
              onSelectZone={handleSelectZone}
              onSwitchToMap={() => setActiveNav('heatmap')}
              onOpenScenarioPlanner={() => setShowScenarioPlanner(true)}
              onOpenCommandCenter={() => setShowCommandCenter(true)}
            />
          ) : (
            <div className="map-dominance-wrapper">
              <ThermosMap
                geoJsonData={geoJsonData}
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
                weather={currentWeather}
              />
              {!isRightPanelOpen && (
                <button
                  type="button"
                  className="reopen-inspector-floating-btn"
                  onClick={() => setIsRightPanelOpen(true)}
                  title="Open Sector Inspector"
                >
                  <PanelRightOpen size={14} className="mr-1 inline" />
                  <span>Inspect Sector</span>
                </button>
              )}
            </div>
          )}
        </main>

        {/* Right Insight Panel (320px Progressive Disclosure) */}
        {isRightPanelOpen && (
          <RightInsightPanel
            zoneId={selectedZoneId}
            weather={currentWeather}
            onClose={handleCloseDetail}
            onOpenScenarioPlanner={(zId) => {
              if (zId) setSelectedZoneId(zId);
              setShowScenarioPlanner(true);
            }}
          />
        )}
      </div>

      {/* Municipal Command Center Modal */}
      {showCommandCenter && (
        <CityCommandCenter
          onClose={() => setShowCommandCenter(false)}
          onSelectZone={(zoneId) => {
            handleSelectZone(zoneId);
            setShowCommandCenter(false);
          }}
        />
      )}

      {/* Urban Climate Digital Twin Scenario Simulator Modal */}
      {showScenarioPlanner && (
        <ScenarioPlanner
          initialZoneId={selectedZoneId}
          onClose={() => setShowScenarioPlanner(false)}
          onSelectZone={(zoneId) => {
            handleSelectZone(zoneId);
          }}
        />
      )}
    </div>
  );
};

export default App;
