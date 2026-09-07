# THERMOS — Urban Climate Decision Intelligence Platform

> **RESONANCE 1.0 Hackathon — Problem Statement PS13**  
> **Problem:** HeatScape — Urban Heat Reduction Planner  
> **Team:** CodePulse  
> **Phase:** 1 (Production-Oriented Foundation & First Vertical Slice)

---

## 🌍 Project Vision

**THERMOS** is an urban climate decision-intelligence workbench engineered to assist municipal planners, resilience officers, and civic engineers in mitigating urban heat islands (UHI).

### Core Capabilities Roadmap:
1. **Micro-Urban Hotspot Identification:** Detect localized thermal anomalies from Land Surface Temperature (LST) observations.
2. **Deterministic Driver Attribution:** Quantify the exact contribution of physical hazard (albedo, impervious surface), human exposure (population, outdoor labor), and vulnerability (canopy deficit, demographic age sensitivity).
3. **Evidence-Based Cooling Interventions:** Evaluate feasibility, unit costs, and cooling deltas for nature-based and material solutions (cool roofs, tree canopy expansion, permeable pavers).
4. **Scenario Simulation & Portfolio Optimization:** Forward-project counterfactual cooling outcomes under budget and space constraints.
5. **Auditable Data Provenance:** First-class classification tags (`OBSERVED`, `DERIVED`, `ESTIMATED`, `SIMULATED`, `ASSUMED`) across all metrics.

---

## 🏛️ Architectural Principles: Not an LLM Wrapper

THERMOS enforces strict boundary separation between **deterministic analytics** and the **AI/NL interface**:

* **Deterministic Computation (Python / FastAPI / PostGIS-Ready):** All risk scoring, spatial aggregation, filter constraints, unit costing, and optimization algorithms are 100% deterministic, mathematically verifiable, and unit-tested.
* **Decoupled AI Translation Bridge:** The AI interface is strictly used to translate natural-language planning queries into typed filter constraints (`PlanningConstraints`) and summarize complex multi-dimensional risk vectors into clear civic executive briefings. It **never** computes risk numbers or invents cooling deltas.

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                        │
│   [ Web UI / MapLibre ]         [ Natural Language Query ]  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │       AI / NL Interface       │
               │  - Structured intent parsing  │
               │  - Executive briefing gen     │
               └───────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               DETERMINISTIC ANALYTICAL ENGINE               │
│                                                             │
│  [Geospatial Engine]           [Thermal / Heat Analytics]   │
│  - GeoJSON / PostGIS           - LST & Anomaly Extraction   │
│  - Spatial aggregation         - UHI index computation      │
│                                                             │
│  [Risk Engine]                 [Interventions Catalog]      │
│  - Hazard x Exposure x Vuln    - Suitability rules          │
│  - Driver attribution          - Unit cost & cooling delta  │
│                                                             │
│  [Scenario Simulation]         [Portfolio Optimization]     │
│  - Counterfactual evaluation   - Knapsack / ILP solver      │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA & PERSISTENCE                      │
│  [PostGIS Ready Schemas]       [Data Classification Audit]  │
│  - Zones, Observations         - OBSERVED | DERIVED         │
│  - Local JSON (MVP) -> PostGIS - ESTIMATED | ASSUMED        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
Thermos/
├── docs/
│   ├── architecture.md           # Deep-dive architecture specification & boundaries
│   └── decisions.md              # Architecture Decision Records (ADRs 001-006)
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI REST endpoints (/health, /zones, /hotspots, /interventions)
│   │   ├── core/                 # Configuration & environment settings
│   │   ├── data/                 # PostGIS-compatible in-memory data repository
│   │   ├── modules/
│   │   │   ├── geospatial/       # Centroids, bounding boxes, GeoJSON formatters
│   │   │   ├── heat/             # LST anomaly extraction & UHI severity tiering
│   │   │   ├── risk/             # Deterministic Composite Heat Risk Index (CHRI) engine
│   │   │   ├── interventions/    # Urban cooling catalog & suitability recommender
│   │   │   ├── simulation/       # Scenario simulation interface (Phase 2 ready)
│   │   │   ├── optimization/     # Portfolio budget optimizer interface (Phase 2 ready)
│   │   │   └── ai_interface/     # Decoupled natural language bridge
│   │   ├── schemas/              # Typed Pydantic domain models
│   │   └── main.py               # Application factory & CORS setup
│   ├── pyproject.toml            # Backend build & package configuration
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/           # UI Components (Header, SummaryBar, HotspotList, ZoneMap, ZoneDetail)
│   │   ├── services/             # Typed API client
│   │   ├── types/                # TypeScript mirrors of backend domain schemas
│   │   ├── App.tsx               # Primary decision workbench layout
│   │   └── index.css             # High-contrast analytical dashboard theme
│   ├── package.json              # Frontend dependencies (React 19, Vite, MapLibre GL)
│   └── vite.config.ts            # Vite configuration
├── data/
│   ├── processed/
│   │   └── sample_zones.json     # 10 realistic synthetic urban planning zones
│   ├── raw/                      # Raw satellite / sensor ingestion folder (.gitkeep)
│   └── schemas/
│       └── zone_schema.json      # JSON Schema for zone validation
└── tests/
    ├── test_api.py               # REST API integration tests
    ├── test_health.py            # Health and root status tests
    ├── test_hotspots.py          # Hotspot ranking & anomaly tests
    └── test_risk_engine.py       # Deterministic risk math & boundary tests
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Python:** 3.11+
* **Node.js:** 18+ and `npm`

