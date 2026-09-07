# THERMOS — Architectural Blueprint

**Project:** THERMOS (PS13 — HeatScape: Urban Heat Reduction Planner)  
**Team:** CodePulse  
**Version:** 0.1.0 (Phase 1 Foundation)  
**Status:** Approved / Active  

---

## 1. Executive Summary & Project Vision

THERMOS is an urban climate decision-intelligence platform engineered to assist municipal planners, climate resilience offices, and civil engineers in mitigating Urban Heat Islands (UHI).

Rather than serving as a decorative AI chatbot wrapper, THERMOS is architected around **deterministic geospatial and thermal analytics**, **reproducible risk models**, and **evidence-based intervention calculations**. Artificial Intelligence is strictly positioned at the outer boundary to facilitate natural-language scenario exploration and human-readable summarization—never for hallucinating scores, constraints, or scientific metrics.

### Core Capabilities Roadmap
1. **Hotspot Identification:** Detect micro-urban thermal anomalies using land surface temperature (LST) and ambient heat signals.
2. **Driver Attribution:** Deconstruct heat risk into quantifiable components (canopy deficit, impervious surface, albedo, demographic vulnerability).
3. **Risk & Exposure Modeling:** Combine physical hazard with human exposure and vulnerability indices.
4. **Targeted Cooling Interventions:** Evaluate feasibility and cost-effectiveness of cooling solutions (cool roofs, urban forestry, permeable pavements).
5. **Scenario Simulation & Optimization:** Evaluate counterfactual portfolios subject to budget and space constraints.
6. **Provenance & Auditability:** Track all data from satellite observation down to simulation assumption.

---

## 2. Fundamental Architectural Principles

### 2.1 Non-LLM Core Principle
```
+-------------------------------------------------------------+
|                      USER INTERFACES                        |
|   [ Web UI / MapLibre ]         [ Natural Language Query ]  |
+-------------------------------------------------------------+
                                       |
                                       v
                     +----------------------------------+
                     |        AI / NL Interface         |
                     |  - Intent / constraint parsing   |
                     |  - Human-language explanation    |
                     +----------------------------------+
                                       |
                                       v
+-------------------------------------------------------------+
|               DETERMINISTIC ANALYTICAL ENGINE               |
|                                                             |
|  [Geospatial Engine]           [Thermal / Heat Analytics]   |
|  - GeoJSON / PostGIS           - LST & Anomaly Extraction   |
|  - Spatial aggregation         - UHI index computation      |
|                                                             |
|  [Risk Engine]                 [Interventions Catalog]      |
|  - Hazard x Exposure x Vuln    - Suitability rules          |
|  - Driver attribution          - Unit cost & cooling delta  |
|                                                             |
|  [Scenario Simulation]         [Portfolio Optimization]     |
|  - Counterfactual evaluation   - Knapsack / ILP solver      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     DATA & PERSISTENCE                      |
|  [PostGIS Ready Schemas]       [Data Classification Audit]  |
|  - Zones, Observations         - OBSERVED | DERIVED         |
|  - Local JSON (MVP) -> PostGIS - ESTIMATED | ASSUMED        |
+-------------------------------------------------------------+
```

1. **Deterministic Calculations:** Every risk score, temperature delta, cost estimate, and ranking is computed via transparent, mathematically verifiable formulas.
2. **Separation of Concerns:** Zero business logic in frontend components; zero spatial calculation in UI views; zero AI dependency in analytical routines.
3. **Loose Coupling:** Analytical modules (`geospatial`, `heat`, `risk`, `interventions`, `simulation`, `optimization`, `ai_interface`) operate on standardized data structures with zero circular imports.
4. **Data Classification & Provenance:** Every metric emitted explicitly identifies its confidence and derivation category (`OBSERVED`, `DERIVED`, `ESTIMATED`, `SIMULATED`, `ASSUMED`).
5. **Incremental Production Path:** Built as a clean modular monolith in Phase 1 with strict PostGIS-ready schemas, enabling instantaneous migration to production PostgreSQL/PostGIS without refactoring APIs.

---

## 3. System Architecture & Module Boundaries

The backend is structured into clear, decoupled domains under `backend/app/`:

### 3.1 `geospatial`
* **Responsibility:** Handles spatial geometries, coordinate transformations (EPSG:4326 WGS84 standard), bounding boxes, spatial containment, and GeoJSON serialization compatible with MapLibre GL and PostGIS.
* **Inputs:** Coordinates, polygons, bounding queries.
* **Outputs:** Valid GeoJSON Features and FeatureCollections.

### 3.2 `heat`
* **Responsibility:** Ingests surface temperature observations (e.g. Landsat/MODIS thermal bands or localized sensor grids), calculates mean baseline temperatures, and computes localized thermal anomalies ($\Delta T$).
* **Inputs:** Thermal observations, land cover fractions.
* **Outputs:** Thermal intensity metrics, anomaly classifications, UHI indices.

### 3.3 `risk`
* **Responsibility:** Implements the Composite Heat Risk Index (CHRI) evaluating three orthogonal dimensions:
  1. **Hazard:** Thermal anomaly, impervious surface fraction, low albedo.
  2. **Exposure:** Population density, pedestrian foot traffic, outdoor labor intensity.
  3. **Vulnerability:** Proportion of vulnerable age groups (children $<5$, seniors $>65$), baseline vegetation deficit, and socioeconomic susceptibility.
