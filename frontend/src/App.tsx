import React, { useEffect, useState } from 'react';
import type {
  BackendHealth,
  GeoJSONFeatureCollection,
  HotspotSummary,
  HotspotDetail,
} from './types';
import {
  fetchHealth,
  fetchZonesGeoJSON,
  fetchHotspots,
  fetchHotspotDetail,
} from './services/api';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { HotspotList } from './components/HotspotList';
import { ZoneMap } from './components/ZoneMap';
import { ZoneDetail } from './components/ZoneDetail';
import './index.css';

export const App: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [hotspots, setHotspots] = useState<HotspotSummary[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<HotspotDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, gRes, hotRes] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchZonesGeoJSON(),
        fetchHotspots(30),
      ]);

      if (hRes) setHealth(hRes);
      setGeoJsonData(gRes);
      setHotspots(hotRes);

      // Auto-select highest risk hotspot initially if none selected
      if (hotRes.length > 0 && !selectedZoneId) {
        handleSelectZone(hotRes[0].zone_id);
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectZone = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setDetailLoading(true);
    try {
      const detail = await fetchHotspotDetail(zoneId);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load zone detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedZoneId(null);
    setSelectedDetail(null);
  };

  return (
    <div className="app-container">
      <Header health={health} loading={loading} onRefresh={loadAllData} />

      <main className="app-main">
        <SummaryBar
          hotspots={hotspots}
          totalZones={geoJsonData ? geoJsonData.features.length : 0}
        />

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadAllData} className="btn-retry">Retry Connection</button>
          </div>
        )}

        <div className="workbench-grid">
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
            <ZoneMap
              geoJsonData={geoJsonData}
              selectedZoneId={selectedZoneId}
              onSelectZone={handleSelectZone}
            />
          </section>

          {/* Right Column: Zone Inspector */}
          <aside className="workbench-inspector">
            <ZoneDetail
              detail={selectedDetail}
              loading={detailLoading}
              onClose={handleCloseDetail}
            />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default App;
