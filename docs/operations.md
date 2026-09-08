# THERMOS — Operations & Deployment Guide

**Target Audience:** DevOps Engineers, Platform Administrators, Municipal SREs  
**Platform Version:** 2.0.0  

---

## 1. Environment Variables & Configuration

The application is configured using Pydantic's `BaseSettings` object in [`backend/app/core/config.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/backend/app/core/config.py). Variables can be supplied through environment variables or a `.env` file in the repository root.

| Variable | Type | Default | Description |
|---|---|---|---|
| `THERMOS_PROJECT_NAME` | string | `"THERMOS"` | Display title for OpenAPI and log banners |
| `THERMOS_VERSION` | string | `"0.1.0"` | Semantic system release version |
| `THERMOS_API_PREFIX` | string | `"/api/v1"` | Canonical versioned REST prefix |
| `THERMOS_BACKEND_CORS_ORIGINS` | list | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed CORS origins for browser fetch |
| `THERMOS_DATA_DIR` | path | `"data"` | Path to the base data directory |
| `THERMOS_ZONES_FILE` | path | `"data/processed/sample_zones.json"` | Path to primary GeoJSON zones file |
| `VITE_API_URL` | string (frontend) | `"http://localhost:8000"` | Backend origin for frontend API requests |

---

## 2. Deployment Architecture

### 2.1 Single-Host Production Topology

For typical municipal deployments, THERMOS runs as a reverse-proxied dual service:

```
[ Internet / Intranet ]
          │
          ▼
   [ Nginx / Caddy ] (Port 80 / 443, TLS termination)
     ├── /api/v1/*   ──► [ Uvicorn / Gunicorn ] (FastAPI, Port 8000)
     ├── /health     ──► [ Uvicorn / Gunicorn ] (FastAPI, Port 8000)
     └── /*          ──► Static SPA Files (dist/ from Vite build)
```

### 2.2 Docker Containerization

#### Backend `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY data/ ./data/
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### Frontend Multi-Stage `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Production Considerations & PostGIS Migration

1. **Database Transition:**
   - The current in-memory repository reads `data/processed/sample_zones.json`.
   - In enterprise production, initialize a PostgreSQL 16 database with the PostGIS 3.4 extension.
   - Replace `backend/app/data/repository.py` with an SQLAlchemy / GeoAlchemy2 spatial session. The schemas in `backend/app/schemas/zone.py` map 1:1 to PostGIS spatial tables.
2. **TiTiler Raster Integration:**
   - Raster tile endpoints dynamically route requests to external or self-hosted TiTiler instances for Cloud-Optimized GeoTIFFs (COGs).
   - If deploying air-gapped, use the built-in synthetic tile fallback server which generates valid Web Mercator PNG tiles with colormaps on-the-fly.
3. **Static Asset Caching:**
   - Configure Nginx with aggressive caching for immutable raster tiles (`/api/v1/raster/*/tiles/*`):
     ```nginx
     location ~* ^/api/v1/raster/.+/tiles/.+\.png$ {
         proxy_pass http://127.0.0.1:8000;
         proxy_cache raster_cache;
         proxy_cache_valid 200 24h;
         add_header X-Cache-Status $upstream_cache_status;
     }
     ```

---

## 4. Logging & Monitoring

* **Health Endpoint:** Use `GET /health` for Kubernetes liveness and readiness probes:
  ```yaml
  livenessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 5
    periodSeconds: 10
  ```
* **Structured Logging:** All backend logs emit standard timestamps, log levels, and request paths. Avoid logging sensitive PII or raw spatial coordinates in high-throughput loops.
* **Error Tracking:** Unhandled exceptions emit traceback logs and return standard `500 Internal Server Error` envelopes.

---

## 5. Performance Notes & Benchmarks

* **CHRI Computation:** Evaluating a single zone with full 5-driver decomposition executes in **$< 0.5\text{ ms}$**.
* **Predictive Forecasting:** Generating $+24\text{h}$, $+72\text{h}$, and $+7\text{d}$ multi-horizon forecasts executes in **$< 1.0\text{ ms}$** per zone.
* **Digital Twin Counterfactual Sandbox:** Full single-zone simulation runs in **$< 1.5\text{ ms}$**; citywide portfolio optimization across all 10 zones completes in **$< 12\text{ ms}$**.
* **Frontend Bundle:** Production build minifies to $\sim 139\text{ kB}$ CSS and $\sim 924\text{ kB}$ gzipped JS (inclusive of MapLibre GL WebGL shaders).

---

## 6. Known Limitations & Operational Guardrails

1. **Weather API Rate Limits:** Open-Meteo free tier has an hourly rate limit. In high-traffic production environments, configure a 10-minute caching layer (`WeatherWidget` caches client-side for 10 minutes).
2. **STAC Discovery Fallback:** When external planetary STAC endpoints are unreachable or latency exceeds 3 seconds, the raster service automatically falls back to synthetic tile generation to guarantee zero UI downtime.
3. **Bounding Box Alignment:** Ensure any new urban zones added to `sample_zones.json` fall within valid coordinate bounds (WGS84 `[-180, -90, 180, 90]`).
