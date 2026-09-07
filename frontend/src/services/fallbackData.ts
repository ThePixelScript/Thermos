// Calibrated fallback demonstration data for resilient offline / demo mode
// Generated directly from THERMOS deterministic heat analytics core
import type { BackendHealth, GeoJSONFeatureCollection, HotspotSummary, HotspotDetail, Intervention } from '../types';

export const FALLBACK_HEALTH: BackendHealth = {
  "status": "healthy",
  "app_name": "THERMOS Urban Climate Decision Intelligence",
  "version": "0.1.0",
  "environment": "development",
  "zones_loaded": 10,
  "hotspots_count": 5,
  "engine_status": {
    "geospatial": "active",
    "heat_analytics": "active",
    "risk_scoring": "active_deterministic",
    "interventions": "catalog_ready",
    "simulation": "ready_phase_2",
    "optimization": "ready_phase_2",
    "ai_interface": "active_decoupled"
  }
};

export const FALLBACK_GEOJSON: GeoJSONFeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "ZONE-01",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.21,
              28.63
            ],
            [
              77.225,
              28.63
            ],
            [
              77.225,
              28.645
            ],
            [
              77.21,
              28.645
            ],
            [
              77.21,
              28.63
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-01",
        "name": "Downtown Financial District",
        "typology": "commercial_dense",
        "area_sqkm": 2.4,
        "land_surface_temp_c": 42.8,
        "thermal_anomaly_c": 11.3,
        "tree_canopy_fraction": 0.05,
        "impervious_surface_fraction": 0.88,
        "population_density": 24000.0,
        "total_population": 57600,
        "vulnerable_ratio": 0.14,
        "temperature": 42.8,
        "vegetation": 0.09,
        "imperviousness": 0.88,
        "building_density": 0.72,
        "population_exposure": 48.0,
        "risk_score": 63.3,
        "risk_level": "HIGH"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-02",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.23,
              28.62
            ],
            [
              77.245,
              28.62
            ],
            [
              77.245,
              28.64
            ],
            [
              77.23,
              28.64
            ],
            [
              77.23,
              28.62
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-02",
        "name": "Riverfront Park & Wetlands",
        "typology": "park_riparian",
        "area_sqkm": 3.1,
        "land_surface_temp_c": 28.4,
        "thermal_anomaly_c": -3.1,
        "tree_canopy_fraction": 0.52,
        "impervious_surface_fraction": 0.15,
        "population_density": 1200.0,
        "total_population": 3720,
        "vulnerable_ratio": 0.18,
        "temperature": 28.4,
        "vegetation": 0.74,
        "imperviousness": 0.15,
        "building_density": 0.02,
        "population_exposure": 2.4,
        "risk_score": 12.7,
        "risk_level": "LOW"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-03",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.185,
              28.65
            ],
            [
              77.205,
              28.65
            ],
            [
              77.205,
              28.67
            ],
            [
              77.185,
              28.67
            ],
            [
              77.185,
              28.65
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-03",
        "name": "Industrial Freight & Logistics Corridor",
        "typology": "industrial_heavy",
        "area_sqkm": 4.5,
        "land_surface_temp_c": 45.2,
        "thermal_anomaly_c": 13.7,
        "tree_canopy_fraction": 0.02,
        "impervious_surface_fraction": 0.94,
        "population_density": 6500.0,
        "total_population": 29250,
        "vulnerable_ratio": 0.11,
        "temperature": 45.2,
        "vegetation": 0.05,
        "imperviousness": 0.94,
        "building_density": 0.68,
        "population_exposure": 13.0,
        "risk_score": 67.1,
        "risk_level": "HIGH"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-04",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.22,
              28.65
            ],
            [
              77.235,
              28.65
            ],
            [
              77.235,
              28.665
            ],
            [
              77.22,
              28.665
            ],
            [
              77.22,
              28.65
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-04",
        "name": "Old City Market & Historic Quarter",
        "typology": "historic_dense",
        "area_sqkm": 1.8,
        "land_surface_temp_c": 39.6,
        "thermal_anomaly_c": 8.1,
        "tree_canopy_fraction": 0.06,
        "impervious_surface_fraction": 0.82,
        "population_density": 32000.0,
        "total_population": 57600,
        "vulnerable_ratio": 0.32,
        "temperature": 39.6,
        "vegetation": 0.08,
        "imperviousness": 0.82,
        "building_density": 0.78,
        "population_exposure": 64.0,
        "risk_score": 66.1,
        "risk_level": "HIGH"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-05",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.195,
              28.625
            ],
            [
              77.21,
              28.625
            ],
            [
              77.21,
              28.64
            ],
            [
              77.195,
              28.64
            ],
            [
              77.195,
              28.625
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-05",
        "name": "University Campus & Botanical Enclave",
        "typology": "institutional_campus",
        "area_sqkm": 2.1,
        "land_surface_temp_c": 30.1,
        "thermal_anomaly_c": -1.4,
        "tree_canopy_fraction": 0.48,
        "impervious_surface_fraction": 0.36,
        "population_density": 9500.0,
        "total_population": 19950,
        "vulnerable_ratio": 0.08,
        "temperature": 30.1,
        "vegetation": 0.62,
        "imperviousness": 0.36,
        "building_density": 0.25,
        "population_exposure": 19.0,
        "risk_score": 18.1,
        "risk_level": "LOW"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-06",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.215,
              28.605
            ],
            [
              77.235,
              28.605
            ],
            [
              77.235,
              28.62
            ],
            [
              77.215,
              28.62
            ],
            [
              77.215,
              28.605
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-06",
        "name": "High-Rise Residential Sector 9",
        "typology": "residential_highrise",
        "area_sqkm": 2.8,
        "land_surface_temp_c": 36.2,
        "thermal_anomaly_c": 4.7,
        "tree_canopy_fraction": 0.18,
        "impervious_surface_fraction": 0.68,
        "population_density": 28000.0,
        "total_population": 78400,
        "vulnerable_ratio": 0.24,
        "temperature": 36.2,
        "vegetation": 0.3,
        "imperviousness": 0.68,
        "building_density": 0.55,
        "population_exposure": 56.0,
        "risk_score": 46.3,
        "risk_level": "MODERATE"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-07",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.21,
              28.645
            ],
            [
              77.225,
              28.645
            ],
            [
              77.225,
              28.66
            ],
            [
              77.21,
              28.66
            ],
            [
              77.21,
              28.645
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-07",
        "name": "Central Railway Terminal & Transit Hub",
        "typology": "transit_hub",
        "area_sqkm": 1.6,
        "land_surface_temp_c": 43.5,
        "thermal_anomaly_c": 12.0,
        "tree_canopy_fraction": 0.03,
        "impervious_surface_fraction": 0.91,
        "population_density": 21000.0,
        "total_population": 33600,
        "vulnerable_ratio": 0.21,
        "temperature": 43.5,
        "vegetation": 0.05,
        "imperviousness": 0.91,
        "building_density": 0.65,
        "population_exposure": 42.0,
        "risk_score": 72.6,
        "risk_level": "SEVERE"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-08",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.175,
              28.62
            ],
            [
              77.195,
              28.62
            ],
            [
              77.195,
              28.64
            ],
            [
              77.175,
              28.64
            ],
            [
              77.175,
              28.62
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-08",
        "name": "Greenbelt Suburban Residential",
        "typology": "residential_suburban",
        "area_sqkm": 3.6,
        "land_surface_temp_c": 32.8,
        "thermal_anomaly_c": 1.3,
        "tree_canopy_fraction": 0.35,
        "impervious_surface_fraction": 0.44,
        "population_density": 7800.0,
        "total_population": 28080,
        "vulnerable_ratio": 0.22,
        "temperature": 32.8,
        "vegetation": 0.53,
        "imperviousness": 0.44,
        "building_density": 0.32,
        "population_exposure": 15.6,
        "risk_score": 24.4,
        "risk_level": "LOW"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-09",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.19,
              28.6
            ],
            [
              77.21,
              28.6
            ],
            [
              77.21,
              28.618
            ],
            [
              77.19,
              28.618
            ],
            [
              77.19,
              28.6
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-09",
        "name": "Biotech & Medical District",
        "typology": "mixed_use",
        "area_sqkm": 2.2,
        "land_surface_temp_c": 35.8,
        "thermal_anomaly_c": 4.3,
        "tree_canopy_fraction": 0.21,
        "impervious_surface_fraction": 0.62,
        "population_density": 14500.0,
        "total_population": 31900,
        "vulnerable_ratio": 0.35,
        "temperature": 35.8,
        "vegetation": 0.35,
        "imperviousness": 0.62,
        "building_density": 0.48,
        "population_exposure": 29.0,
        "risk_score": 41.3,
        "risk_level": "MODERATE"
      }
    },
    {
      "type": "Feature",
      "id": "ZONE-10",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.225,
              28.665
            ],
            [
              77.24,
              28.665
            ],
            [
              77.24,
              28.68
            ],
            [
              77.225,
              28.68
            ],
            [
              77.225,
              28.665
            ]
          ]
        ]
      },
      "properties": {
        "id": "ZONE-10",
        "name": "Ashray Nagar High-Density Settlement",
        "typology": "informal_settlement",
        "area_sqkm": 1.4,
        "land_surface_temp_c": 44.6,
        "thermal_anomaly_c": 13.1,
        "tree_canopy_fraction": 0.02,
        "impervious_surface_fraction": 0.89,
        "population_density": 42000.0,
        "total_population": 58800,
        "vulnerable_ratio": 0.38,
        "temperature": 44.6,
        "vegetation": 0.03,
        "imperviousness": 0.89,
        "building_density": 0.82,
        "population_exposure": 84.0,
        "risk_score": 87.2,
        "risk_level": "CRITICAL"
      }
    }
  ]
};

