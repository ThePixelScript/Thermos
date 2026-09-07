# THERMOS — REST API Reference Manual

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 09-API-REFERENCE.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Global Conventions

* **Base URL:** `http://127.0.0.1:8000`
* **Versioning:** All functional endpoints are available under the `/api/v1` prefix and aliased at `/api` for backwards compatibility.
* **Content Type:** `application/json` (except `/api/v1/zones/geojson` which serves `application/geo+json`).
* **Interactive Documentation:**
  - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
  - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 2. Health & System Status

### `GET /health` (also aliased at `/api/v1/health`)
Returns backend operational status, loaded zones count, and analytical engine readiness.

* **Response (HTTP 200, `HealthResponse`):**
```json
{
  "status": "healthy",
  "app_name": "THERMOS",
  "version": "0.1.0",
  "environment": "development",
  "zones_loaded": 10,
  "hotspots_count": 8,
  "engine_status": {
    "geospatial": "active",
    "heat_analytics": "active",
    "risk_scoring": "active_deterministic",
    "interventions": "catalog_ready",
    "simulation": "ready_phase_2",
    "optimization": "ready_phase_2",
    "ai_interface": "active_decoupled"
  }
}
```

---

## 3. Urban Zones Endpoints

### `GET /api/v1/zones` (also aliased at `/api/zones`)
Lists all urban zones with summary metrics, land-cover fractions, and computed heat risk scores.

* **Query Parameters:** None.
* **Response (HTTP 200):** Array of `ZoneSummary` objects:
```json
[
  {
    "id": "ZONE-01",
    "name": "Downtown Financial District",
    "typology": "commercial_dense",
    "area_sqkm": 2.4,
    "temperature": 39.7,
    "vegetation": 0.09,
    "imperviousness": 0.88,
    "building_density": 0.65,
    "population_exposure": 37.5,
    "risk_score": 72.8,
    "risk_level": "SEVERE",
    "land_surface_temp_c": 39.7,
    "thermal_anomaly_c": 8.2,
    "tree_canopy_fraction": 0.05,
    "impervious_surface_fraction": 0.88,
    "total_population": 45000
  }
]
```

### `GET /api/v1/zones/geojson` (also aliased at `/api/zones/geojson`)
Returns an RFC 7946 compliant GeoJSON `FeatureCollection` for MapLibre GL JS rendering.

