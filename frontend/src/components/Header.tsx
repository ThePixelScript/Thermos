import React from 'react';
import type { BackendHealth } from '../types';

interface HeaderProps {
  health: BackendHealth | null;
  loading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, loading, onRefresh }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-badge">PS13</div>
        <div>
          <h1 className="brand-title">THERMOS</h1>
          <p className="brand-subtitle">Urban Climate Decision Intelligence • HeatScape Reduction Planner</p>
        </div>
      </div>

      <div className="header-actions">
        <div className={`health-pill ${health?.status === 'healthy' ? 'online' : 'offline'}`}>
          <span className="dot"></span>
          <span>
            {health?.status === 'healthy'
              ? `API Online (${health.zones_loaded} Zones Loaded)`
              : 'Connecting to Backend...'}
          </span>
        </div>

        <button className="btn-refresh" onClick={onRefresh} disabled={loading} title="Reload Data">
          {loading ? '⟳ Refreshing...' : '↻ Refresh'}
        </button>
      </div>
    </header>
  );
};
