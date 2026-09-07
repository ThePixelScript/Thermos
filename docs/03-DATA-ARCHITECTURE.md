# THERMOS — Data Architecture Specification

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 03-DATA-ARCHITECTURE.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Data Modeling Philosophy

THERMOS models urban climate intelligence as a normalized, multi-dimensional relational structure. Rather than storing unformatted GeoJSON blobs, the platform partitions urban zones into distinct, orthogonal domains:
* **Spatial Geography:** Boundary polygons, centroids, and area metrics.
* **Land Cover Characteristics:** Surface fractions including impervious cover, vegetative tree canopy, grass, water bodies, and surface albedo.
* **Thermal Observations:** Land Surface Temperature (LST), baseline rural temperatures, and localized anomalies ($\Delta T$).
* **Socio-Demographic Indicators:** Population density, total population, vulnerable age proportions ($<5$ and $>65$), outdoor worker density, and low air conditioning prevalence.
* **Built Environment:** Building density, average building height, and road density.

In Phase 1, these structures are implemented as strongly-typed [Pydantic v2 schemas](../backend/app/schemas/). The data structures map 1-to-1 to relational tables, providing an immediate path to enterprise PostgreSQL/PostGIS 3 deployment in Phase 2 without modifying domain logic or REST API contracts.

---

## 2. Domain Schema Specifications

### 2.1 Common Primitives ([backend/app/schemas/common.py](../backend/app/schemas/common.py))
* `DataClassification` (Enum):
  - `OBSERVED`: Direct physical measurement from satellite, weather station, or survey.
  - `DERIVED`: Deterministic mathematical transformation of observed metrics (e.g., $\text{LST} - \text{Baseline}$).
  - `ESTIMATED`: Statistical approximation or downscaled indicator.
  - `SIMULATED`: Counterfactual projected metric under a planning scenario.
  - `ASSUMED`: Policy parameter or engineering constant.
* `RiskLevel` (Enum - 5 Tiers):
  - `LOW`: Score $< 30.0$
  - `MODERATE`: Score $30.0 - 49.9$
  - `HIGH`: Score $50.0 - 69.9$
  - `SEVERE`: Score $70.0 - 84.9$
  - `CRITICAL`: Score $\ge 85.0$
* `GeoJSONPolygon`: Coordinates array (`[[[lon, lat], ...]]`) compliant with RFC 7946 (WGS84, EPSG:4326).
* `GeoJSONFeatureCollection`: Standard FeatureCollection container for MapLibre GL.

### 2.2 Zone Domain Models ([backend/app/schemas/zone.py](../backend/app/schemas/zone.py))
* `LandCover`:
  - `impervious_surface_fraction` ($[0.0, 1.0]$)
  - `tree_canopy_fraction` ($[0.0, 1.0]$)
  - `vegetation_grass_fraction` ($[0.0, 1.0]$)
  - `water_fraction` ($[0.0, 1.0]$)
  - `average_albedo` ($[0.0, 1.0]$)
  - `building_density` ($[0.0, 1.0]$)
* `ThermalObservation`:
  - `land_surface_temp_c` (Current Land Surface Temperature in $^\circ\text{C}$)
  - `baseline_temp_c` (Regional baseline reference in $^\circ\text{C}$)
  - `thermal_anomaly_c` ($\text{LST} - \text{Baseline}$)
* `Demographics`:
  - `total_population` (Integer $\ge 0$)
  - `population_density_per_sqkm` (Float $\ge 0$)
  - `vulnerable_ratio` ($[0.0, 1.0]$, children $<5$ + seniors $>65$)
  - `outdoor_worker_density_per_sqkm` (Float $\ge 0$)
  - `low_ac_coverage_ratio` ($[0.0, 1.0]$)
* `Zone`: Primary entity aggregating all sub-models with unique identifier `id` (e.g., `ZONE-01`), `name`, `typology`, `geometry` (RFC 7946 Polygon coordinates), and `area_sqkm`.

