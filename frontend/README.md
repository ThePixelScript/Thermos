# THERMOS — Frontend Geospatial Decision Workbench

**Technology Stack:** React 19, TypeScript, Vite, MapLibre GL JS, CSS3 Design System  
**Version:** 2.0.0  

---

## 1. Overview

The THERMOS frontend is a production-grade geospatial decision workbench engineered for urban heat mitigation planning. It combines high-performance WebGL vector and raster map rendering with deep explainable analytical drawers, executive command dashboards, and an interactive digital twin scenario sandbox.

---

## 2. Core Frontend Components

### 2.1 Geospatial Map Engine (`src/components/map/`)
* **`ThermosMap.tsx`:** Primary MapLibre GL map container. Coordinates camera transitions (centered on Chennai, India $[13.0827, 80.2707]$), polygon fill layers, 3D extruded building footprints, Overpass water bodies, and custom animated wind particles.
* **`LayerControl.tsx`:** Floating map overlay allowing operators to toggle individual layers (`basemap`, `lst`, `ndvi`, `buildings`, `waterbodies`, `population`, `wind`, `chri`) and dynamically tune layer opacities.

### 2.2 Analytical Intelligence & Decision Panels (`src/components/analytics/`)
* **`CHRIInsightsPanel.tsx`:** Opens upon selecting an urban zone. Features the Composite Heat Risk Index score, risk tier badge, 5 horizontal driver breakdown bars (LST, Population, Building Density, NDVI, AQI), actionable mitigation cards, and projected cooling dividends.
* **`CityCommandCenter.tsx`:** Executive municipal modal displaying citywide KPIs, multi-horizon forecast trends, a deterministic priority intervention queue, and a budget-tiered resource portfolio planner.
* **`ScenarioPlanner.tsx`:** Digital Twin Sandbox featuring:
  - **Zone Simulator:** Interactive sliders for spatial coverage (5% to 100%) and municipal budget ($25k to $1M), 6 intervention types, and an 8-metric impact grid.
  - **Scenario A/B Comparison:** Side-by-side evaluation matrix with automated winner recommendations and decision rationale.
  - **Metropolitan What-If:** Citywide portfolio impacts across `LOW` ($500k), `MEDIUM` ($2.0M), and `HIGH` ($5.0M) municipal investment tiers.
* **`ForecastPanel.tsx`:** Multi-horizon (+24h, +72h, +7d) predictive heat escalation outlook.

### 2.3 Map Engine Library (`src/lib/map/`)
* **`layerManager.ts`:** Imperative abstraction wrapping MapLibre GL JS for layer lifecycle management (`addLayer`, `removeLayer`, `toggleLayer`, `updateOpacity`).
* **`windParticleLayer.ts`:** High-performance WebGL particle renderer animating live wind vector currents over the map.

---

## 3. Local Development

### Prerequisites
* Node.js 18+
* `npm` package manager

### Getting Started
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Type check & build production bundle
npm run build
```

The application will run locally at [http://localhost:5173](http://localhost:5173).

---

## 4. Environment Configuration

Create a `.env` file in `frontend/` to customize the backend connection:
```env
VITE_API_URL=http://localhost:8000
```
