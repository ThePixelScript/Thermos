"""Core settings and system constants for THERMOS."""
import os
from pathlib import Path
from pydantic import BaseModel, Field

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
SAMPLE_DATA_FILE = DATA_DIR / "processed" / "sample_zones.json"


class Settings(BaseModel):
    app_name: str = "THERMOS Urban Climate Decision Intelligence"
    app_version: str = "0.1.0"
    app_env: str = os.getenv("APP_ENV", "development")
    api_prefix: str = "/api/v1"
    
    # Heat and Risk Configuration Defaults
    default_baseline_temp_c: float = 31.5
    hotspot_anomaly_threshold_c: float = 3.0  # Anomaly > +3°C classifies as heat candidate
    hotspot_risk_threshold: float = 50.0      # Score > 50 classifies as active hotspot
    
    # Weight factors for Composite Heat Risk Index (CHRI) - sum to 1.0
    weight_hazard: float = 0.45
    weight_exposure: float = 0.30
    weight_vulnerability: float = 0.25
    
    # Paths and Mode
    data_mode: str = os.getenv("DATA_MODE", "demo").lower()
    sample_data_path: Path = SAMPLE_DATA_FILE
    real_data_path: Path = DATA_DIR / "processed" / "real_zones.json"
    external_data_dir: Path = DATA_DIR / "external"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]


settings = Settings()
