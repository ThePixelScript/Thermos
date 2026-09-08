# THERMOS — Architectural Blueprint

**Project:** THERMOS (PS13 — HeatScape: Urban Heat Reduction Planner)  
**System Version:** 2.0.0 (Production Core — Phases 1 through 6)  
**Status:** Approved / Active Specification  

---

## 1. Executive Summary & System Scope

**THERMOS** is an urban climate decision-intelligence and digital twin platform engineered for municipal planners, climate resilience officers, and civic engineers tasked with mitigating Urban Heat Islands (UHI).

Unlike black-box generative AI wrappers, THERMOS is built on **deterministic biophysical physics**, **reproducible geospatial risk algorithms**, **remote sensing raster pipelines**, and **explainable decision-support heuristics**. All computations are transparent, mathematically auditable, and unit-tested.

### Implemented Capability Horizons:
* **Phase 1 — Map Foundation & Real-World Geospatial Layers:** MapLibre GL JS engine, custom `LayerManager`, live Open-Meteo weather integration, animated wind vector particles, Overpass water polygons, and 3D building footprint extrusions.
* **Phase 2 — Remote Sensing Raster Intelligence:** Sentinel-2 multispectral NDVI and Landsat 8/9 thermal LST scene discovery via STAC, dynamic TiTiler integration, server-side raster PNG tile rendering, and zonal statistics extraction.
* **Phase 3 — Dynamic Raster-Driven CHRI Analytics:** Continuous Composite Heat Risk Index (CHRI) evaluation driven by live remote sensing data, 5-driver mathematical decomposition, and interactive visual intelligence drawer.
* **Phase 4 — Predictive Heat Forecasting Engine:** Multi-horizon predictive risk modeling (+24h, +72h, +7d) incorporating meteorological trends, diurnal cycles, and thermal inertia without opaque machine learning dependencies.
* **Phase 5 — Municipal Decision Intelligence:** Citywide executive command center, deterministic priority intervention scoring, municipal action catalogs, and budget-constrained portfolio optimization (LOW, MEDIUM, HIGH tiers).
* **Phase 6 — Urban Climate Digital Twin & Scenario Simulator:** Counterfactual biophysical simulation sandbox, interactive intervention sliders (forestry, cool roofs, reflective pavements, shade corridors, water restoration, AQI zones), side-by-side A/B comparison matrix, and metropolitan what-if forecasting.

---

## 2. High-Level System Architecture

THERMOS adopts a **decoupled modular monolith** architecture on the backend coupled with a **component-driven geospatial frontend**.

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React 19 + Vite + TypeScript)"]
        UI["App Shell / Workbench"]
        Map["MapLibre GL Map View"]
        LM["LayerManager"]
        Insights["CHRI Insights Panel"]
        Command["City Command Center"]
        Twin["Scenario Planner Sandbox"]
    end

    subgraph Gateway["FastAPI Application Layer (Port 8000)"]
        Router["API Router (/api/v1 & /api)"]
        CORS["CORS & Request Middleware"]
        Doc["OpenAPI / Swagger / ReDoc"]
    end

    subgraph Engines["Deterministic Computational Engines"]
        RasterEng["Raster Processing Engine\n(STAC + TiTiler + Zonal Stats)"]
        CHRIEng["Dynamic CHRI Analytics Engine\n(5-Factor Normalization & Attribution)"]
        ForecastEng["Heat Forecast Engine\n(+24h, +72h, +7d Diurnal Model)"]
        DecisionEng["Decision Intelligence Engine\n(Priority Scoring & Portfolio Optimizer)"]
        SimEng["Digital Twin Simulator\n(Biophysical Counterfactual Physics)"]
    end

    subgraph Data["Persistence & Ingestion Layer"]
        Repo["In-Memory Spatial Repository\n(PostGIS-Ready GeoJSON)"]
        STAC["Planetary Computer / AWS STAC API"]
        Meteo["Open-Meteo Weather Service"]
        OSM["Overpass OSM / Overture Footprints"]
    end

    UI --> Router
    Map --> LM
    LM --> RasterEng
    Insights --> CHRIEng
    Command --> DecisionEng
    Twin --> SimEng

    Router --> Engines
    RasterEng --> STAC
    CHRIEng --> RasterEng
    CHRIEng --> Repo
    ForecastEng --> Meteo
    ForecastEng --> CHRIEng
    DecisionEng --> ForecastEng
    DecisionEng --> CHRIEng
    SimEng --> CHRIEng
    SimEng --> ForecastEng
