# THERMOS

Urban Heat Intelligence & Climate Risk Analytics Platform

> **System Status:** Production Enterprise GIS Platform  
> **Backend:** FastAPI 0.115+ (Python 3.11+) | **Frontend:** React 19 + TypeScript + MapLibre GL JS + Vite  
> **Test Suite:** 150 / 150 Tests Passing (100% Deterministic Pass Rate)  
> **Data Providers:** WeatherAPI.com + NASA FIRMS + OpenStreetMap (Nominatim & Overpass) + Sentinel-2 & Landsat 8/9  

---

## 🌐 Production URLs

| Service | Target URL | Description |
|---|---|---|
| **Frontend (Vercel)** | `https://thermos-climate.vercel.app` | Public Enterprise GIS Workbench & Map Canvas |
| **Backend API (Render)** | `https://thermos-backend.onrender.com` | FastAPI Microclimate Computation & Telemetry Engine |
| **Interactive API Docs** | `https://thermos-backend.onrender.com/docs` | OpenAPI / Swagger UI Interactive Endpoint Explorer |
| **Health Monitor** | `https://thermos-backend.onrender.com/health` | Real-time System Health & Data Repository Status |

---

## 🚀 Features

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

### UI/UX & Human-Crafted SaaS Design
- **Enterprise SaaS Design:** Inspired by ArcGIS, Google Maps, Linear, Stripe, Notion, and Mapbox; clean surfaces, subtle borders, and zero glassmorphic clutter.
- **Global Font Scaling:** Root CSS variable scaling (`--font-scale`: 0.9, 1.0, 1.15, 1.3) universally inherited across all headers, sidebars, tables, and modals.
- **Top 5 Priority Zones:** Strict visual hierarchy (Gold `#1`, Silver `#2`, Bronze `#3`, Neutral `#4–#5`) with sector names, CHRI scores, risk badges, and thermal anomalies.
- **Dedicated Settings Modal:** 6 comprehensive tabs (Appearance, Typography, Layout, Map, Accessibility, System) with 16 curated accent colors and 7 theme presets.
- **Panel Surface Color Customization:** 8 selectable surface tints (Default, Slate, Blue, Teal, Green, Purple, Orange, Gray) with local persistence.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FRONTEND GIS WORKBENCH (React 19 + TypeScript)              │
│  [TopHeader (50px)] [LeftSidebar (240px)] [MapLibre Canvas] [RightInspector]│
│  [Floating Search Overlay] [LayerControl] [Dashboard 5-Widgets]             │
│  [City Command Center] [Scenario Planner] [Settings Modal]                  │
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

## 🛠️ Environment Configuration

All required environment variables are documented and templated in `.env.example` (backend) and `frontend/.env.example` (frontend).

### Backend Variables (`.env` / Render Environment)

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `WEATHERAPI_KEY` | String | **Yes** | — | WeatherAPI.com API token for real-time atmospheric telemetry (temperature, humidity, wind, heat index, UV). |
| `WEATHER_API_KEY` | String | No | (same as above) | Fallback alias for `WEATHERAPI_KEY`. |
| `NASA_FIRMS_MAP_KEY` | String | Optional | — | NASA FIRMS MAP Key for satellite thermal anomaly and active fire detections. |
| `APP_ENV` | String | No | `production` | Environment mode (`production` or `development`). |
| `PORT` | Integer | No | `8000` | HTTP port assigned automatically by Render / hosting provider via `$PORT`. |
| `CORS_ORIGINS` | String | No | `*` | Comma-separated list of allowed origins or `*` for public access. |

### Frontend Variables (`frontend/.env` / Vercel Environment)

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `VITE_API_URL` | String | **Yes (Prod)** | `https://thermos-backend.onrender.com` | Base URL of the deployed FastAPI backend. In development, defaults to `http://localhost:8000`. |

---

## 🚢 Production Deployment Guide

### Option 1: Backend Deployment on Render.com

The repository is equipped with a native [`render.yaml`](render.yaml) blueprint and [`Procfile`](Procfile) for zero-friction deployment.

#### Automated Blueprint Method:
1. Push your code to GitHub.
2. Log in to [Render.com](https://render.com) and click **New +** → **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml`.
4. Fill in the prompted secret environment variables (`WEATHERAPI_KEY`).
5. Click **Apply**. Render will build and deploy the web service.

#### Manual Web Service Method:
1. Log in to Render.com → Click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name:** `thermos-backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Under **Environment Variables**, add:
   - `WEATHERAPI_KEY`: `b2f2b36c93ae426eb3c223122260809`
   - `NASA_FIRMS_MAP_KEY`: `7858186c9b6a3a6cd7a8e7e625cb5fa2`
   - `APP_ENV`: `production`
   - `CORS_ORIGINS`: `*`
5. Click **Create Web Service**.
6. Copy your public URL (e.g. `https://thermos-backend.onrender.com`).

---

### Option 2: Frontend Deployment on Vercel

The repository includes both [`vercel.json`](vercel.json) and [`frontend/vercel.json`](frontend/vercel.json) with pre-configured Vite SPA rewrites and caching headers.

#### Deployment Steps:
1. Log in to [Vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Select your `Thermos` GitHub repository.
3. Configure Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `frontend` (or leave as `.` if using root `vercel.json`).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://thermos-backend.onrender.com`).
5. Click **Deploy**.
6. Vercel will bundle the production build (`dist/`) and provide your live HTTPS domain (e.g. `https://thermos-climate.vercel.app`).

---

## ⚡ Local Development Guide

### Prerequisites
* **Python:** 3.11+
* **Node.js:** 18+ and `npm`

---

### 1. Running the Backend Locally

```bash
# 1. Create and activate virtual environment
py -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# or: source .venv/bin/activate # macOS / Linux

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Launch development server
python -m uvicorn backend.app.main:app --reload --port 8000
```

Backend services will be live at:
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **System Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
* **Location Search API:** [http://localhost:8000/api/location/search?q=London](http://localhost:8000/api/location/search?q=London)
* **Current Weather API:** [http://localhost:8000/api/weather/current?lat=13.0827&lon=80.2707](http://localhost:8000/api/weather/current?lat=13.0827&lon=80.2707)

---

### 2. Running the Frontend Locally

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