### 2.3 Hotspot & Risk Schemas ([backend/app/schemas/hotspot.py](../backend/app/schemas/hotspot.py), [backend/app/schemas/risk.py](../backend/app/schemas/risk.py))
* `HotspotTier` (Categorical): `CRITICAL_HOTSPOT`, `SEVERE_HOTSPOT`, `HIGH_HOTSPOT`, `MODERATE_HOTSPOT`.
* `DriverContribution`: Detailed driver object containing `driver_key`, `name`, `contribution_pct`, `raw_value`, `unit`, `dimension`, `explanation`, and `classification`.
* `EvidenceItem`: Evidence tracking record containing `driver_key`, `factor_name`, `observed_value`, `unit`, `contribution_pct`, `evidence_statement`, `confidence`, `data_source`, and `classification`.
* `SubscoreBreakdown`: Contains orthogonal `hazard_score`, `exposure_score`, and `vulnerability_score`.
* `HeatRiskScore`: Complete score model containing `score` ($[0.0, 100.0]$), `risk_level`, `subscores`, `driver_contributions`, `confidence`, and `assumptions`.
* `HotspotSummary`: Serialized summary containing `rank`, `zone_id`, `risk_score`, `risk_level`, `thermal_anomaly_c`, `dominant_driver`, and `population_exposure`.

### 2.4 Intervention & Simulation Schemas ([backend/app/schemas/intervention.py](../backend/app/schemas/intervention.py))
* `Intervention`: Catalog model representing an evidence-based cooling measure (ID, name, category, target surface, cooling potential, air temp reduction, unit costs, lifespan, co-benefits).
* `SimulationRequest`:
  - `zone_id` (e.g. `ZONE-01`)
  - `selected_intervention_ids` (List of intervention IDs)
  - `budget_inr_lakhs` (Float $> 0$, budget ceiling in ₹ Lakhs)
* `SimulationResponse`: Server-authoritative simulation output containing:
  - `budget_inr_lakhs`, `total_cost_inr_lakhs`, `remaining_budget_inr_lakhs`, `budget_utilization_pct`, `is_budget_exceeded`, `deficit_inr_lakhs`
  - `modeled_lst_reduction_c`, `modeled_ambient_reduction_c`, `synergy_factor_c`
  - `total_implementation_area_sqm`, `total_implementation_area_hectares`, `zone_area_coverage_pct`, `population_benefited`
  - `active_interventions` (List of `SimulatedInterventionItem`)
  - `phased_roadmap` (Dictionary grouping items by deployment phase)
  - `assumptions`, `provenance`, and `classification` (`DataClassification.SIMULATED`).

---

## 3. Relational Mapping to PostgreSQL / PostGIS 3

When transitioning to PostgreSQL with PostGIS in Phase 2, the Pydantic domain models map directly to relational tables:

```sql
-- Core Zones Table
CREATE TABLE zones (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    typology VARCHAR(32) NOT NULL,
    area_sqkm DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_zones_geom ON zones USING GIST (geom);

-- Land Cover Table
CREATE TABLE zone_land_cover (
    zone_id VARCHAR(32) PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
    impervious_surface_fraction DOUBLE PRECISION CHECK (impervious_surface_fraction BETWEEN 0 AND 1),
    tree_canopy_fraction DOUBLE PRECISION CHECK (tree_canopy_fraction BETWEEN 0 AND 1),
    vegetation_grass_fraction DOUBLE PRECISION CHECK (vegetation_grass_fraction BETWEEN 0 AND 1),
    water_fraction DOUBLE PRECISION CHECK (water_fraction BETWEEN 0 AND 1),
    average_albedo DOUBLE PRECISION CHECK (average_albedo BETWEEN 0 AND 1),
    building_density DOUBLE PRECISION CHECK (building_density BETWEEN 0 AND 1)
);

-- Thermal Observations Table
CREATE TABLE zone_thermal_observations (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(32) REFERENCES zones(id) ON DELETE CASCADE,
    land_surface_temp_c DOUBLE PRECISION NOT NULL,
    baseline_temp_c DOUBLE PRECISION NOT NULL,
    thermal_anomaly_c DOUBLE PRECISION NOT NULL,
    observation_timestamp TIMESTAMPTZ NOT NULL,
    classification VARCHAR(16) DEFAULT 'OBSERVED'
);
CREATE INDEX idx_thermal_zone ON zone_thermal_observations(zone_id);

-- Demographics Table
CREATE TABLE zone_demographics (
    zone_id VARCHAR(32) PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
    total_population INTEGER NOT NULL,
    population_density_per_sqkm DOUBLE PRECISION NOT NULL,
    vulnerable_ratio DOUBLE PRECISION CHECK (vulnerable_ratio BETWEEN 0 AND 1),
    outdoor_worker_density_per_sqkm DOUBLE PRECISION NOT NULL,
    low_ac_coverage_ratio DOUBLE PRECISION CHECK (low_ac_coverage_ratio BETWEEN 0 AND 1)
);
```

