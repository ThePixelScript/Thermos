# THERMOS — Repository File & Symbol Index

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** FILE-INDEX.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Documentation Suite (`docs/`)

| Document Link | Subject Matter | Key Sections |
| :--- | :--- | :--- |
| [README.md](../README.md) | Platform Root Overview | Quickstart, system architecture, technology stack, verification status |
| [01-PROJECT-OVERVIEW.md](01-PROJECT-OVERVIEW.md) | Project Scope & Personas | Problem statement, user personas, implementation status, system non-goals |
| [02-SYSTEM-ARCHITECTURE.md](02-SYSTEM-ARCHITECTURE.md) | Architectural Blueprint | Modular monolith, layered diagrams, module boundaries, request lifecycles |
| [03-DATA-ARCHITECTURE.md](03-DATA-ARCHITECTURE.md) | Data Models & Persistence | Pydantic v2 domain schemas, PostGIS table DDL, in-memory repository |
| [04-HEAT-ANALYTICS.md](04-HEAT-ANALYTICS.md) | Feature Normalization | Direct/inverted normalization math, clamping bounds, thermal metrics |
| [05-RISK-ENGINE.md](05-RISK-ENGINE.md) | CHRI-v1.0 Risk Engine | Hazard, exposure, vulnerability math, driver attribution sum, 5 risk levels |
| [06-HOTSPOT-DETECTION.md](06-HOTSPOT-DETECTION.md) | Hotspot Prioritization | Dual qualification criteria, 4 priority tiers, sorting & ranking algorithm |
| [07-INTERVENTION-ENGINE.md](07-INTERVENTION-ENGINE.md) | Cooling Catalog & Rules | 8 cooling interventions, suitability rules, lifecycle cost models |
| [08-SCENARIO-SIMULATION.md](08-SCENARIO-SIMULATION.md) | Simulation Engine | Surface availability caps, LST cooling, ambient exponential saturation, synergy |
| [09-API-REFERENCE.md](09-API-REFERENCE.md) | REST API Specification | Path endpoints, query/body schemas, HTTP 200/400/404/422 response examples |
| [10-FRONTEND-ARCHITECTURE.md](10-FRONTEND-ARCHITECTURE.md) | UI & Map Specification | React 19 component tree, MapLibre GL WebGL mapping, Intervention Planner UI |
| [11-DATA-PROVENANCE.md](11-DATA-PROVENANCE.md) | Lineage & Auditability | 5-tier classification framework, data lineage matrix, synthetic audit rules |
| [12-TESTING-AND-VALIDATION.md](12-TESTING-AND-VALIDATION.md) | Test Suite Documentation | 53-test pytest breakdown, oxlint and tsc verification, execution guides |
| [13-SECURITY-AND-RELIABILITY.md](13-SECURITY-AND-RELIABILITY.md) | Defensive Programming | Pydantic validation, division-by-zero guards, offline fallback, CORS |
| [14-DEPLOYMENT.md](14-DEPLOYMENT.md) | Operations & Runbooks | Local runbooks, Docker & Docker Compose configs, cloud production target |
| [15-ROADMAP.md](15-ROADMAP.md) | Engineering Milestones | Phase 1 completed achievements, Phase 2 PostGIS/MILP, Phase 3 scaling |
| [FILE-INDEX.md](FILE-INDEX.md) | Repository Index | Exhaustive index of every repository file and exported symbol |
| [architecture.md](architecture.md) | Initial Architecture Spec | High-level system design from Phase 1 kickoff |
| [decisions.md](decisions.md) | Architecture Decision Records | ADR-001 through ADR-006 logging architectural decisions |

---

## 2. Backend Application (`backend/app/`)

