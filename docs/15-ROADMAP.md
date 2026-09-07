# THERMOS — Engineering Roadmap & Milestones

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 15-ROADMAP.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Engineering Phase Overview

THERMOS is developed under a phased, test-driven engineering progression. The core analytical engine, risk equations, hotspot detection, and scenario simulation are fully realized in Phase 1, establishing a deterministic foundation prior to database scale-out and automated portfolio optimization.

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION & FIRST VERTICAL SLICE (COMPLETED)    │
│  - Deterministic CHRI-v1.0 & Driver Attribution (100% sum)  │
│  - Centralized Hotspot Detection & 4-Tier Prioritization    │
│  - Cooling Catalog (8 Interventions) & Surface Limits       │
│  - Counterfactual Scenario Simulation Engine                │
│  - MapLibre GL Interactive Workbench & Planner UI           │
│  - 53 Automated Tests Passing (0.16s)                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: GIS PERSISTENCE & ALGORITHMIC OPTIMIZATION (PLANNED)│
│  - PostgreSQL 16 + PostGIS 3 Spatial Database Migration     │
│  - Cloud-Optimized GeoTIFF (COG) Satellite Ingestion        │
│  - Constrained Portfolio Optimizer (MILP / Knapsack)        │
│  - Decoupled LLM Translation Bridge Integration             │
│  - Automated Municipal PDF Executive Report Exporter        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: REGIONAL SCALING & MULTI-CITY INTEGRATION (FUTURE)│
│  - Multi-tenant municipal isolation                         │
│  - Automated heatwave warning webhooks & alerts             │
│  - Permitting pipeline integration (building code compliance│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Completed Achievements (Current Repository State)

* [x] **Deterministic Heat Risk Core:** Implemented in [risk_engine.py](../backend/app/modules/risk/risk_engine.py). Combines Hazard ($0.45$), Exposure ($0.30$), and Vulnerability ($0.25$) with mathematical clamping.
* [x] **Exact Driver Attribution:** Mathematical decomposition guaranteeing $\sum A_i = 100.0\% \pm 0.5\%$ across all seven risk drivers.
* [x] **Dual-Criterion Hotspot Detection:** Centralized in [hotspot_detection.py](../backend/app/modules/heat/hotspot_detection.py) with deterministic classification into `CRITICAL`, `SEVERE`, `HIGH`, and `MODERATE` tiers.
* [x] **Standardized Cooling Catalog:** Authoritative specifications for 8 cooling measures in [catalog.py](../backend/app/modules/interventions/catalog.py).
* [x] **Scenario Simulation Engine:** Physical parcel surface area caps, itemized cooling deltas, multi-intervention damping, nature-material synergy, and post-CHRI recalculation in [scenario_engine.py](../backend/app/modules/simulation/scenario_engine.py).
* [x] **Frontend Decision Workbench:** React 19 + TypeScript single-page application with MapLibre GL 6.7 WebGL mapping, filterable hotspot lists, and live [InterventionPlanner.tsx](../frontend/src/components/InterventionPlanner.tsx).
* [x] **Data Provenance System:** Rigorous five-tier classification (`OBSERVED`, `DERIVED`, `ESTIMATED`, `SIMULATED`, `ASSUMED`) and transparent demo data labeling in [common.py](../backend/app/schemas/common.py).
* [x] **Automated Test Suite:** 53 unit and integration tests executing in 0.16 seconds with 100% pass rate.

---

## 3. Phase 2: Planned Engineering Tasks

### 3.1 PostgreSQL 16 + PostGIS 3 Database Migration
* **Objective:** Replace in-memory `DataRepository` with an SQLAlchemy / GeoAlchemy2 persistence layer.
* **Architecture:** Ingest urban polygons as native PostGIS `GEOMETRY(Polygon, 4326)` columns, enabling spatial indexing (GiST) and bounding-box queries ($O(\log N)$).
* **Zero Contract Breakage:** The REST API schemas and domain models are already structured to match the target database tables.

### 3.2 Automated Satellite Ingestion Pipeline (USGS / Copernicus)
* **Objective:** Direct automated ingestion of Landsat 8/9 Level-2 Surface Temperature products and Sentinel-2 NDVI.
* **Implementation:** Use `rasterio` and `rioxarray` to compute zonal statistics (mean LST, mean NDVI) directly on Cloud Optimized GeoTIFFs (COGs) stored in object storage.

### 3.3 Algorithmic Portfolio Optimizer (MILP / Knapsack)
* **Objective:** Automatically select the optimal set of cooling interventions across multiple city zones to maximize risk reduction subject to a strict municipal budget cap ($B$).
* **Mathematical Formulation:**
  $$\max \sum_{z \in Z} \sum_{i \in I} \Delta\text{CHRI}(z, i) \times \text{Population}(z)$$
  Subject to:
  $$\sum_{z \in Z} \sum_{i \in I} \text{Cost}(z, i) \le B$$
  $$\sum_{i \in I_s} A(z, i) \le A_{\text{avail}}(z, s) \quad \forall z \in Z, \forall s \in \text{Surfaces}$$
* **Implementation:** Mixed-Integer Linear Programming (MILP) solved via `scipy.optimize.milp` or `PuLP`.

### 3.4 Decoupled AI Translation Bridge Integration
* **Objective:** Connect local or cloud LLMs via [explainer.py](../backend/app/modules/ai_interface/explainer.py) to translate natural-language municipal queries (*"Find priority cooling targets in District 4 under \$2M"*) into typed `PlanningConstraints`.

---

## 4. Phase 3: Future Expansion & Regional Integration

* **Multi-Tenant Regional Scaling:** Support state-wide deployment across multiple metropolitan statistical areas (MSAs) with isolated spatial partitions.
* **Real-Time Heatwave Early Warning:** Integrate meteorological forecast models (NOAA GFS / ECMWF) to trigger automated municipal alerts 72 hours prior to extreme thermal events.
* **Permitting & Building Code API:** Public REST hooks allowing municipal building departments to evaluate proposed architectural developments against urban heat resilience guidelines.
