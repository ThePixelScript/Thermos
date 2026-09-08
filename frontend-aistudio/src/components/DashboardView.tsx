import React, { useState } from 'react';
import { 
  Thermometer, 
  Flame, 
  Users, 
  TrendingDown, 
  Filter, 
  ChevronRight, 
  ArrowUpRight, 
  ShieldAlert, 
  Calendar,
  Building,
  Sparkles,
  TreePine,
  Layers,
  MapPin
} from 'lucide-react';
import { Zone, RiskLevel, HotspotItem } from '../types';
import { deriveCityMetricsFromBackend } from '../services/zoneAdapter';
import { HeatMapCanvas } from './HeatMapCanvas';

interface DashboardViewProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis: (zone: Zone) => void;
  onOpenPlanner: (zone: Zone) => void;
  hotspots?: HotspotItem[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  onOpenPlanner,
  hotspots = []
}) => {
  // Derive live city metrics from live backend data
  const cityMetrics = deriveCityMetricsFromBackend(zones, hotspots);

  // Filter States
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [minTempFilter, setMinTempFilter] = useState<number>(30);
  const [vegetationFilter, setVegetationFilter] = useState<number>(100);
  const [selectedLandUse, setSelectedLandUse] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Derived filter list
  const riskLevels: RiskLevel[] | undefined = 
    selectedRiskFilter === 'all' 
      ? undefined 
      : [selectedRiskFilter as RiskLevel];

  const getRiskBadge = (risk: RiskLevel, backendRiskLevel?: string) => {
    const raw = backendRiskLevel || risk;
    const label = (typeof raw === 'string' ? raw : 'MODERATE').toUpperCase();
    switch (label) {
      case 'CRITICAL':
      case 'EXTREME':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-red-700 border border-red-200 flex items-center space-x-1 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span>{label}</span>
          </span>
        );
      case 'SEVERE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
            {label}
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase">
            {label}
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
            {label}
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            {label || 'LOW / COOL'}
          </span>
        );
    }
  };

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* View Title & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>Metropolitan Resilience</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">Operational Heat Deck</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight uppercase">
            HEATSCAPE DASHBOARD
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Urban Heat Intelligence & Cooling Planning
          </p>
        </div>

        {/* Temporal / Satellite Sync Status */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-slate-500">Observation:</span>
          <span className="text-slate-900 font-semibold">TIR Radiometric Snapshot</span>
          <span className="text-[10px] font-mono-data bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
            Calibrated Sample
          </span>
        </div>
      </div>

      {/* 4 KEY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Surface Temperature */}
        <div 
          id="metric-card-avg-temp"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-600/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Average Surface Temperature
            </span>
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-data text-slate-900">
              {cityMetrics.averageSurfaceTemp}°C
            </span>
            <span className={`text-xs font-bold flex items-center ${cityMetrics.tempDiffVsBaseline >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {cityMetrics.tempDiffVsBaseline >= 0 ? `+${cityMetrics.tempDiffVsBaseline}` : cityMetrics.tempDiffVsBaseline}°C vs baseline
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
            <span>Metropolitan Core Scan</span>
            <span className="font-mono-data text-slate-600 font-semibold">{cityMetrics.baselineTemp}°C Baseline</span>
          </div>
        </div>

        {/* Metric 2: Active Hotspots */}
        <div 
          id="metric-card-active-hotspots"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-600/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Active Hotspots
            </span>
            <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-data text-slate-900">
              {cityMetrics.activeHotspotsCount} Zones
            </span>
            <span className="text-xs font-bold text-orange-600">
              {cityMetrics.criticalZonesCount} Critical Alert
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
            <span>Authoritative Hotspot Status</span>
            <span className="font-mono-data text-emerald-700 font-semibold">Focus: {selectedZone?.code || 'ZONE-01'}</span>
          </div>
        </div>

        {/* Metric 3: Population at Risk */}
        <div 
          id="metric-card-pop-risk"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-600/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Population at Risk
            </span>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-data text-slate-900">
              {cityMetrics.totalPopulationAtRisk.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-600">
              High Vulnerability
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
            <span>Thermal Vulnerability Index</span>
            <span className="font-mono-data text-slate-600 font-semibold">Live GIS Metric</span>
          </div>
        </div>

        {/* Metric 4: Estimated Cooling Potential */}
        <div 
          id="metric-card-cooling-potential"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-600/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
              Estimated Cooling Potential
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono-data text-slate-400">
              N/A
            </span>
            <span className="text-xs font-bold text-emerald-700">
              Simulate in Planner
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
            <span>Citywide Target</span>
            <span className="font-mono-data text-emerald-700 font-semibold">Scenario Engine Ready</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR FOR MAP & HOTSPOTS */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider">
              Geospatial Filters:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Heat Risk Filter */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">Heat Risk:</span>
              <select
                id="filter-heat-risk"
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="all">All Risk Tiers</option>
                <option value="extreme">Extreme (&gt;41°C)</option>
                <option value="high">High (38–41°C)</option>
                <option value="moderate">Moderate (34–38°C)</option>
                <option value="low">Low (&lt;34°C)</option>
              </select>
            </div>

            {/* Min Temperature Slider */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">Min Temp:</span>
              <span className="font-mono-data text-slate-900 font-bold">{minTempFilter}°C</span>
              <input
                id="filter-min-temp"
                type="range"
                min="30"
                max="43"
                step="1"
                value={minTempFilter}
                onChange={(e) => setMinTempFilter(Number(e.target.value))}
                className="w-20 accent-emerald-700 cursor-pointer"
              />
            </div>

            {/* Land Use Filter */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">Land Use:</span>
              <select
                id="filter-land-use"
                value={selectedLandUse}
                onChange={(e) => setSelectedLandUse(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="all">All Land Uses</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="High-Density Residential">Residential</option>
                <option value="Transit Hub">Transit Hub</option>
                <option value="Institutional">Institutional</option>
              </select>
            </div>

            {/* Date / Time Horizon Filter */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">Date:</span>
              <select
                id="filter-date-range"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="today">Today (Peak 14:00 TIR)</option>
                <option value="yesterday">Yesterday Mean</option>
                <option value="7days">7-Day Rolling Max</option>
                <option value="seasonal">Summer Peak 2026</option>
              </select>
            </div>

            {/* Reset Filter Action */}
            {(selectedRiskFilter !== 'all' || minTempFilter !== 30 || selectedLandUse !== 'all') && (
              <button
                onClick={() => {
                  setSelectedRiskFilter('all');
                  setMinTempFilter(30);
                  setSelectedLandUse('all');
                }}
                className="text-[11px] text-emerald-700 font-bold hover:underline ml-1"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAP & PRIORITY HOTSPOTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Large Interactive Heat Map Canvas */}
        <div className="xl:col-span-8 flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider">
                Geographic Thermal Surface Raster
              </span>
              <span className="text-[11px] text-slate-500">
                (Click any hotspot marker to open diagnostic analysis)
              </span>
            </div>
            <span className="text-[11px] font-mono-data text-emerald-700 font-bold">
              Active Focus: {selectedZone.code}
            </span>
          </div>

          <HeatMapCanvas
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            onOpenAnalysis={onOpenAnalysis}
            heightClass="h-[520px] lg:h-[580px]"
            filterRiskLevels={riskLevels}
            minTempFilter={minTempFilter}
            maxVegetationFilter={vegetationFilter}
            landUseFilter={selectedLandUse}
          />
        </div>

        {/* Priority Hotspots List (Beside Map) */}
        <div className="xl:col-span-4 flex flex-col">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full shadow-sm">
            {/* List Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-tight flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-red-600" />
                  <span>Priority Hotspots</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ranked by authoritative heat risk ({hotspots.length > 0 ? `${hotspots.length} Active Hotspots` : `${cityMetrics.activeHotspotsCount} Active Hotspots`})
                </p>
              </div>
              <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                {hotspots.length > 0 ? `${hotspots.length} Hotspots` : `${cityMetrics.activeHotspotsCount} Hotspots`}
              </span>
            </div>

            {/* Hotspots Scrollable List */}
            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[500px] pr-1 flex-1">
              {hotspots.length > 0 ? (
                hotspots.map((hotspot) => {
                  const zone = zones.find((z) => z.id === hotspot.zone_id) || {
                    id: hotspot.zone_id,
                    code: hotspot.zone_id,
                    name: hotspot.zone_name,
                    district: hotspot.typology || 'Urban Zone',
                    temperature: hotspot.temperature ?? hotspot.land_surface_temp_c ?? 40.0,
                    population: hotspot.total_population ?? 30000,
                    landUse: hotspot.typology || 'Mixed Urban',
                    primaryCause: hotspot.dominant_driver 
                      ? `${hotspot.dominant_driver}${hotspot.dominant_driver_pct ? ` (${hotspot.dominant_driver_pct}%)` : ''}`
                      : 'Urban heat accumulation',
                    risk: hotspot.risk_level?.toLowerCase() === 'critical' ? 'extreme' : 'high',
                    backendRiskLevel: hotspot.risk_level as any,
                    areaKm2: hotspot.area_sqkm || 2.0
                  } as Zone;
                  const isSelected = selectedZone.id === zone.id;
                  const temp = hotspot.temperature ?? hotspot.land_surface_temp_c ?? zone.temperature;
                  const driver = hotspot.dominant_driver 
                    ? `${hotspot.dominant_driver}${hotspot.dominant_driver_pct ? ` (${hotspot.dominant_driver_pct}%)` : ''}`
                    : zone.primaryCause;
                  const pop = hotspot.total_population ?? zone.population;

                  return (
                    <div
                      key={hotspot.zone_id}
                      id={`priority-hotspot-${hotspot.zone_id}`}
                      onClick={() => onSelectZone(zone)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                          : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono-data text-slate-400 font-bold">
                            #{hotspot.rank}
                          </span>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-heading font-bold text-slate-900 text-xs">
                                {hotspot.zone_id}
                              </span>
                              <span className="text-[10px] text-slate-600 truncate max-w-[120px] font-medium" title={hotspot.zone_name}>
                                {hotspot.zone_name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {zone.landUse || hotspot.typology || 'Urban Zone'} • {pop ? pop.toLocaleString() : 'N/A'} exposed
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="font-mono-data font-extrabold text-sm text-slate-900">
                            {temp !== undefined ? `${temp}°C` : 'N/A'}
                          </span>
                          <span className="mt-0.5">{getRiskBadge(zone.risk, hotspot.risk_level || zone.backendRiskLevel)}</span>
                        </div>
                      </div>

                      {/* Primary Driver Bar Preview */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 truncate text-[10px] max-w-[170px]" title={driver}>
                          {driver}
                        </span>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button
                            id={`analyze-btn-${hotspot.zone_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectZone(zone);
                              onOpenAnalysis(zone);
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center space-x-1 transition-all shadow-xs"
                          >
                            <span>Analyze</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Fallback if backend hotspots not available */
                zones
                  .filter((z) => z.backendRiskLevel !== 'LOW' && z.risk !== 'low')
                  .map((zone, idx) => {
                    const isSelected = selectedZone.id === zone.id;
                    return (
                      <div
                        key={zone.id}
                        id={`priority-hotspot-${zone.id}`}
                        onClick={() => onSelectZone(zone)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                            : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono-data text-slate-400 font-bold">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-heading font-bold text-slate-900 text-xs">
                                  {zone.code}
                                </span>
                                <span className="text-[10px] text-slate-600 truncate max-w-[120px] font-medium">
                                  {zone.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {zone.landUse} • {zone.population.toLocaleString()} exposed
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end">
                            <span className="font-mono-data font-extrabold text-sm text-slate-900">
                              {zone.temperature}°C
                            </span>
                            <span className="mt-0.5">{getRiskBadge(zone.risk, zone.backendRiskLevel)}</span>
                          </div>
                        </div>

                        {/* Primary Driver Bar Preview */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 truncate text-[10px] max-w-[170px]" title={zone.primaryCause}>
                            {zone.primaryCause}
                          </span>
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              id={`analyze-btn-${zone.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectZone(zone);
                                onOpenAnalysis(zone);
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center space-x-1 transition-all shadow-xs"
                            >
                              <span>Analyze</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}

              {/* Urban Cool Island / Eco Buffer Section */}
              {zones
                .filter((z) => z.backendRiskLevel === 'LOW' || z.risk === 'low')
                .map((zone) => {
                  const isSelected = selectedZone.id === zone.id;
                  const offsetText = zone.diffFromSurround !== undefined
                    ? `${zone.diffFromSurround > 0 ? '+' : ''}${zone.diffFromSurround}°C vs baseline (${zone.name})`
                    : `${zone.district || 'Ecological thermal buffer'}`;

                  return (
                    <div
                      key={zone.id}
                      id={`eco-buffer-${zone.id}`}
                      onClick={() => onSelectZone(zone)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                            <TreePine className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-heading font-bold text-emerald-950 text-xs">
                                {zone.code}
                              </span>
                              <span className="text-[10px] text-emerald-800 truncate max-w-[120px] font-medium">
                                {zone.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-medium">
                              Ecological Cooling Sink • {zone.population.toLocaleString()} pop
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className="font-mono-data font-extrabold text-sm text-emerald-700">
                            {zone.temperature}°C
                          </span>
                          <span className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                            LOW / COOL
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 truncate text-[10px] max-w-[170px]" title={offsetText}>
                          {offsetText}
                        </span>
                        <button
                          id={`analyze-eco-btn-${zone.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(zone);
                            onOpenAnalysis(zone);
                          }}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 px-2 py-0.5 rounded bg-white hover:bg-emerald-100/60 border border-emerald-300 flex items-center space-x-1 transition-all shadow-xs"
                        >
                          <span>Diagnose</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Quick Action Footer */}
            <div className="pt-3 border-t border-slate-200 mt-3">
              <button
                id="btn-goto-planner"
                onClick={() => onOpenPlanner(selectedZone)}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold tracking-tight flex items-center justify-center space-x-2 shadow-md shadow-emerald-800/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Build Cooling Plan for {selectedZone.code}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
