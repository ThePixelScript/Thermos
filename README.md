# THERMOS — Urban Climate Decision Intelligence & Digital Twin Platform

> **RESONANCE 1.0 — Problem Statement PS13 (HeatScape: Urban Heat Reduction Planner)**  
> **System Status:** Production Core (Phases 1 through 6 Completed)  
> **Backend:** FastAPI 0.115+ (Python 3.11+) | **Frontend:** React 19 + TypeScript + MapLibre GL JS + Vite  
> **Test Suite:** 126 / 126 Tests Passing (100% Deterministic Pass Rate)  

---

## 🌍 Project Overview

**THERMOS** is an urban climate decision-intelligence and digital twin platform engineered to assist municipal planners, climate resilience officers, and civic engineers in diagnosing, predicting, and mitigating Urban Heat Islands (UHI).

Unlike black-box generative AI wrappers, THERMOS is built on **deterministic biophysical modeling**, **remote sensing satellite raster pipelines**, **transparent mathematical risk attribution**, and **reproducible optimization heuristics**. All analytical calculations are transparent, explainable, and verifiable.

---

## 🚀 Key Capabilities Across Completed Phases

### Phase 1 — Core Geospatial & Heat Risk Engine
* **MapLibre GL JS Geospatial Foundation:** High-performance vector tile map centered on the urban core of Chennai, India, with full navigation controls.
* **Real-World Environmental Layers:** Live Open-Meteo weather widget, animated WebGL wind vector particles, Overpass OpenStreetMap water polygons, and 3D extruded building footprints.
* **Imperative LayerManager:** Fine-grained runtime control over layer visibility, stacking orders, and dynamic opacity adjustments.

### Phase 2 — Remote Sensing Raster Intelligence
* **Sentinel-2 & Landsat 8/9 Scene Discovery:** Automated STAC querying across Earth Search and Planetary Computer catalogs with spatial bounding filters.
* **TiTiler & Dynamic Raster Tile Server:** On-the-fly generation of $256 \times 256$ Web Mercator PNG tiles with authentic color scale ramps (RdYlGn for NDVI, thermal plasma for LST).
* **Zonal Statistics Engine:** Rapid per-zone extraction of mean, min, max, canopy cover percentages, and thermal anomalies.

### Phase 3 — Dynamic Raster-Driven CHRI Analytics
* **Continuous Composite Heat Risk Index (CHRI):** Replaces static census models with live satellite-derived raster inputs:
  $$\text{CHRI} = 0.35 \cdot \widehat{\text{LST}} + 0.20 \cdot \widehat{\text{Pop}} + 0.20 \cdot \widehat{\text{Bld}} - 0.15 \cdot \widehat{\text{NDVI}} + 0.10 \cdot \widehat{\text{AQI}}$$
* **Explainable 5-Driver Attribution:** Quantifies the exact mathematical percentage contribution of each hazard factor.
* **CHRI Insights Panel:** Analytical drawer featuring risk badges (`LOW`, `MODERATE`, `HIGH`, `SEVERE`, `CRITICAL`), horizontal metric bars, and actionable cooling recommendations.

### Phase 4 — Predictive Heat Forecasting Engine
* **Multi-Horizon Projections:** Deterministic heat forecasts at $+24\text{h}$, $+72\text{h}$, and $+7\text{d}$ horizons based on meteorological trends, diurnal cycles, and urban thermal inertia.
* **Early Warning Escalation Tiers:** Automated categorization into `Severe Rise`, `Rising`, `Stable`, and `Cooling` alert levels.
* **Driver Attribution Deltas:** Pinpoints the specific environmental factor driving heat wave acceleration.

### Phase 5 — Municipal Decision Intelligence
* **City Command Center:** Executive intelligence dashboard displaying metropolitan-wide KPIs, risk distributions, and urgent directives.
* **Deterministic Priority Scoring:**
  $$\text{Priority Score} = 0.35 \cdot \text{CHRI} + 0.25 \cdot \text{Forecast} + 0.15 \cdot \text{Pop} + 0.15 \cdot \text{Vuln} + 0.10 \cdot \text{Feas}$$
