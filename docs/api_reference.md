# THERMOS — API Reference Specification

**API Version:** v1 (FastAPI)  
**Base URL:** `http://localhost:8000/api/v1` (with `/api` dual-mount mirror)  
**Interactive Documentation:** `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc` (ReDoc)  

All endpoints return JSON responses with standard HTTP status codes:
- `200 OK`: Successful retrieval or execution.
- `400 Bad Request`: Invalid query parameters or unsupported request options.
- `404 Not Found`: Target resource identifier (e.g. `zone_id`) does not exist.
- `422 Unprocessable Entity`: Request body or parameter validation failure.
- `500 Internal Server Error`: Unhandled computational exception.

---

## 1. System Health & Metadata APIs

### `GET /health`
Inspects system health, repository readiness, and count of loaded zones.

* **Method:** `GET`
* **Route:** `/health`
* **Parameters:** None
* **Request Body:** None
* **Response Model:** `BackendHealth`
* **Example Request:**
  ```bash
  curl -X GET http://localhost:8000/health
  ```
* **Example Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "version": "0.1.0",
    "service": "thermos-backend",
    "zones_loaded": 10,
    "timestamp": "2026-09-08T18:24:00.000000Z"
  }
  ```

---

## 2. Dynamic CHRI & Risk Analytics APIs

### `GET /api/v1/chri/{zone_id}`
Returns the comprehensive Composite Heat Risk Index (CHRI) evaluation for a single zone, including normalized sub-scores and explainable driver attribution percentages.

* **Method:** `GET`
* **Route:** `/api/v1/chri/{zone_id}` (Mirror: `/api/chri/{zone_id}`)
* **Parameters:**
  * `zone_id` (path, string, required): Target zone identifier (e.g. `ZONE-01`, case-insensitive).
* **Response Model:** `CHRIScore`
* **Example Request:**
  ```bash
  curl -X GET http://localhost:8000/api/v1/chri/ZONE-01
  ```
* **Example Response (200 OK):**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "score": 74.5,
    "risk_level": "SEVERE",
    "normalized_lst": 82.5,
    "normalized_population_density": 85.0,
    "normalized_building_density": 90.0,
    "normalized_ndvi": 15.0,
    "normalized_aqi": 72.0,
    "raw_metrics": {
      "land_surface_temp_c": 38.4,
      "population_density": 18500,
      "building_density": 0.82,
      "ndvi": 0.12,
      "aqi": 145
    },
    "driver_contributions": {
      "high_lst": 38.7,
      "high_building_density": 24.2,
      "high_population": 22.8,
      "low_ndvi": 11.2,
      "poor_air_quality": 3.1
    },
    "dominant_driver": "high_lst",
    "dominant_driver_pct": 38.7,
    "formula": "CHRI = 0.35*norm_lst + 0.20*norm_pop + 0.20*norm_bld - 0.15*norm_ndvi + 0.10*norm_aqi",
    "timestamp": "2026-09-08T18:24:00.000000Z"
  }
  ```
* **Error Responses:**
  * `404 Not Found`:
    ```json
    { "detail": "Zone 'UNKNOWN_ZONE' not found" }
    ```

---

### `GET /api/v1/chri/recommendations/{zone_id}`
Returns tailored mitigation actions addressing the dominant biophysical drivers of the target zone.

* **Method:** `GET`
* **Route:** `/api/v1/chri/recommendations/{zone_id}`
* **Parameters:**
  * `zone_id` (path, string, required): Target zone identifier.
