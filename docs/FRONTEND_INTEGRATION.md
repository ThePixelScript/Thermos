# THERMOS / HeatScape Frontend Integration Guide

> **Core Principle:** The frontend is a presentation layer. The backend should remain the source of truth for analytical values.

---

## Section 1 — Project Overview

- **Frontend Purpose:** Municipal urban heat intelligence and resilience planning platform. It enables municipal climate engineers, urban resilience officers, and city planners to diagnose microclimate heat islands, explore satellite-derived land surface temperature (LST) and thermal anomalies, analyze biophysical heat drivers (impervious coverage, vegetation deficit, building density), and model multi-intervention cooling portfolios against budgetary constraints.
- **Framework:** React 19 (`react` ^19.0.1, `react-dom` ^19.0.1)
- **Language:** TypeScript 5.8 (`typescript` ~5.8.2, strict mode, ESM module syntax)
- **Build Tool:** Vite 6.2 (`vite` ^6.2.3, `@vitejs/plugin-react` ^5.0.4)
- **Styling Approach:** Tailwind CSS v4 using Vite native integration (`@tailwindcss/vite` ^4.1.14, `@import "tailwindcss";` in `src/index.css`). No legacy PostCSS or CSS-in-JS libraries.
- **Icon Library:** Lucide React (`lucide-react` ^0.546.0)
- **Animation Engine:** Motion (`motion` ^12.23.24)
- **Map Implementation:** Custom interactive high-resolution SVG canvas (`src/components/HeatMapCanvas.tsx`) with spatial coordinate projection, interactive vector polygons, heat raster gradient simulation, pan/zoom transformation matrix, and microclimate overlay layers. Designed for direct binding to GeoJSON feature collections (`GET /api/v1/zones/geojson`).
- **Chart & Visualization Approach:** Lightweight, zero-dependency custom SVG and CSS analytical visualizers (diurnal hourly curves, thermal risk distribution bars, bento progress meters, and driver contribution bar charts) optimized for responsive rendering in municipal command centers.
- **Development Server:** Vite development server running on `http://0.0.0.0:3000` (externally routed through reverse proxy).
- **Frontend Entry Point:** `index.html` → `src/main.tsx` → `src/App.tsx`.
- **Current Architecture:** Single Page Application (SPA) with centralized top-level state management in `src/App.tsx`. API communication is isolated in `src/services/api.ts` (`HeatScapeApi`), biophysical data normalization occurs in `src/services/zoneAdapter.ts`, and views receive state and dispatch callbacks through standardized TypeScript interfaces.

---

## Section 2 — Complete File Tree

```
/
├── .env.example                       # Documents required environment variables (VITE_API_URL, etc.)
├── .gitignore                         # Standard git ignore list (node_modules, dist, etc.)
├── bun.lock                           # Lockfile for Bun / package manager
├── FRONTEND_INTEGRATION.md            # Comprehensive integration documentation (this file)
├── index.html                         # Primary HTML document shell with typography and SEO metadata
├── metadata.json                      # AI Studio platform configuration and app identity
├── package.json                       # Project manifests, scripts, dependencies, and devDependencies
├── tsconfig.json                      # TypeScript compiler configuration (ESNext, React JSX, strict)
├── vite.config.ts                     # Vite build configuration with Tailwind and React plugins
├── public/
│   └── assets/
│       └── aistudio/                  # Platform static image assets
└── src/
    ├── App.tsx                        # Root application component; manages active tab, selected zone, zones, and budget state
    ├── index.css                      # Global Tailwind CSS entry point (@import "tailwindcss";)
    ├── main.tsx                       # React DOM entry point that mounts App into #root
    ├── types.ts                       # Shared TypeScript types, API response interfaces, and domain models
    ├── vite-env.d.ts                  # Vite client type declarations and ImportMetaEnv extensions
    ├── components/
    │   ├── DashboardView.tsx          # Executive citywide overview: KPIs, thermal alerts, mini-map, and quick links
    │   ├── Header.tsx                 # Persistent top navigation bar: zone selector, tab shortcuts, and backend status badge
    │   ├── HeatMapCanvas.tsx          # Interactive SVG map canvas: pan/zoom, layer toggles, zone polygons, and hover tooltip
    │   ├── HeatMapView.tsx            # Full-page spatial view: search/filters sidebar, map controls, and selected zone inspector
    │   ├── HotspotAnalysisView.tsx    # Diagnostic deep-dive: biophysical drivers, diurnal heat curve, and executive brief
    │   ├── HotspotsView.tsx           # Ranked hotspot table: sorting, filtering, priority badges, and quick-action buttons
    │   ├── InterventionPlannerView.tsx# Cooling planner: intervention catalog, budget slider, and simulation impact summary
    │   ├── ReportsView.tsx            # Municipal reporting: citywide distribution, export actions, and zone comparisons
    │   └── Sidebar.tsx                # Left navigation sidebar: branding, navigation items, and active zone summary card
    ├── data/
    │   ├── interventions.ts           # Calibrated fallback catalog of 8 cooling interventions (costs, impacts, co-benefits)
    │   └── zones.ts                   # Calibrated fallback dataset of 9 surveyed urban zones (temperatures, demographics, causes)
    └── services/
        ├── api.ts                     # Centralized API service client calling FastAPI backend endpoints
        └── zoneAdapter.ts             # Normalization layer mapping backend DTOs to UI presentation models
```

---

## Section 3 — File-by-File Inventory

