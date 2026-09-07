# THERMOS — Urban Climate Decision Intelligence Platform

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape (Urban Heat Reduction Planner)**  
> **Team:** CodePulse  
> **Status:** Production-Oriented Foundation & First Vertical Slice Verified (53/53 Backend Pytest Tests Passing, Frontend TypeScript & Lint Verified)

---

## 1. Executive Overview

**THERMOS** is an urban climate decision-intelligence platform engineered to assist municipal planners, climate resilience officers, and civic engineers in identifying, diagnosing, and mitigating Urban Heat Islands (UHI).

Urban centers face extreme heat amplified by dense impervious surfaces, low albedo building materials, and depleted tree canopy. Municipalities often lack transparent, mathematically verifiable tools to prioritize heat interventions and project cooling outcomes within budget constraints.

THERMOS addresses this challenge by providing:
1. **Micro-Urban Hotspot Identification:** Automated classification of thermal anomalies from Land Surface Temperature (LST) observations.
2. **Deterministic Risk Attribution:** Decomposition of heat vulnerability into orthogonal hazard, exposure, and vulnerability components using the Composite Heat Risk Index (CHRI-v1.0).
3. **Evidence-Based Cooling Catalog:** Standardized catalog of 8 nature-based, material, urban design, and emergency cooling interventions with empirical unit costs, lifespans, and cooling factors.
4. **Counterfactual Scenario Simulation:** Deterministic modeling of surface and ambient air temperature reductions, budget utilization in INR Lakhs (₹), population benefited, and implementation roadmaps under space and budget constraints.
5. **Auditable Data Provenance:** First-class categorization (`OBSERVED`, `DERIVED`, `ESTIMATED`, `SIMULATED`, `ASSUMED`) across all metrics, ensuring scientific transparency without black-box calculations.

---

## 2. Core Architectural Principle: Deterministic Foundation

THERMOS enforces strict boundary separation between **deterministic analytical routines** and **AI/natural-language translation**:

* **Deterministic Analytical Core (Python / FastAPI):** All risk scoring, spatial aggregation, filter constraints, unit costing, and scenario cooling simulations are 100% deterministic, mathematically verifiable, and unit-tested. The system produces identical outputs given identical inputs.
* **Decoupled AI Translation Bridge (`ai_interface`):** AI and Large Language Models are strictly confined to the outer edge of the system for parsing unstructured natural language queries into structured planning constraints (`PlanningConstraints`) and synthesizing executive policy briefings from computed data. AI never calculates risk scores, alters formulas, or invents intervention cooling metrics.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACES                               │
│       [ Web UI / MapLibre GL JS ]        [ Natural Language Query ]     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
                      ┌───────────────────────────────┐
                      │    Decoupled AI Interface     │
                      │  - Query constraint parsing   │
                      │  - Executive narrative gen    │
                      └──────────────┬────────────────┘
                                     │ (Structured parameters only)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DETERMINISTIC ANALYTICAL ENGINE                     │
│                                                                         │
│  [Geospatial Engine]                    [Heat Analytics Core]           │
│  - GeoJSON RFC 7946                     - Normalization (direct/inv)    │
│  - Centroid & Bounds Calculation        - Hotspot detection & tiering   │
│                                                                         │
│  [Risk Engine (CHRI-v1.0)]              [Interventions Catalog (8)]     │
│  - Hazard x Exposure x Vulnerability    - Nature-based & material specs │
│  - Driver attribution breakdown (100%)  - Suitability rules & costing   │
│                                                                         │
│  [Scenario Simulation Engine]           [Portfolio Optimization]        │
│  - Surface saturation caps              - (Phase 2 Knapsack / MILP)     │
│  - LST & ambient cooling delta                                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA & PERSISTENCE                            │
│  [PostGIS-Ready Data Contracts]         [Data Classification Audit]     │
│  - Pydantic v2 schemas                  - OBSERVED | DERIVED            │
│  - In-memory repository (MVP)           - ESTIMATED | SIMULATED         │
│  - Direct migration path to PostgreSQL  - ASSUMED                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Exact Versions

