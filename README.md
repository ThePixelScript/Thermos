# THERMOS

Urban Heat Intelligence & Climate Risk Analytics Platform

> **System Status:** Production Enterprise GIS Platform  
> **Backend:** FastAPI 0.115+ (Python 3.11+) | **Frontend:** React 19 + TypeScript + MapLibre GL JS + Vite  
> **Test Suite:** 150 / 150 Tests Passing (100% Deterministic Pass Rate)  
> **Data Providers:** WeatherAPI.com + NASA FIRMS + OpenStreetMap (Nominatim & Overpass) + Sentinel-2 & Landsat 8/9  

---

## Features

### Global Location Intelligence
- **Forward Geocoding:** Search any city, district, ward, locality, or coordinates globally via OpenStreetMap Nominatim.
- **Reverse Geocoding:** Click anywhere on the map or use device geolocation to instantly resolve geographic coordinates and administrative boundaries.
- **Recent Search History:** Fast local caching and instantaneous lookup for recently queried jurisdictions.
- **Dynamic Location-Aware Analytics:** Location-driven microclimate intelligence pipeline generating adaptive H3 spatial hexagons and hotspot polygons without hardcoded city locks.

### Live Weather Integration
- **WeatherAPI Integration:** High-resolution atmospheric telemetry (`temperature_c`, `feelslike_c`, `heatindex_c`, `humidity`, `wind_kph`, `wind_degree`, `uv`, `pressure_mb`).
- **30-Minute Response Caching:** Local disk-based and in-memory TTL caching preventing redundant API calls and rate-limiting.
- **Automatic Fallback Handling:** Graceful fallback hierarchy (Live WeatherAPI → Cached Telemetry → Climate Normal Fallback) with exponential backoff and timeout retries.
- **Real-Time Weather Telemetry:** Live atmospheric vectors driving continuous CHRI index calculation and animated WebGL wind particle streamlines.

### Heat Risk Analysis
- **CHRI Scoring:** Continuous Composite Heat Risk Index (0–100) combining Land Surface Temperature (LST), Vegetation Deficit (NDVI), Building Density, Population Exposure, and Distance to Water Cooling Sinks.
- **Hotspot Detection:** Dynamic spatial clustering detecting critical thermal anomalies and biophysical risk zones.
- **Risk Prioritization:** Multi-criteria ranking identifying vulnerable population centers requiring immediate municipal interventions.
- **Intervention Planning:** Algorithmic catalog recommending high-albedo cool roofs, urban canopy corridors, reflective pavements, and evaporative water buffers.

### Interactive GIS Map
- **Global Navigation:** Smooth pan, tilt, pitch, and zoom powered by MapLibre GL JS with global coordinate support.
- **Dynamic Hotspot Visualization:** Choropleth polygons and H3 hexagonal meshes color-coded across deterministic risk tiers (Low, Moderate, High, Extreme).
- **Location-Aware Overlays:** Multi-source layers including STAC COG thermal rasters (Landsat 8/9), Sentinel-2 greenness (NDVI), 3D extruded building footprints, water cooling buffers, and wind streamlines.
- **Search & Fly-To Interactions:** Mapbox/Google Maps style floating search card, smooth camera fly-to animations, geolocate controls, and instant sector inspector activation.

### Executive Dashboard
- **Heat Risk Overview:** Regional mean CHRI score, risk distribution breakdown, and municipal advisory tier.
- **Weather Intelligence:** Real-time WeatherAPI.com metrics, feels-like thermal stress, humidity, wind velocity, and UV solar radiation.
- **Critical Hotspots:** Ranked tabular view of top municipal heat priorities with direct **"Inspect on Map"** camera fly-to actions.
- **Intervention Tracking:** Status of municipal urban canopy corridors, cool roof retrofits, and permeable pavement conversions.
- **Trend Analytics:** 7-day projection combining historical meteorological observations and predictive heat forecasting.

