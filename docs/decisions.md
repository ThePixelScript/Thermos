# Architecture Decision Records (ADRs)

**Project:** THERMOS (PS13 — HeatScape: Urban Heat Reduction Planner)  
**Team:** CodePulse  

This document logs significant architectural, structural, and technical decisions made during the lifecycle of the project.

---

## ADR-001: Modular Monolith vs. Microservices for Phase 1 MVP

### Status
Accepted

### Context
Urban planning decision intelligence requires spatial processing, thermal anomaly detection, risk scoring, and intervention recommendation. A common architectural trap in hackathons is distributing these early concepts into independent microservices (e.g., Auth Service, Heat Service, Geo Service, Optimization Service) resulting in deployment friction, network overhead, and complex local orchestration.

### Decision
Adopt a strict **Modular Monolith** pattern in Python (FastAPI). All domain modules (`geospatial`, `heat`, `risk`, `interventions`, `simulation`, `optimization`, `ai_interface`) reside within the single application process as independent packages with distinct boundaries and zero circular dependencies.

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
Implement the **Composite Heat Risk Index (CHRI)** as a deterministic, weighted linear combination of three normalized dimensions:
1. **Heat Hazard Sub-score ($H$):** Land Surface Temperature anomaly ($\Delta T$), impervious surface ratio, and albedo deficit.
2. **Exposure Sub-score ($E$):** Population density and pedestrian/transit activity.
3. **Vulnerability Sub-score ($V$):** Demographic age sensitivity (infants + seniors) and canopy vegetation deficit.

$$\text{CHRI} = w_h \cdot H + w_e \cdot E + w_v \cdot V$$

The engine must mathematically compute the exact percentage contribution of each driver:
$$\text{Attribution}_i = \frac{w_i \cdot \text{Metric}_i}{\text{CHRI}} \times 100\%$$

### Consequences
* **Positive:** 100% explainable in the UI (e.g. "42% Canopy Deficit, 33% Surface Thermal Anomaly, 25% Demographic Exposure").
* **Positive:** Fully unit-testable and reproducible across runs.
* **Negative:** Requires careful calibration of normalization bounds (min/max clamps) to prevent distortion from extreme outliers.

---

## ADR-003: PostGIS-Ready Data Contracts with File-Backed In-Memory Repository for MVP

### Status
Accepted

### Context
Production urban planning GIS systems mandate PostgreSQL + PostGIS for spatial polygon queries, intersecting buffers, and raster zonal statistics. However, requiring PostgreSQL/PostGIS installation during an MVP setup risks friction on varied developer laptops and evaluation sandboxes.

### Decision
Define all core models using standard GeoJSON (RFC 7946) geometries and Pydantic schemas that mirror PostGIS column types (`Geometry(Polygon, 4326)`). Use an in-memory repository loaded from validated JSON files for Phase 1.

### Consequences
* **Positive:** Zero external database dependency needed to run or test Phase 1.
* **Positive:** Transitioning to PostGIS in Phase 2 only requires replacing the repository class with an SQLAlchemy/GeoAlchemy2 session, with zero changes to business logic or API contracts.

---

## ADR-004: Boundary Separation of AI / Natural Language Interfaces

### Status
Accepted

### Context
Natural Language interfaces are valuable for urban planners wanting to express queries like: *"Find high-risk zones near schools with under 10% tree canopy and budget under $500k."* However, LLMs must never be allowed to calculate risk numbers or invent intervention cooling impacts.

### Decision
Position the `ai_interface` module strictly as a bi-directional translation bridge:
1. **Inbound:** Natural Language $\rightarrow$ Typed structured filter/constraints (`PlanningConstraints`).
2. **Outbound:** Deterministic analytics results $\rightarrow$ Human-readable executive summary and policy narratives.
3. The computational core (`risk`, `heat`, `interventions`, `optimization`) has zero dependency on AI or external LLM APIs.

### Consequences
* **Positive:** Complete protection against hallucinations in spatial planning and budget calculations.
* **Positive:** System remains functional even offline or if external AI APIs are down.

---

## ADR-005: MapLibre GL JS + GeoJSON for Frontend Geospatial Visualization

### Status
Accepted

### Context
Visualizing urban heat requires interactive map navigation, polygon choropleths, risk-coded overlays, and click-to-inspect capabilities.

### Decision
Adopt **MapLibre GL JS** paired with React + TypeScript and Vite. MapLibre GL provides open-source, vendor-neutral WebGL map rendering with vector tiles and GeoJSON data sources.

### Consequences
* **Positive:** High performance rendering of hundreds of urban polygons and thermal layers.
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
