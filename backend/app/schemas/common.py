"""Common domain enumerations, provenance tracking, and GeoJSON base schemas."""
from enum import Enum
from typing import Any, List, Optional, Literal
from pydantic import BaseModel, Field


class DataClassification(str, Enum):
    """Scientific data classification ensuring transparency of origin and modeling rigor."""
    OBSERVED = "OBSERVED"      # Direct sensor or satellite observation
    DERIVED = "DERIVED"        # Computed directly from observed values without predictive models
    ESTIMATED = "ESTIMATED"    # Empirical or statistical downscaled approximation
    SIMULATED = "SIMULATED"    # Counterfactual scenario forward projection
    ASSUMED = "ASSUMED"        # Configurable planning constant or policy assumption


class RiskLevel(str, Enum):
    """Categorical risk tiers for urban thermal stress."""
    LOW = "LOW"                # Score < 30
    MODERATE = "MODERATE"      # Score 30 - 49.9
    HIGH = "HIGH"              # Score 50 - 69.9
    SEVERE = "SEVERE"          # Score 70 - 84.9
    CRITICAL = "CRITICAL"      # Score >= 85


class Typology(str, Enum):
    """Urban morphology classifications."""
    COMMERCIAL_DENSE = "commercial_dense"
    INDUSTRIAL_HEAVY = "industrial_heavy"
    RESIDENTIAL_HIGHRISE = "residential_highrise"
    RESIDENTIAL_SUBURBAN = "residential_suburban"
    HISTORIC_DENSE = "historic_dense"
    INFORMAL_SETTLEMENT = "informal_settlement"
    TRANSIT_HUB = "transit_hub"
    PARK_RIPARIAN = "park_riparian"
    INSTITUTIONAL_CAMPUS = "institutional_campus"
    MIXED_USE = "mixed_use"


class ProvenanceRecord(BaseModel):
    """Data provenance record providing full auditability for values."""
    field_name: str
    classification: DataClassification
    source: str
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    notes: Optional[str] = None


class GeoJSONPolygon(BaseModel):
    """Standard GeoJSON Polygon coordinates structure (RFC 7946)."""
    type: Literal["Polygon"] = "Polygon"
    coordinates: List[List[List[float]]]  # Outer ring and optional holes: [[[lon, lat], ...]]


class GeoJSONFeature(BaseModel):
    """Generic GeoJSON Feature wrapper for MapLibre compatibility."""
    type: Literal["Feature"] = "Feature"
    id: Optional[str] = None
    geometry: GeoJSONPolygon
    properties: dict[str, Any] = Field(default_factory=dict)


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection wrapper."""
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: List[GeoJSONFeature]
