# THERMOS — Frontend Architecture & UI Specification

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 10-FRONTEND-ARCHITECTURE.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Frontend Technology Stack & Build Pipeline

The THERMOS frontend is engineered as a responsive, high-contrast decision workbench tailored for spatial data exploration and counterfactual planning:

* **Framework:** React `^19.2.8` (TypeScript)
* **Build System:** Vite `^8.2.2` with Hot Module Replacement (HMR)
* **TypeScript Compiler:** `~6.0.2` (`tsc -b`)
* **Geospatial Renderer:** MapLibre GL `^6.7.0` (WebGL vector tile and GeoJSON layer engine)
* **Linter & Code Quality:** Oxlint `^1.79.0`
* **Tailwind Status:** **Not installed / None** (styled entirely via custom high-contrast CSS design tokens in [frontend/src/index.css](../frontend/src/index.css))

---

## 2. Component Hierarchy & State Container

```
App.tsx (Root Workbench State Container)
├── Header.tsx (Branding, Live Backend Status Badge, View Selector)
├── SummaryBar.tsx (City-Wide Risk Average, Hotspot Tally, Population Exposed)
└── Main Content Grid (Split-Pane Responsive Layout)
    ├── ZoneMap.tsx (MapLibre GL WebGL Map, GeoJSON Fill/Stroke, Hotspot HTML Markers)
    ├── HotspotList.tsx (Ranked Table, Tier Filter Tabs, Sorting, Selection)
    ├── ZoneDetail.tsx (Zone Dossier, Risk Gauge, Driver Attribution Bars)
    └── InterventionPlanner.tsx (Interactive Scenario Simulator & Budget Calculator)
```

### State Management Strategy ([App.tsx](../frontend/src/App.tsx)):
* **Zero Global Store Bloat:** State is maintained through clean React primitives (`useState`, `useEffect`, `useCallback`) at the root workbench level.
* **Synchronized Selection:** Selecting a zone on the map updates `selectedZoneId`, synchronizing the `HotspotList` highlighted row, `ZoneDetail` inspector, and `InterventionPlanner` context simultaneously.
* **Offline Resilience Mode:** If the backend service is offline, the API client automatically activates [fallbackData.ts](../frontend/src/services/fallbackData.ts), displaying an amber "Demo / Offline Mode" status badge while maintaining full UI functionality.

---

## 3. Geospatial Mapping Engine ([ZoneMap.tsx](../frontend/src/components/ZoneMap.tsx))

The spatial visualization is powered by MapLibre GL JS, providing hardware-accelerated WebGL rendering:

### 3.1 Basemap Styling & Dark-Mode Resilience
To prevent checkerboard or blank-canvas rendering common in WebGL tile loaders during dark mode:
1. **Primary Tile Source:** High-resolution CartoDB Dark Matter / Positron raster tile sources.
2. **Resilient Canvas Fallback:** The map container enforces a solid background color (`#111827` in dark mode) ensuring the map never flashes white or displays a broken checkerboard if external tile servers experience latency.

### 3.2 Vector & Choropleth Layers
* **GeoJSON Source:** Loaded directly from `/api/v1/zones/geojson`.
* **Fill Layer (`zones-fill`):** Colors zone polygons by `risk_level` using a stepped expression:
  - `CRITICAL`: `#ef4444` (High-intensity red)
  - `SEVERE`: `#f97316` (Vibrant orange-red)
  - `HIGH`: `#fb923c` (Vibrant orange)
  - `MODERATE`: `#eab308` (Amber yellow)
  - `LOW`: `#10b981` (Emerald green)
* **Outline Layer (`zones-stroke`):** Provides sharp polygon delineation with dynamic line-width on hover and selection.
* **Marker Layer:** Renders pulsing HTML marker pins at the centroids of top-ranked hotspots, showing tier icons and priority ranks.

---

## 4. Analytical Inspector Components

### 4.1 Hotspot Registry ([HotspotList.tsx](../frontend/src/components/HotspotList.tsx))
* Renders a filterable table of detected hotspots.
* Tabbed tier filters: `ALL`, `CRITICAL`, `SEVERE`, `HIGH`.
* Columns: Rank, Zone Name, CHRI Score, Thermal Anomaly ($\Delta T$), Dominant Driver, and Affected Population.
* Clicking any row invokes `flyTo` animation on the map and opens the zone inspector.

### 4.2 Zone Diagnostic Dossier ([ZoneDetail.tsx](../frontend/src/components/ZoneDetail.tsx))
* **Risk Score Dial:** Displays CHRI ($0-100$) with color-coded risk tier badge (`LOW`, `MODERATE`, `HIGH`, `SEVERE`, `CRITICAL`).
* **Orthogonal Sub-score Bars:** Visualizes Hazard ($H$), Exposure ($E$), and Vulnerability ($V$) sub-scores.
* **Driver Attribution Breakdown:** Horizontal stacked bars displaying the exact percentage contribution of each environmental and demographic driver (guaranteed $\sum = 100\%$).
* **Action Launcher:** Primary button transitions the workbench into the Intervention Planning mode for the active zone.

---

## 5. Counterfactual Intervention Planner ([InterventionPlanner.tsx](../frontend/src/components/InterventionPlanner.tsx))

The planner allows urban resilience officers to design site-specific mitigation portfolios:

### 5.1 Physical Surface Allocation
* Computes and displays zone surface availability:
  - Roof area accessible for retrofits ($\text{m}^2$)
  - Pavement and parking surfaces ($\text{m}^2$)
  - Street transit corridors ($\text{m}^2$)
  - Public unbuilt space ($\text{m}^2$)

### 5.2 Interactive Intervention Selection & Budget Slider
* Planners select candidate interventions from the 8-item catalog (Cool Roofs, Street Trees, Permeable Pavers, Pocket Parks, etc.).
* Sliders set the municipal budget ceiling in INR Lakhs (₹).
* Real-time calculation prevents over-allocation beyond physical surface boundaries.

### 5.3 Simulation Execution & Results Display
* Submits payload to `POST /api/v1/interventions/simulate`.
* Renders comprehensive scenario results:
  - Total CapEx & remaining budget in ₹ Lakhs
  - Budget utilization percentage bar & deficit warnings
  - Simulated $\Delta T_{\text{LST}}$ (up to 6.5°C) and $\Delta T_{\text{ambient}}$ (up to 2.8°C)
  - Microclimate synergy bonus indicator
  - Population protected tally
  - Phased implementation roadmap (Phase 1, Phase 2, Phase 3)
  - Explicit audit caveat and scientific disclaimer.