* **Attribution Output:** Provides percentage breakdown of what caused the risk (e.g. $42\%$ Canopy Deficit, $33\%$ Surface Heat, $25\%$ Demographic Vulnerability) for transparent explainability in the UI.

### 3.4 `interventions`
* **Responsibility:** Maintains a catalog of tested urban cooling interventions (e.g., Cool Roof Coatings, High-Canopy Shade Trees, Permeable Pavement, Pocket Micro-Parks). Evaluates zone physical feasibility and calculates unit costs and expected cooling deltas.
* **Inputs:** Zone land cover, built environment metrics, risk drivers.
* **Outputs:** Filtered, prioritized intervention candidates with ROI and cost estimations.

### 3.5 `simulation` (Phase 2 Ready)
* **Responsibility:** Counterfactual scenario simulator. Evaluates what happens to zone surface temperature and heat risk if a proposed intervention portfolio is deployed.
* **Interface:** `simulate_scenario(zone_id, interventions) -> ScenarioResult`

### 3.6 `optimization` (Phase 2 Ready)
* **Responsibility:** Constrained multi-objective optimization (e.g., maximum temperature reduction subject to a budget limit, or minimum cost to eliminate critical risk zones).
* **Interface:** `optimize_portfolio(zone_ids, budget, constraints) -> OptimizationResult`

### 3.7 `ai_interface`
* **Responsibility:** Translation layer. Converts unstructured natural-language planning queries into typed filter criteria and converts numerical risk attribution vectors into clear planning justifications.
* **Constraint:** Does not compute numbers. Reads deterministic engine outputs only.

---

## 4. Data Provenance & Classification Framework

To eliminate scientific ambiguity and guard against fabricated precision, all values transported through THERMOS are categorized:

| Classification | Meaning | Example Metric |
| :--- | :--- | :--- |
| `OBSERVED` | Directly captured by remote sensing or in-situ hardware. | Landsat 8/9 LST thermal reading, meteorological station air temp. |
| `DERIVED` | Directly calculated from observed values without probabilistic modeling. | Thermal anomaly ($\text{LST} - \text{Baseline}$), NDVI greenness index. |
| `ESTIMATED` | Modeled using validated empirical relationships or census downscaling. | Daytime worker population, roof area suitable for retrofits. |
| `SIMULATED` | Projected outcomes under a hypothetical planning scenario. | Predicted $1.8^\circ\text{C}$ cooling delta post-tree canopy deployment. |
| `ASSUMED` | Configurable planning assumptions or policy constants. | Unit cost (\$ per $\text{m}^2$ cool pavement), discount rate. |

---

## 5. Persistence Strategy: From MVP to Production

```
+--------------------------+       +-------------------------------+
|       Phase 1 (MVP)      |       |      Production Target        |
|  - data/processed/*.json |  -->  |  - PostgreSQL 16 + PostGIS 3  |
|  - In-memory repository  |       |  - GeoAlchemy2 + SQLAlchemy   |
|  - Typed Pydantic models |       |  - Spatial indexing (GIST)    |
+--------------------------+       +-------------------------------+
```

The data models in `backend/app/schemas/` mirror relational PostGIS tables:
* `zones` table: `id`, `name`, `geometry: Geometry(Polygon, 4326)`, `area_sqkm`, `created_at`
* `land_cover` table: `zone_id`, `impervious_fraction`, `tree_canopy_fraction`, `water_fraction`, `albedo`
* `thermal_observations` table: `zone_id`, `surface_temp_c`, `baseline_temp_c`, `anomaly_c`, `timestamp`
* `demographics` table: `zone_id`, `population_density`, `vulnerable_pop_ratio`, `outdoor_worker_density`

For the Phase 1 MVP, an in-memory repository reads pre-validated GeoJSON datasets matching these exact schemas, ensuring zero setup friction while keeping schema migration 100% seamless.

---

## 6. API Specification Summary

* `GET /health` — Service health, engine readiness, and version.
* `GET /api/v1/zones` — GeoJSON FeatureCollection of all urban zones with key land-use metrics.
* `GET /api/v1/zones/{zone_id}` — In-depth details, spatial coordinates, thermal timeseries.
* `GET /api/v1/hotspots` — Ranked list of detected heat hotspots with risk score, priority rank, and dominant driver.
* `GET /api/v1/hotspots/{zone_id}` — Detailed hotspot risk breakdown, explainable attribution percentages, and initial intervention recommendations.
* `GET /api/v1/interventions/catalog` — Available cooling measures with unit costs, lifespans, and cooling factors.

---

## 7. Frontend Integration Strategy

* **Framework:** React + TypeScript + Vite.
* **Map Engine:** MapLibre GL JS with custom styling and GeoJSON data overlays for zone polygons and hotspot choropleths.
* **State Management:** Lightweight React state + typed API service layer with automated backend health detection.
* **Key Components:**
  - `Header`: System branding, status badge, summary metrics.
  - `ZoneMap`: Interactive map rendering zone polygons colored by risk level, with click-to-inspect.
  - `HotspotList`: Ranked table of high-risk priority zones with filter toggles.
  - `ZoneDetail`: Hotspot inspector displaying risk score gauge, explainable component attribution bars, and recommended interventions.
