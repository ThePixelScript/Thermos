# Architecture Decision Records (ADRs)

**Project:** THERMOS (PS13 — HeatScape: Urban Heat Reduction Planner)  
**System Version:** 2.0.0 (Phases 1 through 6)  
**Status:** Living Engineering Record  

This document logs significant architectural, structural, and technical decisions made during the lifecycle of the THERMOS platform.

---

## ADR-001: Modular Monolith vs. Microservices for Core Platform

### Status
Accepted

### Context
Urban planning decision intelligence requires spatial processing, thermal anomaly detection, risk scoring, and intervention recommendation. A common architectural trap in hackathons is distributing these early concepts into independent microservices (e.g., Auth Service, Heat Service, Geo Service, Optimization Service) resulting in deployment friction, network overhead, and complex local orchestration.

### Decision
Adopt a strict **Modular Monolith** pattern in Python (FastAPI). All domain modules (`geospatial`, `heat`, `risk`, `raster`, `chri`, `forecast`, `city`, `simulation`, `weather`, `interventions`) reside within the single application process as independent packages with distinct boundaries and zero circular dependencies.

### Consequences
* **Positive:** Zero microservice operational overhead; instantaneous local setup; type-safe internal interfaces; atomic transactions; fast testing.
* **Mitigation:** Strict dependency boundaries are enforced so any module can be extracted into an independent gRPC or HTTP microservice in later phases if horizontal scale dictates.

---

## ADR-002: Deterministic Heat Risk Index with Explainable Component Attribution

### Status
Accepted

### Context
Decision-makers (urban planners, civic engineers) reject "black-box" risk scoring. If an AI or opaque algorithm claims a neighborhood is a "Risk 88 Hotspot" without mathematical breakdown, municipal funding cannot be legally or ethically justified.

### Decision
Implement the **Composite Heat Risk Index (CHRI)** as a deterministic, weighted linear combination of five normalized dimensions:
$$\text{CHRI} = 0.35 \cdot \widehat{\text{LST}} + 0.20 \cdot \widehat{\text{Pop}} + 0.20 \cdot \widehat{\text{Bld}} - 0.15 \cdot \widehat{\text{NDVI}} + 0.10 \cdot \widehat{\text{AQI}}$$
The engine mathematically computes the exact percentage contribution of each driver:
$$\text{Attribution}_i = \frac{w_i \cdot \text{Metric}_i}{\text{CHRI}} \times 100\%$$

### Consequences
* **Positive:** 100% explainable in the UI (e.g. "38% Land Surface Temperature, 26% Building Density, 18% Population Exposure, 12% Canopy Deficit, 6% Poor Air Quality").
* **Positive:** Fully unit-testable and reproducible across runs.
* **Negative:** Requires careful calibration of normalization bounds (min/max clamps) to prevent distortion from extreme outliers.

---

## ADR-003: PostGIS-Ready Data Contracts with File-Backed In-Memory Repository for MVP

### Status
Accepted

### Context
Production urban planning GIS systems mandate PostgreSQL + PostGIS for spatial polygon queries, intersecting buffers, and raster zonal statistics. However, requiring PostgreSQL/PostGIS installation during initial development and evaluation sandboxes introduces high friction.

### Decision
Define all core models using standard GeoJSON (RFC 7946) geometries and Pydantic schemas that mirror PostGIS column types (`Geometry(Polygon, 4326)`). Use an in-memory repository loaded from validated JSON files (`data/processed/sample_zones.json`).

### Consequences
* **Positive:** Zero external database dependency needed to run or test the application.
* **Positive:** Transitioning to PostGIS in production only requires replacing the repository class with an SQLAlchemy/GeoAlchemy2 session, with zero changes to business logic or API contracts.

---

## ADR-004: Boundary Separation of AI / Natural Language Interfaces

### Status
Accepted

### Context
Natural Language interfaces are valuable for urban planners wanting to express queries like: *"Find high-risk zones near schools with under 10% tree canopy and budget under $500k."* However, LLMs must never be allowed to calculate risk numbers or invent intervention cooling impacts.