```

---

## 3. Backend Architecture

The backend is written in Python 3.11+ using FastAPI and Pydantic v2. It enforces strict separation of concerns, zero circular imports, and total isolation between API transport, business logic, and spatial data persistence.

```
backend/app/
├── api/                    # HTTP transport layer (FastAPI APIRouters)
│   ├── chri.py             # Zonal CHRI evaluation & driver attribution
│   ├── city.py             # Municipal overview, priority queue, resource portfolios
│   ├── forecast.py         # Multi-horizon heat wave forecasting & early warnings
│   ├── health.py           # Liveness, readiness, and repository inspection
│   ├── hotspots.py         # Thermal anomaly ranking and dossiers
│   ├── interventions.py    # Urban cooling measure catalog
│   ├── raster.py           # TileJSON, PNG raster tiles, colormaps, zonal stats
│   ├── simulation.py       # Digital twin counterfactual sandbox & comparison
│   ├── weather.py          # Ambient meteorological data & heat index
│   └── zones.py            # GeoJSON polygons and zone metadata
├── core/                   # System configuration & environment settings
│   └── config.py           # ThermosSettings Pydantic settings object
├── data/                   # Data access and storage abstractions
│   └── repository.py       # Spatial repository loading sample_zones.json
├── modules/                # Pure business logic and mathematical engines
│   ├── chri/               # CHRI computation, risk tiers, driver attribution
│   ├── city/               # Priority scoring formula & portfolio allocation
│   ├── forecast/           # Diurnal cycle modeling & multi-day heat projections
│   ├── geospatial/         # EPSG:4326 geometries, bbox, centroids, GeoJSON builders
│   ├── heat/               # LST anomaly extraction & thermal severity
│   ├── interventions/      # Cooling suitability & unit cost models
│   ├── raster/             # STAC discovery, TiTiler proxy, PNG tile encoder
│   ├── simulation/         # Deterministic biophysical delta physics & A/B comparison
│   └── weather/            # Open-Meteo client & Steadman heat index calculation
├── schemas/                # Strongly-typed Pydantic domain models & DTOs
└── main.py                 # FastAPI application factory, router mounting, discovery
```

### Architectural Principles:
1. **Dual Route Mounting:** All API routers are mounted under both `/api/v1/*` and `/api/*` to guarantee strict backward compatibility with early client integrations.
2. **Deterministic Computation:** Analytical functions never call random generators, external AI models, or heuristic non-deterministic branches during calculation.
3. **Pydantic Validation:** All incoming query parameters, path variables, and JSON payloads are strictly validated against Pydantic models with field constraints (e.g. `coverage_pct` bounded $[1.0, 100.0]$).

---

## 4. Frontend Architecture

The frontend is built with **React 19**, **TypeScript**, and **Vite**, prioritizing rendering performance, crisp geospatial visualization, and executive usability.

```
frontend/src/
├── components/
│   ├── analytics/
│   │   ├── CHRIInsightsPanel.tsx   # Zone analytical drawer (CHRI score, progress bars, recommendations)
│   │   ├── CityCommandCenter.tsx   # Municipal command modal (KPIs, priority queue, budget tiers)
│   │   ├── ForecastPanel.tsx       # Heat forecast chart (+24h, +72h, +7d escalation badges)
│   │   └── ScenarioPlanner.tsx     # Digital twin sandbox (3 tabs: simulator, A/B matrix, what-if)
│   ├── map/
│   │   ├── LayerControl.tsx        # UI toggle and opacity slider control panel
│   │   └── ThermosMap.tsx          # MapLibre GL map container, camera management, layer hooks
│   ├── weather/
│   │   └── WeatherWidget.tsx       # Real-time meteorological pill with auto-refresh
│   ├── Header.tsx                  # App bar, branding, command/scenario triggers, status pill
│   ├── HotspotList.tsx             # Ranked priority queue sidebar with risk filter
│   └── SummaryBar.tsx              # Top-level citywide metrics bar
├── lib/
│   └── map/
│       ├── layerManager.ts         # Imperative MapLibre GL layer abstraction
│       └── windParticleLayer.ts    # WebGL wind vector animation engine
├── services/
│   ├── api.ts                      # Typed REST client for all backend endpoints
│   ├── buildingFootprintsService.ts# Overture building polygon fetcher & GeoJSON builder
│   ├── lstService.ts               # Landsat thermal raster TileJSON & tile helper
│   ├── ndviService.ts              # Sentinel-2 vegetation TileJSON & tile helper
│   └── overpassWaterService.ts     # OpenStreetMap water polygon Overpass client
├── types/
│   └── index.ts                    # Complete TypeScript definitions matching backend schemas
├── App.tsx                         # Master application orchestrator
└── index.css                       # High-contrast analytical theme & layout rules
```

---

## 5. End-to-End Data Flow Architecture

The data lifecycle within THERMOS connects remote sensing hardware to executive policy decisions:

```mermaid
sequenceDiagram
    autonumber
    actor User as Urban Planner / Resilience Officer
    participant UI as React Frontend (MapLibre + Drawers)
    participant API as FastAPI Backend (/api/v1/*)
    participant Raster as Raster Engine (STAC / TiTiler)
    participant Analytics as CHRI & Forecast Engines
    participant Twin as Digital Twin Simulator

    User->>UI: Selects Zone (e.g. ZONE-01) on Map
    UI->>API: GET /api/v1/chri/ZONE-01
    API->>Raster: Compute Zonal Stats (NDVI & LST)
    Raster-->>API: Return mean LST (38.5°C), mean NDVI (0.18)
    API->>Analytics: Evaluate Live CHRI + 5-Driver Attribution
    Analytics-->>API: Return CHRI (72.4), Risk: SEVERE, Dominant: high_lst
    API-->>UI: Deliver LiveCHRIScore payload
    UI-->>User: Open CHRIInsightsPanel with progress bars & recommendations

    User->>UI: Opens Scenario Planner -> Simulates 60% Cool Roofs ($200k)
    UI->>API: POST /api/v1/simulation/run
    API->>Twin: compute_counterfactual_deltas() + re-evaluate CHRI
    Twin-->>API: Return SimulationResult (-3.2°C LST, -11.4 pts CHRI, 18,200 pop shielded)
    API-->>UI: Render 8-Metric Impact Grid & Before/After Comparison
    UI-->>User: Display Civic ROI (7.7x) & Risk De-escalation (SEVERE -> MODERATE)
```

---

## 6. Remote Sensing & Raster Processing Pipeline

THERMOS incorporates real satellite raster intelligence directly into the risk calculations rather than relying on static tabular assumptions.

```mermaid
flowchart LR
    subgraph DataSources["Satellite Remote Sensing"]
        S2["Sentinel-2 Level-2A\n(Multispectral Surface Reflectance)"]
        L8["Landsat 8/9 Collection 2\n(Thermal Infrared Band 10 / LST)"]
    end

    subgraph Ingestion["STAC Discovery Layer"]
        STAC["STAC API Search\n(BBox: Chennai [80.15, 12.95, 80.32, 13.18])"]
        Filter["Cloud Cover Filter (< 20%)\nTemporal Sorting (Latest Scenes)"]
    end

    subgraph Processing["Raster Engine (raster_service.py)"]
        TileJSON["Dynamic TileJSON Generator\n(Tile endpoint templates & bounds)"]
        TileGen["Synthetic/COG Tile Generator\n(Z/X/Y Web Mercator -> Lat/Lon Bounds)"]
        ColorRamp["Server-side Color Ramp Mapping\n(RdYlGn for NDVI, Magma/Plasma for LST)"]
        PNG["In-Memory PNG Compression\n(zlib Deflate stream)"]
        Zonal["Zonal Statistics Extractor\n(Per-zone mean, min, max, canopy cover)"]
    end

    subgraph ClientMap["MapLibre GL Client"]
        Rasters["Raster Tile Layers\n(Dynamic Opacity & Colormap Legends)"]
    end

    S2 --> STAC
    L8 --> STAC
    STAC --> Filter
    Filter --> TileJSON
    TileJSON --> TileGen
    TileGen --> ColorRamp
    ColorRamp --> PNG
    PNG --> Rasters
    TileGen --> Zonal
```

### Supported Raster Channels:
1. **Sentinel-2 NDVI:**
   - Evaluates vegetation index $\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$ across $[-1.0, 1.0]$.
   - Color scale: 5-step Red-Yellow-Green (`#d7191c` through `#1a9641`).
   - Generates zonal vegetation metrics: mean NDVI, canopy cover percentage, and thermal mitigation cooling offset.
2. **Landsat 8/9 LST:**
   - Evaluates surface kinetic temperature in Celsius across $[20.0^\circ\text{C}, 55.0^\circ\text{C}]$.
   - Color scale: 6-step thermal ramp (Blue $\rightarrow$ Green $\rightarrow$ Yellow $\rightarrow$ Orange $\rightarrow$ Deep Crimson).
   - Classifies thermal anomalies into 5 tiers: `Cool Refuge`, `Normal`, `Elevated`, `Severe Anomaly`, `Extreme Hotspot`.

---

## 7. Predictive Heat Forecasting Pipeline

The Heat Forecast Engine ([`backend/app/modules/forecast/`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/backend/app/modules/forecast/)) provides deterministic projections for $+24\text{h}$, $+72\text{h}$, and $+7\text{d}$ horizons without unpredictable machine learning regressions.

```mermaid
flowchart TD
    Init["Baseline Input (Live CHRI, LST, NDVI, AQI)"]
    Meteo["Weather Trends (Ambient Temp Delta, Wind, Humidity)"]
    Inertia["Urban Physical Thermal Inertia (Impervious & Building Density)"]

    Init --> Calc
    Meteo --> Calc
    Inertia --> Calc

    subgraph Engine["Deterministic Forecasting Core"]
        Calc["Compute Projected Thermal Delta:\nΔT = meteo_trend * (1 + 0.4*impervious - 0.3*ndvi)"]
        ProjectLST["Project Surface Temp: LST_t = LST_0 + ΔT"]
        ProjectCHRI["Recompute CHRI Score: CHRI_t = compute_chri_score(...)"]
        Escalation["Classify Escalation:\nSevere Rise | Rising | Stable | Cooling"]
        DriverAttr["Driver Attribution Delta:\n(Determine what is accelerating risk)"]
    end

    ProjectCHRI --> Escalation
    Calc --> DriverAttr

    subgraph Outputs["API & Client Deliverables"]
        ForecastOutput["CHRIForecast (+24h, +72h, +7d points)"]
        EarlyWarning["Citywide Early Warning Alert Triggers"]
    end

    Escalation --> ForecastOutput
    DriverAttr --> ForecastOutput
    ForecastOutput --> EarlyWarning
```

### Escalation Classification Criteria:
* **Severe Rise:** Projected $\Delta \text{CHRI} \ge +4.0$ points, or projected $\text{CHRI} \ge 70.0$ with $\Delta \text{CHRI} \ge +2.5$.
* **Rising:** $+1.0 \le \Delta \text{CHRI} < +4.0$ points.
* **Stable:** $-1.5 \le \Delta \text{CHRI} < +1.0$ points.
* **Cooling:** $\Delta \text{CHRI} < -1.5$ points.

---

## 8. Municipal Decision Intelligence Pipeline

The City Intelligence Engine ([`backend/app/modules/city/`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/backend/app/modules/city/)) synthesizes micro-urban findings into actionable public administration decisions.

```mermaid
flowchart TD
    subgraph MultiCriteria["Multi-Criteria Evaluation Input"]
        CHRI["Current CHRI Score (35%)"]
        Forecast["Forecast +72h Risk (25%)"]
        Pop["Population Exposure Index (15%)"]
        Vuln["Socio-Demographic Vulnerability (15%)"]
        Feas["Infrastructural Feasibility (10%)"]
    end

    subgraph Scoring["Priority Scoring Formula"]
        Formula["Priority Score = 0.35*CHRI + 0.25*Forecast + 0.15*Pop + 0.15*Vuln + 0.10*Feas"]
    end

    CHRI --> Formula
    Forecast --> Formula
    Pop --> Formula
    Vuln --> Formula
    Feas --> Formula

    subgraph Tiers["Action Prioritization & Optimization"]
        Urgency["Urgency Classifier:\nIMMEDIATE (>=75) | URGENT (>=60) | PLANNED (>=45) | ROUTINE"]
        Portfolio["Greedy Multi-Zone Resource Allocator\n(Budgets: LOW $500k, MEDIUM $2M, HIGH $5M)"]
    end

    Formula --> Urgency
    Urgency --> Portfolio

    subgraph FinalBrief["Executive Briefing"]
        Brief["Executive Directives & ROI Score\nBeneficiary Population & Remediated Hotspots"]
    end

    Portfolio --> Brief
```

---

## 9. Digital Twin Simulation Engine Pipeline

The Digital Twin Engine ([`backend/app/modules/simulation/`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/backend/app/modules/simulation/)) provides counterfactual scenario testing for urban cooling infrastructure.

```mermaid
flowchart TD
    subgraph Inputs["Simulation Levers"]
        Zone["Target Zone (Demographics, Land Cover, Thermal)"]
        Type["Intervention Type (6 Available)"]
        Cov["Spatial Coverage (1% to 100%)"]
        Bud["Allocated Budget ($ USD)"]
        Horiz["Horizon (Immediate, Short, Mid, Long)"]
    end

    subgraph Biophysics["Biophysical Physics Core (simulator.py)"]
        Deltas["Calculate Physical Reductions:\nΔLST, ΔNDVI, ΔAQI based on zone land cover"]
        Counterfactual["Evaluate Counterfactual Baseline:\nSimulated LST, NDVI, AQI"]
        CHRIReval["Re-compute CHRI Score via Canonical Equation"]
        ForecastReval["Re-evaluate +72h Peak Risk under Interventions"]
        PopShield["Compute Citizens De-escalated from Hazard"]
        ROI["Calculate Economic Benefit ($8.50/°C-person + $12/pt-person)\nand Civic ROI Ratio"]
    end

    Inputs --> Biophysics

    subgraph SandboxOutputs["Sandbox Modes"]
        Single["Single Zone Projection (8-Metric Impact Grid)"]
        Compare["Multi-Scenario A/B Comparative Decision Matrix (Winner Recommendation)"]
        Citywide["Metropolitan What-If Portfolio (LOW, MEDIUM, HIGH)"]
    end

    Biophysics --> Single
    Biophysics --> Compare
    Biophysics --> Citywide
```

---

## 10. Data Provenance Framework

To guarantee scientific auditability and eliminate fabricated accuracy, every metric in THERMOS is stamped with a strict confidence taxonomy:

| Classification | Meaning | Examples in THERMOS |
| :--- | :--- | :--- |
| `OBSERVED` | Directly measured by remote sensing or ground stations. | Landsat 8/9 LST readings, Open-Meteo ambient air temperature, wind speed. |
| `DERIVED` | Deterministically calculated from observed values without modeling. | Sentinel-2 NDVI index, thermal anomaly ($\text{LST} - \text{Baseline}$), CHRI score. |
| `ESTIMATED` | Extrapolated using empirical geographic or demographic relationships. | Zonal population density downscaling, building height extrusions. |
| `SIMULATED` | Forward-projected counterfactual outcomes under hypothetical policy. | Digital twin cooling deltas ($-3.2^\circ\text{C}$), forecast risk points. |
| `ASSUMED` | Explicit policy constants, budget ceilings, or model weights. | CHRI factor weights ($0.35, 0.20, 0.20, 0.15, 0.10$), budget caps ($500\text{k}, \$2\text{M}, \$5\text{M}$). |

---

## 11. Security, Resilience & Production Evolution

1. **State Isolation:** The server operates statelessly across HTTP requests. Spatial states are derived dynamically from repository data and remote sensing queries.
2. **Failure Handling:** External services (Open-Meteo, Overpass API, STAC providers) are shielded by local fallback heuristics so the application continues to function in air-gapped or offline test environments.
3. **Database Migration Path:** All Pydantic data schemas strictly mirror PostgreSQL/PostGIS table definitions. Transitioning from the in-memory repository to a production PostGIS cluster requires zero changes to route handlers or business logic.