* **Response (HTTP 200, `GeoJSONFeatureCollection`):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "ZONE-01",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.21, 28.63],
            [77.225, 28.63],
            [77.225, 28.645],
            [77.21, 28.645],
            [77.21, 28.63]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-01",
        "name": "Downtown Financial District",
        "typology": "commercial_dense",
        "area_sqkm": 2.4,
        "land_surface_temp_c": 39.7,
        "thermal_anomaly_c": 8.2,
        "risk_score": 72.8,
        "risk_level": "SEVERE"
      }
    }
  ]
}
```

### `GET /api/v1/zones/{zone_id}` (also aliased at `/api/zones/{zone_id}`)
Returns complete spatial, physical, land-cover, thermal, and demographic information for a single zone.

* **Path Parameters:** `zone_id` (string, e.g. `ZONE-01`).
* **Errors:** HTTP 404 if `zone_id` does not exist (`detail: "Zone 'ZONE-99' not found"`).

---

## 4. Hotspot Detection & Ranking Endpoints

### `GET /api/v1/hotspots` (also aliased at `/api/hotspots`)
Returns all qualifying urban heat hotspots, prioritized by composite heat risk with thermal anomaly tiebreaking.

* **Query Parameters:**
  - `min_risk` (float, default `30.0`, range $[0.0, 100.0]$): Minimum CHRI score threshold.
  - `min_anomaly` (float, optional): Minimum thermal anomaly in $^\circ\text{C}$.
* **Response (HTTP 200):** Array of `HotspotSummary` objects:
```json
[
  {
    "rank": 1,
    "zone_id": "ZONE-10",
    "zone_name": "Ashray Nagar High-Density Settlement",
    "typology": "informal_settlement",
    "temperature": 40.4,
    "vegetation": 0.05,
    "imperviousness": 0.86,
    "building_density": 0.72,
    "population_exposure": 95.0,
    "risk_score": 88.4,
    "risk_level": "CRITICAL",
    "land_surface_temp_c": 40.4,
    "thermal_anomaly_c": 8.9,
    "dominant_driver": "Lack of Cooling Infrastructure",
    "dominant_driver_pct": 28.4,
    "total_population": 95000,
    "vulnerable_population": 26600,
    "area_sqkm": 1.2,
    "center_coords": [77.262, 28.592],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "CRITICAL_HOTSPOT"
  }
]
```

### `GET /api/v1/hotspots/{zone_id}` (also aliased at `/api/hotspots/{zone_id}`)
Returns full diagnostic dossier (`HotspotDetail`) including explainable driver percentage breakdown and site-specific recommendations.

* **Response (HTTP 200, `HotspotDetail`):**
```json
{
  "summary": {
    "rank": 1,
    "zone_id": "ZONE-10",
    "zone_name": "Ashray Nagar High-Density Settlement",
    "risk_score": 88.4,
    "risk_level": "CRITICAL",
    "hotspot_tier": "CRITICAL_HOTSPOT"
  },
  "zone": { "id": "ZONE-10", "name": "Ashray Nagar High-Density Settlement" },
  "risk_assessment": {
    "zone_id": "ZONE-10",
    "zone_name": "Ashray Nagar High-Density Settlement",
    "risk_score": {
      "score": 88.4,
      "risk_level": "CRITICAL",
      "subscores": {
        "hazard_score": 78.5,
        "exposure_score": 92.0,
        "vulnerability_score": 96.2
      },
      "driver_contributions": [
        {
          "driver_key": "low_ac_coverage_ratio",
          "name": "Lack of Cooling Infrastructure",
          "contribution_pct": 28.4,
          "raw_value": 0.88,
          "unit": "ratio",
          "dimension": "Vulnerability"
        }
      ]
    }
  },
  "recommended_interventions": [
    {
      "intervention_id": "INT-COOL-ROOF",
      "intervention_name": "High-Reflectance Cool Roof Coating",
      "category": "material_engineering",
      "recommended_area_sqm": 14000.0,
      "estimated_total_cost_usd": 252000.0,
      "expected_local_lst_reduction_c": 12.0,
      "expected_ambient_reduction_c": 1.2,
      "suitability_score": 95.0,
      "rationale": "Low surface albedo (0.11) and dense roof footprint make reflective white coatings highest ROI."
    }
  ],
  "confidence": 0.98,
  "assumptions": [
    "Regional baseline temperature is assumed uniform across the study boundary.",
    "Canopy deficit assumes 50% tree canopy represents optimal cooling potential."
  ]
}
```

---

## 5. Interventions & Simulation Endpoints

### `GET /api/v1/interventions/catalog` (also aliased at `/api/interventions/catalog`)
Returns complete catalog of 8 evidence-based urban cooling interventions.

* **Response (HTTP 200):** Array of `Intervention` objects:
```json
[
  {
    "id": "INT-TREE-CANOPY",
    "name": "High-Albedo Urban Tree Canopy Expansion",
    "category": "nature_based",
    "description": "Planting dense, broadleaf native shade trees along pedestrian paths and public easements.",
    "target_surface": "street_corridor",
    "cooling_potential_c": 5.5,
    "air_temp_reduction_c": 1.8,
    "unit_cost_usd_per_sqm": 45.0,
    "expected_lifespan_years": 30,
    "maintenance_cost_usd_annual_per_sqm": 3.5,
    "cost_inr_lakhs": 14.5,
    "typical_area_sqm": 18000.0,
    "phase": "Phase 3: Structural Canopy (8–18m)",
    "timeframe": "8 – 14 Months",
    "feasibility": "High"
  }
]
```

### `GET /api/v1/interventions/catalog/{intervention_id}`
Returns engineering specifications for a single intervention by ID.
* **Errors:** HTTP 404 if intervention ID does not match catalog.

### `GET /api/v1/interventions/recommendations/{zone_id}`
Evaluates zone land cover and drivers, returning prioritized site-specific cooling estimates.

### `POST /api/v1/interventions/simulate` (also aliased at `/api/interventions/simulate`)
Executes server-authoritative deterministic scenario simulation under physical surface area and budget constraints.

* **Request Body (`SimulationRequest`):**
```json
{
  "zone_id": "ZONE-01",
  "selected_intervention_ids": [
    "INT-COOL-ROOF",
    "INT-TREE-CANOPY"
  ],
  "budget_inr_lakhs": 25.0
}
```

* **Response (HTTP 200, `SimulationResponse`):**
```json
{
  "zone_id": "ZONE-01",
  "zone_name": "Downtown Financial District",
  "budget_inr_lakhs": 25.0,
  "total_cost_inr_lakhs": 23.0,
  "remaining_budget_inr_lakhs": 2.0,
  "budget_utilization_pct": 92.0,
  "is_budget_exceeded": false,
  "deficit_inr_lakhs": 0.0,
  "modeled_lst_reduction_c": 4.12,
  "modeled_ambient_reduction_c": 1.48,
  "synergy_factor_c": 0.13,
  "total_implementation_area_sqm": 32000.0,
  "total_implementation_area_hectares": 3.2,
  "zone_area_coverage_pct": 1.3,
  "population_benefited": 1320,
  "active_interventions": [
    {
      "id": "INT-COOL-ROOF",
      "name": "High-Reflectance Cool Roof Coating",
      "category": "material_engineering",
      "target_surface": "roof",
      "cost_inr_lakhs": 8.5,
      "implementation_area_sqm": 14000.0,
      "implementation_area_hectares": 1.4,
      "surface_constraint_checked": true,
      "estimated_lst_drop_c": 2.8,
      "estimated_ambient_drop_c": 0.21,
      "phase": "Phase 1: Immediate Relief (1–3m)",
      "timeframe": "1 – 3 Months",
      "co_benefits": ["Indoor comfort (-3.5°C)", "HVAC demand reduction (-18%)"]
    }
  ],
  "phased_roadmap": {
    "Phase 1: Immediate Relief (1–3m)": [
      "High-Reflectance Cool Roof Coating (₹8.5L, 1 – 3 Months)"
    ],
    "Phase 3: Structural Canopy (8–18m)": [
      "High-Albedo Urban Tree Canopy Expansion (₹14.5L, 8 – 14 Months)"
    ]
  },
  "assumptions": [
    "Costs reflect standard Indian municipal public works schedule of rates for urban heat retrofits (INR Lakhs).",
    "Implementation footprints are bounded by zone-specific land cover fractions.",
    "Ambient air temperature (2m UCL) is modeled using asymptotic diminishing returns (ceiling = 3.0°C).",
    "Microclimate synergy bonus (+0.10°C to +0.20°C) is credited when nature-based and high-albedo material interventions are co-deployed.",
    "Population protected represents daytime residential and transit foot-traffic exposure within the intervention coverage radius."
  ],
  "provenance": "Modelled estimate under stated assumptions; not field-validated.",
  "classification": "SIMULATED"
}
```

* **Errors:**
  - HTTP 400: `Budget must be greater than zero (₹ Lakhs)` or `Unknown intervention ID 'XYZ'`
  - HTTP 404: `Zone 'ZONE-99' not found`
  - HTTP 422: Unprocessable Entity (e.g. missing required JSON keys).