* **Response Model:** `ZoneRecommendation`
* **Example Response (200 OK):**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "chri_score": 74.5,
    "risk_level": "SEVERE",
    "dominant_drivers": ["high_lst", "high_building_density"],
    "recommended_actions": [
      {
        "action_id": "ACT-01",
        "title": "High-Albedo Cool Roof Program",
        "category": "cool_roofs",
        "driver_addressed": "high_lst",
        "description": "Apply high-reflectance coating on industrial and commercial rooftops.",
        "cooling_impact_c": 2.5,
        "cost_tier": "MEDIUM",
        "implementation_time": "6-12 months",
        "co_benefits": ["Energy savings", "Reduced peak electricity demand"]
      }
    ],
    "projected_cooling_c": 3.8,
    "projected_chri_reduction": 14.2,
    "summary": "Deploy high-albedo coatings and shade canopies to mitigate extreme thermal anomalies."
  }
  ```

---

## 3. Remote Sensing & Raster Intelligence APIs

### `GET /api/v1/raster/ndvi/tilejson` and `GET /api/v1/raster/lst/tilejson`
Returns OpenGIS TileJSON 3.0.0 metadata describing raster tile endpoints, bounding boxes, and zoom constraints.

* **Method:** `GET`
* **Route:** `/api/v1/raster/ndvi/tilejson` & `/api/v1/raster/lst/tilejson`
* **Response Model:** `TileJSONMetadata`
* **Example Response (200 OK):**
  ```json
  {
    "tilejson": "3.0.0",
    "name": "THERMOS Landsat 8/9 LST Thermal Layer",
    "description": "Land Surface Temperature (°C) raster tiles derived from Landsat 8/9 Band 10",
    "tiles": [
      "http://localhost:8000/api/v1/raster/lst/tiles/{z}/{x}/{y}.png"
    ],
    "minzoom": 8,
    "maxzoom": 16,
    "bounds": [80.15, 12.95, 80.32, 13.18],
    "format": "png",
    "attribution": "NASA/USGS Landsat 8/9 Collection 2 Level-2 | THERMOS Analytics"
  }
  ```

---

### `GET /api/v1/raster/{channel}/tiles/{z}/{x}/{y}.png`
Delivers dynamically rendered $256 \times 256$ Web Mercator PNG tiles with color ramps.

* **Method:** `GET`
* **Route:** `/api/v1/raster/ndvi/tiles/{z}/{x}/{y}.png` or `/api/v1/raster/lst/tiles/{z}/{x}/{y}.png`
* **Parameters:**
  * `z` (path, int, $0 \le z \le 22$): Zoom level.
  * `x` (path, int): Tile column index.
  * `y` (path, int): Tile row index.
* **Response:** Binary image content (`image/png`).
* **Error Response:** `400 Bad Request` if coordinates are outside valid Web Mercator bounds.

---

### `GET /api/v1/raster/{channel}/zonal-stats/{zone_id}`
Computes polygon-level zonal statistics for the target zone.

* **Method:** `GET`
* **Route:** `/api/v1/raster/lst/zonal-stats/{zone_id}`
* **Parameters:**
  * `zone_id` (path, string, required): Zone identifier.
* **Response Model:** `LSTZonalStats`
* **Example Response (200 OK):**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "mean_lst_c": 38.4,
    "min_lst_c": 32.1,
    "max_lst_c": 44.2,
    "thermal_anomaly_c": 6.4,
    "anomaly_classification": "Severe Anomaly",
    "satellite": "Landsat 9 TIRS-2",
    "acquisition_date": "2026-08-15"
  }
  ```

---

## 4. Predictive Heat Forecasting APIs

### `GET /api/v1/forecast/{zone_id}`
Provides deterministic heat risk forecasts at $+24\text{h}$, $+72\text{h}$, and $+7\text{d}$ horizons.

* **Method:** `GET`
* **Route:** `/api/v1/forecast/{zone_id}`
* **Parameters:**
  * `zone_id` (path, string, required): Zone identifier.