| File | Type | Purpose | Used By | Imports | Data Source | Backend Integration Needed? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `package.json` | Config | Manifest of npm dependencies, scripts (`dev`, `build`, `lint`), and package metadata | Build tooling, Vite, npm | None | Static config | No |
| `vite.config.ts` | Config | Configures Vite plugins (`@vitejs/plugin-react`, `@tailwindcss/vite`) and path aliases | Vite dev server & build | `vite`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `path` | Static config | No |
| `tsconfig.json` | Config | Configures TypeScript compilation options, target (`ES2022`), module resolution, and strict typing | TypeScript compiler (`tsc`) | None | Static config | No |
| `.env.example` | Config | Specifies configuration variables (`VITE_API_URL`) with sample values | Developers, deployment scripts | None | Static template | No |
| `index.html` | HTML Shell | Host page loading fonts (Work Sans, JetBrains Mono, Plus Jakarta Sans) and mounting `/src/main.tsx` | Browser | None | Static markup | No |
| `metadata.json` | Config | AI Studio platform configuration (app name, description, capabilities) | Platform container | None | Static JSON | No |
| `src/main.tsx` | Entry | Initializes React root and renders `<App />` into the DOM `#root` container | Browser / Vite | `react`, `react-dom/client`, `./App`, `./index.css` | None | No |
| `src/index.css` | Styles | Global stylesheet defining Tailwind imports and design tokens | `src/main.tsx` | `@import "tailwindcss";` | Static CSS | No |
| `src/vite-env.d.ts`| Types | Extends `ImportMeta` interface to declare `import.meta.env.VITE_API_URL` type definitions | TypeScript compiler | `vite/client` | Type definitions | No |
| `src/types.ts` | Types | Domain models (`Zone`, `Intervention`), risk enums, and backend API schemas (`BackendZoneItem`, `SimulationResponse`, etc.) | All components, services, and pages | None | Domain definitions | Medium (keep aligned with backend Pydantic models) |
| `src/App.tsx` | Root / State | Root component holding global state (`activeTab`, `zones`, `selectedZone`, `hotspots`, `budgetLakhs`), manages initial data fetch and health polling | `src/main.tsx` | React, types, data, services, all component views | `HeatScapeApi` with fallback to `src/data/zones.ts` | High (orchestrates primary data hydration) |
| `src/services/api.ts` | Service | HTTP client module encapsulating fetch calls to FastAPI backend endpoints with unified error handling | `App.tsx`, `InterventionPlannerView.tsx`, `HotspotAnalysisView.tsx` | `src/types.ts` | FastAPI Backend (`http://localhost:8000`) | High (core backend integration point) |
| `src/services/zoneAdapter.ts` | Utility | Normalizes raw backend zone records, GeoJSON features, and hotspot diagnostic details into frontend `Zone` models | `App.tsx`, views | `src/types.ts` | Backend DTOs & GeoJSON | High (ensures data compatibility) |
| `src/data/zones.ts` | Mock Data | Provides calibrated fallback dataset of 9 urban zones with thermal baselines and demographics | `App.tsx` (initial state fallback) | `src/types.ts` | Static fallback data | No (keep as offline fallback) |
| `src/data/interventions.ts` | Mock Data | Provides calibrated fallback catalog of 8 cooling interventions with unit costs, impacts, and co-benefits | `App.tsx`, `InterventionPlannerView.tsx` | `src/types.ts` | Static fallback data | No (keep as offline fallback) |
| `src/components/Header.tsx` | UI Component | Displays page header, metro indicator, live backend health status indicator, quick navigation buttons, and zone switcher | `App.tsx` | React, `lucide-react`, `src/types.ts` | Props from `App.tsx` | Low (already bound to props) |
| `src/components/Sidebar.tsx` | UI Component | Persistent left navigation menu with active tab indicators, branding, and selected zone snapshot card | `App.tsx` | React, `lucide-react`, `src/types.ts` | Props from `App.tsx` | Low (already bound to props) |
| `src/components/DashboardView.tsx` | Page / View | Executive command center: citywide KPI summary cards, priority hotspot alert banner, mini heat map canvas, and quick-action cards | `App.tsx` | React, `lucide-react`, `src/types.ts`, `HeatMapCanvas.tsx` | Props from `App.tsx` (`zones`, `hotspots`) | Medium (consumes aggregated metrics) |
| `src/components/HeatMapView.tsx` | Page / View | Full spatial explorer: layer visibility controls, risk/temperature filters, interactive SVG map, and selected zone telemetry drawer | `App.tsx` | React, `lucide-react`, `src/types.ts`, `HeatMapCanvas.tsx` | Props from `App.tsx` (`zones`) | Medium (binds GeoJSON spatial data) |
| `src/components/HeatMapCanvas.tsx` | UI Component | SVG canvas handling pan, zoom, zone boundary rendering, thermal raster gradient, hover tooltips, and click-to-select handlers | `DashboardView.tsx`, `HeatMapView.tsx` | React, `lucide-react`, `src/types.ts` | Props (`zones`, `selectedZone`) | Medium (coordinate and boundary handling) |
| `src/components/HotspotsView.tsx` | Page / View | Ranked comparative table of all surveyed zones/hotspots with search, risk filters, temperature deltas, and direct drilldown buttons | `App.tsx` | React, `lucide-react`, `src/types.ts` | Props from `App.tsx` (`zones`, `hotspots`) | Medium (table data binding) |
| `src/components/HotspotAnalysisView.tsx` | Page / View | Detailed zone diagnostic screen: thermal profile, biophysical drivers chart, diurnal temperature curve, and executive brief | `App.tsx` | React, `lucide-react`, `src/types.ts`, `HeatScapeApi` | `HeatScapeApi.getHotspotDetail(zoneId)` + props | High (consumes `/api/v1/hotspots/{zone_id}`) |
| `src/components/InterventionPlannerView.tsx` | Page / View | Interactive cooling portfolio builder: budget input, intervention multi-selector, and simulation results summary | `App.tsx` | React, `lucide-react`, `src/types.ts`, `HeatScapeApi`, `data/interventions.ts` | `HeatScapeApi.simulateInterventions` + props | High (consumes `/catalog` and `/simulate`) |
| `src/components/ReportsView.tsx` | Page / View | Analytical report generator: citywide temperature distribution, vulnerable demographic impact, and exportable adaptation summaries | `App.tsx` | React, `lucide-react`, `src/types.ts` | Props from `App.tsx` (`zones`, `selectedZone`) | Low to Medium (consumes citywide zones) |

---

## Section 4 — Pages / Screens

### 1. Citywide Overview (`DashboardView`)
- **File:** `src/components/DashboardView.tsx`
- **Route:** Tab `'dashboard'` in `App.tsx`
- **Purpose:** Central executive command screen displaying high-level citywide metrics, acute thermal alerts, spatial hotspot distribution, and recommended next actions.
- **Components Used:**
  - Metric cards (Average Surface Temp, Active Critical Hotspots, Exposed Population, Cooling Potential)
  - Acute Hotspot Alert banner (`Zone 17` or top-ranked hotspot)
  - Embedded interactive `<HeatMapCanvas />` in compact preview mode
  - Ranked hotspot summary cards with direct navigation triggers
  - Quick action cards linking to Hotspot Analysis and Intervention Planner
- **Data Currently Used:**
  - `zones`: Array of `Zone` objects passed via props
  - `hotspots`: Array of `HotspotItem` objects passed via props
  - Derived citywide metrics via `deriveCityMetricsFromBackend(zones, hotspots)`
- **Backend Data Required:**
  - Citywide aggregate statistics (average LST, baseline LST, total population at risk, active hotspot count)
  - Top critical hotspot identification with primary heat driver
  - Ranked hotspot overview records
- **Potential API Endpoints:**
  - `GET /api/v1/zones` (for all zone baselines)
  - `GET /api/v1/hotspots` (for ranked thermal anomalies)
  - `GET /api/v1/zones/geojson` (for spatial geometry in mini-map)
- **Integration Notes:** The component is already wired to accept backend data through props. When `App.tsx` populates `zones` and `hotspots` from the API, this dashboard updates dynamically.

---

### 2. Urban Heat Map (`HeatMapView`)
- **File:** `src/components/HeatMapView.tsx`
- **Route:** Tab `'heatmap'` in `App.tsx`
- **Purpose:** Full-screen geospatial heat visualization. Allows operators to inspect satellite-derived surface temperature contours, toggle contextual microclimate layers, filter zones by risk or land use, and inspect specific zone telemetry.
- **Components Used:**
  - Map control sidebar (search input, risk level multi-select pills, temperature range slider, vegetation threshold, land use filter)
  - Map layer visibility toggles (Thermal Raster, Tree Canopy, Impervious Surface, Population Density, Cooling Corridors, Built-up Density)
  - Primary `<HeatMapCanvas />` with full pan/zoom capabilities
  - Selected zone telemetry side drawer showing current LST, thermal anomaly, vegetation cover, and demographic exposure
- **Data Currently Used:**
  - `zones`: Complete array of `Zone` objects
  - `selectedZone`: Currently active `Zone`
  - Internal filter state (`searchQuery`, `selectedRisks`, `minTemp`, `maxVeg`, `selectedLandUse`)
- **Backend Data Required:**
  - Spatial boundaries and microclimate attributes for all municipal zones
  - Thermal anomaly, impervious surface percentage, canopy percentage, and population density per zone
- **Potential API Endpoints:**
  - `GET /api/v1/zones`
  - `GET /api/v1/zones/geojson`
- **Integration Notes:** The underlying `<HeatMapCanvas />` expects zone coordinates normalized to a 0–100 SVG coordinate bounding box or GeoJSON feature properties. `src/services/zoneAdapter.ts` handles this translation.

---

### 3. Municipal Hotspots Inventory (`HotspotsView`)
- **File:** `src/components/HotspotsView.tsx`
- **Route:** Tab `'hotspots'` in `App.tsx`
- **Purpose:** Comprehensive, searchable, and sortable directory of all surveyed urban microclimates, ranked by heat severity, thermal anomaly, and population vulnerability.
- **Components Used:**
  - Header statistics cards (Extreme Hotspots Count, Average Hotspot Temp, Vulnerable Population, Surveyed Area)
  - Filter and search bar (text search, risk level filter dropdown, land use filter, sorting dropdown)
  - Tabular data grid with columns: Rank, Zone ID & Name, Risk Level Badge, Surface Temperature, Thermal Anomaly vs Baseline, Vulnerable Population, Primary Cause, and Action Buttons