### Backend
* **Runtime:** Python 3.11+
* **Framework:** FastAPI `>=0.115.0` (ASGI web framework)
* **Validation & Schemas:** Pydantic `>=2.8.0` (strict type enforcement)
* **ASGI Server:** Uvicorn `>=0.30.0`
* **Testing:** Pytest `>=8.0.0` (53 comprehensive unit and integration tests)
* **HTTP Client:** HTTPX `>=0.27.0`
* **Geospatial Standards:** GeoJSON (RFC 7946), WGS84 (EPSG:4326)

### Frontend
* **Runtime:** Node.js 18+
* **Framework:** React `^19.2.8` (TypeScript)
* **Build Tool:** Vite `^8.2.2`
* **TypeScript:** `~6.0.2`
* **Mapping Engine:** MapLibre GL `^6.7.0` (WebGL vector tile and GeoJSON choropleth rendering)
* **Basemaps:** CartoDB Dark Matter / Positron with solid canvas resilient fallback (`#111827`)
* **Styling:** Custom high-contrast analytical CSS tokens in `src/index.css` (Tailwind: Not installed)
* **Linting & Code Quality:** Oxlint `^1.79.0` + TypeScript compiler (`tsc -b`)

---

## 4. Repository Structure

```
Thermos/
├── README.md                           # Root documentation & quickstart
├── backend/                            # Python FastAPI analytical application
│   ├── app/
│   │   ├── api/                        # REST API routing layer
│   │   │   ├── health.py               # Health check and engine status
│   │   │   ├── zones.py                # Urban zones and GeoJSON endpoints
│   │   │   ├── hotspots.py             # Hotspot detection and ranking endpoints
│   │   │   └── interventions.py        # Catalog (8 items), recommendations, simulation
│   │   ├── core/                       # App configuration and environment settings
│   │   ├── data/                       # In-memory repository loading validated datasets
│   │   ├── modules/                    # Deterministic domain logic
│   │   │   ├── geospatial/             # Centroid, bounding box, spatial utilities
│   │   │   ├── heat/                   # Feature normalization & hotspot classification
│   │   │   ├── risk/                   # CHRI-v1.0 risk calculation & driver attribution
│   │   │   ├── interventions/          # Cooling catalog (8 items) & suitability recommender
│   │   │   ├── simulation/             # Counterfactual scenario simulation engine
│   │   │   └── ai_interface/           # Natural language translation bridge
│   │   ├── schemas/                    # Typed Pydantic v2 models
│   │   │   ├── common.py               # DataClassification, RiskLevel (5 tiers), enums
│   │   │   ├── zone.py                 # Zone, LandCover, Thermal, Demographic models
│   │   │   ├── hotspot.py              # HotspotDetails, HotspotTier, DriverItem
│   │   │   ├── risk.py                 # RiskAssessment, HeatRiskScore, DriverContribution
│   │   │   └── intervention.py         # Intervention, SimulationRequest, SimulationResponse
│   │   └── main.py                     # FastAPI application factory & CORS configuration
│   ├── pyproject.toml                  # Backend project metadata and test configuration
│   └── requirements.txt                # Python dependencies (fastapi, uvicorn, pydantic, pytest, httpx)
├── frontend/                           # React 19 TypeScript web application
│   ├── src/
│   │   ├── components/                 # UI components
│   │   │   ├── Header.tsx              # Application header and system status badge
│   │   │   ├── SummaryBar.tsx          # City-wide risk and hotspot metric tiles
│   │   │   ├── ZoneMap.tsx             # MapLibre GL choropleth and marker layer
│   │   │   ├── HotspotList.tsx         # Filterable ranked hotspot table
│   │   │   ├── ZoneDetail.tsx          # Zone dossier, risk gauges, driver bars
│   │   │   └── InterventionPlanner.tsx # Interactive scenario planner & cost calculator
│   │   ├── services/                   # API client and fallback data
│   │   │   ├── api.ts                  # Typed Fetch client for REST endpoints
│   │   │   └── fallbackData.ts         # Static snapshot for offline demonstrations
│   │   ├── types/                      # TypeScript type definitions matching backend schemas
│   │   ├── App.tsx                     # Main layout and workbench state container
│   │   └── index.css                   # Analytical theme and high-contrast styling
│   ├── package.json                    # Node dependencies (React 19.2.8, MapLibre 6.7.0, Vite 8.2.2)
│   └── vite.config.ts                  # Vite bundler configuration
├── data/                               # Spatial and demographic datasets
│   ├── processed/
│   │   └── sample_zones.json           # 10 realistic urban zones (industrial, core, etc.)
│   ├── raw/                            # Ingestion folder for raw raster/sensor data
│   └── schemas/
│       └── zone_schema.json            # JSON Schema for external zone validation
├── docs/                               # Engineering documentation suite
│   ├── 01-PROJECT-OVERVIEW.md          # Vision, scope, personas, and problem formulation
│   ├── 02-SYSTEM-ARCHITECTURE.md       # Modular monolith, data flow, component boundaries
│   ├── 03-DATA-ARCHITECTURE.md         # Domain schemas, PostGIS mapping, relational design
│   ├── 04-HEAT-ANALYTICS.md            # Normalization math, bounds, and thermal analytics
│   ├── 05-RISK-ENGINE.md               # CHRI-v1.0 formulation, sub-scores, driver attribution
│   ├── 06-HOTSPOT-DETECTION.md         # Dual-criterion detection, tier classification logic
│   ├── 07-INTERVENTION-ENGINE.md       # 8-item intervention catalog, suitability rules, costing
│   ├── 08-SCENARIO-SIMULATION.md       # Surface limits, cooling models, synergy physics
│   ├── 09-API-REFERENCE.md             # Complete REST endpoint specifications & schemas
│   ├── 10-FRONTEND-ARCHITECTURE.md     # React component tree, state model, MapLibre GL
│   ├── 11-DATA-PROVENANCE.md           # 5-tier classification framework & audit trails
│   ├── 12-TESTING-AND-VALIDATION.md    # 53-test verification suite, boundary conditions
│   ├── 13-SECURITY-AND-RELIABILITY.md  # Input validation, bounds clamping, fail-safes
│   ├── 14-DEPLOYMENT.md                # Local setup, Docker containerization, cloud path
│   ├── 15-ROADMAP.md                   # Phase 1 achievements and Phase 2/3 engineering
│   └── FILE-INDEX.md                   # Traceability index of every repository file
└── tests/                              # Pytest test suite (53 tests total)
    ├── conftest.py                     # Test fixtures and TestClient configuration
    ├── test_api.py                     # REST API integration tests (7 tests)
    ├── test_health.py                  # Health and root status tests (2 tests)
    ├── test_heat_analytics_core.py     # Mathematical normalization & boundary tests (22 tests)
    ├── test_hotspots.py                # Hotspot ranking & anomaly tests (4 tests)
    ├── test_risk_engine.py             # Deterministic risk math & boundary tests (6 tests)
    └── test_simulation.py              # Scenario engine cooling & budget tests (12 tests)
```