### Decision
Position any future AI/LLM interface strictly as a bi-directional translation bridge:
1. **Inbound:** Natural Language $\rightarrow$ Typed structured filter/constraints (`PlanningConstraints`).
2. **Outbound:** Deterministic analytics results $\rightarrow$ Human-readable executive summary and policy narratives.
3. The computational core has zero dependency on AI or external LLM APIs.

### Consequences
* **Positive:** Complete protection against hallucinations in spatial planning and budget calculations.
* **Positive:** System remains fully operational offline or in air-gapped municipal data centers.

---

## ADR-005: MapLibre GL JS + GeoJSON for Frontend Geospatial Visualization

### Status
Accepted

### Context
Visualizing urban heat requires interactive map navigation, polygon choropleths, risk-coded overlays, and click-to-inspect capabilities without proprietary API licensing barriers.

### Decision
Adopt **MapLibre GL JS** paired with React 19, TypeScript, and Vite. MapLibre GL provides open-source, vendor-neutral WebGL map rendering with vector tiles, raster tile layers, and GeoJSON data sources. Encapsulate all map interactions behind an imperative `LayerManager` abstraction.

### Consequences
* **Positive:** High performance rendering of hundreds of urban polygons, 3D extruded building footprints, and thermal raster layers.
* **Positive:** No proprietary Mapbox access token required; works with open Carto and OpenStreetMap tiles.

---

## ADR-006: Rigorous Data Provenance Classification

### Status
Accepted

### Context
Urban planning datasets combine multiple sources of varying fidelity: satellite imagery, census surveys, empirical models, and simulation forecasts. Mixing these without distinction destroys auditability.

### Decision
Enforce a first-class `classification` enum on every metric:
* `OBSERVED`: Direct sensor/satellite data.
* `DERIVED`: Deterministic calculation from observed values.
* `ESTIMATED`: Statistical or empirical approximation.
* `SIMULATED`: Counterfactual forward projections.
* `ASSUMED`: Policy constants or parameter assumptions.

### Consequences
* **Positive:** Full transparency for stakeholders; UI can display provenance badges next to critical metrics.

---

## ADR-007: Dynamic Remote Sensing Raster Tile Proxy for Sentinel-2 & Landsat 8/9

### Status
Accepted

### Context
Phase 3 required true satellite imagery integration for NDVI (vegetation) and LST (surface temperature). Full-resolution satellite scenes (GeoTIFFs) exceed 500 MB each and cannot be shipped to frontend browsers or stored in Git repositories.

### Decision
Implement a dynamic raster intelligence layer with:
1. **STAC Discovery Service:** Queries SpatioTemporal Asset Catalog (STAC) endpoints (AWS Earth Search / Microsoft Planetary Computer) for bounding box coordinates.
2. **TiTiler Integration:** Formulates dynamic Cloud-Optimized GeoTIFF (COG) tile endpoints for raster tiling.
3. **Internal Fallback Tile Server:** Generates valid $256 \times 256$ Web Mercator PNG tiles (`/api/v1/raster/{channel}/tiles/{z}/{x}/{y}.png`) on-the-fly with authentic color scale ramps (RdYlGn for NDVI, thermal plasma/magma for LST) and zlib compression.
4. **Zonal Statistics Extractor:** Computes polygon-level mean, min, max, and canopy percentages for each urban zone.

### Consequences
* **Positive:** Instantaneous tile rendering in MapLibre GL with zero external cloud dependencies during local testing.
* **Positive:** Fully compliant with the OpenGIS TileJSON specification.

---

## ADR-008: Dynamic Raster-Driven CHRI Calculation with 5-Driver Normalized Decomposition

### Status
Accepted

### Context
Static heat vulnerability models rely on annual census updates, obscuring seasonal vegetation changes and localized heat waves. The platform required dynamic recalculation based on actual thermal and spectral satellite observations.

### Decision
Evolve the Composite Heat Risk Index (CHRI) to dynamically ingest real-time raster metrics:
* Vegetation factor is calculated directly from Sentinel-2 zonal mean NDVI.
* Thermal factor is calculated directly from Landsat 8/9 zonal mean LST.
* Ambient conditions incorporate live air quality (AQI PM2.5) and population densities.
* The calculation decomposes risk into 5 explicit drivers (`high_lst`, `low_ndvi`, `high_population`, `high_building_density`, `poor_air_quality`) with dominant driver attribution and mitigation mapping.