- **Data Currently Used:**
  - `zones`: Array of `Zone` objects
  - `hotspots`: Array of `HotspotItem` objects
  - `selectedZone`: Currently active `Zone`
- **Backend Data Required:**
  - Authoritative ranking of hotspots by Composite Heat Risk Index (CHRI) or thermal anomaly
  - Official risk classification (`CRITICAL`, `SEVERE`, `HIGH`, `MODERATE`, `LOW`)
  - Dominant biophysical drivers and affected demographic counts
- **Potential API Endpoints:**
  - `GET /api/v1/hotspots`
  - `GET /api/v1/zones`
- **Integration Notes:** Displays data from `GET /api/v1/hotspots` when available, falling back gracefully to the zone array if the backend is offline. Clicking "Analyze" transitions to `'analysis'` with that zone selected; clicking "Plan Cooling" transitions to `'interventions'`.

---

### 4. Hotspot Causal Analysis (`HotspotAnalysisView`)
- **File:** `src/components/HotspotAnalysisView.tsx`
- **Route:** Tab `'analysis'` in `App.tsx`
- **Purpose:** Deep-dive diagnostic page for a single zone. Identifies physical contributors to local heat retention, displays diurnal 24-hour temperature curves, presents demographic exposure metrics, and outlines recommended interventions.
- **Components Used:**
  - Zone selector header with acute thermal alert badge
  - Key biophysical telemetry strip (LST, Baseline, Peak Temp, Thermal Anomaly, HVI score)
  - Causal Attribution Breakdown (bar visualizer attributing heat to Impervious Surfaces, Canopy Deficit, Waste Heat, Albedo Deficit)
  - Diurnal Thermal Curve (hourly time series comparing zone temperature vs municipal baseline)
  - Demographic Vulnerability Grid (elderly population, outdoor laborers, informal housing)
  - Recommended Cooling Measures card list with direct one-click additions to the municipal cooling plan
  - AI-Generated Executive Summary Brief (synthesizing microclimate risks and mitigation urgency)
- **Data Currently Used:**
  - `selectedZone`: Active `Zone` object from `App.tsx`
  - `hotspotDetail`: State populated asynchronously via `HeatScapeApi.getHotspotDetail(selectedZone.id)`
  - Internal loading and error states for diagnostic fetching
- **Backend Data Required:**
  - Detailed biophysical driver attribution percentages
  - Diurnal hourly temperature series
  - Detailed vulnerable population breakdowns
  - Authoritative intervention recommendations tailored to the zone's typology
  - AI diagnostic brief / executive synthesis text
- **Potential API Endpoints:**
  - `GET /api/v1/hotspots/{zone_id}`
  - `GET /api/v1/interventions/recommendations/{zone_id}`
- **Integration Notes:** Already implemented with an asynchronous `useEffect` that calls `HeatScapeApi.getHotspotDetail(selectedZone.id)`. If the endpoint returns successfully, `enrichZoneWithHotspotDetail()` merges the server data into the display model.

---

### 5. Cooling Intervention Planner (`InterventionPlannerView`)
- **File:** `src/components/InterventionPlannerView.tsx`
- **Route:** Tab `'interventions'` in `App.tsx`
- **Purpose:** Scenario modeling and portfolio budgeting tool. Allows urban planners to toggle proposed mitigation measures, specify municipal budget ceilings, and trigger real-time simulations of temperature reduction, budget utilization, and population protected.
- **Components Used:**
  - Zone Context & Target Reduction Header
  - Municipal Budget Slider (₹5 Lakhs to ₹100 Lakhs, default ₹30 Lakhs)
  - Intervention Selection Catalog: grid of cards (Tree Canopy Expansion, Cool Roof Retrofits, Cool Pavement, Transit Shade, Green Corridors, Urban Water Features, Pocket Parks, High-Albedo Coating)
  - Real-Time Simulation Impact Summary:
    - Projected LST Reduction (°C)
    - Projected Ambient Air Temp Reduction (°C)
    - Portfolio Synergy Multiplier
    - Total Implementation Footprint (km² or hectares)
    - Population Benefited
    - Budget Utilization Bar (Allocated vs Remaining vs Deficit)
  - Modal Action Plan Generator: Phased municipal roadmap with milestone timeframes
- **Data Currently Used:**
  - `selectedZone`: Active `Zone`
  - `selectedInterventionIds`: Array of selected intervention ID strings
  - `budgetLakhs`: Budget allocated in INR Lakhs
  - `simulation`: State populated asynchronously via `HeatScapeApi.simulateInterventions()`
  - `catalog`: Loaded via `HeatScapeApi.getInterventionsCatalog()` with fallback to `src/data/interventions.ts`
- **Backend Data Required:**
  - Full intervention catalog (`id`, `name`, `category`, `description`, `cost`, `cooling_impact`, `feasibility`)
  - Server-calculated simulation response:
    - `total_cost_inr_lakhs`, `remaining_budget_inr_lakhs`, `deficit_inr_lakhs`
    - `modeled_lst_reduction_c`, `modeled_ambient_reduction_c`, `synergy_factor_c`
    - `total_implementation_area_sqm`, `population_benefited`
    - `phased_roadmap`
- **Potential API Endpoints:**
  - `GET /api/v1/interventions/catalog`
  - `GET /api/v1/interventions/recommendations/{zone_id}`
  - `POST /api/v1/interventions/simulate`
- **Integration Notes:** The component dispatches a simulation request to `POST /api/v1/interventions/simulate` whenever `selectedInterventionIds` or `budgetLakhs` changes (debounced by 250ms). It consumes the server's authoritative calculations without overriding them locally.

---

### 6. Reports & City Analytics (`ReportsView`)
- **File:** `src/components/ReportsView.tsx`
- **Route:** Tab `'reports'` in `App.tsx`
- **Purpose:** Executive reporting dashboard presenting cross-zone comparative analytics, thermal distribution histograms, adaptation progress metrics, and printable/exportable briefs for municipal stakeholders.
- **Components Used:**
  - Citywide Heat Severity Profile (zone count grouped by risk category)
  - Zone Comparison Matrix (comparative bar charts for LST vs Baseline)
  - Population Vulnerability Breakdown (demographic risk exposure across surveyed districts)
  - Active Municipal Plan Summary (selected interventions, estimated total investment, cooling target)
  - Print / Export Brief trigger button
- **Data Currently Used:**
  - `zones`: Array of `Zone` objects
  - `selectedZone`: Active `Zone`
  - `selectedInterventionIds`: Currently planned intervention IDs
- **Backend Data Required:**
  - Aggregate municipal resilience indices
  - Cross-zone comparative metrics
- **Potential API Endpoints:**
  - `GET /api/v1/zones`
  - `GET /api/v1/hotspots`
- **Integration Notes:** Operates as a purely presentational aggregator over the `zones` array provided by `App.tsx`.

---

## Section 5 — Component Data Dependencies

