import React, { useEffect, useState } from 'react';
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
} from './services/api';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { HotspotList } from './components/HotspotList';
import { ThermosMap } from './components/map/ThermosMap';
import { CHRIInsightsPanel } from './components/analytics/CHRIInsightsPanel';
import { CityCommandCenter } from './components/analytics/CityCommandCenter';
import { ScenarioPlanner } from './components/analytics/ScenarioPlanner';
import { useLocation } from './context/LocationContext';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDataForLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const isChennaiDefault =
        Math.abs(selectedLocation.lat - 13.0827) < 0.05 &&
        Math.abs(selectedLocation.lon - 80.2707) < 0.05;

      const [hRes, gRes, hotRes] = await Promise.all([
        fetchHealth().catch(() => null),
        isChennaiDefault
          ? fetchZonesGeoJSON().catch(() => fetchHexagonsGeoJSON(2.5, selectedLocation.lat, selectedLocation.lon))
          : fetchHexagonsGeoJSON(2.5, selectedLocation.lat, selectedLocation.lon),
        fetchHotspots(30, selectedLocation.lat, selectedLocation.lon),
      ]);

      if (hRes) setHealth(hRes);
      setGeoJsonData(gRes);
      setHotspots(hotRes);

      // Auto-select highest risk hotspot in the active region
      if (hotRes.length > 0) {
        setSelectedZoneId(hotRes[0].zone_id);
      } else {
        setSelectedZoneId(null);
      }
    } catch (err: any) {
      console.error('Failed to load location intelligence data:', err);
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataForLocation();
  }, [selectedLocation.lat, selectedLocation.lon]);

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
  };

  const handleCloseDetail = () => {
    setSelectedZoneId(null);
  };

  return (
    <div className="app-container">
      <Header
        health={health}
        loading={loading}
        onRefresh={loadDataForLocation}
        onWeatherLoaded={setCurrentWeather}
        onOpenCommandCenter={() => setShowCommandCenter(true)}
        onOpenScenarioPlanner={() => setShowScenarioPlanner(true)}
      />

      {/* Phase 5: Municipal Decision Intelligence Command Center Modal */}
      {showCommandCenter && (
        <CityCommandCenter
          onClose={() => setShowCommandCenter(false)}
          onSelectZone={(zoneId) => {
            handleSelectZone(zoneId);
            setShowCommandCenter(false);
          }}
        />
      )}

      {/* Phase 6: Urban Climate Digital Twin & Scenario Simulator Modal */}
      {showScenarioPlanner && (
        <ScenarioPlanner
          initialZoneId={selectedZoneId}
          onClose={() => setShowScenarioPlanner(false)}
          onSelectZone={(zoneId) => {
            handleSelectZone(zoneId);
          }}
        />
      )}

      <main className="app-main">
        <SummaryBar
          hotspots={hotspots}
          totalZones={geoJsonData ? geoJsonData.features.length : 0}
        />

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadDataForLocation} className="btn-retry">Retry Connection</button>
          </div>
        )}

        <div className={`workbench-grid ${selectedZoneId ? 'has-selection' : 'no-selection'}`}>
          {/* Left Column: Ranked Hotspots */}
          <aside className="workbench-sidebar">
            <HotspotList
              hotspots={hotspots}
              selectedZoneId={selectedZoneId}
              onSelectHotspot={handleSelectZone}
            />
          </aside>

          {/* Center Column: Interactive Map */}
          <section className="workbench-map">
            <ThermosMap
              geoJsonData={geoJsonData}
              selectedZoneId={selectedZoneId}
              onSelectZone={handleSelectZone}
              weather={currentWeather}
            />
          </section>

          {/* Right Column: CHRI Visual Intelligence Panel */}
          {selectedZoneId && (
            <CHRIInsightsPanel
              zoneId={selectedZoneId}
              onClose={handleCloseDetail}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