### 2.1 API Routers (`backend/app/api/`)
| File Link | Route Path | Primary Handlers / Functions | Verification |
| :--- | :--- | :--- | :--- |
| [health.py](../backend/app/api/health.py) | `/health`, `/api/v1/health` | `get_health()` | [test_health.py](../tests/test_health.py) |
| [zones.py](../backend/app/api/zones.py) | `/api/v1/zones`, `/geojson`, `/{id}` | `get_all_zones()`, `get_zones_geojson()`, `get_zone_by_id()` | [test_api.py](../tests/test_api.py) |
| [hotspots.py](../backend/app/api/hotspots.py) | `/api/v1/hotspots`, `/{id}` | `get_all_hotspots()`, `get_hotspot_detail()` | [test_hotspots.py](../tests/test_hotspots.py) |
| [interventions.py](../backend/app/api/interventions.py) | `/api/v1/interventions/*` | `get_catalog()`, `get_intervention()`, `get_recommendations_for_zone()`, `simulate_intervention_scenario()` | [test_simulation.py](../tests/test_simulation.py) |

### 2.2 Core & Persistence (`backend/app/core/`, `backend/app/data/`)
| File Link | Role | Key Symbols | Verification |
| :--- | :--- | :--- | :--- |
| [config.py](../backend/app/core/config.py) | Application Settings | `Settings`, `settings` | [test_health.py](../tests/test_health.py) |
| [repository.py](../backend/app/data/repository.py) | In-Memory Repository | `DataRepository`, `repository` | [test_api.py](../tests/test_api.py) |

### 2.3 Domain Modules (`backend/app/modules/`)
| File Link | Module Domain | Key Functions & Algorithms | Verification |
| :--- | :--- | :--- | :--- |
| [spatial_utils.py](../backend/app/modules/geospatial/spatial_utils.py) | Geospatial | `compute_polygon_centroid()`, `compute_polygon_bounds()`, `to_geojson_polygon()` | [test_api.py](../tests/test_api.py) |
| [normalization.py](../backend/app/modules/heat/normalization.py) | Heat Analytics | `normalize_min_max()`, `clamp()`, `safe_extract_metric()` | [test_heat_analytics_core.py](../tests/test_heat_analytics_core.py) |
| [hotspot_detection.py](../backend/app/modules/heat/hotspot_detection.py) | Heat Analytics | `is_hotspot()`, `classify_hotspot_tier()`, `classify_risk_level()`, `build_hotspot_summary()` | [test_hotspots.py](../tests/test_hotspots.py) |
| [thermal_analytics.py](../backend/app/modules/heat/thermal_analytics.py) | Heat Analytics | `extract_lst_anomaly()`, `classify_lst_intensity()` | [test_heat_analytics_core.py](../tests/test_heat_analytics_core.py) |
| [risk_engine.py](../backend/app/modules/risk/risk_engine.py) | Risk Engine | `compute_heat_risk()`, driver attribution decomposition (100% invariant) | [test_risk_engine.py](../tests/test_risk_engine.py) |
| [catalog.py](../backend/app/modules/interventions/catalog.py) | Interventions | `INTERVENTION_CATALOG` (8 items), `get_intervention_by_id()` | [test_api.py](../tests/test_api.py) |
| [recommender.py](../backend/app/modules/interventions/recommender.py) | Interventions | `recommend_interventions_for_zone()` | [test_api.py](../tests/test_api.py) |
| [scenario_engine.py](../backend/app/modules/simulation/scenario_engine.py) | Simulation | `simulate_scenario()`, `compute_available_surfaces()` | [test_simulation.py](../tests/test_simulation.py) |
| [explainer.py](../backend/app/modules/ai_interface/explainer.py) | AI Translation | `generate_executive_briefing()`, `parse_planning_constraints()` | Decoupled unit tests |