* **Response Model:** `CHRIForecast`
* **Example Response (200 OK):**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "current_chri": 74.5,
    "current_risk_level": "SEVERE",
    "forecast_points": [
      {
        "horizon": "24h",
        "projected_chri": 76.8,
        "delta_chri": 2.3,
        "escalation_tier": "Rising",
        "predicted_lst_c": 39.5,
        "confidence": "HIGH"
      },
      {
        "horizon": "72h",
        "projected_chri": 79.2,
        "delta_chri": 4.7,
        "escalation_tier": "Severe Rise",
        "predicted_lst_c": 41.0,
        "confidence": "HIGH"
      },
      {
        "horizon": "7d",
        "projected_chri": 73.1,
        "delta_chri": -1.4,
        "escalation_tier": "Stable",
        "predicted_lst_c": 37.8,
        "confidence": "MEDIUM"
      }
    ],
    "peak_chri": 79.2,
    "peak_horizon": "72h",
    "narrative": "Severe heat wave trajectory detected. Immediate municipal intervention recommended."
  }
  ```

---

### `GET /api/v1/forecast/hotspots/ranking`
Ranks all urban zones by projected forecast risk.

* **Method:** `GET`
* **Route:** `/api/v1/forecast/hotspots/ranking`
* **Parameters:**
  * `horizon` (query, string, default: `72h`): Evaluation horizon (`24h`, `72h`, `7d`).
  * `escalation_filter` (query, string, optional): Filter by tier (`Severe Rise`, `Rising`, `Stable`, `Cooling`).
* **Response Model:** `List[CHRIForecast]`

---

## 5. Municipal Decision Intelligence APIs

### `GET /api/v1/city/overview`
Aggregates metropolitan executive KPIs across all urban zones.

* **Method:** `GET`
* **Route:** `/api/v1/city/overview`
* **Response Model:** `CityCommandOverview`
* **Example Response (200 OK):**
  ```json
  {
    "city_name": "Chennai Urban Agglomeration",
    "generated_at": "2026-09-08T18:24:00.000000Z",
    "total_zones": 10,
    "current_city_chri": 61.4,
    "forecast_city_chri_72h": 65.2,
    "active_hotspots": 6,
    "emerging_hotspots": 2,
    "cooling_zones": 1,
    "population_exposed": 182400,
    "high_risk_zones_count": 6,
    "average_lst_c": 34.8,
    "average_ndvi": 0.24,
    "citywide_risk_tier": "HIGH"
  }
  ```

---

### `GET /api/v1/city/interventions`
Delivers the multi-criteria prioritized queue of municipal cooling interventions.

* **Method:** `GET`
* **Route:** `/api/v1/city/interventions`
* **Parameters:**
  * `limit` (query, int, default: 10): Maximum items to return.
  * `urgency` (query, string, optional): Filter by `IMMEDIATE`, `URGENT`, `PLANNED`, `ROUTINE`.
* **Response Model:** `List[PriorityIntervention]`
* **Example Item in Response:**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "rank": 1,
    "priority_score": 88.4,
    "chri_component": 26.1,
    "forecast_risk_component": 19.8,
    "population_exposure_component": 13.5,
    "vulnerability_component": 14.2,
    "feasibility_component": 8.8,
    "risk_level": "SEVERE",
    "dominant_driver": "high_lst",
    "recommended_action": "Cool Roofs & Shaded Transit Corridors",
    "urgency": "IMMEDIATE"
  }
  ```

---

### `GET /api/v1/city/resources`
Optimizes municipal resource deployment across budget tiers (`LOW`: \$500k, `MEDIUM`: \$2.0M, `HIGH`: \$5.0M).

* **Method:** `GET`
* **Route:** `/api/v1/city/resources`
* **Parameters:**
  * `budget_tier` (query, string, default: `MEDIUM`): Target tier (`LOW`, `MEDIUM`, `HIGH`).
* **Response Model:** `ResourcePortfolio`

---

## 6. Urban Climate Digital Twin & Scenario Simulator APIs

### `GET /api/v1/simulation/zone/{zone_id}`
Returns zone baseline status and available simulation levers.

* **Method:** `GET`
* **Route:** `/api/v1/simulation/zone/{zone_id}`
* **Parameters:**
  * `zone_id` (path, string, required): Zone identifier.
* **Response Model:** `ZoneSimulationMetadata`

---

### `POST /api/v1/simulation/run`
Simulates counterfactual biophysical cooling interventions on a target zone.