---

## 5. Quickstart Guide

### Prerequisites
* **Python:** 3.11 or higher
* **Node.js:** 18.0 or higher (with `npm`)

### 5.1 Backend Setup & Execution

```bash
# 1. Open terminal at project root
cd C:/Users/Dell/Desktop/Programming/Project/Thermos

# 2. Create and activate a Python virtual environment
# Windows PowerShell:
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# python3 -m venv .venv && source .venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Execute the test suite (53 tests)
pytest -v

# 5. Start the FastAPI development server
python -m uvicorn backend.app.main:app --reload --port 8000
```

The backend services will be live at:
* **Interactive OpenAPI Documentation (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc API Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **System Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 5.2 Frontend Setup & Execution

In a second terminal window:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Run linter and type-check
npm run lint
npm run build

# 4. Launch Vite development server
npm run dev
```

The decision workbench will be available in your browser at [http://localhost:5173](http://localhost:5173).

---

## 6. Core Mathematical Formulations

### 6.1 Composite Heat Risk Index (CHRI-v1.0)
The primary risk metric evaluates three orthogonal sub-scores:

$$\text{CHRI} = w_h \cdot H + w_e \cdot E + w_v \cdot V = 0.45 \cdot H + 0.30 \cdot E + 0.25 \cdot V$$

1. **Hazard ($H \in [0, 100]$):**
   $$H = 0.50 \cdot \text{norm}(\Delta T, [0.0, 15.0]) + 0.30 \cdot \text{norm}(\text{impervious}, [0.0, 1.0]) + 0.20 \cdot \text{norm\_inv}(\text{albedo}, [0.10, 0.40])$$
2. **Exposure ($E \in [0, 100]$):**
   $$E = 0.60 \cdot \text{norm}(\text{pop\_density}, [0, 50000]) + 0.40 \cdot \text{norm}(\text{worker\_density}, [0, 10000])$$
3. **Vulnerability ($V \in [0, 100]$):**
   $$V = 0.40 \cdot \text{norm\_inv}(\text{canopy}, [0.0, 0.50]) + 0.35 \cdot \text{norm}(\text{vulnerable\_ratio}, [0.0, 0.50]) + 0.25 \cdot \text{norm}(\text{low\_ac\_ratio}, [0.0, 1.0])$$

### 6.2 Risk Level Classification Tiers
Implemented in [`classify_risk_level()`](backend/app/modules/heat/hotspot_detection.py):
* `LOW`: $\text{CHRI} < 30.0$
* `MODERATE`: $30.0 \le \text{CHRI} < 50.0$
* `HIGH`: $50.0 \le \text{CHRI} < 70.0$
* `SEVERE`: $70.0 \le \text{CHRI} < 85.0$
* `CRITICAL`: $\text{CHRI} \ge 85.0$

### 6.3 Hotspot Detection Criteria
A zone qualifies as an active hotspot if:

$$\text{is\_hotspot} = (\text{CHRI} \ge 50.0) \lor (\Delta T \ge 3.0^\circ\text{C})$$

Tiers are assigned deterministically in [`classify_hotspot_tier()`](backend/app/modules/heat/hotspot_detection.py):
* `CRITICAL_HOTSPOT`: $\text{CHRI} \ge 85.0 \lor \Delta T \ge 12.0^\circ\text{C}$
* `SEVERE_HOTSPOT`: $\text{CHRI} \ge 70.0 \lor \Delta T \ge 8.0^\circ\text{C}$
* `HIGH_HOTSPOT`: $\text{CHRI} \ge 50.0 \lor \Delta T \ge 4.0^\circ\text{C}$
* `MODERATE_HOTSPOT`: Any other zone meeting the base hotspot qualification

### 6.4 Scenario Cooling Models
Counterfactual cooling calculations apply physical surface caps and diminishing marginal returns:

* **Land Surface Temperature Reduction:**
  $$\Delta T_{\text{LST}} = \min\left(6.5^\circ\text{C},\; \sum_{i} \delta_{\text{LST}, i} \cdot \max(0.70, 1.0 - 0.04 \cdot (N - 1))\right)$$
* **Ambient 2m Air Temperature Reduction:**
  $$\Delta T_{\text{ambient}} = \min\left(2.8^\circ\text{C},\; 3.0 \cdot \left(1 - \exp\left(-\frac{\sum k_i}{3.0}\right)\right) + \text{synergy}\right)$$
  *(where $\text{synergy} = 0.20 \cdot (1 - \exp(-N/2.0))$ when nature-based and material/reflective interventions are combined).*

---

## 7. REST API Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health, loaded zones count, active modules |
| `GET` | `/api/v1/zones` | List all urban zones with summary risk ratings |
| `GET` | `/api/v1/zones/geojson` | RFC 7946 GeoJSON FeatureCollection for mapping |
| `GET` | `/api/v1/zones/{zone_id}` | Full zone dossier (thermal, land-cover, demographics) |
| `GET` | `/api/v1/hotspots` | Ranked hotspots sorted descending by risk |
| `GET` | `/api/v1/hotspots/{zone_id}` | Hotspot detail with full driver attribution breakdown |
| `GET` | `/api/v1/interventions/catalog` | Catalog of 8 cooling measures with unit costs & specs |
| `GET` | `/api/v1/interventions/catalog/{id}`| Detailed specifications for a specific intervention |
| `GET` | `/api/v1/interventions/recommendations/{zone_id}` | Site-tailored cooling interventions for a zone |
| `POST`| `/api/v1/interventions/simulate`| Counterfactual scenario simulation with cooling deltas |

*Note: All `/api/v1/*` endpoints are also aliased at `/api/*` for backwards compatibility.*

---

## 8. Complete Documentation Suite

For complete implementation specifications, consult the documents in the `docs/` directory:

1. [01-PROJECT-OVERVIEW.md](docs/01-PROJECT-OVERVIEW.md) — Scope, problem statement, user personas, operational workflows.
2. [02-SYSTEM-ARCHITECTURE.md](docs/02-SYSTEM-ARCHITECTURE.md) — Modular monolith design, component boundaries, execution flows.
3. [03-DATA-ARCHITECTURE.md](docs/03-DATA-ARCHITECTURE.md) — Domain schemas, PostGIS mapping, relational column mappings.
4. [04-HEAT-ANALYTICS.md](docs/04-HEAT-ANALYTICS.md) — Normalization functions, clamping, thermal anomaly models.
5. [05-RISK-ENGINE.md](docs/05-RISK-ENGINE.md) — CHRI-v1.0 mathematical formulation, weights, driver attribution.
6. [06-HOTSPOT-DETECTION.md](docs/06-HOTSPOT-DETECTION.md) — Dual criteria, priority ranking, classification tiers.
7. [07-INTERVENTION-ENGINE.md](docs/07-INTERVENTION-ENGINE.md) — 8-item cooling measure catalog, suitability rules, unit economics.
8. [08-SCENARIO-SIMULATION.md](docs/08-SCENARIO-SIMULATION.md) — Physics-inspired cooling models, surface limits, synergy factors.
9. [09-API-REFERENCE.md](docs/09-API-REFERENCE.md) — Complete endpoint specifications, request/response JSON payloads.
10. [10-FRONTEND-ARCHITECTURE.md](docs/10-FRONTEND-ARCHITECTURE.md) — React component hierarchy, state management, MapLibre GL styling.
11. [11-DATA-PROVENANCE.md](docs/11-DATA-PROVENANCE.md) — Five-tier classification framework, data lineage, confidence levels.
12. [12-TESTING-AND-VALIDATION.md](docs/12-TESTING-AND-VALIDATION.md) — 53-test verification suite, boundary tests, coverage report.
13. [13-SECURITY-AND-RELIABILITY.md](docs/13-SECURITY-AND-RELIABILITY.md) — Input validation, error handling, defensive bounds clamping.
14. [14-DEPLOYMENT.md](docs/14-DEPLOYMENT.md) — Development runbooks, containerization, cloud deployment architecture.
15. [15-ROADMAP.md](docs/15-ROADMAP.md) — Phase 1 achievements, Phase 2 PostGIS/optimization, Phase 3 regional scaling.
16. [FILE-INDEX.md](docs/FILE-INDEX.md) — Exhaustive cross-reference file index of every repository artifact.

---

## 9. Verification & Quality Assurance

The codebase has undergone comprehensive automated verification:
* **Backend Unit & Integration Tests:** `53 passed in 1.22s` across 6 test modules.
* **Frontend Linting:** `oxlint` executed with `0 errors, 0 warnings`.
* **TypeScript Build:** `tsc -b && vite build` completed successfully without warnings (built in 641ms).

---

## 10. License & Attribution

THERMOS is developed by **Team CodePulse** for the **RESONANCE 1.0 Hackathon (Problem Statement PS13)**.  
Licensed under the Apache License 2.0. Built with open-source tools and public geospatial standards.