export const FALLBACK_HOTSPOTS: HotspotSummary[] = [
  {
    "rank": 1,
    "zone_id": "ZONE-10",
    "zone_name": "Ashray Nagar High-Density Settlement",
    "typology": "informal_settlement",
    "temperature": 44.6,
    "vegetation": 0.03,
    "imperviousness": 0.89,
    "building_density": 0.82,
    "population_exposure": 84.0,
    "risk_score": 87.2,
    "risk_level": "CRITICAL",
    "land_surface_temp_c": 44.6,
    "thermal_anomaly_c": 13.1,
    "dominant_driver": "Thermal Heat Anomaly",
    "dominant_driver_pct": 24.8,
    "total_population": 58800,
    "vulnerable_population": 22344,
    "area_sqkm": 1.4,
    "center_coords": [
      77.2325,
      28.6725
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "CRITICAL_HOTSPOT"
  },
  {
    "rank": 2,
    "zone_id": "ZONE-07",
    "zone_name": "Central Railway Terminal & Transit Hub",
    "typology": "transit_hub",
    "temperature": 43.5,
    "vegetation": 0.05,
    "imperviousness": 0.91,
    "building_density": 0.65,
    "population_exposure": 42.0,
    "risk_score": 72.6,
    "risk_level": "SEVERE",
    "land_surface_temp_c": 43.5,
    "thermal_anomaly_c": 12.0,
    "dominant_driver": "Thermal Heat Anomaly",
    "dominant_driver_pct": 28.2,
    "total_population": 33600,
    "vulnerable_population": 7056,
    "area_sqkm": 1.6,
    "center_coords": [
      77.2175,
      28.6525
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "CRITICAL_HOTSPOT"
  },
  {
    "rank": 3,
    "zone_id": "ZONE-03",
    "zone_name": "Industrial Freight & Logistics Corridor",
    "typology": "industrial_heavy",
    "temperature": 45.2,
    "vegetation": 0.05,
    "imperviousness": 0.94,
    "building_density": 0.68,
    "population_exposure": 13.0,
    "risk_score": 67.1,
    "risk_level": "HIGH",
    "land_surface_temp_c": 45.2,
    "thermal_anomaly_c": 13.7,
    "dominant_driver": "Thermal Heat Anomaly",
    "dominant_driver_pct": 35.4,
    "total_population": 29250,
    "vulnerable_population": 3217,
    "area_sqkm": 4.5,
    "center_coords": [
      77.195,
      28.66
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "CRITICAL_HOTSPOT"
  },
  {
    "rank": 4,
    "zone_id": "ZONE-04",
    "zone_name": "Old City Market & Historic Quarter",
    "typology": "historic_dense",
    "temperature": 39.6,
    "vegetation": 0.08,
    "imperviousness": 0.82,
    "building_density": 0.78,
    "population_exposure": 64.0,
    "risk_score": 66.1,
    "risk_level": "HIGH",
    "land_surface_temp_c": 39.6,
    "thermal_anomaly_c": 8.1,
    "dominant_driver": "Thermal Heat Anomaly",
    "dominant_driver_pct": 20.7,
    "total_population": 57600,
    "vulnerable_population": 18432,
    "area_sqkm": 1.8,
    "center_coords": [
      77.2275,
      28.6575
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "SEVERE_HOTSPOT"
  },
  {
    "rank": 5,
    "zone_id": "ZONE-01",
    "zone_name": "Downtown Financial District",
    "typology": "commercial_dense",
    "temperature": 42.8,
    "vegetation": 0.09,
    "imperviousness": 0.88,
    "building_density": 0.72,
    "population_exposure": 48.0,
    "risk_score": 63.3,
    "risk_level": "HIGH",
    "land_surface_temp_c": 42.8,
    "thermal_anomaly_c": 11.3,
    "dominant_driver": "Thermal Heat Anomaly",
    "dominant_driver_pct": 30.9,
    "total_population": 57600,
    "vulnerable_population": 8064,
    "area_sqkm": 2.4,
    "center_coords": [
      77.2175,
      28.6375
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "SEVERE_HOTSPOT"
  },
  {
    "rank": 6,
    "zone_id": "ZONE-06",
    "zone_name": "High-Rise Residential Sector 9",
    "typology": "residential_highrise",
    "temperature": 36.2,
    "vegetation": 0.3,
    "imperviousness": 0.68,
    "building_density": 0.55,
    "population_exposure": 56.0,
    "risk_score": 46.3,
    "risk_level": "MODERATE",
    "land_surface_temp_c": 36.2,
    "thermal_anomaly_c": 4.7,
    "dominant_driver": "Residential Population Exposure",
    "dominant_driver_pct": 25.4,
    "total_population": 78400,
    "vulnerable_population": 18816,
    "area_sqkm": 2.8,
    "center_coords": [
      77.225,
      28.6125
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "HIGH_HOTSPOT"
  },
  {
    "rank": 7,
    "zone_id": "ZONE-09",
    "zone_name": "Biotech & Medical District",
    "typology": "mixed_use",
    "temperature": 35.8,
    "vegetation": 0.35,
    "imperviousness": 0.62,
    "building_density": 0.48,
    "population_exposure": 29.0,
    "risk_score": 41.3,
    "risk_level": "MODERATE",
    "land_surface_temp_c": 35.8,
    "thermal_anomaly_c": 4.3,
    "dominant_driver": "Impervious Built Surface",
    "dominant_driver_pct": 23.9,
    "total_population": 31900,
    "vulnerable_population": 11165,
    "area_sqkm": 2.2,
    "center_coords": [
      77.2,
      28.609
    ],
    "confidence": 0.98,
    "is_hotspot": true,
    "hotspot_tier": "HIGH_HOTSPOT"
  }
];

export const FALLBACK_HOTSPOT_DETAILS: Record<string, HotspotDetail> = {
  "ZONE-10": {
    "summary": {
      "rank": 1,
      "zone_id": "ZONE-10",
      "zone_name": "Ashray Nagar High-Density Settlement",
      "typology": "informal_settlement",
      "temperature": 44.6,
      "vegetation": 0.03,
      "imperviousness": 0.89,
      "building_density": 0.82,
      "population_exposure": 84.0,
      "risk_score": 87.2,
      "risk_level": "CRITICAL",
      "land_surface_temp_c": 44.6,
      "thermal_anomaly_c": 13.1,
      "dominant_driver": "Thermal Heat Anomaly",
      "dominant_driver_pct": 24.8,
      "total_population": 58800,
      "vulnerable_population": 22344,
      "area_sqkm": 1.4,
      "center_coords": [
        77.2325,
        28.6725
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "CRITICAL_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-10",
      "name": "Ashray Nagar High-Density Settlement",
      "typology": "informal_settlement",
      "area_sqkm": 1.4,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.225,
              28.665
            ],
            [
              77.24,
              28.665
            ],
            [
              77.24,
              28.68
            ],
            [
              77.225,
              28.68
            ],
            [
              77.225,
              28.665
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.89,
        "tree_canopy_fraction": 0.02,
        "vegetation_grass_fraction": 0.01,
        "water_fraction": 0.0,
        "average_albedo": 0.13,
        "building_density": 0.82
      },
      "thermal_observation": {
        "land_surface_temp_c": 44.6,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 13.1,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 42000.0,
        "total_population": 58800,
        "vulnerable_ratio": 0.38,
        "outdoor_worker_density_per_sqkm": 8600.0,
        "low_ac_coverage_ratio": 0.92
      },
      "provenance": [],
      "temperature": 44.6,
      "vegetation": 0.03,
      "imperviousness": 0.89,
      "building_density": 0.82,
      "population_exposure": 84.0,
      "risk_score": 87.2,
      "risk_level": "CRITICAL"
    },
    "risk_assessment": {
      "zone_id": "ZONE-10",
      "zone_name": "Ashray Nagar High-Density Settlement",
      "risk_score": {
        "score": 87.2,
        "risk_level": "CRITICAL",
        "subscores": {
          "hazard_score": 88.4,
          "exposure_score": 84.8,
          "vulnerability_score": 88.0
        },
        "component_scores": {
          "hazard": 88.4,
          "exposure": 84.8,
          "vulnerability": 88.0,
          "thermal_hazard": 87.3,
          "impervious_hazard": 89.0,
          "albedo_deficit": 90.0,
          "population_exposure": 84.0,
          "worker_exposure": 86.0,
          "canopy_deficit": 96.0,
          "demographic_vulnerability": 76.0,
          "cooling_deficit": 92.0
        },
        "driver_contributions": [
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 24.8,
            "raw_value": 13.1,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +13.1\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 19.1,
            "raw_value": 42000.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 42,000 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 15.2,
            "raw_value": 89.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "89% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 13.0,
            "raw_value": 8600.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 8,600 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 12.1,
            "raw_value": 98.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 2.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 8.4,
            "raw_value": 38.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "38.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 7.3,
            "raw_value": 92.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "92% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 13.1,
            "unit": "\u00b0C",
            "contribution_pct": 24.8,
            "evidence_statement": "Thermal anomaly of +13.1\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 42000.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 19.1,
            "evidence_statement": "High resident exposure density of 42,000 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 89.0,
            "unit": "%",
            "contribution_pct": 15.2,
            "evidence_statement": "Ground sealing ratio of 89.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 8600.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 13.0,
            "evidence_statement": "High occupational outdoor exposure with 8,600 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 98.0,
            "unit": "%",
            "contribution_pct": 12.1,
            "evidence_statement": "Canopy coverage is 2.0%, leaving an urban vegetative deficit of 98.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 38.0,
            "unit": "%",
            "contribution_pct": 8.4,
            "evidence_statement": "38.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 92.0,
            "unit": "%",
            "contribution_pct": 7.3,
            "evidence_statement": "92.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.411275+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-COOL-ROOF",
        "intervention_name": "High-Reflectance Cool Roof Coating",
        "category": "material_engineering",
        "recommended_area_sqm": 124600.0,
        "estimated_total_cost_usd": 2242800.0,
        "expected_local_lst_reduction_c": 5.34,
        "expected_ambient_reduction_c": 0.43,
        "suitability_score": 99.0,
        "rationale": "Low surface albedo (0.13) and high roof density make reflective white coatings the highest cooling ROI measure. Low air-conditioning penetration means passive indoor cooling will save lives.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 112000.0,
        "estimated_total_cost_usd": 5040000.0,
        "expected_local_lst_reduction_c": 2.2,
        "expected_ambient_reduction_c": 0.58,
        "suitability_score": 98.0,
        "rationale": "Existing tree canopy is only 2.0%. Street tree planting provides crucial shade to ground pedestrian corridors. High pedestrian foot-traffic benefits directly from canopy shade.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TRANSIT-SHADE",
        "intervention_name": "Solar-Reflective Tensile Transit Shading & Misting",
        "category": "emergency_cooling",
        "recommended_area_sqm": 5000.0,
        "estimated_total_cost_usd": 550000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 80.0,
        "rationale": "Extreme outdoor exposure (8,600.0 laborers/transit users) demands rapid solar canopy shading and misting stations.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-POCKET-PARK",
        "intervention_name": "Urban Micro-Pocket Park & Bioswale",
        "category": "urban_design",
        "recommended_area_sqm": 15000.0,
        "estimated_total_cost_usd": 1275000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 65.0,
        "rationale": "Dense neighborhood requires accessible green thermal refuges within 5-minute walking radii.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-PERM-PAVEMENT",
        "intervention_name": "Permeable Cool Pavement & Interlocking Pavers",
        "category": "material_engineering",
        "recommended_area_sqm": 56000.0,
        "estimated_total_cost_usd": 3640000.0,
        "expected_local_lst_reduction_c": 1.2,
        "expected_ambient_reduction_c": 0.14,
        "suitability_score": 45.0,
        "rationale": "High ground sealing traps sensible heat overnight; permeable pavers restore evaporative cooling.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "Ashray Nagar High-Density Settlement is currently designated at CRITICAL thermal risk with a Composite Heat Risk Index of 87.2/100. The primary heat-stress driver is Thermal Heat Anomaly, accounting for 24.8% of the cumulative score. Compounding this risk is Residential Population Exposure (19.1% contribution), with Dense residential population of 42,000 residents per km\u00b2. Observed Land Surface Temperature is 44.6\u00b0C (+13.1\u00b0C vs regional baseline), affecting approximately 58,800 residents and 8,600.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-07": {
    "summary": {
      "rank": 2,
      "zone_id": "ZONE-07",
      "zone_name": "Central Railway Terminal & Transit Hub",
      "typology": "transit_hub",
      "temperature": 43.5,
      "vegetation": 0.05,
      "imperviousness": 0.91,
      "building_density": 0.65,
      "population_exposure": 42.0,
      "risk_score": 72.6,
      "risk_level": "SEVERE",
      "land_surface_temp_c": 43.5,
      "thermal_anomaly_c": 12.0,
      "dominant_driver": "Thermal Heat Anomaly",
      "dominant_driver_pct": 28.2,
      "total_population": 33600,
      "vulnerable_population": 7056,
      "area_sqkm": 1.6,
      "center_coords": [
        77.2175,
        28.6525
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "CRITICAL_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-07",
      "name": "Central Railway Terminal & Transit Hub",
      "typology": "transit_hub",
      "area_sqkm": 1.6,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.21,
              28.645
            ],
            [
              77.225,
              28.645
            ],
            [
              77.225,
              28.66
            ],
            [
              77.21,
              28.66
            ],
            [
              77.21,
              28.645
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.91,
        "tree_canopy_fraction": 0.03,
        "vegetation_grass_fraction": 0.02,
        "water_fraction": 0.0,
        "average_albedo": 0.11,
        "building_density": 0.65
      },
      "thermal_observation": {
        "land_surface_temp_c": 43.5,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 12.0,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 21000.0,
        "total_population": 33600,
        "vulnerable_ratio": 0.21,
        "outdoor_worker_density_per_sqkm": 7200.0,
        "low_ac_coverage_ratio": 0.7
      },
      "provenance": [],
      "temperature": 43.5,
      "vegetation": 0.05,
      "imperviousness": 0.91,
      "building_density": 0.65,
      "population_exposure": 42.0,
      "risk_score": 72.6,
      "risk_level": "SEVERE"
    },
    "risk_assessment": {
      "zone_id": "ZONE-07",
      "zone_name": "Central Railway Terminal & Transit Hub",
      "risk_score": {
        "score": 72.6,
        "risk_level": "SEVERE",
        "subscores": {
          "hazard_score": 86.6,
          "exposure_score": 54.0,
          "vulnerability_score": 69.8
        },
        "component_scores": {
          "hazard": 86.6,
          "exposure": 54.0,
          "vulnerability": 69.8,
          "thermal_hazard": 80.0,
          "impervious_hazard": 91.0,
          "albedo_deficit": 96.7,
          "population_exposure": 42.0,
          "worker_exposure": 72.0,
          "canopy_deficit": 94.0,
          "demographic_vulnerability": 42.0,
          "cooling_deficit": 70.0
        },
        "driver_contributions": [
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 28.2,
            "raw_value": 12.0,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +12.0\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 19.2,
            "raw_value": 91.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "91% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 14.7,
            "raw_value": 97.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 3.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 13.5,
            "raw_value": 7200.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 7,200 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 11.8,
            "raw_value": 21000.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 21,000 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 6.8,
            "raw_value": 70.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "70% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 5.7,
            "raw_value": 21.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "21.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 12.0,
            "unit": "\u00b0C",
            "contribution_pct": 28.2,
            "evidence_statement": "Thermal anomaly of +12.0\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 91.0,
            "unit": "%",
            "contribution_pct": 19.2,
            "evidence_statement": "Ground sealing ratio of 91.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 97.0,
            "unit": "%",
            "contribution_pct": 14.7,
            "evidence_statement": "Canopy coverage is 3.0%, leaving an urban vegetative deficit of 97.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 7200.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 13.5,
            "evidence_statement": "High occupational outdoor exposure with 7,200 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 21000.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 11.8,
            "evidence_statement": "High resident exposure density of 21,000 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 70.0,
            "unit": "%",
            "contribution_pct": 6.8,
            "evidence_statement": "70.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 21.0,
            "unit": "%",
            "contribution_pct": 5.7,
            "evidence_statement": "21.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.416284+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-COOL-ROOF",
        "intervention_name": "High-Reflectance Cool Roof Coating",
        "category": "material_engineering",
        "recommended_area_sqm": 145600.0,
        "estimated_total_cost_usd": 2620800.0,
        "expected_local_lst_reduction_c": 5.46,
        "expected_ambient_reduction_c": 0.44,
        "suitability_score": 100.0,
        "rationale": "Low surface albedo (0.11) and high roof density make reflective white coatings the highest cooling ROI measure. Low air-conditioning penetration means passive indoor cooling will save lives.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 128000.0,
        "estimated_total_cost_usd": 5760000.0,
        "expected_local_lst_reduction_c": 2.2,
        "expected_ambient_reduction_c": 0.58,
        "suitability_score": 97.0,
        "rationale": "Existing tree canopy is only 3.0%. Street tree planting provides crucial shade to ground pedestrian corridors. High pedestrian foot-traffic benefits directly from canopy shade.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TRANSIT-SHADE",
        "intervention_name": "Solar-Reflective Tensile Transit Shading & Misting",
        "category": "emergency_cooling",
        "recommended_area_sqm": 5000.0,
        "estimated_total_cost_usd": 550000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 80.0,
        "rationale": "Extreme outdoor exposure (7,200.0 laborers/transit users) demands rapid solar canopy shading and misting stations.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-POCKET-PARK",
        "intervention_name": "Urban Micro-Pocket Park & Bioswale",
        "category": "urban_design",
        "recommended_area_sqm": 15000.0,
        "estimated_total_cost_usd": 1275000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 65.0,
        "rationale": "Dense neighborhood requires accessible green thermal refuges within 5-minute walking radii.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-PERM-PAVEMENT",
        "intervention_name": "Permeable Cool Pavement & Interlocking Pavers",
        "category": "material_engineering",
        "recommended_area_sqm": 64000.0,
        "estimated_total_cost_usd": 4160000.0,
        "expected_local_lst_reduction_c": 1.2,
        "expected_ambient_reduction_c": 0.14,
        "suitability_score": 45.0,
        "rationale": "High ground sealing traps sensible heat overnight; permeable pavers restore evaporative cooling.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "Central Railway Terminal & Transit Hub is currently designated at SEVERE thermal risk with a Composite Heat Risk Index of 72.6/100. The primary heat-stress driver is Thermal Heat Anomaly, accounting for 28.2% of the cumulative score. Compounding this risk is Impervious Built Surface (19.2% contribution), with 91% of the ground surface is sealed with heat-absorbing concrete/asphalt. Observed Land Surface Temperature is 43.5\u00b0C (+12.0\u00b0C vs regional baseline), affecting approximately 33,600 residents and 7,200.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-03": {
    "summary": {
      "rank": 3,
      "zone_id": "ZONE-03",
      "zone_name": "Industrial Freight & Logistics Corridor",
      "typology": "industrial_heavy",
      "temperature": 45.2,
      "vegetation": 0.05,
      "imperviousness": 0.94,
      "building_density": 0.68,
      "population_exposure": 13.0,
      "risk_score": 67.1,
      "risk_level": "HIGH",
      "land_surface_temp_c": 45.2,
      "thermal_anomaly_c": 13.7,
      "dominant_driver": "Thermal Heat Anomaly",
      "dominant_driver_pct": 35.4,
      "total_population": 29250,
      "vulnerable_population": 3217,
      "area_sqkm": 4.5,
      "center_coords": [
        77.195,
        28.66
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "CRITICAL_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-03",
      "name": "Industrial Freight & Logistics Corridor",
      "typology": "industrial_heavy",
      "area_sqkm": 4.5,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.185,
              28.65
            ],
            [
              77.205,
              28.65
            ],
            [
              77.205,
              28.67
            ],
            [
              77.185,
              28.67
            ],
            [
              77.185,
              28.65
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.94,
        "tree_canopy_fraction": 0.02,
        "vegetation_grass_fraction": 0.03,
        "water_fraction": 0.0,
        "average_albedo": 0.1,
        "building_density": 0.68
      },
      "thermal_observation": {
        "land_surface_temp_c": 45.2,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 13.7,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 6500.0,
        "total_population": 29250,
        "vulnerable_ratio": 0.11,
        "outdoor_worker_density_per_sqkm": 5800.0,
        "low_ac_coverage_ratio": 0.65
      },
      "provenance": [],
      "temperature": 45.2,
      "vegetation": 0.05,
      "imperviousness": 0.94,
      "building_density": 0.68,
      "population_exposure": 13.0,
      "risk_score": 67.1,
      "risk_level": "HIGH"
    },
    "risk_assessment": {
      "zone_id": "ZONE-03",
      "zone_name": "Industrial Freight & Logistics Corridor",
      "risk_score": {
        "score": 67.1,
        "risk_level": "HIGH",
        "subscores": {
          "hazard_score": 93.9,
          "exposure_score": 31.0,
          "vulnerability_score": 62.4
        },
        "component_scores": {
          "hazard": 93.9,
          "exposure": 31.0,
          "vulnerability": 62.4,
          "thermal_hazard": 91.3,
          "impervious_hazard": 94.0,
          "albedo_deficit": 100.0,
          "population_exposure": 13.0,
          "worker_exposure": 58.0,
          "canopy_deficit": 96.0,
          "demographic_vulnerability": 22.0,
          "cooling_deficit": 65.0
        },
        "driver_contributions": [
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 35.4,
            "raw_value": 13.7,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +13.7\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 21.8,
            "raw_value": 94.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "94% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 16.5,
            "raw_value": 98.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 2.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 12.0,
            "raw_value": 5800.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 5,800 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 7.0,
            "raw_value": 65.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "65% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 4.0,
            "raw_value": 6500.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 6,500 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 3.3,
            "raw_value": 11.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "11.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 13.7,
            "unit": "\u00b0C",
            "contribution_pct": 35.4,
            "evidence_statement": "Thermal anomaly of +13.7\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 94.0,
            "unit": "%",
            "contribution_pct": 21.8,
            "evidence_statement": "Ground sealing ratio of 94.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 98.0,
            "unit": "%",
            "contribution_pct": 16.5,
            "evidence_statement": "Canopy coverage is 2.0%, leaving an urban vegetative deficit of 98.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 5800.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 12.0,
            "evidence_statement": "High occupational outdoor exposure with 5,800 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 65.0,
            "unit": "%",
            "contribution_pct": 7.0,
            "evidence_statement": "65.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 6500.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 4.0,
            "evidence_statement": "High resident exposure density of 6,500 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 11.0,
            "unit": "%",
            "contribution_pct": 3.3,
            "evidence_statement": "11.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.421039+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-COOL-ROOF",
        "intervention_name": "High-Reflectance Cool Roof Coating",
        "category": "material_engineering",
        "recommended_area_sqm": 423000.0,
        "estimated_total_cost_usd": 7614000.0,
        "expected_local_lst_reduction_c": 5.64,
        "expected_ambient_reduction_c": 0.45,
        "suitability_score": 100.0,
        "rationale": "Low surface albedo (0.10) and high roof density make reflective white coatings the highest cooling ROI measure. Low air-conditioning penetration means passive indoor cooling will save lives.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TRANSIT-SHADE",
        "intervention_name": "Solar-Reflective Tensile Transit Shading & Misting",
        "category": "emergency_cooling",
        "recommended_area_sqm": 5000.0,
        "estimated_total_cost_usd": 550000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 80.0,
        "rationale": "Extreme outdoor exposure (5,800.0 laborers/transit users) demands rapid solar canopy shading and misting stations.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 360000.0,
        "estimated_total_cost_usd": 16200000.0,
        "expected_local_lst_reduction_c": 2.2,
        "expected_ambient_reduction_c": 0.58,
        "suitability_score": 78.0,
        "rationale": "Existing tree canopy is only 2.0%. Street tree planting provides crucial shade to ground pedestrian corridors.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-PERM-PAVEMENT",
        "intervention_name": "Permeable Cool Pavement & Interlocking Pavers",
        "category": "material_engineering",
        "recommended_area_sqm": 180000.0,
        "estimated_total_cost_usd": 11700000.0,
        "expected_local_lst_reduction_c": 1.2,
        "expected_ambient_reduction_c": 0.14,
        "suitability_score": 45.0,
        "rationale": "High ground sealing traps sensible heat overnight; permeable pavers restore evaporative cooling.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "Industrial Freight & Logistics Corridor is currently designated at HIGH thermal risk with a Composite Heat Risk Index of 67.1/100. The primary heat-stress driver is Thermal Heat Anomaly, accounting for 35.4% of the cumulative score. Compounding this risk is Impervious Built Surface (21.8% contribution), with 94% of the ground surface is sealed with heat-absorbing concrete/asphalt. Observed Land Surface Temperature is 45.2\u00b0C (+13.7\u00b0C vs regional baseline), affecting approximately 29,250 residents and 5,800.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-04": {
    "summary": {
      "rank": 4,
      "zone_id": "ZONE-04",
      "zone_name": "Old City Market & Historic Quarter",
      "typology": "historic_dense",
      "temperature": 39.6,
      "vegetation": 0.08,
      "imperviousness": 0.82,
      "building_density": 0.78,
      "population_exposure": 64.0,
      "risk_score": 66.1,
      "risk_level": "HIGH",
      "land_surface_temp_c": 39.6,
      "thermal_anomaly_c": 8.1,
      "dominant_driver": "Thermal Heat Anomaly",
      "dominant_driver_pct": 20.7,
      "total_population": 57600,
      "vulnerable_population": 18432,
      "area_sqkm": 1.8,
      "center_coords": [
        77.2275,
        28.6575
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "SEVERE_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-04",
      "name": "Old City Market & Historic Quarter",
      "typology": "historic_dense",
      "area_sqkm": 1.8,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.22,
              28.65
            ],
            [
              77.235,
              28.65
            ],
            [
              77.235,
              28.665
            ],
            [
              77.22,
              28.665
            ],
            [
              77.22,
              28.65
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.82,
        "tree_canopy_fraction": 0.06,
        "vegetation_grass_fraction": 0.02,
        "water_fraction": 0.0,
        "average_albedo": 0.15,
        "building_density": 0.78
      },
      "thermal_observation": {
        "land_surface_temp_c": 39.6,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 8.1,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 32000.0,
        "total_population": 57600,
        "vulnerable_ratio": 0.32,
        "outdoor_worker_density_per_sqkm": 4900.0,
        "low_ac_coverage_ratio": 0.58
      },
      "provenance": [],
      "temperature": 39.6,
      "vegetation": 0.08,
      "imperviousness": 0.82,
      "building_density": 0.78,
      "population_exposure": 64.0,
      "risk_score": 66.1,
      "risk_level": "HIGH"
    },
    "risk_assessment": {
      "zone_id": "ZONE-04",
      "zone_name": "Old City Market & Historic Quarter",
      "risk_score": {
        "score": 66.1,
        "risk_level": "HIGH",
        "subscores": {
          "hazard_score": 68.3,
          "exposure_score": 58.0,
          "vulnerability_score": 72.1
        },
        "component_scores": {
          "hazard": 68.3,
          "exposure": 58.0,
          "vulnerability": 72.1,
          "thermal_hazard": 54.0,
          "impervious_hazard": 82.0,
          "albedo_deficit": 83.3,
          "population_exposure": 64.0,
          "worker_exposure": 49.0,
          "canopy_deficit": 88.0,
          "demographic_vulnerability": 64.0,
          "cooling_deficit": 58.0
        },
        "driver_contributions": [
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 20.7,
            "raw_value": 8.1,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +8.1\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 19.6,
            "raw_value": 32000.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 32,000 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 18.9,
            "raw_value": 82.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "82% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 15.0,
            "raw_value": 94.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 6.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 10.0,
            "raw_value": 4900.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 4,900 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 9.5,
            "raw_value": 32.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "32.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 6.2,
            "raw_value": 58.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "58% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 8.1,
            "unit": "\u00b0C",
            "contribution_pct": 20.7,
            "evidence_statement": "Thermal anomaly of +8.1\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 32000.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 19.6,
            "evidence_statement": "High resident exposure density of 32,000 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 82.0,
            "unit": "%",
            "contribution_pct": 18.9,
            "evidence_statement": "Ground sealing ratio of 82.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 94.0,
            "unit": "%",
            "contribution_pct": 15.0,
            "evidence_statement": "Canopy coverage is 6.0%, leaving an urban vegetative deficit of 94.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 4900.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 10.0,
            "evidence_statement": "High occupational outdoor exposure with 4,900 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 32.0,
            "unit": "%",
            "contribution_pct": 9.5,
            "evidence_statement": "32.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 58.0,
            "unit": "%",
            "contribution_pct": 6.2,
            "evidence_statement": "58.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.425852+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-COOL-ROOF",
        "intervention_name": "High-Reflectance Cool Roof Coating",
        "category": "material_engineering",
        "recommended_area_sqm": 147600.0,
        "estimated_total_cost_usd": 2656800.0,
        "expected_local_lst_reduction_c": 4.92,
        "expected_ambient_reduction_c": 0.39,
        "suitability_score": 95.0,
        "rationale": "Low surface albedo (0.15) and high roof density make reflective white coatings the highest cooling ROI measure. Low air-conditioning penetration means passive indoor cooling will save lives.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 144000.0,
        "estimated_total_cost_usd": 6480000.0,
        "expected_local_lst_reduction_c": 2.2,
        "expected_ambient_reduction_c": 0.58,
        "suitability_score": 94.0,
        "rationale": "Existing tree canopy is only 6.0%. Street tree planting provides crucial shade to ground pedestrian corridors. High pedestrian foot-traffic benefits directly from canopy shade.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TRANSIT-SHADE",
        "intervention_name": "Solar-Reflective Tensile Transit Shading & Misting",
        "category": "emergency_cooling",
        "recommended_area_sqm": 5000.0,
        "estimated_total_cost_usd": 550000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 80.0,
        "rationale": "Extreme outdoor exposure (4,900.0 laborers/transit users) demands rapid solar canopy shading and misting stations.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-POCKET-PARK",
        "intervention_name": "Urban Micro-Pocket Park & Bioswale",
        "category": "urban_design",
        "recommended_area_sqm": 15000.0,
        "estimated_total_cost_usd": 1275000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 65.0,
        "rationale": "Dense neighborhood requires accessible green thermal refuges within 5-minute walking radii.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-PERM-PAVEMENT",
        "intervention_name": "Permeable Cool Pavement & Interlocking Pavers",
        "category": "material_engineering",
        "recommended_area_sqm": 72000.0,
        "estimated_total_cost_usd": 4680000.0,
        "expected_local_lst_reduction_c": 1.2,
        "expected_ambient_reduction_c": 0.14,
        "suitability_score": 45.0,
        "rationale": "High ground sealing traps sensible heat overnight; permeable pavers restore evaporative cooling.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "Old City Market & Historic Quarter is currently designated at HIGH thermal risk with a Composite Heat Risk Index of 66.1/100. The primary heat-stress driver is Thermal Heat Anomaly, accounting for 20.7% of the cumulative score. Compounding this risk is Residential Population Exposure (19.6% contribution), with Dense residential population of 32,000 residents per km\u00b2. Observed Land Surface Temperature is 39.6\u00b0C (+8.1\u00b0C vs regional baseline), affecting approximately 57,600 residents and 4,900.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-01": {
    "summary": {
      "rank": 5,
      "zone_id": "ZONE-01",
      "zone_name": "Downtown Financial District",
      "typology": "commercial_dense",
      "temperature": 42.8,
      "vegetation": 0.09,
      "imperviousness": 0.88,
      "building_density": 0.72,
      "population_exposure": 48.0,
      "risk_score": 63.3,
      "risk_level": "HIGH",
      "land_surface_temp_c": 42.8,
      "thermal_anomaly_c": 11.3,
      "dominant_driver": "Thermal Heat Anomaly",
      "dominant_driver_pct": 30.9,
      "total_population": 57600,
      "vulnerable_population": 8064,
      "area_sqkm": 2.4,
      "center_coords": [
        77.2175,
        28.6375
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "SEVERE_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-01",
      "name": "Downtown Financial District",
      "typology": "commercial_dense",
      "area_sqkm": 2.4,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.21,
              28.63
            ],
            [
              77.225,
              28.63
            ],
            [
              77.225,
              28.645
            ],
            [
              77.21,
              28.645
            ],
            [
              77.21,
              28.63
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.88,
        "tree_canopy_fraction": 0.05,
        "vegetation_grass_fraction": 0.04,
        "water_fraction": 0.0,
        "average_albedo": 0.12,
        "building_density": 0.72
      },
      "thermal_observation": {
        "land_surface_temp_c": 42.8,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 11.3,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 24000.0,
        "total_population": 57600,
        "vulnerable_ratio": 0.14,
        "outdoor_worker_density_per_sqkm": 4200.0,
        "low_ac_coverage_ratio": 0.15
      },
      "provenance": [],
      "temperature": 42.8,
      "vegetation": 0.09,
      "imperviousness": 0.88,
      "building_density": 0.72,
      "population_exposure": 48.0,
      "risk_score": 63.3,
      "risk_level": "HIGH"
    },
    "risk_assessment": {
      "zone_id": "ZONE-01",
      "zone_name": "Downtown Financial District",
      "risk_score": {
        "score": 63.3,
        "risk_level": "HIGH",
        "subscores": {
          "hazard_score": 82.7,
          "exposure_score": 45.6,
          "vulnerability_score": 49.5
        },
        "component_scores": {
          "hazard": 82.7,
          "exposure": 45.6,
          "vulnerability": 49.5,
          "thermal_hazard": 75.3,
          "impervious_hazard": 88.0,
          "albedo_deficit": 93.3,
          "population_exposure": 48.0,
          "worker_exposure": 42.0,
          "canopy_deficit": 90.0,
          "demographic_vulnerability": 28.0,
          "cooling_deficit": 15.0
        },
        "driver_contributions": [
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 30.9,
            "raw_value": 11.3,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +11.3\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 21.6,
            "raw_value": 88.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "88% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 16.4,
            "raw_value": 95.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 5.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 15.7,
            "raw_value": 24000.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 24,000 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 9.2,
            "raw_value": 4200.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 4,200 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 4.5,
            "raw_value": 14.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "14.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 1.7,
            "raw_value": 15.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "15% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 11.3,
            "unit": "\u00b0C",
            "contribution_pct": 30.9,
            "evidence_statement": "Thermal anomaly of +11.3\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 88.0,
            "unit": "%",
            "contribution_pct": 21.6,
            "evidence_statement": "Ground sealing ratio of 88.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 95.0,
            "unit": "%",
            "contribution_pct": 16.4,
            "evidence_statement": "Canopy coverage is 5.0%, leaving an urban vegetative deficit of 95.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 24000.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 15.7,
            "evidence_statement": "High resident exposure density of 24,000 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 4200.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 9.2,
            "evidence_statement": "High occupational outdoor exposure with 4,200 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 14.0,
            "unit": "%",
            "contribution_pct": 4.5,
            "evidence_statement": "14.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 15.0,
            "unit": "%",
            "contribution_pct": 1.7,
            "evidence_statement": "15.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.442348+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 192000.0,
        "estimated_total_cost_usd": 8640000.0,
        "expected_local_lst_reduction_c": 2.2,
        "expected_ambient_reduction_c": 0.58,
        "suitability_score": 95.0,
        "rationale": "Existing tree canopy is only 5.0%. Street tree planting provides crucial shade to ground pedestrian corridors. High pedestrian foot-traffic benefits directly from canopy shade.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-TRANSIT-SHADE",
        "intervention_name": "Solar-Reflective Tensile Transit Shading & Misting",
        "category": "emergency_cooling",
        "recommended_area_sqm": 5000.0,
        "estimated_total_cost_usd": 550000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 80.0,
        "rationale": "Extreme outdoor exposure (4,200.0 laborers/transit users) demands rapid solar canopy shading and misting stations.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-COOL-ROOF",
        "intervention_name": "High-Reflectance Cool Roof Coating",
        "category": "material_engineering",
        "recommended_area_sqm": 211200.0,
        "estimated_total_cost_usd": 3801600.0,
        "expected_local_lst_reduction_c": 5.28,
        "expected_ambient_reduction_c": 0.42,
        "suitability_score": 76.0,
        "rationale": "Low surface albedo (0.12) and high roof density make reflective white coatings the highest cooling ROI measure.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-POCKET-PARK",
        "intervention_name": "Urban Micro-Pocket Park & Bioswale",
        "category": "urban_design",
        "recommended_area_sqm": 15000.0,
        "estimated_total_cost_usd": 1275000.0,
        "expected_local_lst_reduction_c": 0.3,
        "expected_ambient_reduction_c": 0.1,
        "suitability_score": 65.0,
        "rationale": "Dense neighborhood requires accessible green thermal refuges within 5-minute walking radii.",
        "classification": "SIMULATED"
      },
      {
        "intervention_id": "INT-PERM-PAVEMENT",
        "intervention_name": "Permeable Cool Pavement & Interlocking Pavers",
        "category": "material_engineering",
        "recommended_area_sqm": 96000.0,
        "estimated_total_cost_usd": 6240000.0,
        "expected_local_lst_reduction_c": 1.2,
        "expected_ambient_reduction_c": 0.14,
        "suitability_score": 45.0,
        "rationale": "High ground sealing traps sensible heat overnight; permeable pavers restore evaporative cooling.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "Downtown Financial District is currently designated at HIGH thermal risk with a Composite Heat Risk Index of 63.3/100. The primary heat-stress driver is Thermal Heat Anomaly, accounting for 30.9% of the cumulative score. Compounding this risk is Impervious Built Surface (21.6% contribution), with 88% of the ground surface is sealed with heat-absorbing concrete/asphalt. Observed Land Surface Temperature is 42.8\u00b0C (+11.3\u00b0C vs regional baseline), affecting approximately 57,600 residents and 4,200.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-06": {
    "summary": {
      "rank": 6,
      "zone_id": "ZONE-06",
      "zone_name": "High-Rise Residential Sector 9",
      "typology": "residential_highrise",
      "temperature": 36.2,
      "vegetation": 0.3,
      "imperviousness": 0.68,
      "building_density": 0.55,
      "population_exposure": 56.0,
      "risk_score": 46.3,
      "risk_level": "MODERATE",
      "land_surface_temp_c": 36.2,
      "thermal_anomaly_c": 4.7,
      "dominant_driver": "Residential Population Exposure",
      "dominant_driver_pct": 25.4,
      "total_population": 78400,
      "vulnerable_population": 18816,
      "area_sqkm": 2.8,
      "center_coords": [
        77.225,
        28.6125
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "HIGH_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-06",
      "name": "High-Rise Residential Sector 9",
      "typology": "residential_highrise",
      "area_sqkm": 2.8,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.215,
              28.605
            ],
            [
              77.235,
              28.605
            ],
            [
              77.235,
              28.62
            ],
            [
              77.215,
              28.62
            ],
            [
              77.215,
              28.605
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.68,
        "tree_canopy_fraction": 0.18,
        "vegetation_grass_fraction": 0.12,
        "water_fraction": 0.0,
        "average_albedo": 0.18,
        "building_density": 0.55
      },
      "thermal_observation": {
        "land_surface_temp_c": 36.2,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 4.7,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 28000.0,
        "total_population": 78400,
        "vulnerable_ratio": 0.24,
        "outdoor_worker_density_per_sqkm": 1200.0,
        "low_ac_coverage_ratio": 0.22
      },
      "provenance": [],
      "temperature": 36.2,
      "vegetation": 0.3,
      "imperviousness": 0.68,
      "building_density": 0.55,
      "population_exposure": 56.0,
      "risk_score": 46.3,
      "risk_level": "MODERATE"
    },
    "risk_assessment": {
      "zone_id": "ZONE-06",
      "zone_name": "High-Rise Residential Sector 9",
      "risk_score": {
        "score": 46.3,
        "risk_level": "MODERATE",
        "subscores": {
          "hazard_score": 50.7,
          "exposure_score": 38.4,
          "vulnerability_score": 47.9
        },
        "component_scores": {
          "hazard": 50.7,
          "exposure": 38.4,
          "vulnerability": 47.9,
          "thermal_hazard": 31.3,
          "impervious_hazard": 68.0,
          "albedo_deficit": 73.3,
          "population_exposure": 56.0,
          "worker_exposure": 12.0,
          "canopy_deficit": 64.0,
          "demographic_vulnerability": 48.0,
          "cooling_deficit": 22.0
        },
        "driver_contributions": [
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 25.4,
            "raw_value": 28000.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 28,000 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 23.1,
            "raw_value": 68.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "68% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 17.7,
            "raw_value": 4.7,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +4.7\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 16.1,
            "raw_value": 82.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 18.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 10.6,
            "raw_value": 24.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "24.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 3.6,
            "raw_value": 1200.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 1,200 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 3.5,
            "raw_value": 22.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "22% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 28000.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 25.4,
            "evidence_statement": "High resident exposure density of 28,000 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 68.0,
            "unit": "%",
            "contribution_pct": 23.1,
            "evidence_statement": "Ground sealing ratio of 68.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 4.7,
            "unit": "\u00b0C",
            "contribution_pct": 17.7,
            "evidence_statement": "Thermal anomaly of +4.7\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 82.0,
            "unit": "%",
            "contribution_pct": 16.1,
            "evidence_statement": "Canopy coverage is 18.0%, leaving an urban vegetative deficit of 82.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 24.0,
            "unit": "%",
            "contribution_pct": 10.6,
            "evidence_statement": "24.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 1200.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 3.6,
            "evidence_statement": "High occupational outdoor exposure with 1,200 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 22.0,
            "unit": "%",
            "contribution_pct": 3.5,
            "evidence_statement": "22.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.448067+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 168000.0,
        "estimated_total_cost_usd": 7560000.0,
        "expected_local_lst_reduction_c": 1.65,
        "expected_ambient_reduction_c": 0.43,
        "suitability_score": 82.0,
        "rationale": "Existing tree canopy is only 18.0%. Street tree planting provides crucial shade to ground pedestrian corridors. High pedestrian foot-traffic benefits directly from canopy shade.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "High-Rise Residential Sector 9 is currently designated at MODERATE thermal risk with a Composite Heat Risk Index of 46.3/100. The primary heat-stress driver is Residential Population Exposure, accounting for 25.4% of the cumulative score. Compounding this risk is Impervious Built Surface (23.1% contribution), with 68% of the ground surface is sealed with heat-absorbing concrete/asphalt. Observed Land Surface Temperature is 36.2\u00b0C (+4.7\u00b0C vs regional baseline), affecting approximately 78,400 residents and 1,200.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-09": {
    "summary": {
      "rank": 7,
      "zone_id": "ZONE-09",
      "zone_name": "Biotech & Medical District",
      "typology": "mixed_use",
      "temperature": 35.8,
      "vegetation": 0.35,
      "imperviousness": 0.62,
      "building_density": 0.48,
      "population_exposure": 29.0,
      "risk_score": 41.3,
      "risk_level": "MODERATE",
      "land_surface_temp_c": 35.8,
      "thermal_anomaly_c": 4.3,
      "dominant_driver": "Impervious Built Surface",
      "dominant_driver_pct": 23.9,
      "total_population": 31900,
      "vulnerable_population": 11165,
      "area_sqkm": 2.2,
      "center_coords": [
        77.2,
        28.609
      ],
      "confidence": 0.98,
      "is_hotspot": true,
      "hotspot_tier": "HIGH_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-09",
      "name": "Biotech & Medical District",
      "typology": "mixed_use",
      "area_sqkm": 2.2,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.19,
              28.6
            ],
            [
              77.21,
              28.6
            ],
            [
              77.21,
              28.618
            ],
            [
              77.19,
              28.618
            ],
            [
              77.19,
              28.6
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.62,
        "tree_canopy_fraction": 0.21,
        "vegetation_grass_fraction": 0.14,
        "water_fraction": 0.0,
        "average_albedo": 0.19,
        "building_density": 0.48
      },
      "thermal_observation": {
        "land_surface_temp_c": 35.8,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 4.3,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 14500.0,
        "total_population": 31900,
        "vulnerable_ratio": 0.35,
        "outdoor_worker_density_per_sqkm": 1600.0,
        "low_ac_coverage_ratio": 0.18
      },
      "provenance": [],
      "temperature": 35.8,
      "vegetation": 0.35,
      "imperviousness": 0.62,
      "building_density": 0.48,
      "population_exposure": 29.0,
      "risk_score": 41.3,
      "risk_level": "MODERATE"
    },
    "risk_assessment": {
      "zone_id": "ZONE-09",
      "zone_name": "Biotech & Medical District",
      "risk_score": {
        "score": 41.3,
        "risk_level": "MODERATE",
        "subscores": {
          "hazard_score": 46.9,
          "exposure_score": 23.8,
          "vulnerability_score": 52.2
        },
        "component_scores": {
          "hazard": 46.9,
          "exposure": 23.8,
          "vulnerability": 52.2,
          "thermal_hazard": 28.7,
          "impervious_hazard": 62.0,
          "albedo_deficit": 70.0,
          "population_exposure": 29.0,
          "worker_exposure": 16.0,
          "canopy_deficit": 58.0,
          "demographic_vulnerability": 70.0,
          "cooling_deficit": 18.0
        },
        "driver_contributions": [
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 23.9,
            "raw_value": 62.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "62% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 18.4,
            "raw_value": 4.3,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +4.3\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 17.5,
            "raw_value": 35.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "35.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 16.6,
            "raw_value": 79.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 21.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 14.9,
            "raw_value": 14500.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 14,500 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 5.5,
            "raw_value": 1600.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 1,600 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 3.2,
            "raw_value": 18.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "18% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 62.0,
            "unit": "%",
            "contribution_pct": 23.9,
            "evidence_statement": "Ground sealing ratio of 62.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 4.3,
            "unit": "\u00b0C",
            "contribution_pct": 18.4,
            "evidence_statement": "Thermal anomaly of +4.3\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 35.0,
            "unit": "%",
            "contribution_pct": 17.5,
            "evidence_statement": "35.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 79.0,
            "unit": "%",
            "contribution_pct": 16.6,
            "evidence_statement": "Canopy coverage is 21.0%, leaving an urban vegetative deficit of 79.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 14500.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 14.9,
            "evidence_statement": "High resident exposure density of 14,500 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 1600.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 5.5,
            "evidence_statement": "High occupational outdoor exposure with 1,600 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 18.0,
            "unit": "%",
            "contribution_pct": 3.2,
            "evidence_statement": "18.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.453537+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [
      {
        "intervention_id": "INT-TREE-CANOPY",
        "intervention_name": "High-Albedo Urban Tree Canopy Expansion",
        "category": "nature_based",
        "recommended_area_sqm": 99000.0,
        "estimated_total_cost_usd": 4455000.0,
        "expected_local_lst_reduction_c": 1.24,
        "expected_ambient_reduction_c": 0.32,
        "suitability_score": 59.0,
        "rationale": "Existing tree canopy is only 21.0%. Street tree planting provides crucial shade to ground pedestrian corridors.",
        "classification": "SIMULATED"
      }
    ],
    "ai_executive_brief": "Biotech & Medical District is currently designated at MODERATE thermal risk with a Composite Heat Risk Index of 41.3/100. The primary heat-stress driver is Impervious Built Surface, accounting for 23.9% of the cumulative score. Compounding this risk is Thermal Heat Anomaly (18.4% contribution), with Land surface temperature is +4.3\u00b0C relative to the regional baseline. Observed Land Surface Temperature is 35.8\u00b0C (+4.3\u00b0C vs regional baseline), affecting approximately 31,900 residents and 1,600.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-02": {
    "summary": {
      "rank": 10,
      "zone_id": "ZONE-02",
      "zone_name": "Riverfront Park & Wetlands",
      "typology": "park_riparian",
      "temperature": 28.4,
      "vegetation": 0.74,
      "imperviousness": 0.15,
      "building_density": 0.02,
      "population_exposure": 2.4,
      "risk_score": 12.7,
      "risk_level": "LOW",
      "land_surface_temp_c": 28.4,
      "thermal_anomaly_c": -3.1,
      "dominant_driver": "Age-Vulnerable Population",
      "dominant_driver_pct": 42.9,
      "total_population": 3720,
      "vulnerable_population": 669,
      "area_sqkm": 3.1,
      "center_coords": [
        77.2375,
        28.63
      ],
      "confidence": 0.98,
      "is_hotspot": false,
      "hotspot_tier": "NOT_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-02",
      "name": "Riverfront Park & Wetlands",
      "typology": "park_riparian",
      "area_sqkm": 3.1,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.23,
              28.62
            ],
            [
              77.245,
              28.62
            ],
            [
              77.245,
              28.64
            ],
            [
              77.23,
              28.64
            ],
            [
              77.23,
              28.62
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.15,
        "tree_canopy_fraction": 0.52,
        "vegetation_grass_fraction": 0.22,
        "water_fraction": 0.11,
        "average_albedo": 0.22,
        "building_density": 0.02
      },
      "thermal_observation": {
        "land_surface_temp_c": 28.4,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": -3.1,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 1200.0,
        "total_population": 3720,
        "vulnerable_ratio": 0.18,
        "outdoor_worker_density_per_sqkm": 150.0,
        "low_ac_coverage_ratio": 0.25
      },
      "provenance": [],
      "temperature": 28.4,
      "vegetation": 0.74,
      "imperviousness": 0.15,
      "building_density": 0.02,
      "population_exposure": 2.4,
      "risk_score": 12.7,
      "risk_level": "LOW"
    },
    "risk_assessment": {
      "zone_id": "ZONE-02",
      "zone_name": "Riverfront Park & Wetlands",
      "risk_score": {
        "score": 12.7,
        "risk_level": "LOW",
        "subscores": {
          "hazard_score": 16.5,
          "exposure_score": 2.0,
          "vulnerability_score": 18.9
        },
        "component_scores": {
          "hazard": 16.5,
          "exposure": 2.0,
          "vulnerability": 18.9,
          "thermal_hazard": 0.0,
          "impervious_hazard": 15.0,
          "albedo_deficit": 60.0,
          "population_exposure": 2.4,
          "worker_exposure": 1.5,
          "canopy_deficit": 0.0,
          "demographic_vulnerability": 36.0,
          "cooling_deficit": 25.0
        },
        "driver_contributions": [
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 42.9,
            "raw_value": 18.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "18.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 27.6,
            "raw_value": 15.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "15% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 21.3,
            "raw_value": 25.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "25% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 5.9,
            "raw_value": 1200.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 1,200 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 2.4,
            "raw_value": 150.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 150 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 0.0,
            "raw_value": -3.1,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is -3.1\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 0.0,
            "raw_value": 48.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 52.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          }
        ],
        "evidence": [
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 18.0,
            "unit": "%",
            "contribution_pct": 42.9,
            "evidence_statement": "18.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 15.0,
            "unit": "%",
            "contribution_pct": 27.6,
            "evidence_statement": "Ground sealing ratio of 15.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 25.0,
            "unit": "%",
            "contribution_pct": 21.3,
            "evidence_statement": "25.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 1200.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 5.9,
            "evidence_statement": "High resident exposure density of 1,200 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 150.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 2.4,
            "evidence_statement": "High occupational outdoor exposure with 150 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": -3.1,
            "unit": "\u00b0C",
            "contribution_pct": 0.0,
            "evidence_statement": "Thermal anomaly of -3.1\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 48.0,
            "unit": "%",
            "contribution_pct": 0.0,
            "evidence_statement": "Canopy coverage is 52.0%, leaving an urban vegetative deficit of 48.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.458438+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [],
    "ai_executive_brief": "Riverfront Park & Wetlands is currently designated at LOW thermal risk with a Composite Heat Risk Index of 12.7/100. The primary heat-stress driver is Age-Vulnerable Population, accounting for 42.9% of the cumulative score. Compounding this risk is Impervious Built Surface (27.6% contribution), with 15% of the ground surface is sealed with heat-absorbing concrete/asphalt. Observed Land Surface Temperature is 28.4\u00b0C (-3.1\u00b0C vs regional baseline), affecting approximately 3,720 residents and 150.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-05": {
    "summary": {
      "rank": 9,
      "zone_id": "ZONE-05",
      "zone_name": "University Campus & Botanical Enclave",
      "typology": "institutional_campus",
      "temperature": 30.1,
      "vegetation": 0.62,
      "imperviousness": 0.36,
      "building_density": 0.25,
      "population_exposure": 19.0,
      "risk_score": 18.1,
      "risk_level": "LOW",
      "land_surface_temp_c": 30.1,
      "thermal_anomaly_c": -1.4,
      "dominant_driver": "Impervious Built Surface",
      "dominant_driver_pct": 40.3,
      "total_population": 19950,
      "vulnerable_population": 1596,
      "area_sqkm": 2.1,
      "center_coords": [
        77.2025,
        28.6325
      ],
      "confidence": 0.98,
      "is_hotspot": false,
      "hotspot_tier": "NOT_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-05",
      "name": "University Campus & Botanical Enclave",
      "typology": "institutional_campus",
      "area_sqkm": 2.1,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.195,
              28.625
            ],
            [
              77.21,
              28.625
            ],
            [
              77.21,
              28.64
            ],
            [
              77.195,
              28.64
            ],
            [
              77.195,
              28.625
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.36,
        "tree_canopy_fraction": 0.48,
        "vegetation_grass_fraction": 0.14,
        "water_fraction": 0.02,
        "average_albedo": 0.2,
        "building_density": 0.25
      },
      "thermal_observation": {
        "land_surface_temp_c": 30.1,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": -1.4,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 9500.0,
        "total_population": 19950,
        "vulnerable_ratio": 0.08,
        "outdoor_worker_density_per_sqkm": 600.0,
        "low_ac_coverage_ratio": 0.2
      },
      "provenance": [],
      "temperature": 30.1,
      "vegetation": 0.62,
      "imperviousness": 0.36,
      "building_density": 0.25,
      "population_exposure": 19.0,
      "risk_score": 18.1,
      "risk_level": "LOW"
    },
    "risk_assessment": {
      "zone_id": "ZONE-05",
      "zone_name": "University Campus & Botanical Enclave",
      "risk_score": {
        "score": 18.1,
        "risk_level": "LOW",
        "subscores": {
          "hazard_score": 24.1,
          "exposure_score": 13.8,
          "vulnerability_score": 12.2
        },
        "component_scores": {
          "hazard": 24.1,
          "exposure": 13.8,
          "vulnerability": 12.2,
          "thermal_hazard": 0.0,
          "impervious_hazard": 36.0,
          "albedo_deficit": 66.7,
          "population_exposure": 19.0,
          "worker_exposure": 6.0,
          "canopy_deficit": 4.0,
          "demographic_vulnerability": 16.0,
          "cooling_deficit": 20.0
        },
        "driver_contributions": [
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 40.3,
            "raw_value": 36.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "36% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 28.4,
            "raw_value": 9500.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 9,500 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 11.6,
            "raw_value": 8.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "8.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 10.4,
            "raw_value": 20.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "20% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 6.0,
            "raw_value": 600.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 600 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 3.3,
            "raw_value": 52.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 48.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 0.0,
            "raw_value": -1.4,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is -1.4\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          }
        ],
        "evidence": [
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 36.0,
            "unit": "%",
            "contribution_pct": 40.3,
            "evidence_statement": "Ground sealing ratio of 36.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 9500.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 28.4,
            "evidence_statement": "High resident exposure density of 9,500 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 8.0,
            "unit": "%",
            "contribution_pct": 11.6,
            "evidence_statement": "8.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 20.0,
            "unit": "%",
            "contribution_pct": 10.4,
            "evidence_statement": "20.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 600.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 6.0,
            "evidence_statement": "High occupational outdoor exposure with 600 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 52.0,
            "unit": "%",
            "contribution_pct": 3.3,
            "evidence_statement": "Canopy coverage is 48.0%, leaving an urban vegetative deficit of 52.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": -1.4,
            "unit": "\u00b0C",
            "contribution_pct": 0.0,
            "evidence_statement": "Thermal anomaly of -1.4\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.463383+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [],
    "ai_executive_brief": "University Campus & Botanical Enclave is currently designated at LOW thermal risk with a Composite Heat Risk Index of 18.1/100. The primary heat-stress driver is Impervious Built Surface, accounting for 40.3% of the cumulative score. Compounding this risk is Residential Population Exposure (28.4% contribution), with Dense residential population of 9,500 residents per km\u00b2. Observed Land Surface Temperature is 30.1\u00b0C (-1.4\u00b0C vs regional baseline), affecting approximately 19,950 residents and 600.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  },
  "ZONE-08": {
    "summary": {
      "rank": 8,
      "zone_id": "ZONE-08",
      "zone_name": "Greenbelt Suburban Residential",
      "typology": "residential_suburban",
      "temperature": 32.8,
      "vegetation": 0.53,
      "imperviousness": 0.44,
      "building_density": 0.32,
      "population_exposure": 15.6,
      "risk_score": 24.4,
      "risk_level": "LOW",
      "land_surface_temp_c": 32.8,
      "thermal_anomaly_c": 1.3,
      "dominant_driver": "Impervious Built Surface",
      "dominant_driver_pct": 31.8,
      "total_population": 28080,
      "vulnerable_population": 6177,
      "area_sqkm": 3.6,
      "center_coords": [
        77.185,
        28.63
      ],
      "confidence": 0.98,
      "is_hotspot": false,
      "hotspot_tier": "NOT_HOTSPOT"
    },
    "zone": {
      "id": "ZONE-08",
      "name": "Greenbelt Suburban Residential",
      "typology": "residential_suburban",
      "area_sqkm": 3.6,
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              77.175,
              28.62
            ],
            [
              77.195,
              28.62
            ],
            [
              77.195,
              28.64
            ],
            [
              77.175,
              28.64
            ],
            [
              77.175,
              28.62
            ]
          ]
        ]
      },
      "land_cover": {
        "impervious_surface_fraction": 0.44,
        "tree_canopy_fraction": 0.35,
        "vegetation_grass_fraction": 0.18,
        "water_fraction": 0.0,
        "average_albedo": 0.21,
        "building_density": 0.32
      },
      "thermal_observation": {
        "land_surface_temp_c": 32.8,
        "baseline_temp_c": 31.5,
        "thermal_anomaly_c": 1.3,
        "sensor_source": "Landsat-9 Thermal Infrared Sensor (TIRS)",
        "observation_time": "2026-08-15T14:30:00Z"
      },
      "demographics": {
        "population_density_per_sqkm": 7800.0,
        "total_population": 28080,
        "vulnerable_ratio": 0.22,
        "outdoor_worker_density_per_sqkm": 400.0,
        "low_ac_coverage_ratio": 0.1
      },
      "provenance": [],
      "temperature": 32.8,
      "vegetation": 0.53,
      "imperviousness": 0.44,
      "building_density": 0.32,
      "population_exposure": 15.6,
      "risk_score": 24.4,
      "risk_level": "LOW"
    },
    "risk_assessment": {
      "zone_id": "ZONE-08",
      "zone_name": "Greenbelt Suburban Residential",
      "risk_score": {
        "score": 24.4,
        "risk_level": "LOW",
        "subscores": {
          "hazard_score": 30.2,
          "exposure_score": 11.0,
          "vulnerability_score": 29.9
        },
        "component_scores": {
          "hazard": 30.2,
          "exposure": 11.0,
          "vulnerability": 29.9,
          "thermal_hazard": 8.7,
          "impervious_hazard": 44.0,
          "albedo_deficit": 63.3,
          "population_exposure": 15.6,
          "worker_exposure": 4.0,
          "canopy_deficit": 30.0,
          "demographic_vulnerability": 44.0,
          "cooling_deficit": 10.0
        },
        "driver_contributions": [
          {
            "driver_key": "impervious_surface",
            "name": "Impervious Built Surface",
            "contribution_pct": 31.8,
            "raw_value": 44.0,
            "unit": "%",
            "dimension": "Hazard",
            "explanation": "44% of the ground surface is sealed with heat-absorbing concrete/asphalt.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "name": "Age-Vulnerable Population",
            "contribution_pct": 20.6,
            "raw_value": 22.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "22.0% of residents are young infants (<5) or seniors (>65).",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "name": "Tree Canopy Deficit",
            "contribution_pct": 16.1,
            "raw_value": 65.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "Only 35.0% vegetative shade exists in this urban footprint.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "name": "Residential Population Exposure",
            "contribution_pct": 15.1,
            "raw_value": 7800.0,
            "unit": "people/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Dense residential population of 7,800 residents per km\u00b2.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "thermal_anomaly",
            "name": "Thermal Heat Anomaly",
            "contribution_pct": 10.5,
            "raw_value": 1.3,
            "unit": "\u00b0C",
            "dimension": "Hazard",
            "explanation": "Land surface temperature is +1.3\u00b0C relative to the regional baseline.",
            "classification": "DERIVED"
          },
          {
            "driver_key": "low_ac_coverage",
            "name": "Lack of Cooling Infrastructure",
            "contribution_pct": 3.4,
            "raw_value": 10.0,
            "unit": "%",
            "dimension": "Vulnerability",
            "explanation": "10% of households lack mechanical air conditioning or passive cooling.",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "name": "Outdoor Physical Workers",
            "contribution_pct": 2.6,
            "raw_value": 400.0,
            "unit": "workers/km\u00b2",
            "dimension": "Exposure",
            "explanation": "Concentration of 400 laborers working in unshaded ambient conditions.",
            "classification": "ESTIMATED"
          }
        ],
        "evidence": [
          {
            "driver_key": "impervious_surface",
            "factor_name": "Impervious Built Surface",
            "observed_value": 44.0,
            "unit": "%",
            "contribution_pct": 31.8,
            "evidence_statement": "Ground sealing ratio of 44.0% impedes evaporative cooling.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Impervious Surface Layer proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "demographic_vulnerability",
            "factor_name": "Age-Vulnerable Population",
            "observed_value": 22.0,
            "unit": "%",
            "contribution_pct": 20.6,
            "evidence_statement": "22.0% of neighborhood population belongs to physiologically heat-sensitive age groups.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Public Health Age-Cohort proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "canopy_deficit",
            "factor_name": "Tree Canopy Deficit",
            "observed_value": 65.0,
            "unit": "%",
            "contribution_pct": 16.1,
            "evidence_statement": "Canopy coverage is 35.0%, leaving an urban vegetative deficit of 65.0%.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (High-Resolution Land Cover proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "population_density",
            "factor_name": "Residential Population Exposure",
            "observed_value": 7800.0,
            "unit": "people/km\u00b2",
            "contribution_pct": 15.1,
            "evidence_statement": "High resident exposure density of 7,800 individuals per square kilometer.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Census Demographics proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "thermal_anomaly",
            "factor_name": "Thermal Heat Anomaly",
            "observed_value": 1.3,
            "unit": "\u00b0C",
            "contribution_pct": 10.5,
            "evidence_statement": "Thermal anomaly of +1.3\u00b0C relative to baseline (calibrated to satellite thermal radiometric proxy).",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Landsat-9 TIRS proxy)",
            "classification": "DERIVED"
          },
          {
            "driver_key": "low_ac_coverage",
            "factor_name": "Lack of Cooling Infrastructure",
            "observed_value": 10.0,
            "unit": "%",
            "contribution_pct": 3.4,
            "evidence_statement": "10.0% household mechanical cooling deficit amplifies indoor thermal danger.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Infrastructure & AC Coverage proxy)",
            "classification": "ESTIMATED"
          },
          {
            "driver_key": "outdoor_workers",
            "factor_name": "Outdoor Physical Workers",
            "observed_value": 400.0,
            "unit": "workers/km\u00b2",
            "contribution_pct": 2.6,
            "evidence_statement": "High occupational outdoor exposure with 400 active shift laborers per km\u00b2.",
            "confidence": 0.98,
            "data_source": "Synthetic Demonstration Data (Labor Bureau Workforce proxy)",
            "classification": "ESTIMATED"
          }
        ],
        "confidence": 0.98,
        "assumptions": [
          "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
          "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
          "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
          "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
          "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
          "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
        ],
        "formula_version": "CHRI-v1.0-deterministic",
        "calculation_timestamp": "2026-09-07T12:36:28.468459+00:00"
      },
      "confidence": 0.98,
      "assumptions": [
        "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
        "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
        "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
        "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
        "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
        "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
      ],
      "classification": "DERIVED"
    },
    "recommended_interventions": [],
    "ai_executive_brief": "Greenbelt Suburban Residential is currently designated at LOW thermal risk with a Composite Heat Risk Index of 24.4/100. The primary heat-stress driver is Impervious Built Surface, accounting for 31.8% of the cumulative score. Compounding this risk is Age-Vulnerable Population (20.6% contribution), with 22.0% of residents are young infants (<5) or seniors (>65). Observed Land Surface Temperature is 32.8\u00b0C (+1.3\u00b0C vs regional baseline), affecting approximately 28,080 residents and 400.0 outdoor laborers per square kilometer.",
    "confidence": 0.98,
    "assumptions": [
      "Regional baseline temperature is assumed uniform across the metropolitan study boundary.",
      "Canopy deficit assumes 50% tree canopy coverage represents optimal urban cooling potential.",
      "Demographic vulnerability linearly weights pediatric (<5) and geriatric (>65) cohorts equally.",
      "Thermal anomaly is clamped at 15.0\u00b0C as maximum expected micro-urban thermal differential.",
      "Population exposure reference upper-bound is calibrated to 50,000 residents per km\u00b2.",
      "Assessment utilizes synthetic demonstration data calibrated to realistic urban archetypes; indicator proxies can be substituted with live telemetry/surveys."
    ]
  }
};

export const FALLBACK_CATALOG: Intervention[] = [
  {
    id: "INT-TREE-CANOPY",
    name: "High-Albedo Urban Tree Canopy Expansion",
    category: "nature_based",
    description: "Planting dense, broadleaf native shade trees along pedestrian paths and public easements.",
    target_surface: "street_corridor",
    cooling_potential_c: 5.5,
    air_temp_reduction_c: 1.8,
    unit_cost_usd_per_sqm: 45.0,
    expected_lifespan_years: 30,
    maintenance_cost_usd_annual_per_sqm: 3.5,
    co_benefits: ["PM2.5 filtration", "Stormwater retention", "Pedestrian solar shade", "Mental wellbeing"],
    cost_inr_lakhs: 14.5,
    typical_area_sqm: 18000,
    phase: "Phase 3: Structural Canopy (8–18m)",
    timeframe: "8 – 14 Months",
    feasibility: "High",
    why_recommended: "Targeted along pedestrian sidewalk easements to mitigate severe unshaded street solar radiation."
  },
  {
    id: "INT-COOL-ROOF",
    name: "High-Reflectance Cool Roof Coating",
    category: "material_engineering",
    description: "Application of elastomeric reflective coatings (albedo >= 0.75) across commercial and residential flat rooftops.",
    target_surface: "roof",
    cooling_potential_c: 12.0,
    air_temp_reduction_c: 1.2,
    unit_cost_usd_per_sqm: 18.0,
    expected_lifespan_years: 12,
    maintenance_cost_usd_annual_per_sqm: 1.0,
    co_benefits: ["Indoor thermal relief (-3.5°C)", "HVAC power drop (-18%)", "Extended roof life"],
    cost_inr_lakhs: 8.5,
    typical_area_sqm: 14000,
    phase: "Phase 1: Immediate Relief (1–3m)",
    timeframe: "1 – 3 Months",
    feasibility: "High",
    why_recommended: "Rapidly reflects up to 80% of solar radiation from dense commercial and municipal flat roofs."
  },
  {
    id: "INT-PERM-PAVEMENT",
    name: "Permeable Cool Pavement & Interlocking Pavers",
    category: "material_engineering",
    description: "Replacing dense dark asphalt in parking lots and minor streets with porous, evaporative cool paving.",
    target_surface: "pavement",
    cooling_potential_c: 6.0,
    air_temp_reduction_c: 0.9,
    unit_cost_usd_per_sqm: 65.0,
    expected_lifespan_years: 20,
    maintenance_cost_usd_annual_per_sqm: 2.0,
    co_benefits: ["Runoff absorption", "Nocturnal heat trap reduction", "Groundwater aquifer recharge"],
    cost_inr_lakhs: 11.0,
    typical_area_sqm: 9000,
    phase: "Phase 2: Permeable Works (3–8m)",
    timeframe: "2 – 4 Months",
    feasibility: "Medium",
    why_recommended: "Prevents daytime ground thermal storage and speeds nocturnal radiative cooling."
  },
  {
    id: "INT-TRANSIT-SHADE",
    name: "Solar-Reflective Tensile Transit Shading & Misting",
    category: "emergency_cooling",
    description: "Rapid deployment of tensile solar fabric awnings with high-efficiency evaporative misting nozzles at busy commuter transit stops.",
    target_surface: "public_space",
    cooling_potential_c: 8.0,
    air_temp_reduction_c: 2.5,
    unit_cost_usd_per_sqm: 110.0,
    expected_lifespan_years: 8,
    maintenance_cost_usd_annual_per_sqm: 8.0,
    co_benefits: ["Immediate heatstroke protection", "Commuter microclimate shelter", "Glare mitigation"],
    cost_inr_lakhs: 6.5,
    typical_area_sqm: 3500,
    phase: "Phase 1: Immediate Relief (1–3m)",
    timeframe: "1 Month",
    feasibility: "High",
    why_recommended: "Protects high-volume transit commuters and street laborers from extreme acute daytime solar exposure."
  },
  {
    id: "INT-POCKET-PARK",
    name: "Urban Micro-Pocket Park & Bioswale",
    category: "urban_design",
    description: "Converting vacant parcels and redundant street shoulders into dense vegetated micro-cool islands.",
    target_surface: "public_space",
    cooling_potential_c: 4.8,
    air_temp_reduction_c: 1.5,
    unit_cost_usd_per_sqm: 85.0,
    expected_lifespan_years: 25,
    maintenance_cost_usd_annual_per_sqm: 5.0,
    co_benefits: ["Neighborhood social refuge", "Microclimate humidity buffer", "Acoustic noise dampening"],
    cost_inr_lakhs: 15.0,
    typical_area_sqm: 8000,
    phase: "Phase 2: Permeable Works (3–8m)",
    timeframe: "4 – 8 Months",
    feasibility: "Medium",
    why_recommended: "Creates localized vegetative cooling oases in dense residential blocks lacking open parks."
  },
  {
    id: "INT-GREEN-CORRIDOR",
    name: "Linear Bioretention Green Corridor",
    category: "nature_based",
    description: "Continuous bioswales and multi-tiered native shrub rows connecting fragmented urban blocks along arterial corridors.",
    target_surface: "street_corridor",
    cooling_potential_c: 5.2,
    air_temp_reduction_c: 1.6,
    unit_cost_usd_per_sqm: 52.0,
    expected_lifespan_years: 25,
    maintenance_cost_usd_annual_per_sqm: 4.0,
    co_benefits: ["Wind ventilation channeling", "Biodiversity corridor", "Urban stormwater filtration"],
    cost_inr_lakhs: 17.5,
    typical_area_sqm: 20000,
    phase: "Phase 3: Structural Canopy (8–18m)",
    timeframe: "8 – 14 Months",
    feasibility: "Medium",
    why_recommended: "Channels urban ventilation breezes into high-density building clusters."
  },
  {
    id: "INT-CANOPY-PRESERVE",
    name: "Mature Tree Canopy Preservation & Root Aeration",
    category: "nature_based",
    description: "Preservation ordinances, root decompaction, and canopy care to protect existing large-stature shade trees.",
    target_surface: "street_corridor",
    cooling_potential_c: 3.5,
    air_temp_reduction_c: 0.8,
    unit_cost_usd_per_sqm: 15.0,
    expected_lifespan_years: 20,
    maintenance_cost_usd_annual_per_sqm: 1.5,
    co_benefits: ["Avoided mature canopy loss", "Preserved evapotranspiration cooling", "Carbon retention"],
    cost_inr_lakhs: 5.5,
    typical_area_sqm: 25000,
    phase: "Phase 1: Immediate Relief (1–3m)",
    timeframe: "1 – 2 Months",
    feasibility: "High",
    why_recommended: "Preserves irreplaceable mature ecological cooling sinks and prevents canopy degradation."
  },
  {
    id: "INT-WATER-RETENTION",
    name: "Evaporative Micro-Retention Basin & Misting",
    category: "urban_design",
    description: "Naturalized shallow retention basin engineered for evaporative cooling and emergency stormwater buffering.",
    target_surface: "public_space",
    cooling_potential_c: 6.5,
    air_temp_reduction_c: 1.1,
    unit_cost_usd_per_sqm: 70.0,
    expected_lifespan_years: 20,
    maintenance_cost_usd_annual_per_sqm: 3.0,
    co_benefits: ["Direct evaporative cooling sink", "Localized humidity regulation", "Urban flood buffering"],
    cost_inr_lakhs: 9.5,
    typical_area_sqm: 5000,
    phase: "Phase 2: Permeable Works (3–8m)",
    timeframe: "3 – 6 Months",
    feasibility: "Medium",
    why_recommended: "Provides passive water-sink thermal absorption during extreme dry summer peaks."
  }
];

