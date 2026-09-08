/**
 * THERMOS Geospatial Platform — Predictive Urban Heat Intelligence (Forecast Panel)
 * 
 * Provides:
 * - Multi-horizon predictive CHRI trajectory (+24h, +72h, +7d)
 * - Deterministic physical thermal mass & biophysical response projection
 * - Real-time escalation badges (Stable, Rising, Severe Rise, Cooling)
 * - Horizon-decaying confidence indicators (94%, 88%, 78%)
 * - Explainable driver delta attribution breakdown
 * - Peak risk horizon & primary escalation warning
 */
import React, { useEffect, useState } from 'react';
import type { CHRIForecastData, ForecastPointData } from '../../types';
import { fetchZoneForecast } from '../../services/api';

export interface ForecastPanelProps {
  zoneId?: string;
  forecastData?: CHRIForecastData | null;
  onSelectHorizon?: (horizon: string) => void;
}

const getEscalationStyle = (escalation: string): { badgeClass: string; arrow: string; color: string } => {
  switch (escalation) {
    case 'Severe Rise':
      return { badgeClass: 'forecast-escalation-severe', arrow: '▲▲', color: '#ef4444' };
    case 'Rising':
      return { badgeClass: 'forecast-escalation-rising', arrow: '▲', color: '#f97316' };
    case 'Cooling':
      return { badgeClass: 'forecast-escalation-cooling', arrow: '▼', color: '#10b981' };
    default:
      return { badgeClass: 'forecast-escalation-stable', arrow: '━', color: '#94a3b8' };
  }
};