### 2.4 Pydantic Domain Schemas (`backend/app/schemas/`)
| File Link | Domain | Primary Schema Models |
| :--- | :--- | :--- |
| [common.py](../backend/app/schemas/common.py) | Common Primitives | `DataClassification`, `RiskLevel` (5 tiers), `GeoJSONPolygon`, `GeoJSONFeatureCollection` |
| [zone.py](../backend/app/schemas/zone.py) | Zone Models | `Zone`, `ZoneSummary`, `LandCover`, `ThermalObservation`, `Demographics` |
| [hotspot.py](../backend/app/schemas/hotspot.py) | Hotspot Models | `HotspotSummary`, `HotspotDetail` |
| [risk.py](../backend/app/schemas/risk.py) | Risk Models | `HeatRiskScore`, `RiskAssessment`, `DriverContribution`, `EvidenceItem` |
| [intervention.py](../backend/app/schemas/intervention.py) | Intervention Models | `Intervention`, `InterventionEstimate`, `SimulationRequest`, `SimulationResponse`, `SimulatedInterventionItem` |

---

## 3. Frontend Application (`frontend/src/`)

| File Link | Component / Module | Responsibilities |
| :--- | :--- | :--- |
| [App.tsx](../frontend/src/App.tsx) | Root State Container | Workbench layout, selection synchronization, live/fallback data toggles |
| [Header.tsx](../frontend/src/components/Header.tsx) | Application Header | System branding, backend health status badge, theme selector |
| [SummaryBar.tsx](../frontend/src/components/SummaryBar.tsx) | Analytics Metrics Bar | City-wide average risk, active hotspot count, total population exposed |
| [ZoneMap.tsx](../frontend/src/components/ZoneMap.tsx) | Geospatial WebGL Map | MapLibre GL choropleth rendering, hover/select state, resilient dark basemap |
| [HotspotList.tsx](../frontend/src/components/HotspotList.tsx) | Hotspot Registry Table | Priority-ranked table, tier filter tabs (`CRITICAL`, `SEVERE`, `HIGH`, `ALL`) |
| [ZoneDetail.tsx](../frontend/src/components/ZoneDetail.tsx) | Zone Inspector Dossier | CHRI gauge, sub-score breakdown, driver attribution percentage breakdown |
| [InterventionPlanner.tsx](../frontend/src/components/InterventionPlanner.tsx) | Intervention Workbench | 8-item catalog selection, budget slider (₹ Lakhs), surface caps, simulation panel |
| [api.ts](../frontend/src/services/api.ts) | HTTP Client Service | Typed fetch calls to backend with automatic fallback error interception |
| [fallbackData.ts](../frontend/src/services/fallbackData.ts) | Offline Fallback Data | Embedded 10-zone static snapshot for zero-downtime offline demonstrations |
| [types/index.ts](../frontend/src/types/index.ts) | TypeScript Models | Client-side interfaces mirroring backend Pydantic models |
| [index.css](../frontend/src/index.css) | Global Styling | High-contrast analytical theme, CSS tokens, responsive layout styles |

---

## 4. Datasets & Tests (`data/`, `tests/`)

| File Link | Category | Description |
| :--- | :--- | :--- |
| [sample_zones.json](../data/processed/sample_zones.json) | Processed Data | 10 calibrated synthetic urban planning zones in Metropolis Central (`ZONE-01` to `ZONE-10`) |
| [zone_schema.json](../data/schemas/zone_schema.json) | Schema Definition | Formal JSON Schema specifying valid zone data structures |
| [conftest.py](../tests/conftest.py) | Test Configuration | Pytest fixtures and test application client setup |
| [test_health.py](../tests/test_health.py) | Test Suite | 2 tests verifying `/health` and root routes |
| [test_api.py](../tests/test_api.py) | Test Suite | 7 tests verifying REST API contracts, GeoJSON serialization, 404/422 handlers |
| [test_heat_analytics_core.py](../tests/test_heat_analytics_core.py) | Test Suite | 22 tests verifying normalization math, clamping, hotspot base criteria, tiers |
| [test_hotspots.py](../tests/test_hotspots.py) | Test Suite | 4 tests verifying hotspot ranking, anomaly tiebreaking, dossier generation |
| [test_risk_engine.py](../tests/test_risk_engine.py) | Test Suite | 6 tests verifying CHRI formula, attribution 100% sum invariant, boundary cases |
| [test_simulation.py](../tests/test_simulation.py) | Test Suite | 12 tests verifying scenario simulation, surface clamping, synergy, budget tallies |