* **Method:** `POST`
* **Route:** `/api/v1/simulation/run` (Mirror: `/api/simulation/run`)
* **Request Body (`SimulationRequest`):**
  ```json
  {
    "zone_id": "ZONE-01",
    "intervention_type": "cool_roofs",
    "coverage_pct": 60.0,
    "budget": 200000.0,
    "implementation_horizon": "short_term",
    "scenario_name": "Commercial Cool Roof Rollout"
  }
  ```
* **Response Model:** `SimulationResult`
* **Example Response (200 OK):**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "scenario_name": "Commercial Cool Roof Rollout",
    "intervention_type": "cool_roofs",
    "coverage_pct": 60.0,
    "budget": 200000.0,
    "implementation_horizon": "short_term",
    "baseline_chri": 74.5,
    "simulated_chri": 63.1,
    "projected_chri_reduction": 11.4,
    "baseline_lst_c": 38.4,
    "simulated_lst_c": 35.2,
    "projected_lst_reduction": 3.2,
    "baseline_ndvi": 0.12,
    "simulated_ndvi": 0.12,
    "projected_ndvi_increase": 0.0,
    "baseline_aqi": 145.0,
    "simulated_aqi": 142.0,
    "projected_aqi_reduction": 3.0,
    "baseline_risk_level": "SEVERE",
    "simulated_risk_level": "HIGH",
    "baseline_forecast_peak": 79.2,
    "simulated_forecast_peak": 71.5,
    "forecast_improvement": 7.7,
    "exposed_population_reduction": 18500,
    "economic_benefit_usd": 1542000.0,
    "roi": 7.71,
    "applied_interventions": [
      "High-Albedo Solar-Reflective Cool Roof Coatings"
    ],
    "timestamp": "2026-09-08T18:24:00.000000Z"
  }
  ```

---

### `POST /api/v1/simulation/compare`
Evaluates two competing scenarios against baseline with automated winner recommendation.

* **Method:** `POST`
* **Route:** `/api/v1/simulation/compare`
* **Request Body (`ScenarioComparisonRequest`):**
  ```json
  {
    "zone_id": "ZONE-01",
    "scenario_a": {
      "zone_id": "ZONE-01",
      "intervention_type": "cool_roofs",
      "coverage_pct": 70.0,
      "budget": 250000.0,
      "implementation_horizon": "short_term",
      "scenario_name": "Aggressive Cool Roofs"
    },
    "scenario_b": {
      "zone_id": "ZONE-01",
      "intervention_type": "urban_forestry",
      "coverage_pct": 40.0,
      "budget": 250000.0,
      "implementation_horizon": "mid_term",
      "scenario_name": "Canopy Greening"
    }
  }
  ```
* **Response Model:** `ScenarioComparisonResponse`
* **Example Response (200 OK):**
  ```json
  {
    "zone_id": "ZONE-01",
    "zone_name": "George Town Commercial Core",
    "baseline": { ... },
    "scenario_a": { ... },
    "scenario_b": { ... },
    "winner_scenario": "Scenario A",
    "winning_metric": "Superior CHRI Reduction (-13.2 pts vs -8.4 pts) and localized cooling (-3.6°C)",
    "delta_chri_a_vs_b": 4.8,
    "delta_cooling_a_vs_b": 1.2,
    "delta_roi_a_vs_b": 2.1,
    "recommendation": "Deploy Aggressive Cool Roofs. It yields 1.2°C greater cooling impact and protects 18,500 citizens with an ROI of 8.4x."
  }
  ```

---

### `GET /api/v1/simulation/citywide`
Simulates citywide what-if projections across budget tiers (`LOW`, `MEDIUM`, `HIGH`, or `ALL`).

* **Method:** `GET`
* **Route:** `/api/v1/simulation/citywide`
* **Parameters:**
  * `budget_tier` (query, string, default: `MEDIUM`): Supported: `LOW`, `MEDIUM`, `HIGH`, `ALL`.
* **Response Model:** `CitywideSimulationResult` (or `Dict[str, CitywideSimulationResult]` when `budget_tier=ALL`).
