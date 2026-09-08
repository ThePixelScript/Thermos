/**
 * THERMOS Geospatial Platform — Enterprise Floating Layer Control Dock
 * 
 * Floating segmented control dock positioned at the top-right of the map.
 * Grouped into 5 enterprise categories:
 * - Base Layers
 * - Environmental (LST, NDVI, CHRI)
 * - Urban Form (Buildings, Roads, Population)
 * - Hydrology (Water Bodies)
 * - Atmosphere (Wind Particles, AQI)
 */
import React, { useState } from 'react';
import type { LayerId, LayerMetadata } from '../../lib/map/layerManager';

interface LayerControlProps {
  layers: LayerMetadata[];
  onToggleLayer: (id: LayerId) => void;
  onUpdateOpacity: (id: LayerId, opacity: number) => void;
  onResetCamera: () => void;
}

type EnterpriseGroup = 'Base Layers' | 'Environmental' | 'Urban Form' | 'Hydrology' | 'Atmosphere';

const GROUP_MAPPING: Record<LayerId, EnterpriseGroup> = {
  basemap: 'Base Layers',
  chri: 'Environmental',
  lst: 'Environmental',
  ndvi: 'Environmental',
  buildings: 'Urban Form',
  roads: 'Urban Form',
  population: 'Urban Form',
  waterbodies: 'Hydrology',
  wind: 'Atmosphere',
  aqi: 'Atmosphere',
};

const ENTERPRISE_GROUPS: { id: EnterpriseGroup; label: string; icon: string }[] = [
  { id: 'Base Layers', label: 'Base', icon: '🗺️' },
  { id: 'Environmental', label: 'Environmental', icon: '🌡️' },
  { id: 'Urban Form', label: 'Urban Form', icon: '🏙️' },
  { id: 'Hydrology', label: 'Hydrology', icon: '💧' },
  { id: 'Atmosphere', label: 'Atmosphere', icon: '💨' },
];

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer,
  onUpdateOpacity,
  onResetCamera,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeGroup, setActiveGroup] = useState<EnterpriseGroup>('Environmental');

  const currentLayers = layers.filter((l) => GROUP_MAPPING[l.id] === activeGroup);

  return (
    <div className={`map-dock-container ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Dock Bar */}
      <div className="map-dock-bar">
        {/* Category Segmented Tabs */}
        <div className="dock-segmented-tabs">
          {ENTERPRISE_GROUPS.map((grp) => {
            const grpLayers = layers.filter((l) => GROUP_MAPPING[l.id] === grp.id);
            const activeInGrp = grpLayers.filter((l) => l.visible).length;
            const isSelected = activeGroup === grp.id;

            return (
              <button
                key={grp.id}
                className={`dock-segment-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setActiveGroup(grp.id);
                  if (!isOpen) setIsOpen(true);
                }}
                title={grp.id}
              >
                <span className="dock-icon">{grp.icon}</span>
                <span className="dock-label">{grp.label}</span>
                {activeInGrp > 0 && <span className="dock-active-dot" />}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="dock-action-group">
          <button
            className="dock-reset-btn"
            onClick={onResetCamera}
            title="Reset Map View to Chennai Urban Core"
          >
            🎯
          </button>
          <button
            className="dock-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Collapse Layer Dock' : 'Expand Layer Dock'}
          >
            {isOpen ? '▴' : '▾'}
          </button>
        </div>
      </div>

      {/* Expanded Segmented Control Drawer */}
      {isOpen && (
        <div className="dock-drawer-content">
          <div className="dock-group-header">
            <span className="group-title">{activeGroup}</span>
            <span className="group-counter">
              {currentLayers.filter((l) => l.visible).length} / {currentLayers.length} active
            </span>
          </div>

          {/* Segmented Layer Pills */}
          <div className="dock-layer-pills-row">
            {currentLayers.map((layer) => {
              return (
                <div key={layer.id} className="dock-layer-control-unit">
                  <button
                    className={`layer-pill-switch ${layer.visible ? 'active' : ''}`}
                    onClick={() => onToggleLayer(layer.id)}
                  >
                    <span className="pill-status-dot" />
                    <span className="pill-name">{layer.name}</span>
                  </button>

                  {/* Inline micro-slider for visible active layers */}
                  {layer.visible && layer.status === 'active' && (
                    <div className="dock-micro-slider">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={layer.opacity}
                        onChange={(e) => onUpdateOpacity(layer.id, parseFloat(e.target.value))}
                        className="micro-slider"
                        title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
                      />
                      <span className="micro-val">{Math.round(layer.opacity * 100)}%</span>
                    </div>
                  )}

                  {/* Mini-Legend */}
                  {layer.visible && layer.legend && (
                    <div className="dock-mini-legend">
                      {layer.legend.type === 'gradient' ? (
                        <div className="dock-gradient-bar">
                          <div
                            className="gradient-fill"
                            style={{
                              background: `linear-gradient(to right, ${layer.legend.items.map((it) => it.color).join(', ')})`,
                            }}
                          />
                          <div className="gradient-labels">
                            <span>{layer.legend.items[0]?.label}</span>
                            <span>{layer.legend.items[layer.legend.items.length - 1]?.label}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="dock-discrete-legend">
                          {layer.legend.items.map((item) => (
                            <span key={item.label} className="discrete-item">
                              <span className="dot" style={{ backgroundColor: item.color }} />
                              <span className="txt">{item.label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