### UI/UX
- **Enterprise SaaS Design:** Inspired by ArcGIS, Google Maps, Linear, Stripe, Notion, and Mapbox; clean surfaces, subtle borders, and zero glassmorphic clutter.
- **Responsive Layout:** 3-column architecture (240px Sidebar, 70–75% Dominant Map Canvas, 320px Progressive Disclosure Inspector).
- **Theme Customization:** 5 curated enterprise palettes (Emerald, Blue, Teal, Orange, Violet) across Light, Dark, and System modes.
- **Font Scaling:** Adaptive typography scaling (Small, Medium, Large) for dense operational centers or presentation displays.
- **Density Controls:** Layout density modes (Compact, Comfortable, Spacious) tailored for command center monitors or tablets.
- **Persistent Preferences:** Centralized `ThemeContext` persisting user display preferences to `localStorage` across page refreshes.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FRONTEND GIS WORKBENCH (React 19 + TypeScript)              │
│  [TopHeader (50px)] [LeftSidebar (240px)] [MapLibre Canvas] [RightInspector]│
│  [Floating Search Overlay] [LayerControl] [Dashboard 5-Widgets]             │
│  [City Command Center] [Digital Twin Scenario Planner]                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │  HTTP / REST (JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI APPLICATION GATEWAY                           │
│  - Routes: /api/v1/* and /api/* (Location, Weather, Hotspots, CHRI, Twin)   │
│  - OpenAPI / Swagger Documentation & Pydantic v2 Request Validation         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ LOCATION & METEO │          │ ANALYTICS CORE   │          │ DIGITAL TWIN     │
│ - Nominatim Geo  │          │ - Dynamic CHRI   │          │ - Biophysics Sim │
│ - WeatherAPI Svc │          │ - Hotspot Detect │          │ - A/B Matrix     │
│ - 30m Disk Cache │          │ - 5-Driver Attrib│          │ - What-If Engine │
│ - H3 Hex Mesh    │          │ - Multi-Horizon  │          │ - Civic ROI Calc │
└──────────────────┘          └──────────────────┘          └──────────────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA & INGESTION LAYER                              │
│  - WeatherAPI.com Live Telemetry & NASA FIRMS Thermal Data                  │
│  - OpenStreetMap Nominatim Geocoding & Overpass Vector Features             │
│  - Sentinel-2 Multispectral (NDVI) & Landsat 8/9 Thermal Infrared (LST)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

* **Backend Framework:** FastAPI 0.115+, Uvicorn 0.30+, Pydantic v2
* **Frontend Framework:** React 19, TypeScript, Vite 8+, Lucide React
* **Geospatial & Visualization:** MapLibre GL JS, GeoJSON (RFC 7946), WebGL Wind Vector Particles, H3 Grid
* **Weather & Remote Sensing:** WeatherAPI.com, NASA FIRMS, OpenStreetMap Nominatim, Sentinel-2 COG, Landsat 8/9 Thermal
* **Testing & Quality Assurance:** Pytest 8.x (150 tests passing), AnyIO, Starlette TestClient, TypeScript Compiler (`tsc -b`)

---

## 📁 Repository Structure

```
Thermos/
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── api/              # HTTP Route handlers (location, weather, chri, hotspots, raster...)
│   │   ├── core/             # Configuration & environment settings (.env)
│   │   ├── data/             # In-memory spatial data repository & fallback caches
│   │   ├── modules/          # Pure computational services (weather, location, chri, simulation...)
│   │   │   ├── weather/      # WeatherAPIService & WeatherProvider with Nominatim geocoding
│   │   │   ├── chri/         # Deterministic CHRI calculation engine
│   │   │   └── ...
│   │   ├── schemas/          # Pydantic v2 domain schemas & DTOs
│   │   └── main.py           # Application entrypoint & discovery routes
│   ├── pyproject.toml        # Backend package metadata
│   └── requirements.txt      # Python runtime dependencies
├── data/
│   ├── cache/                # Disk cache for weather & geocoding responses (30-min TTL)
│   └── processed/            # Baseline urban zones & administrative geometries
├── docs/                     # Architectural, operational & technical documentation
├── frontend/                 # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # TopHeader, LeftSidebar, RightInsightPanel
│   │   │   ├── dashboard/    # DashboardView (5 Executive Sections)
│   │   │   ├── search/       # LocationSearchBar (Forward Geocoding & History)
│   │   │   ├── map/          # ThermosMap (MapLibre GL JS) & LayerControl
│   │   │   └── analytics/    # CityCommandCenter & ScenarioPlanner
│   │   ├── context/          # ThemeContext & LocationContext
│   │   ├── services/         # Typed API clients
│   │   ├── types/            # TypeScript domain interfaces
│   │   ├── App.tsx           # Primary application workbench
│   │   └── index.css         # Clean enterprise design system
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite bundling configuration
└── tests/                    # Pytest automated test suite (150 tests passing)
```

---

## ⚡ Quickstart & Local Development

### Prerequisites
* **Python:** 3.11+
* **Node.js:** 18+ and `npm`
* **WeatherAPI Key:** Set in `backend/.env` as `WEATHERAPI_KEY=...`

---

### 1. Running the Backend

```bash
# 1. Create and activate virtual environment
py -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# or: source .venv/bin/activate # macOS / Linux

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Launch FastAPI server
python -m uvicorn backend.app.main:app --reload --port 8000
```

The backend services will be live at:
* **Interactive OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **System Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
* **Location Geocoding Search:** [http://localhost:8000/api/location/search?q=Paris](http://localhost:8000/api/location/search?q=Paris)
* **Current WeatherAPI Telemetry:** [http://localhost:8000/api/weather/current?lat=13.0827&lon=80.2707](http://localhost:8000/api/weather/current?lat=13.0827&lon=80.2707)

---

### 2. Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at [http://localhost:5173](http://localhost:5173).

---

### 3. Running Automated Tests

Run the complete 150-test suite:
```bash
pytest -v
```

Verify frontend TypeScript type-checking and production bundling:
```bash
cd frontend
npm run build
```

---

## 📡 Key API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | System health check and loaded engine status |
| `/api/location/search` | `GET` | Global forward geocoding with bounding box and place resolution |
| `/api/location/reverse` | `GET` | Reverse geocoding of coordinates to administrative boundaries |
| `/api/weather/current` | `GET` | Live WeatherAPI.com telemetry with 30-min cache and fallback |
| `/api/v1/zones/geojson` | `GET` | RFC 7946 GeoJSON FeatureCollection for MapLibre GL |
| `/api/v1/hotspots` | `GET` | Dynamically detected thermal hotspots sorted by risk rank |
| `/api/v1/chri/{zone_id}` | `GET` | Live raster-driven CHRI score and 5-driver breakdown |
| `/api/v1/forecast/{zone_id}` | `GET` | Multi-horizon predictive heat forecast (+24h, +72h, +7d) |
| `/api/v1/city/overview` | `GET` | Metropolitan command center overview & citywide KPIs |
| `/api/v1/city/interventions` | `GET` | Multi-criteria prioritized intervention queue |
| `/api/v1/simulation/run` | `POST` | Digital twin counterfactual intervention simulation |
| `/api/v1/simulation/compare` | `POST` | Multi-scenario A/B side-by-side comparison matrix |\n