| Component | Props Received | State Held Locally | Callbacks Dispatched | Data Consumed | Data Displayed | Data Source | Ultimate Backend Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Header` | `title`, `subtitle`, `activeTab`, `zones`, `selectedZone`, `selectedInterventionsCount`, `totalCostLakhs`, `backendOnline` | None | `onSelectZone`, `onNavigate` | Active zone, zone list, backend status | Title, zone dropdown, connection badge, quick stats | Props from `App.tsx` | `GET /health`, `GET /api/v1/zones` |
| `Sidebar` | `activeTab`, `selectedZone` | None | `onTabChange` | Navigation tabs, selected zone summary | Navigation links, brand logo, active zone pill | Props from `App.tsx` | UI State / `GET /api/v1/zones/{id}` |
| `DashboardView` | `zones`, `selectedZone`, `hotspots` | None | `onSelectZone`, `onOpenAnalysis`, `onOpenPlanner` | Zones array, hotspots array | KPI metric cards, alert banner, top hotspot list, mini-map | Props from `App.tsx` | `GET /api/v1/zones`, `GET /api/v1/hotspots` |
| `HeatMapView` | `zones`, `selectedZone` | Search query, risk filters, temp slider, veg slider, land use filter | `onSelectZone`, `onOpenAnalysis`, `onOpenPlanner` | Zones array, selected zone details | Interactive map, layer toggles, zone telemetry drawer | Props from `App.tsx` | `GET /api/v1/zones`, `GET /api/v1/zones/geojson` |
| `HeatMapCanvas` | `zones`, `selectedZone`, `filterRiskLevels`, `minTempFilter`, `maxVegetationFilter`, `landUseFilter` | Pan (`x`, `y`), Zoom level, Dragging state, Hovered zone, Layer visibility toggles | `onSelectZone`, `onOpenAnalysis` | Zone coordinates, risk levels, temperatures | Vector polygons, heat gradient raster, hover cards, map controls | Props from `HeatMapView` / `DashboardView` | `GET /api/v1/zones/geojson` |
| `HotspotsView` | `zones`, `selectedZone`, `hotspots` | Search query, risk filter, land use filter, sort field, sort order | `onSelectZone`, `onOpenAnalysis`, `onOpenPlanner` | Hotspot array or zones array | Ranked table of hotspots, severity badges, metrics | Props from `App.tsx` | `GET /api/v1/hotspots` |
| `HotspotAnalysisView` | `selectedZone`, `zones`, `selectedInterventionIds` | `hotspotDetail` (DTO), `isLoading`, `errorMessage`, `activeTab` (diagnostic vs brief) | `onSelectZone`, `onToggleIntervention`, `onNavigateToPlanner` | Hotspot detail DTO, biophysical drivers, diurnal temperatures | Driver contribution bars, 24h temperature curve, recommendations | `HeatScapeApi.getHotspotDetail(zoneId)` | `GET /api/v1/hotspots/{zone_id}` |
| `InterventionPlannerView` | `selectedZone`, `zones`, `selectedInterventionIds`, `budgetLakhs` | `simulation` (response DTO), `isSimulating`, `simulationError`, `catalog` (items), `showPlanModal` | `onSelectZone`, `onToggleIntervention`, `onClearPlan`, `onUpdateBudget` | Catalog items, simulation response, budget | Intervention cards, budget slider, cooling metrics, cost utilization | `HeatScapeApi.simulateInterventions` & `getCatalog` | `GET /api/v1/interventions/catalog`, `POST /simulate` |
| `ReportsView` | `zones`, `selectedZone`, `selectedInterventionIds` | None | `onSelectZone`, `onOpenAnalysis`, `onOpenPlanner` | All zones, selected interventions | Distribution charts, comparative bars, adaptation brief | Props from `App.tsx` | `GET /api/v1/zones`, `GET /api/v1/hotspots` |

---

## Section 6 — Data Flow

### Conceptual Data Flow Diagram

```
                 FastAPI Backend (http://localhost:8000)
       ├── GET /health
       ├── GET /api/v1/zones
       ├── GET /api/v1/zones/geojson
       ├── GET /api/v1/hotspots
       ├── GET /api/v1/hotspots/{zone_id}
       ├── GET /api/v1/interventions/catalog
       └── POST /api/v1/interventions/simulate
                                  │
                                  ▼
                   API Client (src/services/api.ts)
                         [HeatScapeApi Object]
                                  │
                                  ▼
             Data Adapter Layer (src/services/zoneAdapter.ts)
        [Normalizes DTOs, Maps Risks, Derives SVG Coordinates]
                                  │
                                  ▼
              Central Application State (src/App.tsx)
          ├── activeTab: NavigationTab
          ├── zones: Zone[]
          ├── selectedZone: Zone
          ├── hotspots: HotspotItem[]
          ├── selectedInterventionIds: string[]
          ├── budgetLakhs: number
          └── backendOnline: boolean
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
Header.tsx                   Sidebar.tsx                 Active View
(Zone Dropdown,             (Navigation,                (Props passed)
 Health Badge)               Active Zone)                     │
                                                              │
          ┌───────────────────────────────────────────────────┼─────────────────────────┐
          ▼                                                   ▼                         ▼
   DashboardView.tsx                                   HeatMapView.tsx          HotspotsView.tsx
   - City KPIs                                         - HeatMapCanvas          - Ranked Table
   - Mini Map Canvas                                   - Filters & Layers       - Sorting & Filtering
   - Hotspot Alert                                     - Zone Telemetry         - Drilldowns
          │                                                   │                         │
          └───────────────────────────────────────────────────┼─────────────────────────┘
                                                              ▼
                                               HotspotAnalysisView.tsx
                                               - GET /hotspots/{id}
                                               - Biophysical Drivers
                                               - Diurnal Curves
                                                              │
                                                              ▼
                                            InterventionPlannerView.tsx
                                            - GET /catalog
                                            - POST /simulate
                                            - Scenario Modeling
                                                              │
                                                              ▼
                                                      ReportsView.tsx
                                                      - City Analytics
                                                      - Exportable Briefs
```

### Current Implementation Details
1. **Application Hydration:** In `src/App.tsx`, an initial `useEffect` calls `Promise.allSettled` across `HeatScapeApi.getHealth()`, `HeatScapeApi.getZones()`, `HeatScapeApi.getHotspots()`, and `HeatScapeApi.getZonesGeoJson()`.
2. **Data Normalization:** Raw backend zones from `GET /api/v1/zones` are passed to `adaptBackendZonesToFrontend()` in `src/services/zoneAdapter.ts`. This merges any matching GeoJSON feature properties, standardizes land use labels, maps backend risk levels (`LOW` → `CRITICAL`) to presentation color tokens, and populates `zones` state.
3. **Fallback Resiliency:** If the backend is offline or unreachable, `App.tsx` retains the calibrated local dataset in `src/data/zones.ts` and sets `backendOnline: false`.
4. **Prop Drilling:** `zones`, `selectedZone`, and zone-selection callbacks (`onSelectZone`, `onOpenAnalysis`, `onOpenPlanner`) are passed directly from `App.tsx` down to each view component.
5. **Component-Level Server Calls:**
   - `HotspotAnalysisView.tsx` executes an independent call to `HeatScapeApi.getHotspotDetail(selectedZone.id)` whenever `selectedZone.id` changes.
   - `InterventionPlannerView.tsx` executes an independent call to `HeatScapeApi.simulateInterventions(...)` whenever `selectedInterventionIds` or `budgetLakhs` changes.

---

## Section 7 — Zone Selection Flow

### Canonical State Location
There is **exactly ONE canonical selected zone state** in the application:
- Variable: `selectedZone` (`Zone`)
- Location: `src/App.tsx` (line 25)
- Initial Value: `ZONES[0]` (`Zone 17 — Grand Ave Corridor`)

### How Zone Selection Changes
1. **Header Zone Dropdown:** User selects a zone from the top header `<select>` menu. Dispatches `setSelectedZone(zone)`.
2. **Dashboard Mini-Map Click:** User clicks a zone marker or boundary polygon in `HeatMapCanvas`. Triggers `onSelectZone(zone)`.
3. **Dashboard Hotspot Alert / Cards:** User clicks "Analyze Hotspot" on the alert card. Dispatches `handleOpenAnalysis(zone)`, which sets `selectedZone = zone` AND switches `activeTab = 'analysis'`.
4. **Urban Heat Map Canvas:** User clicks any zone polygon or marker in `HeatMapView`. Dispatches `onSelectZone(zone)`, updating the side telemetry drawer and setting canonical `selectedZone`.
5. **Hotspots Table Actions:** User clicks the "Analyze" or "Plan Cooling" action button on any row in `HotspotsView`. Dispatches `handleOpenAnalysis(zone)` or `handleOpenPlanner(zone)`.
6. **Analysis View Zone Switcher:** Inside `HotspotAnalysisView`, a secondary dropdown allows switching the active zone without leaving the page. Dispatches `onSelectZone(zone)`.

### Downstream Propagation
When `selectedZone` changes in `App.tsx`:
- The `Header` updates its displayed zone badge and dropdown selection.
- The `Sidebar` updates its bottom quick-context summary pill.
- The `HotspotAnalysisView` detects the change in `selectedZone.id` via `useEffect`, cancels any in-flight request, and fetches fresh diagnostic details via `HeatScapeApi.getHotspotDetail(selectedZone.id)`.
- The `InterventionPlannerView` updates its context header, resets or re-evaluates recommendations, and triggers a new simulation for the newly selected zone.

---

## Section 8 — API / Backend Integration Map

| Endpoint | Method | Consuming File | Consuming Component | Fields Consumed | UI Elements Displayed | Existing API Function | Status & Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | `src/App.tsx` | `Header.tsx` | `status`, `version`, `engine` | Live/Offline badge in top header bar | `HeatScapeApi.getHealth()` | Implemented; runs on mount and polls every 30s |
| `/api/v1/zones` | `GET` | `src/App.tsx` | `Header`, `DashboardView`, `HeatMapView`, `HotspotsView`, `ReportsView` | `zone_id`, `name`, `land_surface_temp_c`, `baseline_temp_c`, `thermal_anomaly_c`, `risk_level`, `total_population`, `vulnerable_population`, `vegetation_pct`, `impervious_pct`, `typology`, `area_sqkm` | KPI cards, zone dropdown, table rows, telemetry drawer, chart axes | `HeatScapeApi.getZones()` | Implemented; adapt via `zoneAdapter.ts` |
| `/api/v1/zones/geojson` | `GET` | `src/App.tsx` | `HeatMapCanvas.tsx` | `type`, `features[].geometry`, `features[].properties.id`, `features[].properties.risk_level` | Vector boundary polygons, thermal heat contours on map canvas | `HeatScapeApi.getZonesGeoJson()` | Implemented; feeds into `adaptBackendZonesToFrontend` |
| `/api/v1/zones/{zone_id}` | `GET` | Optional direct fetch | `HeatMapView.tsx` | Same as `BackendZoneItem` | Selected zone side drawer telemetry | `HeatScapeApi.getZoneById(zoneId)` | Implemented in service client |
| `/api/v1/hotspots` | `GET` | `src/App.tsx` | `DashboardView.tsx`, `HotspotsView.tsx` | `zone_id`, `zone_name`, `land_surface_temp_c`, `thermal_anomaly_c`, `risk_level`, `risk_score`, `total_population`, `vulnerable_population`, `dominant_driver`, `dominant_driver_pct` | Top priority alert banner, ranked hotspots table, severity badges | `HeatScapeApi.getHotspots()` | Implemented; hydrates `hotspots` state in `App.tsx` |
| `/api/v1/hotspots/{zone_id}` | `GET` | `HotspotAnalysisView.tsx` | `HotspotAnalysisView.tsx` | `zone`, `risk_assessment.risk_score.driver_contributions`, `hourly_temps`, `recommended_interventions`, `executive_brief` | Biophysical driver breakdown bars, diurnal 24h curve, recommended measures list, AI brief text | `HeatScapeApi.getHotspotDetail(zoneId)` | Implemented; triggered on zone selection |
| `/api/v1/interventions/catalog` | `GET` | `InterventionPlannerView.tsx` | `InterventionPlannerView.tsx` | `id`, `name`, `category`, `description`, `cost_range_usd`, `cooling_potential_c`, `feasibility`, `co_benefits` | Intervention selection grid cards | `HeatScapeApi.getInterventionsCatalog()` | Implemented in service; component falls back to static catalog if empty |
| `/api/v1/interventions/catalog/{intervention_id}` | `GET` | Optional modal | Intervention card detail | Item metadata | Detailed specifications modal | `HeatScapeApi.getInterventionById(id)` | Implemented in service client |
| `/api/v1/interventions/recommendations/{zone_id}` | `GET` | `HotspotAnalysisView.tsx`, `InterventionPlannerView.tsx` | Recommendation cards | `intervention_id`, `name`, `priority`, `suitability_score`, `rationale` | "Why Recommended" callout banner on intervention cards | `HeatScapeApi.getInterventionRecommendations(zoneId)` | Implemented in service client |
| `/api/v1/interventions/simulate` | `POST` | `InterventionPlannerView.tsx` | `InterventionPlannerView.tsx` | Request: `zone_id`, `selected_intervention_ids`, `budget_inr_lakhs`. Response: `total_cost_inr_lakhs`, `remaining_budget_inr_lakhs`, `deficit_inr_lakhs`, `modeled_lst_reduction_c`, `modeled_ambient_reduction_c`, `synergy_factor_c`, `total_implementation_area_sqm`, `population_benefited`, `phased_roadmap` | LST cooling stat, ambient cooling stat, synergy badge, budget progress bar, remaining/deficit indicator, phased action plan modal | `HeatScapeApi.simulateInterventions(payload)` | Implemented; sends request on selection change |

---

## Section 9 — Mock / Hardcoded Data Audit

| File | Location | Current Value / Data | Purpose | Should Backend Replace It? | Backend Field / Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/data/zones.ts` | Lines 50–490 | 9 complete zone definitions (`zone-17`, `zone-21`, `zone-09`, `zone-02`, etc.) with temps (43.2°C, 42.6°C), population, HVI | Static fallback for zone attributes and baseline temperatures | Yes, dynamically populated via API | `GET /api/v1/zones` |
| `src/data/interventions.ts` | Lines 3–200 | 8 intervention items (`int-tree-canopy`, `int-cool-roof`, etc.) with cost ₹14.5L, cooling -1.4°C, population benefit | Static fallback catalog of cooling measures | Yes, dynamically populated via API | `GET /api/v1/interventions/catalog` |
| `src/components/DashboardView.tsx` | Lines 22–32 | Fallback alert banner for `Zone 17` (+6.8°C anomaly, 43.2°C LST) if hotspots array is empty | Displays acute thermal hotspot alert | Yes, populated when `hotspots[0]` exists | `GET /api/v1/hotspots` (`hotspots[0]`) |
| `src/components/HotspotAnalysisView.tsx` | Lines 45–65 | Synthetic hourly diurnal temperatures (`[00:00: 34.5°C, 04:00: 32.8°C, ... 14:00: 45.1°C]`) | Renders 24h temperature curve | Yes, if provided by detail endpoint | `GET /api/v1/hotspots/{zone_id}` (`hourly_temps`) |
| `src/components/HotspotAnalysisView.tsx` | Lines 70–88 | Static causal heat contributors (Impervious: 42%, Low Canopy: 28%, Waste Heat: 18%, Albedo: 12%) | Renders biophysical attribution bars | Yes, authoritative server values | `GET /api/v1/hotspots/{zone_id}` (`driver_contributions`) |
| `src/components/HotspotAnalysisView.tsx` | Lines 95–110 | Hardcoded text for "AI Executive Briefing & Microclimate Synthesis" | Displays diagnostic narrative | Yes, generated or stored by backend | `GET /api/v1/hotspots/{zone_id}` (`executive_brief`) |
| `src/components/InterventionPlannerView.tsx` | Lines 165–185 | Fallback formula: `cooling = sum(coolingImpact) * 0.9` if server simulation is null | Prevents empty stat display during offline use | Yes, strictly use server response | `POST /api/v1/interventions/simulate` (`modeled_lst_reduction_c`) |
| `src/components/InterventionPlannerView.tsx` | Lines 170–178 | Fallback formula: `popBenefited = sum(populationBenefit) * 0.75` | Offline estimate | Yes, strictly use server response | `POST /api/v1/interventions/simulate` (`population_benefited`) |
| `src/components/InterventionPlannerView.tsx` | Lines 150–162 | Fallback formula: `remainingBudget = budgetLakhs - totalCost` | Offline budget math | Yes, strictly use server response | `POST /api/v1/interventions/simulate` (`remaining_budget_inr_lakhs`) |
| `src/services/zoneAdapter.ts` | Lines 41–52 | Hardcoded coordinates for `ZONE-01` through `ZONE-10` in relative SVG space | Positions zones on SVG canvas | Optional: can use GeoJSON centroid | `GET /api/v1/zones/geojson` |
| `src/services/zoneAdapter.ts` | Lines 80–88 | Base diurnal multipliers `[0.80, 0.76, 0.90, 0.98, 1.03, ...]` | Generates curve when backend omits hourly data | Optional: retain as fallback | `GET /api/v1/hotspots/{zone_id}` |

---

## Section 10 — Frontend Calculations Audit

The backend must remain the authoritative source for all scientific and financial calculations. The table below details all calculations found in the frontend and indicates which must be delegated to the backend.

| File | Calculation | Purpose | Current Inputs | Current Output | Should It Remain Frontend? | Authoritative Backend Replacement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/types.ts` (line 7) | `getRiskFromTemp(temp)`: `temp >= 41 ? 'extreme' : temp >= 38 ? 'high' : ...` | Maps temperature to risk tier | Surface temp (°C) | `'low' \| 'moderate' \| 'high' \| 'extreme'` | **No (Presentation only)**. Server calculates Composite Heat Risk Index (CHRI) | Backend field `risk_level` (`LOW`, `MODERATE`, `HIGH`, `SEVERE`, `CRITICAL`) |
| `src/services/zoneAdapter.ts` (line 99) | `diff = item.thermal_anomaly_c ?? (temp - baseline)` | Calculates temperature anomaly | `land_surface_temp_c`, `baseline_temp_c` | Temperature difference (°C) | **No**. Server should supply `thermal_anomaly_c` | Backend field `thermal_anomaly_c` from `GET /api/v1/zones` |
| `src/services/zoneAdapter.ts` (line 136) | `riskScore = item.risk_score ?? Math.round((temp / 50) * 100)` | Fallback numerical risk score | Temperature | Number (0–100) | **No**. Server must compute risk score | Backend field `risk_score` from `GET /api/v1/zones` / `hotspots` |
| `src/services/zoneAdapter.ts` (line 145) | `hvi = Number((riskScore / 10).toFixed(1))` | Heat Vulnerability Index | Risk score | Number (1–10) | **No**. Server must compute HVI | Backend field `hvi` |
| `src/services/zoneAdapter.ts` (line 294) | `deriveCityMetricsFromBackend(zones)`: averages, counts by risk tier, population at risk | Calculates summary metrics across all zones | `zones` array | Citywide summary object | **Yes for simple client-side aggregations**, but citywide official metrics should come from server if available | `GET /api/v1/zones` / city metrics endpoint |
| `src/components/InterventionPlannerView.tsx` (line 152) | `totalCostLakhs = simulation?.total_cost_inr_lakhs ?? sum(costLakhs)` | Calculates total plan investment | Selected intervention costs | Total in INR Lakhs | **No**. Simulation response is authoritative | `POST /api/v1/interventions/simulate` (`total_cost_inr_lakhs`) |
| `src/components/InterventionPlannerView.tsx` (line 156) | `remainingBudget = simulation?.remaining_budget_inr_lakhs ?? (budget - cost)` | Calculates remaining budget or deficit | Budget & Cost | Remaining INR Lakhs | **No**. Simulation response is authoritative | `POST /api/v1/interventions/simulate` (`remaining_budget_inr_lakhs`, `deficit_inr_lakhs`) |
| `src/components/InterventionPlannerView.tsx` (line 166) | `coolingLabel = -simulation?.modeled_lst_reduction_c ?? -sum(coolingImpact) * 0.9` | Calculates modeled surface cooling | Interventions & synergy | Reduction in °C | **No**. Simulation response is authoritative | `POST /api/v1/interventions/simulate` (`modeled_lst_reduction_c`) |
| `src/components/InterventionPlannerView.tsx` (line 173) | `populationBenefited = simulation?.population_benefited ?? sum(...)` | Calculates beneficiary headcount | Interventions & zone population | Number of people | **No**. Simulation response is authoritative | `POST /api/v1/interventions/simulate` (`population_benefited`) |
| `src/components/InterventionPlannerView.tsx` (line 178) | `totalAreaKm2 = simulation?.total_implementation_area_hectares / 100` | Converts implementation area to km² | Total area from server | km² | **Yes (Unit conversion only)** | `POST /api/v1/interventions/simulate` (`total_implementation_area_hectares`) |
| `src/components/HeatMapCanvas.tsx` (line 97) | `setZoom(prev + 0.25)` and pan offsets | Canvas pan and zoom transformation | User drag/click events | CSS transform matrix | **Yes (Pure UI interaction)** | None |

---

## Section 11 — Types and Data Models

The primary type definitions reside in `src/types.ts`.

### Key Frontend Data Interfaces
- `Zone`: Comprehensive presentation model consumed across views. Contains biophysical fields (`temperature`, `baselineTemp`, `peakTemp`, `diffFromSurround`, `vegetation`, `imperviousSurface`), demographic fields (`population`, `populationVulnerable`, `elderlyPercent`, `outdoorWorkers`), risk scores (`risk`, `backendRiskLevel`, `riskScore`, `hvi`), spatial coordinates (`coordinates: { x, y, lat, lng }`), and diurnal series (`hourlyTemps`).
- `Intervention`: Frontend model for cooling measures (`id`, `name`, `category`, `description`, `costLakhs`, `costRange`, `coolingImpact`, `populationBenefit`, `implementationAreaKm2`, `coBenefits`).
- `HeatContributor`: Biophysical attribution item (`name`, `percentage`, `color`, `description`).
- `NavigationTab`: Literal union `'dashboard' | 'heatmap' | 'hotspots' | 'analysis' | 'interventions' | 'reports'`.
- `RiskLevel`: Presentation risk tier `'low' | 'moderate' | 'high' | 'extreme'`.
- `BackendRiskLevel`: Server official tier `'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'CRITICAL'`.

### Backend API Schema Interfaces in `src/types.ts`
- `BackendHealthResponse`: `{ status: string; version?: string; engine?: string }`
- `BackendZoneItem`: Represents an individual zone record from `GET /api/v1/zones` (`zone_id`, `name`, `typology`, `land_surface_temp_c`, `baseline_temp_c`, `thermal_anomaly_c`, `risk_level`, `total_population`, `vulnerable_population`, `vegetation_pct`, `impervious_pct`, `area_sqkm`).
- `ZoneGeoJSONCollection`: Standard GeoJSON FeatureCollection containing `features: GeoJSONFeature[]`.
- `HotspotItem`: Record from `GET /api/v1/hotspots` (`zone_id`, `zone_name`, `land_surface_temp_c`, `thermal_anomaly_c`, `risk_level`, `risk_score`, `total_population`, `vulnerable_population`, `dominant_driver`, `dominant_driver_pct`, `area_sqkm`).
- `HotspotDetail`: Full diagnostic payload from `GET /api/v1/hotspots/{zone_id}` (`zone`, `risk_assessment`, `hourly_temps`, `recommended_interventions`, `executive_brief`).
- `BackendInterventionItem`: Catalog entry from `GET /api/v1/interventions/catalog` (`id`, `name`, `category`, `description`, `cost_range_usd`, `cooling_potential_c`, `feasibility`, `co_benefits`).
- `SimulationRequest`: Payload for `POST /api/v1/interventions/simulate` (`zone_id: string`, `selected_intervention_ids: string[]`, `budget_inr_lakhs: number`).
- `SimulationResponse`: Server simulation response (`total_cost_inr_lakhs`, `remaining_budget_inr_lakhs`, `budget_utilization_pct`, `deficit_inr_lakhs`, `modeled_lst_reduction_c`, `modeled_ambient_reduction_c`, `synergy_factor_c`, `total_implementation_area_sqm`, `total_implementation_area_hectares`, `population_benefited`, `phased_roadmap`, `assumptions`).

### Type Safety and Weak Typing Audit
- `coordinates: any` inside `GeoJSONFeature`: Can be typed strictly as `number[] | number[][] | number[][][]` according to RFC 7946.
- `[key: string]: any` in `GeoJSONFeature.properties`: Retained for arbitrary GeoJSON metadata compatibility.
- `driver_contributions` in `HotspotDetail`: Supports both array of `{ name, percentage }` and record mapping `{ [driver: string]: number }` via `zoneAdapter.ts`.

---

## Section 12 — Map Integration

### Map Implementation Details
- **Component File:** `src/components/HeatMapCanvas.tsx` (hosted within `HeatMapView.tsx` and `DashboardView.tsx`).
- **Rendering Technology:** Pure SVG with dynamic viewport transformation (`transform: translate(panX, panY) scale(zoom)`). No heavy external mapping SDKs (Mapbox, Leaflet, Google Maps) are loaded, ensuring near-instant loading, zero API billing dependency, and smooth pan/zoom in restricted container environments.
- **Coordinate System:** Normalized 0–100 coordinate space mapped across a responsive `viewBox="0 0 100 100"`.
- **Thermal Surface Raster:** Rendered as layered SVG radial gradients with customizable opacity (`layers.thermalRaster`).
- **Vector Zones:** Zones render as distinct SVG polygon groups with:
  - Fill color driven by `zone.backendRiskLevel` or `zone.risk`:
    - `CRITICAL` / `SEVERE` / `extreme`: `#ef4444` (Red, 60% opacity)
    - `HIGH` / `high`: `#f97316` (Orange, 55% opacity)
    - `MODERATE` / `moderate`: `#eab308` (Yellow, 50% opacity)
    - `LOW` / `low`: `#10b981` (Emerald green, 45% opacity)
  - Stroke highlight: Thick emerald ring (`stroke="#064E3B"`, `strokeWidth="1.5"`) with pulsating outer halo when `selectedZone.id === zone.id`.
- **Microclimate Overlays:**
  - Tree canopy overlay: Semi-transparent green foliage patterns (`layers.treeCanopy`).
  - Impervious surface overlay: High-albedo hatching patterns (`layers.impervious`).
  - Cooling corridors: Dashed cyan airflow vectors connecting green spaces (`layers.coolingCorridors`).
- **Interaction:** Full click selection (`onSelectZone`), hover tooltip displaying real-time surface temperature and thermal anomaly, and drag/pan and zoom buttons (+, -, reset).

### Connecting `/api/v1/zones/geojson`
1. When `HeatScapeApi.getZonesGeoJson()` returns a GeoJSON FeatureCollection, `adaptBackendZonesToFrontend()` in `src/services/zoneAdapter.ts` maps each feature's `properties.id` or `properties.zone_id` to the corresponding `BackendZoneItem`.
2. Polygon coordinates from GeoJSON `geometry.coordinates` can be converted to SVG path strings using standard projection math if arbitrary polygon boundaries are provided.
3. Zone identifiers are matched as case-insensitive strings (`ZONE-01`, `ZONE-17`).

---

## Section 13 — Intervention Planner Data Flow

```
                      User Actions
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
Toggles Interventions                 Adjusts Budget Slider
(int-tree-canopy, int-cool-roof)       (e.g., ₹30 Lakhs)
       │                                       │
       └───────────────────┬───────────────────┘
                           ▼
          Local Planner State in Component
          - selectedInterventionIds: string[]
          - budgetLakhs: number
                           │
                           ▼ (Debounced by 250ms)
       Dispatch POST /api/v1/interventions/simulate
       {
         "zone_id": "ZONE-17",
         "selected_intervention_ids": ["int-tree-canopy", "int-cool-roof"],
         "budget_inr_lakhs": 30
       }
                           │
                           ▼
               FastAPI Backend Modeling
               - Biophysical thermodynamic cooling
               - Synergy multiplier calculation
               - Implementation area constraints
               - INR Lakhs financial audit
                           │
                           ▼
          SimulationResponse (Authoritative)
          ├── modeled_lst_reduction_c: 2.8
          ├── modeled_ambient_reduction_c: 1.4
          ├── synergy_factor_c: 0.3
          ├── total_cost_inr_lakhs: 23.0
          ├── remaining_budget_inr_lakhs: 7.0
          ├── budget_utilization_pct: 76.7
          ├── deficit_inr_lakhs: 0.0
          ├── population_benefited: 18000
          └── phased_roadmap: [ Phase 1, Phase 2, ... ]
                           │
                           ▼
                 Frontend UI Rendering
          - LST Reduction: "-2.8°C"
          - Ambient Cooling: "-1.4°C"
          - Budget Bar: 76.7% used (Green / Amber / Red if deficit)
          - Benefited: 18,000 residents
          - Roadmap Modal: Actionable municipal implementation phases
```

### Critical Separation of Responsibilities
- **Frontend Input ONLY:** User selections (`selected_intervention_ids`), budget value (`budget_inr_lakhs`), and target zone (`zone_id`).
- **Backend Authoritative Output ONLY:** All cost totals, remaining budget, deficit flags, cooling impacts (°C), synergy factors, benefited population headcounts, and phased implementation schedules.

---

## Section 14 — Environment Variables

| Variable Name | Purpose | Example Value | Required in Production? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Root URL of the FastAPI backend service | `http://localhost:8000` | Yes | **Do NOT append `/api/v1`**. The API service in `src/services/api.ts` automatically appends endpoint paths (`/health`, `/api/v1/zones`, etc.). |
| `GEMINI_API_KEY` | Server-side key for AI Studio Gemini features | `MY_GEMINI_API_KEY` | Optional | Used in server-side context; never exposed to browser. |
| `APP_URL` | Application root hosting URL | `http://localhost:3000` | Optional | Used for self-referential links or OAuth redirects if configured. |

---

## Section 15 — Dependencies

From `package.json`:

### Runtime Dependencies
- `react` (`^19.0.1`): Core UI rendering engine.
- `react-dom` (`^19.0.1`): Web DOM renderer.
- `lucide-react` (`^0.546.0`): Icon library for UI controls, indicators, and navigation badges.
- `motion` (`^12.23.24`): Fluid animations for transitions, dialogs, and alerts.
- `@google/genai` (`^2.4.0`): Gemini API TypeScript SDK (reserved for AI Studio server-side integrations).
- `express` (`^4.21.2`): Lightweight server used for containerized production deployment.
- `dotenv` (`^17.2.3`): Environment variable loader.

### Build and Dev Dependencies
- `vite` (`^6.2.3`): Next-generation frontend bundler and local development server.
- `@vitejs/plugin-react` (`^5.0.4`): Fast React JSX/TSX transform.
- `@tailwindcss/vite` (`^4.1.14`): Native Tailwind CSS v4 compiler plugin for Vite.
- `tailwindcss` (`^4.1.14`): Core utility styling system.
- `typescript` (`~5.8.2`): Type checking engine.
- `tsx` (`^4.21.0`): TypeScript execution engine for server scripts.
- `esbuild` (`^0.25.0`): Fast bundler for production server packaging.

---

## Section 16 — Files Likely to Change During Integration

### High Priority — Likely to Modify
1. `src/services/api.ts`: Ensure endpoint paths and response handling align with any micro-variations in the backend router.
2. `src/types.ts`: Keep interfaces (`BackendZoneItem`, `HotspotDetail`, `SimulationResponse`) synchronized if backend schemas change.
3. `src/services/zoneAdapter.ts`: Adjust data transformation logic if field naming in the backend varies (e.g. `lst_c` vs `land_surface_temp_c`).
4. `src/App.tsx`: Top-level initialization and error handling for live backend responses.

### Medium Priority — May Need Modification
1. `src/components/HotspotAnalysisView.tsx`: If the backend introduces new diagnostic fields (e.g., tree canopy deficit index, air quality correlation).
2. `src/components/InterventionPlannerView.tsx`: If the simulation request payload structure is adjusted or additional constraint parameters are introduced.
3. `src/components/HeatMapCanvas.tsx`: When binding dynamic GeoJSON coordinates from `GET /api/v1/zones/geojson`.
4. `src/components/HotspotsView.tsx`: If custom backend sorting or pagination query parameters are added.

### Do NOT Modify Unless Necessary (Presentation Layer)
1. `src/components/Sidebar.tsx`: Purely presentational navigation component.
2. `src/components/Header.tsx`: Presentational header; already parameterized via props.
3. `src/components/ReportsView.tsx`: Presentational report layout; consumes generic `Zone[]`.
4. `src/index.css`: Global styling tokens and typography declarations.
5. `vite.config.ts` / `index.html`: Core configuration files that do not affect backend integration.

---

## Section 17 — Recommended Integration Order

For a developer integrating the FastAPI backend with this frontend, the recommended sequence is:

1. **Verify Backend Health (`GET /health`)**
   - Start the FastAPI backend on port 8000 (`http://localhost:8000`).
   - Confirm that the status badge in the frontend `Header` turns green ("Live Backend").
2. **Synchronize Type Definitions (`src/types.ts`)**
   - Compare `src/types.ts` against the backend's Pydantic schemas (`ZoneSchema`, `HotspotSchema`, `SimulationResponse`).
3. **Verify Zone Hydration (`GET /api/v1/zones`)**
   - Confirm that `HeatScapeApi.getZones()` loads records into `zones` state in `App.tsx`.
   - Inspect `src/services/zoneAdapter.ts` to confirm fields like `land_surface_temp_c` map correctly.
4. **Bind Spatial Boundaries (`GET /api/v1/zones/geojson`)**
   - Verify that zone boundary coordinates load and map onto `HeatMapCanvas.tsx`.
5. **Verify Hotspot Ranking (`GET /api/v1/hotspots`)**
   - Verify that the ranked hotspot inventory populates the `DashboardView` alert banner and the `HotspotsView` table.
6. **Verify Hotspot Diagnostic Drilldown (`GET /api/v1/hotspots/{zone_id}`)**
   - Click a zone in the hotspots table to navigate to `HotspotAnalysisView`.
   - Confirm that biophysical driver percentages and the diurnal curve populate from the server.
7. **Verify Intervention Catalog (`GET /api/v1/interventions/catalog`)**
   - Open `InterventionPlannerView` and verify that catalog items load dynamically.
8. **Verify Portfolio Simulation (`POST /api/v1/interventions/simulate`)**
   - Select multiple interventions and adjust the budget slider.
   - Inspect the network payload to ensure `zone_id`, `selected_intervention_ids`, and `budget_inr_lakhs` are sent.
   - Confirm that the returned `modeled_lst_reduction_c`, `synergy_factor_c`, and budget calculations update the UI without client-side overrides.
9. **Validate Loading and Error States**
   - Test behavior when the backend is stopped or returns HTTP 500 errors to verify that the UI falls back cleanly without crashing.
10. **Run Lint and Build Checks**
    - Execute `npm run lint` and `npm run build` to confirm zero compilation errors.

---

## Section 18 — Known Risks & Integration Watchpoints

1. **String-Based Zone IDs:**
   - Zone IDs in this system are strings (e.g. `'ZONE-01'`, `'ZONE-17'`, `'zone-17'`).
   - **Risk:** Converting zone IDs to numbers (e.g. `parseInt('ZONE-01')`) will break routing, state matching, and GeoJSON lookups. Always treat zone IDs as strings.
2. **Currency Separation:**
   - Intervention Catalog items specify individual unit benchmark costs in **USD**.
   - Portfolio Simulation budgets and results are expressed in **INR Lakhs** (e.g., ₹30 Lakhs).
   - **Risk:** Mixing USD and INR Lakhs without conversion will produce nonsensical budget figures. The frontend maintains this separation cleanly; the backend must do the same.
3. **Risk Level Terminology:**
   - Backend official levels: `LOW`, `MODERATE`, `HIGH`, `SEVERE`, `CRITICAL`.
   - Frontend styling categories: `'low'`, `'moderate'`, `'high'`, `'extreme'`.
   - **Risk:** Mismatched casing or missing mapping. Use `mapBackendRiskToPresentation()` in `src/types.ts` to convert server risk strings to UI color tokens while preserving the original backend label via `getBackendRiskDisplayLabel()`.
4. **Authoritative Server Calculations:**
   - **Risk:** Calculating cooling impacts or budget deficits in React can conflict with the backend's thermodynamic model. The frontend is configured to consume server simulation results directly; do not reintroduce client-side mathematical formulas.
5. **Backend URL Configuration:**
   - `VITE_API_URL` should be `http://localhost:8000`. Do not include a trailing slash or `/api/v1`.
6. **CORS Configuration:**
   - The FastAPI backend must enable CORS middleware for the frontend origin (typically `http://localhost:3000` or the Cloud Run container origin) with `allow_origins=["*"]`, `allow_methods=["*"]`, and `allow_headers=["*"]`.

---

## Section 19 — Final Integration Checklist

- [ ] Backend URL configured via `VITE_API_URL="http://localhost:8000"` in `.env`
- [ ] Backend CORS configured to allow requests from frontend origin
- [ ] `GET /health` returns `{ "status": "ok" }` and status badge in `Header` displays green
- [ ] `GET /api/v1/zones` loads all municipal zones into `App.tsx`
- [ ] `GET /api/v1/zones/geojson` provides feature geometries for the heat map
- [ ] `HeatMapCanvas` renders zones and highlights the selected zone
- [ ] `GET /api/v1/hotspots` populates the ranked table in `HotspotsView` and dashboard alert
- [ ] Zone selection works across Header, Map, Table, and Dashboard
- [ ] `GET /api/v1/hotspots/{zone_id}` loads biophysical drivers and diurnal curve in `HotspotAnalysisView`
- [ ] Driver attribution percentages originate from the server
- [ ] `GET /api/v1/interventions/catalog` populates the catalog in `InterventionPlannerView`
- [ ] `POST /api/v1/interventions/simulate` runs on intervention toggle and budget adjustment
- [ ] LST reduction, ambient cooling, and synergy values originate from server simulation
- [ ] Budget utilization, remaining budget, and deficit flags originate from server simulation
- [ ] Zone IDs are handled as strings throughout all network calls
- [ ] Fallback dataset in `src/data/zones.ts` functions smoothly when backend is disconnected
- [ ] Loading and error states display graceful visual feedback
- [ ] `npm run lint` passes with 0 errors (`tsc --noEmit`)
- [ ] `npm run build` compiles clean static assets to `dist/`
- [ ] Existing UI visual layout, styling, colors, and typography remain completely intact