---

### 1. Backend Setup & Run

```bash
# 1. Create and activate a virtual environment
py -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run backend tests (20 unit & integration tests)
pytest -v

# 4. Start the FastAPI development server
python -m uvicorn backend.app.main:app --reload --port 8000
```

The backend will be available at:
* **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2. Frontend Setup & Run

In a separate terminal:

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Build check
npm run build

# 4. Start Vite development server
npm run dev
```

The web dashboard will be available at [http://localhost:5173](http://localhost:5173).

---

## 📡 API Contract Summary

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health, loaded zones count, and engine status |
| `GET` | `/api/v1/zones` | List of all zones with summary risk metrics |
| `GET` | `/api/v1/zones/geojson` | RFC 7946 GeoJSON FeatureCollection for MapLibre GL |
| `GET` | `/api/v1/zones/{zone_id}` | Complete physical, thermal, and demographic zone details |
| `GET` | `/api/v1/hotspots` | Ranked thermal hotspots sorted descending by risk |
| `GET` | `/api/v1/hotspots/{zone_id}` | Detailed dossier with explainable driver breakdown |
| `GET` | `/api/v1/interventions/catalog` | Catalog of cooling measures with unit costs & lifespan |
| `GET` | `/api/v1/interventions/recommendations/{zone_id}` | Site-specific cooling solutions for a target zone |

---

## 🔬 Deterministic Risk Engine (CHRI-v1.0)

The **Composite Heat Risk Index (CHRI)** combines three normalized orthogonal sub-scores:

$$\text{CHRI} = w_{\text{hazard}} \cdot H + w_{\text{exposure}} \cdot E + w_{\text{vulnerability}} \cdot V$$

* **Hazard ($H$):** Land Surface Temperature anomaly ($\Delta T$, 50%), Impervious ground fraction (30%), Albedo solar absorption (20%).
* **Exposure ($E$):** Population density (60%), Outdoor laborer concentration (40%).
* **Vulnerability ($V$):** Tree canopy deficit (40%), Age-sensitive ratio ($<5$ and $>65$ years, 35%), Lack of mechanical cooling / AC (25%).

Every score exposes its **driver attribution percentage** in the API and UI:

$$\text{Attribution}_i = \frac{w_i \cdot \text{Metric}_i}{\text{CHRI}} \times 100\%$$

---

## 🧪 Testing & Verification

Run the comprehensive pytest suite:
```bash
pytest -v
```

All 20 tests verify:
* Deterministic reproducible score calculations
* Exact driver attribution sum ($100\% \pm 0.5\%$)
* High-risk vs cool refuge boundary conditions
* Hotspot sorting and filtering algorithms
* GeoJSON RFC 7946 compliance
* REST endpoint status codes and Pydantic schema validation

---

## 🗺️ Next Steps (Phase 2 Roadmap)
- [ ] Connect PostGIS spatial database via GeoAlchemy2/SQLAlchemy for raster zonal statistics
- [ ] Ingest live Landsat/MODIS thermal rasters via Cloud Optimized GeoTIFFs (COGs)
- [ ] Implement interactive budget slider linked to the Portfolio Optimizer engine
- [ ] Expand the Scenario Simulator with counterfactual before/after thermal layer toggle
- [ ] Integrate local LLM / LangChain agent over the decoupled `ai_interface` translation bridge