* **Budget-Tiered Resource Portfolios:** Greedy resource allocator optimizing municipal interventions across standardized investment tiers (`LOW`: \$500k, `MEDIUM`: \$2.0M, `HIGH`: \$5.0M).

### Phase 6 — Urban Climate Digital Twin & Scenario Simulator
* **Counterfactual Biophysical Simulator:** Physics-based evaluation of 6 cooling interventions:
  1. Urban Forestry & Tree Canopy expansion
  2. Cool Roofs (High-Albedo coatings)
  3. Reflective Cool Pavements
  4. Shade Corridors (Tensile solar interception)
  5. Water Body & Wetland Restoration
  6. Clean Air Micro-Zones (AQI PM2.5 mitigation)
* **Multi-Scenario A/B Comparison Matrix:** Side-by-side evaluation of competing intervention plans against status quo baseline with automated winner recommendation.
* **Metropolitan What-If Portfolio Sandbox:** Aggregated citywide cooling, population protection, and civic ROI projections.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FRONTEND WORKBENCH (React 19 + TypeScript)                  │
│  [MapLibre GL Map View] [LayerControl] [CHRI Insights Drawer]              │
│  [City Command Center]  [Forecast Panel] [Digital Twin Scenario Planner]    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │  HTTP / REST (JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI APPLICATION GATEWAY                           │
│  - Routes: /api/v1/* (with backward-compatible /api/* dual-mount)           │
│  - OpenAPI / Swagger Documentation & Pydantic Request Validation            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ RASTER ENGINE    │          │ ANALYTICS CORE   │          │ DIGITAL TWIN     │
│ - STAC Discovery │          │ - Live CHRI Calc │          │ - Biophysics Sim │
│ - TiTiler Proxy  │          │ - 5-Driver Attrib│          │ - A/B Matrix     │
│ - PNG Tile Gen   │          │ - Heat Forecast  │          │ - What-If Engine │
│ - Zonal Stats    │          │ - Decision Queue │          │ - Civic ROI Calc │
└──────────────────┘          └──────────────────┘          └──────────────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA & INGESTION LAYER                              │
│  - In-Memory Repository (PostGIS-Ready GeoJSON Schemas)                     │
│  - Remote Sensing: Sentinel-2 Multispectral & Landsat 8/9 Thermal           │
│  - Meteorological: Open-Meteo Live API | Urban Footprints: Overpass / OSM   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

* **Backend Framework:** FastAPI 0.115+, Uvicorn 0.30+, Pydantic v2
* **Frontend Framework:** React 19, TypeScript, Vite 8+, CSS3 Design Tokens
* **Geospatial & Visualization:** MapLibre GL JS, GeoJSON (RFC 7946), WebGL Wind Vector Particles
* **Testing & Quality Assurance:** Pytest 8.x, AnyIO, Starlette TestClient, TypeScript Compiler (`tsc -b`)
* **Remote Sensing Standards:** STAC (SpatioTemporal Asset Catalog), OpenGIS TileJSON 3.0.0, Cloud-Optimized GeoTIFF (COG)

---

## 📁 Repository Structure

```
Thermos/
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── api/              # HTTP Route handlers (chri, forecast, city, simulation, raster...)
│   │   ├── core/             # Configuration & environment settings
│   │   ├── data/             # In-memory spatial data repository
│   │   ├── modules/          # Pure computational services (raster, chri, forecast, city, simulation...)
│   │   ├── schemas/          # Pydantic v2 domain schemas & DTOs
│   │   └── main.py           # Application entrypoint & discovery routes
│   ├── pyproject.toml        # Backend package metadata
│   └── requirements.txt      # Python runtime dependencies
├── data/
│   └── processed/
│       └── sample_zones.json # Primary dataset: 10 urban zones (Chennai core)
├── docs/                     # Architectural, operational & technical documentation
│   ├── api_reference.md      # Detailed REST API specification
│   ├── architecture.md       # High-level system architecture & diagrams
│   ├── decisions.md          # Architecture Decision Records (ADRs 001-011)
│   ├── developer_guide.md    # Developer standards & coding conventions
│   ├── operations.md         # Deployment, Docker & monitoring guide
│   └── testing.md            # Test suite structure & execution guide
├── frontend/                 # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/       # UI Components (Map, Analytics, Command Center, Scenario Planner)
│   │   ├── lib/map/          # LayerManager & WebGL wind particle engine
│   │   ├── services/         # Typed API clients
│   │   ├── types/            # TypeScript domain interfaces
│   │   ├── App.tsx           # Primary application view
│   │   └── index.css         # Analytical dashboard theme
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite bundling configuration
└── tests/                    # Pytest automated test suite (126 tests)
```

---

## ⚡ Quickstart & Local Development

### Prerequisites
* **Python:** 3.11+
* **Node.js:** 18+ and `npm`

---

### 1. Running the Backend

```bash
# 1. Create and activate a Python virtual environment
py -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Start the FastAPI development server
python -m uvicorn backend.app.main:app --reload --port 8000
```

The backend will be available at:
* **Interactive OpenAPI Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative ReDoc View:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **System Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

### 2. Running the Frontend

In a separate terminal:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The web dashboard will be available at [http://localhost:5173](http://localhost:5173).

---

### 3. Running Automated Tests

Run the complete 126-test suite:
```bash
pytest -v
```

Execute a specific domain test:
```bash
# Run simulation digital twin tests:
pytest tests/test_simulation.py -v

# Run raster intelligence tests:
pytest tests/test_raster.py -v

# Run forecast engine tests:
pytest tests/test_forecast.py -v
```

Verify frontend TypeScript type-checking and production build:
```bash
cd frontend
npm run build
```

---

## 📡 Key API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | System health check and loaded zones status |
| `/api/v1/zones/geojson` | `GET` | RFC 7946 GeoJSON FeatureCollection for MapLibre GL |
| `/api/v1/chri/{zone_id}` | `GET` | Live raster-driven CHRI score and 5-driver breakdown |
| `/api/v1/raster/ndvi/tilejson` | `GET` | OpenGIS TileJSON for Sentinel-2 NDVI raster tiles |
| `/api/v1/raster/lst/tilejson` | `GET` | OpenGIS TileJSON for Landsat 8/9 thermal LST tiles |
| `/api/v1/forecast/{zone_id}` | `GET` | Multi-horizon predictive heat forecast (+24h, +72h, +7d) |
| `/api/v1/city/overview` | `GET` | Metropolitan command center overview & citywide KPIs |
| `/api/v1/city/interventions` | `GET` | Multi-criteria prioritized intervention queue |
| `/api/v1/city/resources` | `GET` | Budget-constrained portfolio allocation (LOW, MEDIUM, HIGH) |
| `/api/v1/simulation/run` | `POST` | Digital twin counterfactual intervention simulation |
| `/api/v1/simulation/compare` | `POST` | Multi-scenario A/B side-by-side comparison matrix |
| `/api/v1/simulation/citywide` | `GET` | Metropolitan what-if digital twin projections |

For full request/response schemas and curl examples, see the [API Reference Specification](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/api_reference.md).

---

## 📚 Complete Documentation Index

* [Architecture Blueprint & Mermaid Pipelines](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/architecture.md)
* [Architecture Decision Records (ADR-001 to ADR-011)](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/decisions.md)
* [Comprehensive API Reference](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/api_reference.md)
* [Developer & Engineering Guide](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/developer_guide.md)
* [Operations & Deployment Guide](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/operations.md)
* [Testing & Quality Assurance Guide](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/docs/testing.md)
* [Frontend Geospatial Workbench Guide](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/frontend/README.md)
