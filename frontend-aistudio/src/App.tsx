import React, { useState, useEffect, useCallback } from 'react';
import { NavigationTab, Zone, HotspotItem, BackendInterventionItem, Intervention, RealDataMetadata, ZoneGeoJSONCollection } from './types';
import { ZONES } from './data/zones';
import { INTERVENTIONS } from './data/interventions';
import { HeatScapeApi } from './services/api';
import { 
  adaptBackendZonesToFrontend, 
  adaptBackendZoneToFrontend,
  adaptBackendInterventionToFrontend 
} from './services/zoneAdapter';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { HeatMapView } from './components/HeatMapView';
import { HotspotsView } from './components/HotspotsView';
import { HotspotAnalysisView } from './components/HotspotAnalysisView';
import { InterventionPlannerView } from './components/InterventionPlannerView';
import { ReportsView } from './components/ReportsView';
import { Menu } from 'lucide-react';

// Canonical fallback zone representing ZONE-01 in case backend is loading or unreachable
const initialDefaultZone: Zone = ZONES.find(z => z.id === 'ZONE-01') || adaptBackendZoneToFrontend({
  id: 'ZONE-01',
  name: 'Downtown Financial District',
  typology: 'commercial_dense',
  land_surface_temp_c: 42.8,
  baseline_temp_c: 31.5,
  thermal_anomaly_c: 11.3,
  risk_level: 'CRITICAL',
  risk_score: 92,
  total_population: 57600,
  vulnerable_population: 8064,
  vegetation: 0.09,
  imperviousness: 0.88,
  building_density: 0.72,
  area_sqkm: 2.4
});

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  
  // Zones State (starts with calibrated fallback, dynamically populated via GET /api/v1/zones)
  const [zones, setZones] = useState<Zone[]>(() => {
    const hasZone01 = ZONES.some(z => z.id === 'ZONE-01');
    return hasZone01 ? ZONES : [initialDefaultZone, ...ZONES];
  });

  // Selected Zone (default canonical backend zone ID: ZONE-01)
  const [selectedZone, setSelectedZone] = useState<Zone>(initialDefaultZone);

  // Ranked Hotspots from GET /api/v1/hotspots
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);

  // Interventions Catalog State (starts with calibrated fallback, dynamically populated via GET /api/v1/interventions/catalog)
  const [interventionsCatalog, setInterventionsCatalog] = useState<Intervention[]>(INTERVENTIONS);
  const [backendCatalog, setBackendCatalog] = useState<BackendInterventionItem[]>([]);

  // Backend Connectivity State
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);
  const [realDataMeta, setRealDataMeta] = useState<RealDataMetadata | null>(null);
  const [zonesGeoJson, setZonesGeoJson] = useState<ZoneGeoJSONCollection | null>(null);

  // Selected Interventions in Cooling Plan (starts with canonical backend IDs: INT-TREE-CANOPY + INT-COOL-ROOF)
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<string[]>([
    'INT-TREE-CANOPY',
    'INT-COOL-ROOF'
  ]);

  // Municipal Resilience Budget in Lakhs (default ₹30 Lakhs)
  const [budgetLakhs, setBudgetLakhs] = useState<number>(30);

  // Mobile menu drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch live backend data
  const initializeBackendData = useCallback(async () => {
    try {
      setIsLoadingInitialData(true);

      const [healthRes, zonesRes, hotspotsRes, geoJsonRes, catalogRes, realMetaRes] = await Promise.allSettled([
        HeatScapeApi.getHealth(),
        HeatScapeApi.getZones(),
        HeatScapeApi.getHotspots(),
        HeatScapeApi.getZonesGeoJson(),
        HeatScapeApi.getInterventionsCatalog(),
        HeatScapeApi.getRealDataMetadata()
      ]);

      const isOnline = healthRes.status === 'fulfilled' && 
        (healthRes.value.status === 'ok' || healthRes.value.status === 'healthy');
      setBackendOnline(isOnline);

      // Real satellite metadata (Landsat-9 / TIRS-2)
      if (realMetaRes.status === 'fulfilled' && realMetaRes.value?.satellite) {
        setRealDataMeta(realMetaRes.value);
      }

      // GeoJSON spatial boundary layer
      if (geoJsonRes.status === 'fulfilled' && geoJsonRes.value) {
        setZonesGeoJson(geoJsonRes.value);
      }

      // Ranked hotspots
      if (hotspotsRes.status === 'fulfilled' && Array.isArray(hotspotsRes.value)) {
        setHotspots(hotspotsRes.value);
      }

      // Live intervention catalog (takes precedence over mock dataset)
      if (catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value) && catalogRes.value.length > 0) {
        setBackendCatalog(catalogRes.value);
        const adaptedCatalog = catalogRes.value.map(adaptBackendInterventionToFrontend);
        if (adaptedCatalog.length > 0) {
          setInterventionsCatalog(adaptedCatalog);
        }
      }

      // Live zones (takes precedence over mock dataset)
      if (zonesRes.status === 'fulfilled' && Array.isArray(zonesRes.value) && zonesRes.value.length > 0) {
        const geoData = geoJsonRes.status === 'fulfilled' ? geoJsonRes.value : undefined;
        const adapted = adaptBackendZonesToFrontend(zonesRes.value, geoData);
        if (adapted.length > 0) {
          setZones(adapted);
          setSelectedZone((current) => {
            const matched = adapted.find(z => z.id === current.id || z.code === current.code);
            if (matched) return matched;
            const canonicalDefault = adapted.find(z => z.id === 'ZONE-01' || z.code === 'ZONE-01');
            return canonicalDefault || adapted[0];
          });
        }
      }
    } catch (err) {
      console.warn('Backend data initialization failed, using calibrated fallback dataset:', err);
      setBackendOnline(false);
    } finally {
      setIsLoadingInitialData(false);
    }
  }, []);

  // Fetch live backend data on mount
  useEffect(() => {
    let isMounted = true;

    initializeBackendData();

    // Periodic health check
    const healthInterval = setInterval(async () => {
      try {
        const h = await HeatScapeApi.getHealth();
        if (isMounted) {
          setBackendOnline(h.status === 'ok' || h.status === 'healthy');
        }
      } catch {
        if (isMounted) setBackendOnline(false);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(healthInterval);
    };
  }, [initializeBackendData]);

  // Toggle intervention in plan
  const handleToggleIntervention = (interventionId: string) => {
    setSelectedInterventionIds((prev) =>
      prev.includes(interventionId)
        ? prev.filter((id) => id !== interventionId)
        : [...prev, interventionId]
    );
  };

  const handleClearPlan = () => {
    setSelectedInterventionIds([]);
  };

  // Navigations with hotspot context
  const handleOpenAnalysis = (zone: Zone) => {
    setSelectedZone(zone);
    setActiveTab('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPlanner = (zone: Zone) => {
    setSelectedZone(zone);
    setActiveTab('interventions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate current total cost in Lakhs using active interventions catalog
  const currentTotalCostLakhs = interventionsCatalog
    .filter((int) => 
      selectedInterventionIds.includes(int.id) || 
      selectedInterventionIds.some(id => id.toUpperCase() === int.id.toUpperCase())
    )
    .reduce((sum, int) => sum + int.costLakhs, 0);

  // Page titles and subtitles
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'HEATSCAPE DASHBOARD',
          subtitle: 'Urban Heat Intelligence & Cooling Planning'
        };
      case 'heatmap':
        return {
          title: 'URBAN HEAT MAP',
          subtitle: 'Satellite Thermal Surface Raster & Microclimate Overlays'
        };
      case 'hotspots':
        return {
          title: 'MUNICIPAL HOTSPOTS INVENTORY',
          subtitle: 'Ranked Comparative Directory of Surveyed Urban Microclimates'
        };
      case 'analysis':
        return {
          title: 'HOTSPOT ANALYSIS',
          subtitle: `Causal Attribution & Vulnerability Diagnostics — ${selectedZone.code} (${selectedZone.name})`
        };
      case 'interventions':
        return {
          title: 'COOLING INTERVENTION PLANNER',
          subtitle: `Portfolio Optimization & Budget Modeling — ${selectedZone.code} (${selectedZone.name})`
        };
      case 'reports':
        return {
          title: 'REPORTS & CITY ANALYTICS',
          subtitle: 'Metropolitan Heat Severity & Municipal Adaptation Progress'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-['Work_Sans',sans-serif]">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Persistent Left Navigation Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          selectedZone={selectedZone}
        />
      </div>

      {/* Main Content Workspace */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-[#F8FAFC]">
        {/* Mobile Header Bar Toggle */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#064E3B] text-white border-b border-emerald-900">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-emerald-800/80 text-white hover:bg-emerald-700"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-emerald-400 rounded flex items-center justify-center">
              <span className="text-emerald-950 font-black text-xs">H</span>
            </div>
            <span className="font-heading font-extrabold text-sm text-white tracking-tight uppercase">HeatScape</span>
          </div>
          <span className="text-[10px] font-mono-data text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
            {selectedZone.code}
          </span>
        </div>

        {/* Global Context Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          activeTab={activeTab}
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          onNavigate={setActiveTab}
          selectedInterventionsCount={selectedInterventionIds.length}
          totalCostLakhs={currentTotalCostLakhs}
          backendStatus={backendOnline === true ? 'connected' : backendOnline === false ? 'error' : 'checking'}
          onRetryConnect={initializeBackendData}
          realDataMeta={realDataMeta}
        />

        {/* Primary Page Canvas (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {activeTab === 'dashboard' && (
            <DashboardView
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenAnalysis={handleOpenAnalysis}
              onOpenPlanner={handleOpenPlanner}
              hotspots={hotspots}
              geoJson={zonesGeoJson}
            />
          )}

          {activeTab === 'heatmap' && (
            <HeatMapView
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenAnalysis={handleOpenAnalysis}
              onOpenPlanner={handleOpenPlanner}
              hotspots={hotspots}
              geoJson={zonesGeoJson}
            />
          )}

          {activeTab === 'hotspots' && (
            <HotspotsView
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenAnalysis={handleOpenAnalysis}
              onOpenPlanner={handleOpenPlanner}
              hotspots={hotspots}
            />
          )}

          {activeTab === 'analysis' && (
            <HotspotAnalysisView
              selectedZone={selectedZone}
              zones={zones}
              onSelectZone={setSelectedZone}
              selectedInterventionIds={selectedInterventionIds}
              onToggleIntervention={handleToggleIntervention}
              onNavigateToPlanner={handleOpenPlanner}
            />
          )}

          {activeTab === 'interventions' && (
            <InterventionPlannerView
              selectedZone={selectedZone}
              zones={zones}
              onSelectZone={setSelectedZone}
              selectedInterventionIds={selectedInterventionIds}
              onToggleIntervention={handleToggleIntervention}
              onClearPlan={handleClearPlan}
              budgetLakhs={budgetLakhs}
              onUpdateBudget={setBudgetLakhs}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenAnalysis={handleOpenAnalysis}
              onOpenPlanner={handleOpenPlanner}
              selectedInterventionIds={selectedInterventionIds}
            />
          )}
        </main>
      </div>
    </div>
  );
}