export const ForecastPanel: React.FC<ForecastPanelProps> = ({
  zoneId,
  forecastData,
  onSelectHorizon,
}) => {
  const [forecast, setForecast] = useState<CHRIForecastData | null>(forecastData || null);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('24h');
  const [loading, setLoading] = useState<boolean>(!forecastData && !!zoneId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (forecastData) {
      setForecast(forecastData);
      setLoading(false);
      return;
    }

    if (!zoneId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchZoneForecast(zoneId)
      .then((data) => {
        if (isMounted) {
          setForecast(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`Failed to load forecast for ${zoneId}:`, err);
          setError(err?.message || 'Failed to load predictive heat forecast.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [zoneId, forecastData]);

  const handleHorizonClick = (horizon: string) => {
    setSelectedHorizon(horizon);
    if (onSelectHorizon) {
      onSelectHorizon(horizon);
    }
  };

  if (loading) {
    return (
      <div className="forecast-panel forecast-loading">
        <div className="forecast-skeleton-pill shimmer" />
        <div className="forecast-skeleton-card shimmer" />
        <div className="forecast-skeleton-breakdown shimmer" />
      </div>
    );
  }

  if (error || !forecast) {
    if (!zoneId && !forecastData) return null;
    return (
      <div className="forecast-panel forecast-error">
        <span className="error-icon">⚠️</span>
        <p>{error || 'Heat forecast unavailable for this zone.'}</p>
      </div>
    );
  }

  const activePoint: ForecastPointData | undefined =
    forecast.horizons.find((h) => h.horizon === selectedHorizon) || forecast.horizons[0];

  const escStyle = getEscalationStyle(activePoint?.escalation || forecast.overall_escalation);

  return (
    <div className="forecast-panel">
      {/* Header & Section Title */}
      <div className="forecast-header">
        <div>
          <div className="forecast-tag-line">
            <span className="forecast-pulse-dot" />
            <span className="forecast-kicker">Predictive Heat Intelligence</span>
          </div>
          <h4 className="forecast-title">Risk Horizon Trajectory</h4>
        </div>

        {/* Overall Escalation Pill */}
        <div className={`forecast-overall-badge ${getEscalationStyle(forecast.overall_escalation).badgeClass}`}>
          {forecast.overall_escalation}
        </div>
      </div>

      {/* Horizon Selector Tabs */}
      <div className="forecast-horizon-tabs">
        {forecast.horizons.map((h) => {
          const isActive = h.horizon === selectedHorizon;
          const isPeak = h.horizon === forecast.peak_risk_horizon;
          return (
            <button
              key={h.horizon}
              type="button"
              className={`forecast-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleHorizonClick(h.horizon)}
            >
              <div className="tab-horizon-title">
                +{h.horizon}
                {isPeak && <span className="peak-star" title="Peak Projected Risk">★</span>}
              </div>
              <div className="tab-horizon-score">{h.projected_chri.toFixed(1)}</div>
              <div className="tab-horizon-delta" style={{ color: getEscalationStyle(h.escalation).color }}>
                {h.delta_chri > 0 ? `+${h.delta_chri.toFixed(1)}` : h.delta_chri.toFixed(1)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Horizon Detailed View */}
      {activePoint && (
        <div className="forecast-active-card">
          {/* Top Metric Row */}
          <div className="forecast-score-row">
            <div className="forecast-metric-group">
              <span className="forecast-metric-caption">+{activePoint.horizon} Projected CHRI</span>
              <div className="forecast-big-value-row">
                <span className="forecast-score-val">{activePoint.projected_chri.toFixed(1)}</span>
                <span className="forecast-score-max">/ 100</span>
                <span
                  className="forecast-delta-chip"
                  style={{
                    color: escStyle.color,
                    background: `${escStyle.color}18`,
                    border: `1px solid ${escStyle.color}40`,
                  }}
                >
                  {escStyle.arrow} {activePoint.delta_chri > 0 ? `+${activePoint.delta_chri.toFixed(1)}` : activePoint.delta_chri.toFixed(1)} vs live
                </span>
              </div>
            </div>

            {/* Confidence Gauge */}
            <div className="forecast-confidence-box">
              <div className="confidence-label-row">
                <span>Certainty</span>
                <span className="confidence-val">{(activePoint.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <div className="confidence-meter-track">
                <div
                  className="confidence-meter-fill"
                  style={{ width: `${activePoint.confidence_score * 100}%` }}
                />
              </div>
              <span className="confidence-sub">Physically constrained</span>
            </div>
          </div>

          {/* Microclimate Telemetry Grid */}
          <div className="forecast-telemetry-grid">
            <div className="forecast-telemetry-tile">
              <span className="telemetry-label">Projected LST</span>
              <span className="telemetry-val thermal">{activePoint.projected_lst_c.toFixed(1)}°C</span>
              <span className="telemetry-sub">Surface thermal mass</span>
            </div>
            <div className="forecast-telemetry-tile">
              <span className="telemetry-label">Ambient Air Temp</span>
              <span className="telemetry-val ambient">{activePoint.projected_ambient_temp_c.toFixed(1)}°C</span>
              <span className="telemetry-sub">2m microclimate air</span>
            </div>
            <div className="forecast-telemetry-tile">
              <span className="telemetry-label">Apparent Heat Index</span>
              <span className="telemetry-val heat-index">{activePoint.projected_heat_index_c.toFixed(1)}°C</span>
              <span className="telemetry-sub">Relative humidity factor</span>
            </div>
          </div>

          {/* Explainable Driver Deltas */}
          {activePoint.driver_breakdown && activePoint.driver_breakdown.length > 0 && (
            <div className="forecast-drivers-section">
              <div className="forecast-drivers-title">
                <span>Forecast Driver Attribution (+{activePoint.horizon})</span>
              </div>
              <div className="forecast-drivers-list">
                {activePoint.driver_breakdown.map((driver) => {
                  const isNegative = driver.delta_impact < 0;
                  return (
                    <div key={driver.driver} className="forecast-driver-item">
                      <div className="forecast-driver-head">
                        <span className="forecast-driver-name">{driver.driver_name}</span>
                        <span
                          className="forecast-driver-impact"
                          style={{
                            color: isNegative ? '#10b981' : driver.delta_impact > 0 ? '#f87171' : '#94a3b8',
                          }}
                        >
                          {driver.delta_impact > 0 ? `+${driver.delta_impact.toFixed(2)}` : driver.delta_impact.toFixed(2)} pts
                        </span>
                      </div>
                      <p className="forecast-driver-desc">{driver.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Peak Risk Summary Banner */}
          <div className="forecast-peak-callout">
            <span className="peak-icon">⚡</span>
            <div className="peak-content">
              <div className="peak-title">
                Peak Escalation at <strong>+{forecast.peak_risk_horizon}</strong> ({forecast.peak_chri.toFixed(1)} CHRI)
              </div>
              <div className="peak-sub">
                Primary Driver: <strong>{forecast.primary_escalation_driver}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