### Consequences
* **Positive:** Planners immediately see when a heat wave elevates a moderate zone into severe, or when seasonal greening reduces risk.
* **Positive:** Directly powers the `CHRIInsightsPanel` analytical drawer with progress bars and mitigation recommendations.

---

## ADR-009: Explainable Multi-Horizon Heat Forecasting Engine without Black-Box ML

### Status
Accepted

### Context
Municipalities need early warnings for upcoming heat waves at $+24\text{h}$, $+72\text{h}$, and $+7\text{d}$ horizons. Deploying deep learning or large regression models introduces heavy dependencies (PyTorch/TensorFlow), non-deterministic outputs, and opacity.

### Decision
Implement a deterministic, physics-inspired **Heat Forecast Engine** based on:
1. Diurnal temperature fluctuations and meteorological trend projection from Open-Meteo.
2. Urban thermal inertia scaling derived from impervious surface fraction and building density.
3. Vegetation buffer damping derived from zonal NDVI.
4. Explicit escalation categorization (`Severe Rise`, `Rising`, `Stable`, `Cooling`).
5. Driver escalation delta attribution explaining which parameter is driving the projected risk increase.

### Consequences
* **Positive:** Zero heavy ML framework dependencies; ultra-fast sub-millisecond execution.
* **Positive:** Completely explainable forecast narratives suitable for emergency municipal heat action plans.

---

## ADR-010: Multi-Criteria Priority Scoring and Budget-Constrained Municipal Portfolio Optimization

### Status
Accepted

### Context
City officials have constrained capital budgets ($500k to $5M) and cannot intervene in every hotspot simultaneously. They require an objective, defensible prioritization queue.

### Decision
Establish the **Municipal Decision Intelligence Engine** with:
1. **Deterministic Priority Score Formula:**
   $$\text{Priority Score} = 0.35 \cdot \text{CHRI} + 0.25 \cdot \text{Forecast} + 0.15 \cdot \text{PopExposure} + 0.15 \cdot \text{Vulnerability} + 0.10 \cdot \text{Feasibility}$$
2. **Urgency Classification:** `IMMEDIATE` ($\ge 75$), `URGENT` ($\ge 60$), `PLANNED` ($\ge 45$), `ROUTINE` ($< 45$).
3. **Greedy Resource Portfolio Allocator:** Selects optimal cross-zone municipal actions across standardized budget tiers (`LOW`: \$500k, `MEDIUM`: \$2.0M, `HIGH`: \$5.0M) maximizing aggregate cooling and population protection.

### Consequences
* **Positive:** Powers the `CityCommandCenter` dashboard, enabling public officials to download executive summaries with clear ROI justifications.

---

## ADR-011: Deterministic Urban Climate Digital Twin for Counterfactual Scenario Simulation

### Status
Accepted

### Context
Decision-makers must test "what-if" interventions before committing civic capital. They need to know: *"If we convert 60% of rooftops in Zone 1 to cool roofs for $200k, how much cooler will the neighborhood get, and how does that compare to urban forestry?"*

### Decision
Build an **Urban Climate Digital Twin Engine** that evaluates counterfactual interventions across 6 cooling domains:
* Urban forestry, cool roofs, reflective pavements, shade corridors, water body restoration, AQI reduction.
* Calculates physical cooling deltas ($\Delta \text{LST}$, $\Delta \text{NDVI}$, $\Delta \text{AQI}$) constrained by zone land-cover capacity.
* Feeds counterfactual physical values back through the canonical CHRI engine to compute simulated risk reduction.
* Provides a multi-scenario comparison mode (Scenario A vs. Scenario B vs. Status Quo) with an automated winner recommendation engine based on cooling impact, population protected, and civic ROI.
* Provides a metropolitan what-if portfolio simulator across budget tiers.

### Consequences
* **Positive:** Directly elevates THERMOS into a scenario planning digital twin platform.
* **Positive:** Gives planners instant visual feedback via the `ScenarioPlanner` component.