---

## 4. In-Memory Data Repository Implementation

The current Phase 1 persistence layer is managed by `DataRepository` in [backend/app/data/repository.py](../backend/app/data/repository.py).

### Key Architectural Characteristics:
* **Singleton Lifecycle:** Instantiated on application startup, loads and parses [data/processed/sample_zones.json](../data/processed/sample_zones.json) into strongly-typed `Zone` objects.
* **Thread-Safe Read Cache:** Zone lookups by ID (`get_zone_by_id(zone_id)`) operate in $O(1)$ time via Python dictionaries.
* **Hotspot Queries:** `list_hotspots(min_risk_score, min_anomaly_c)` computes risk scores on the fly or retrieves cached assessments, sorts descending by score and anomaly, and assigns contiguous 1-indexed ranks.
* **Zero External Dependencies:** Runs out-of-the-box on developer workstations without requiring local database service daemons.

---

## 5. Sample Dataset Profile ([sample_zones.json](../data/processed/sample_zones.json))

The evaluation dataset contains 10 calibrated urban planning zones in the Metropolis Central metropolitan area:

| Zone ID | Zone Name | Typology | Anomaly ($\Delta T$) | Canopy | Impervious | Population | AC Deficit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ZONE-01` | Downtown Financial District | `commercial_dense` | $+8.2^\circ\text{C}$ | $5\%$ | $88\%$ | $45,000$ | $15\%$ |
| `ZONE-02` | Riverfront Park & Wetlands | `park_riparian` | $-1.5^\circ\text{C}$ | $65\%$ | $8\%$ | $3,500$ | $5\%$ |
| `ZONE-03` | Industrial Freight Corridor | `industrial_heavy` | $+11.4^\circ\text{C}$ | $3\%$ | $91\%$ | $8,500$ | $45\%$ |
| `ZONE-04` | Old City Market & Historic Quarter | `historic_dense` | $+7.6^\circ\text{C}$ | $7\%$ | $82\%$ | $72,000$ | $65\%$ |
| `ZONE-05` | University Campus & Botanical Enclave | `institutional_campus` | $+1.2^\circ\text{C}$ | $45\%$ | $35\%$ | $22,000$ | $20\%$ |
| `ZONE-06` | High-Rise Residential Sector 9 | `residential_highrise` | $+5.8^\circ\text{C}$ | $14\%$ | $68\%$ | $64,000$ | $25\%$ |
| `ZONE-07` | Central Railway Terminal & Transit Hub | `transit_hub` | $+9.8^\circ\text{C}$ | $4\%$ | $89\%$ | $18,000$ | $40\%$ |
| `ZONE-08` | Greenbelt Suburban Residential | `residential_suburban` | $+0.8^\circ\text{C}$ | $48\%$ | $28\%$ | $19,500$ | $10\%$ |
| `ZONE-09` | Biotech & Medical District | `mixed_use` | $+4.5^\circ\text{C}$ | $22\%$ | $60\%$ | $31,000$ | $18\%$ |
| `ZONE-10` | Ashray Nagar High-Density Settlement | `informal_settlement` | $+8.9^\circ\text{C}$ | $2\%$ | $86\%$ | $95,000$ | $88\%$ |

This diverse dataset provides representative stress cases for the analytical engine, spanning high-hazard industrial zones (`ZONE-03`), hyper-dense informal settlements with acute socio-demographic vulnerability (`ZONE-10`), and cool ecological buffers (`ZONE-02`).
