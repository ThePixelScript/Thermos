import React, { useState } from 'react';
import { 
  Filter, 
  Layers, 
  Flame, 
  Building2, 
  TreePine, 
  Wind, 
  Users, 
  ChevronRight, 
  MapPin, 
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Thermometer,
  ShieldAlert
} from 'lucide-react';
import { Zone, RiskLevel } from '../types';
import { HeatMapCanvas } from './HeatMapCanvas';

interface HeatMapViewProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis: (zone: Zone) => void;
  onOpenPlanner: (zone: Zone) => void;
}

export const HeatMapView: React.FC<HeatMapViewProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  onOpenPlanner
}) => {
  // Map Filters
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [minTempFilter, setMinTempFilter] = useState<number>(30);
  const [selectedLandUse, setSelectedLandUse] = useState<string>('all');
  const [showSidePanel, setShowSidePanel] = useState<boolean>(true);

  // Derived filter list
  const riskLevels: RiskLevel[] | undefined = 
    selectedRiskFilter === 'all' 
      ? undefined 
      : [selectedRiskFilter as RiskLevel];

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'extreme': return '#ef4444';
      case 'high': return '#f97316';
      case 'moderate': return '#eab308';
      case 'low': return '#10b981';
    }
  };

  return (
    <div id="full-heat-map-view" className="p-6 space-y-4 max-w-[1700px] mx-auto flex flex-col h-full bg-[#F8FAFC]">
      {/* Title & Filter Bar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-0.5 font-medium">
            <span>Spatial Heat GIS</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">Land Surface Temperature (LST) Raster</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            URBAN HEAT SURFACE MAP
          </h2>
          <p className="text-xs text-slate-500">
            High-resolution satellite thermal raster overlay & neighborhood microclimate analytics
          </p>
        </div>

        {/* Global Map Filters & Inspector Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Risk Level Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
            <span className="text-slate-500 mr-1.5 font-medium">Risk Tier:</span>
            <select
              id="map-page-risk-filter"
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Heat Zones</option>
              <option value="extreme">Extreme (&gt;41°C)</option>
              <option value="high">High (38–41°C)</option>
              <option value="moderate">Moderate (34–38°C)</option>
              <option value="low">Cool (&lt;34°C)</option>
            </select>
          </div>

          {/* Temperature Threshold Slider */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs space-x-2 shadow-sm">
            <Thermometer className="w-3.5 h-3.5 text-red-600" />
            <span className="text-slate-500 font-medium">Min Temp:</span>
            <span className="font-mono-data text-slate-900 font-bold">{minTempFilter}°C</span>
            <input
              id="map-page-temp-slider"
              type="range"
              min="30"
              max="43"
              step="1"
              value={minTempFilter}
              onChange={(e) => setMinTempFilter(Number(e.target.value))}
              className="w-16 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Land Use Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <span className="text-slate-500 mr-1.5 font-medium">Land Use:</span>
            <select
              id="map-page-landuse-filter"
              value={selectedLandUse}
              onChange={(e) => setSelectedLandUse(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Land Uses</option>
              <option value="Commercial">Commercial Core</option>
              <option value="Industrial">Industrial / Logistics</option>
              <option value="High-Density Residential">Dense Residential</option>
              <option value="Transit Hub">Transit Interchange</option>
              <option value="Institutional">Institutional</option>
              <option value="Mixed Urban">Mixed Urban / Eco Buffer</option>
            </select>
          </div>

          {/* Inspector Drawer Toggle */}
          <button
            id="toggle-inspector-btn"
            onClick={() => setShowSidePanel(!showSidePanel)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm ${
              showSidePanel 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showSidePanel ? 'Hide Inspector' : 'Show Inspector'}</span>
          </button>
        </div>
      </div>

      {/* Dominant Map Canvas with Integrated Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* Dominant Map Container */}
        <div className={`${showSidePanel ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} flex flex-col`}>
          <HeatMapCanvas
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            onOpenAnalysis={onOpenAnalysis}
            heightClass="h-[620px] lg:h-[700px]"
            filterRiskLevels={riskLevels}
            minTempFilter={minTempFilter}
            landUseFilter={selectedLandUse}
          />
        </div>

        {/* Floating / Docked Hotspot Inspector Panel */}
        {showSidePanel && (
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full shadow-sm space-y-4">
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400">
                    Zone Telemetry Inspector
                  </span>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                    {selectedZone.code}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedZone.name}</p>
                </div>
                <div 
                  className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase border"
                  style={{
                    backgroundColor: `${getRiskColor(selectedZone.risk)}15`,
                    color: getRiskColor(selectedZone.risk),
                    borderColor: `${getRiskColor(selectedZone.risk)}35`
                  }}
                >
                  {selectedZone.risk} Risk
                </div>
              </div>

              {/* Thermal Overview Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">Observed Land Surface Temp (LST):</span>
                  <span className="font-mono-data text-2xl font-extrabold text-slate-900">
                    {selectedZone.temperature}°C
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Surround Delta:</span>
                  <span className={`font-mono-data font-bold ${
                    selectedZone.diffFromSurround > 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {selectedZone.diffFromSurround > 0 
                      ? `+${selectedZone.diffFromSurround}°C above baseline` 
                      : `${selectedZone.diffFromSurround}°C below baseline (Cool Sink)`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Peak Midday:</span>
                  <span className="font-mono-data text-slate-800 font-semibold">
                    {selectedZone.peakTemp}°C
                  </span>
                </div>
              </div>

              {/* Physical Driver Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>{selectedZone.risk === 'low' ? 'Natural Cooling Factors' : 'Thermal Drivers'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Multi-factor Attribution</span>
                </span>
                <div className="space-y-2">
                  {selectedZone.causes.map((cause, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 truncate max-w-[180px]">{cause.name}</span>
                        <span className="font-mono-data font-bold text-slate-800">{cause.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cause.percentage}%`,
                            backgroundColor: cause.color || '#059669'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exposure Indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-medium">Exposed Pop</span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {selectedZone.population.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-medium">Heat Vuln (HVI)</span>
                  <span className="font-mono-data font-bold text-red-600 text-sm">
                    {selectedZone.hvi} / 10
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2 mt-auto">
                <button
                  id="inspector-open-analysis-btn"
                  onClick={() => onOpenAnalysis(selectedZone)}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold border border-slate-300 flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                >
                  <Thermometer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Open Full Hotspot Analysis</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="inspector-build-plan-btn"
                  onClick={() => onOpenPlanner(selectedZone)}
                  className="w-full py-2.5 px-3 bg-[#064E3B] hover:bg-[#065F46] text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Plan Cooling Interventions</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
