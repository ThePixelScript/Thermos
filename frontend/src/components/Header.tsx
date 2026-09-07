import React from 'react';
import type { BackendHealth } from '../types';

interface HeaderProps {
  health: BackendHealth | null;
  loading: boolean;
  isDemoMode: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, loading, isDemoMode, onRefresh }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-badge">PS13</div>
        <div>
          <div className="brand-title-row">
            <h1 className="brand-title">THERMOS</h1>
            <span className="brand-stage-tag">RESONANCE 1.0</span>
          </div>
          <p className="brand-subtitle">Urban Climate Decision Intelligence • HeatScape Reduction Planner</p>
        </div>
      </div>

      <div className="header-actions">
        <div className={`health-pill ${isDemoMode ? 'demo' : 'online'}`}>
          <span className="dot"></span>
          <span>
            {isDemoMode
              ? 'Demo Mode (Calibrated Demonstration Data)'
              : `Live API Connected (${health?.zones_loaded ?? 10} Zones Ingested)`}
          </span>
        </div>

        <button className="btn-refresh" onClick={onRefresh} disabled={loading} title="Reload Data">
          {loading ? '⟳ Refreshing...' : '↻ Refresh Data'}
        </button>
      </div>
    </header>
  );
};

