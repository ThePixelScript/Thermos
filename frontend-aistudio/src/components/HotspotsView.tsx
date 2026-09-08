import React, { useState } from 'react';
import { 
  Flame, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowUpDown, 
  Thermometer, 
  Users, 
  Building2, 
  ShieldAlert, 
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  TreePine,
  AlertTriangle
} from 'lucide-react';
import { Zone, RiskLevel, HotspotItem, getRiskFromTemp } from '../types';

interface HotspotsViewProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis: (zone: Zone) => void;
  onOpenPlanner: (zone: Zone) => void;
  hotspots?: HotspotItem[];
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  onOpenPlanner,
  hotspots = []
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [landUseFilter, setLandUseFilter] = useState<string>('all');

  // Quick lookup for backend hotspot items
  const hotspotMap = new Map(hotspots.map((h) => [h.zone_id, h]));

  // Strict sorting by surface temperature descending
  const sortedZones = [...zones].sort((a, b) => b.temperature - a.temperature);

  // Filter zones based on user selection
  const filteredZones = sortedZones.filter((zone) => {
    const derivedRisk = getRiskFromTemp(zone.temperature);
    if (riskFilter !== 'all' && derivedRisk !== riskFilter) {
      return false;
    }
    if (landUseFilter !== 'all' && zone.landUse !== landUseFilter) {
      return false;
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = zone.name.toLowerCase().includes(q);
      const matchCode = zone.code.toLowerCase().includes(q);
      const matchDistrict = zone.district.toLowerCase().includes(q);
      const matchCause = zone.primaryCause.toLowerCase().includes(q);
      return matchName || matchCode || matchDistrict || matchCause;
    }
    return true;
  });

  // Dynamic aggregates derived from master dataset
  const totalSurveyed = zones.length;
  const extremeZones = zones.filter((z) => getRiskFromTemp(z.temperature) === 'extreme');
  const highZones = zones.filter((z) => getRiskFromTemp(z.temperature) === 'high');
  const moderateZones = zones.filter((z) => getRiskFromTemp(z.temperature) === 'moderate');
  const lowZones = zones.filter((z) => getRiskFromTemp(z.temperature) === 'low');
  const activeHotspots = extremeZones.length + highZones.length;
  const avgTemp = (zones.reduce((sum, z) => sum + z.temperature, 0) / totalSurveyed).toFixed(1);

  const getRiskBadgeStyles = (risk: string) => {
    const r = risk.toUpperCase();
    if (r === 'CRITICAL' || r === 'EXTREME') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (r === 'SEVERE' || r === 'HIGH') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (r === 'MODERATE') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getPriorityLabel = (temp: number) => {
    if (temp >= 41) return { label: 'Urgent (0–3m)', color: 'text-red-600' };
    if (temp >= 38) return { label: 'High (3–6m)', color: 'text-orange-600' };
    if (temp >= 34) return { label: 'Moderate (6–12m)', color: 'text-amber-600' };
    return { label: 'Conservation / Cool Sink', color: 'text-emerald-700 font-semibold' };
  };

  return (
    <div id="hotspots-page-view" className="p-6 space-y-6 max-w-[1700px] mx-auto bg-[#F8FAFC]">
      {/* Page Title & Context Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1 font-medium">
            <span>Spatial Heat GIS</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">Hotspot Inventory & Ranking</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight uppercase">
            MUNICIPAL HOTSPOTS INVENTORY
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked comparative directory of all 9 surveyed municipal microclimate zones sorted by measured thermal severity
          </p>
        </div>

        {/* Global Summary Metric Pill */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-sm">
          <Flame className="w-4 h-4 text-red-600" />
          <span className="text-slate-500 font-medium">Active Heat Hotspots:</span>
          <span className="font-mono-data font-extrabold text-red-600 text-sm">{activeHotspots} of {totalSurveyed}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">City Avg:</span>
          <span className="font-mono-data font-bold text-slate-800">{avgTemp}°C</span>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Zones Surveyed</span>
            <span className="text-2xl font-mono-data font-extrabold text-slate-900 mt-1 block">
              {totalSurveyed} Zones
            </span>
            <span className="text-[10px] text-slate-400">Master spatial dataset</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Active Hotspots</span>
            <span className="text-2xl font-mono-data font-extrabold text-orange-600 mt-1 block">
              {activeHotspots} Zones
            </span>
            <span className="text-[10px] text-orange-700 font-medium">High & Extreme (≥38°C)</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Critical / Extreme</span>
            <span className="text-2xl font-mono-data font-extrabold text-red-600 mt-1 block">
              {extremeZones.length} Zones
            </span>
            <span className="text-[10px] text-red-700 font-medium">Acute Hazard (≥41°C)</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Cool / Eco Buffer</span>
            <span className="text-2xl font-mono-data font-extrabold text-emerald-700 mt-1 block">
              {lowZones.length} Zone
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Canopy & River Sink (&lt;34°C)</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <TreePine className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Risk Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Filter Tier:
          </span>
          <button
            id="filter-all-zones"
            onClick={() => setRiskFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            All ({totalSurveyed})
          </button>
          <button
            id="filter-extreme-zones"
            onClick={() => setRiskFilter('extreme')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'extreme'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            Extreme ({extremeZones.length})
          </button>
          <button
            id="filter-high-zones"
            onClick={() => setRiskFilter('high')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'high'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
            }`}
          >
            High ({highZones.length})
          </button>
          <button
            id="filter-moderate-zones"
            onClick={() => setRiskFilter('moderate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'moderate'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            Moderate ({moderateZones.length})
          </button>
          <button
            id="filter-low-zones"
            onClick={() => setRiskFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'low'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            Low / Cool ({lowZones.length})
          </button>
        </div>

        {/* Search Input & Land Use Filter */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="hotspot-search-input"
              type="text"
              placeholder="Search zone, cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 w-48 sm:w-60"
            />
          </div>

          <select
            id="hotspots-landuse-filter"
            value={landUseFilter}
            onChange={(e) => setLandUseFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Land Uses</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Transit Hub">Transit Hub</option>
            <option value="High-Density Residential">Residential</option>
            <option value="Mixed Urban">Mixed Urban</option>
            <option value="Institutional">Institutional</option>
          </select>
        </div>
      </div>

      {/* Primary Hotspots Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-sm text-slate-900 tracking-wide uppercase">
              Monitored Microclimates
            </span>
            <span className="text-[11px] font-mono-data text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Showing {filteredZones.length} of {totalSurveyed} zones
            </span>
          </div>
          <span className="text-xs text-slate-500 italic">
            *Ranked strictly by measured surface temperature descending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-heading font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-16">Rank</th>
                <th className="py-3.5 px-4">Zone & Location</th>
                <th className="py-3.5 px-4">Surface Temp</th>
                <th className="py-3.5 px-4">Risk Tier</th>
                <th className="py-3.5 px-4">Main Cause / Context</th>
                <th className="py-3.5 px-4">Exposed Pop</th>
                <th className="py-3.5 px-4">Intervention Urgency</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredZones.map((zone) => {
                // Find actual global index in sortedZones or backend rank
                const backendHotspot = hotspotMap.get(zone.id);
                const globalRank = sortedZones.findIndex((z) => z.id === zone.id) + 1;
                const displayRank = backendHotspot?.rank ?? globalRank;
                const derivedRisk = getRiskFromTemp(zone.temperature);
                const displayRiskLevel = backendHotspot?.risk_level || zone.backendRiskLevel || derivedRisk.toUpperCase();
                const isSelected = selectedZone.id === zone.id;
                const priority = getPriorityLabel(zone.temperature);

                return (
                  <tr
                    key={zone.id}
                    id={`hotspot-row-${zone.id}`}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/50 hover:bg-emerald-50/80 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50/80'
                    }`}
                    onClick={() => onSelectZone(zone)}
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data font-bold text-xs ${
                        displayRank <= 3 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : displayRank <= 5
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : displayRank <= 8
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        #{displayRank}
                      </span>
                    </td>

                    {/* Zone Code & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-heading font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                            <span>{zone.code}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono-data bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">{zone.name}</div>
                          <div className="text-[10px] text-slate-400">{zone.district} • {backendHotspot?.typology || zone.landUse}</div>
                        </div>
                      </div>
                    </td>

                    {/* Measured Surface Temp */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono-data font-extrabold text-base text-slate-900">
                        {backendHotspot?.land_surface_temp_c ?? zone.temperature}°C
                      </div>
                      <div className={`text-[10px] font-mono-data font-semibold ${
                        (backendHotspot?.thermal_anomaly_c ?? zone.diffFromSurround) > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {backendHotspot 
                          ? `+${backendHotspot.thermal_anomaly_c}°C anomaly`
                          : (zone.diffFromSurround > 0 ? `+${zone.diffFromSurround}°C vs base` : `${zone.diffFromSurround}°C cool sink`)}
                      </div>
                    </td>

                    {/* Risk Tier Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${getRiskBadgeStyles(displayRiskLevel)}`}>
                        {displayRiskLevel}
                      </span>
                    </td>

                    {/* Main Cause / Context */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-700 font-medium line-clamp-2">
                        {backendHotspot?.dominant_driver 
                          ? `${backendHotspot.dominant_driver} (${backendHotspot.dominant_driver_pct}%)`
                          : zone.primaryCause}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Canopy: <strong className="text-slate-700">{zone.vegetation}%</strong></span>
                        <span>•</span>
                        <span>Impervious: <strong className="text-slate-700">{zone.imperviousSurface}%</strong></span>
                      </div>
                    </td>

                    {/* Population Exposed */}
                    <td className="py-3.5 px-4 font-mono-data">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {(backendHotspot?.total_population ?? zone.population).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {backendHotspot?.vulnerable_population ? (
                          <span className="text-purple-700 font-semibold">{backendHotspot.vulnerable_population.toLocaleString()} vulnerable</span>
                        ) : (
                          <span>HVI: <span className={zone.hvi >= 7 ? 'text-red-600 font-bold' : 'text-slate-600 font-medium'}>{zone.hvi} / 10</span></span>
                        )}
                      </div>
                    </td>

                    {/* Urgency */}
                    <td className="py-3.5 px-4">
                      <span className={`text-xs ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          id={`btn-analyze-zone-${zone.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(zone);
                            onOpenAnalysis(zone);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#065F46] text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
                          title={`Open Hotspot Analysis for ${zone.code}`}
                        >
                          <Thermometer className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Analyze</span>
                        </button>

                        <button
                          id={`btn-plan-zone-${zone.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(zone);
                            onOpenPlanner(zone);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-all hidden sm:inline-flex items-center space-x-1"
                          title={`Plan Interventions for ${zone.code}`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Plan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
