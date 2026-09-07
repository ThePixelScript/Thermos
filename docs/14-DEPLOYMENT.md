# THERMOS — Deployment & Operations Guide

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 14-DEPLOYMENT.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Local Development Runbook

### Prerequisites
* Python 3.11+
* Node.js 18+ (with npm)
* Git

### Step-by-Step Execution:

#### 1. Backend Service
```bash
# Clone and navigate to repository root
cd C:/Users/Dell/Desktop/Programming/Project/Thermos

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt

# Run automated tests to verify installation (53 tests)
pytest -v

# Start FastAPI development server
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend Swagger documentation will be accessible at `http://127.0.0.1:8000/docs`.

#### 2. Frontend Decision Workbench
In a separate terminal:
```bash
cd frontend

# Install Node dependencies
npm install

# Run static analysis and build verification
npm run lint
npm run build

# Start Vite development server
npm run dev
```
Frontend application will be accessible at `http://localhost:5173`.

---

## 2. Containerized Deployment (Docker & Compose)

### 2.1 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ backend/
COPY data/ data/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production Static Server Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Local Orchestration (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - HOST=0.0.0.0
      - PORT=8000
    volumes:
      - ./data:/app/data:ro

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 3. Production Cloud Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MUNICIPAL CLIENT                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (TLS 1.3)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  EDGE CDN / REVERSE PROXY                   │
│          (Cloudflare / AWS CloudFront / Nginx)              │
│  - Static assets caching (React 19 SPA)                     │
│  - DDoS mitigation & TLS termination                        │
└──────────────┬──────────────────────────────┬───────────────┘
               │ /api/*                       │ /*
               ▼                              ▼
┌─────────────────────────────┐  ┌────────────────────────────┐
│      API SERVICE POOL       │  │       STATIC BUCKET        │
│ (AWS ECS / GCP Cloud Run)   │  │   (AWS S3 / GCP Storage)   │
│ - Stateless FastAPI pods    │  │ - Compiled Vite SPA assets │
│ - Auto-scaled on CPU / RPS  │  └────────────────────────────┘
└──────────────┬──────────────┘
               │ (Phase 2 Target)
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   MANAGED DATABASE TIER                     │
│               (PostgreSQL 16 + PostGIS 3)                   │
│  - AWS Aurora PostGIS / GCP Cloud SQL                       │
│  - GIST indexed spatial polygons & zonal statistics         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Environment Configuration Reference

Centralized in [backend/app/core/config.py](../backend/app/core/config.py):

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `THERMOS` | Application display name in logs and OpenAPI docs. |
| `API_V1_STR` | `/api/v1` | URL routing prefix for versioned endpoints. |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173", ...]` | Allowed HTTP origins for browser cross-origin requests. |
| `SAMPLE_DATA_PATH` | `data/processed/sample_zones.json` | Path to default urban zone dataset. |
| `HOST` | `127.0.0.1` | Network interface for Uvicorn server binding. |
| `PORT` | `8000` | Network port for Uvicorn server binding. |
