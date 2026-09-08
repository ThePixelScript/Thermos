"""Core settings and system constants for THERMOS."""
import os
from pathlib import Path
from pydantic import BaseModel, Field

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
SAMPLE_DATA_FILE = DATA_DIR / "processed" / "sample_zones.json"

# Load .env file into environment if present (check backend/.env then root .env)
for env_candidate in [BACKEND_DIR / ".env", PROJECT_ROOT / ".env"]:
    if env_candidate.exists():
        try:
            with open(env_candidate, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip("'\""))
        except Exception:
            pass


class Settings(BaseModel):
    app_name: str = "THERMOS Urban Climate Decision Intelligence"
    app_version: str = "0.1.0"
    app_env: str = os.getenv("APP_ENV", "development")
    api_prefix: str = "/api/v1"
    
    # External APIs Configuration (support both WEATHER_API_KEY and WEATHERAPI_KEY)
    weatherapi_key: str = Field(
        default_factory=lambda: os.getenv("WEATHER_API_KEY", os.getenv("WEATHERAPI_KEY", ""))
    )
    nasa_firms_map_key: str = Field(default_factory=lambda: os.getenv("NASA_FIRMS_MAP_KEY", ""))


    
    # Heat and Risk Configuration Defaults
    default_baseline_temp_c: float = 31.5
    hotspot_anomaly_threshold_c: float = 3.0  # Anomaly > +3°C classifies as heat candidate
    hotspot_risk_threshold: float = 50.0      # Score > 50 classifies as active hotspot
    
    # Weight factors for Composite Heat Risk Index (CHRI) - sum to 1.0
    weight_hazard: float = 0.45
    weight_exposure: float = 0.30
    weight_vulnerability: float = 0.25
    
    # Paths
    sample_data_path: Path = SAMPLE_DATA_FILE
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]


settings = Settings()
