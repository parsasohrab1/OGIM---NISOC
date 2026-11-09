"""
Petrobras 3W to OGIM Schema Adapter

Maps 3W variables to OGIM sensor tags with explicit unit conversions.
Ensures compatibility with OGIM ML inference service.
"""

import logging
from typing import Dict, List

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Mapping: 3W variable -> OGIM tag
# 3W uses SI units (bar, °C, m³/d), which are compatible with OGIM
VARIABLE_MAPPING = {
    "P-PDG": {
        "ogim_tag": "PDG_PRESSURE",
        "unit": "bar",
        "description": "Permanent Downhole Gauge Pressure",
        "conversion_factor": 1.0,  # No conversion needed
    },
    "P-TPT": {
        "ogim_tag": "TPT_PRESSURE",
        "unit": "bar",
        "description": "Tubing Pressure (Tree)",
        "conversion_factor": 1.0,
    },
    "T-TPT": {
        "ogim_tag": "TPT_TEMPERATURE",
        "unit": "degC",
        "description": "Tubing Temperature (Tree)",
        "conversion_factor": 1.0,
    },
    "P-MON-CKP": {
        "ogim_tag": "CHOKE_PRESSURE",
        "unit": "bar",
        "description": "Choke Manifold Pressure (Monitored)",
        "conversion_factor": 1.0,
    },
    "T-JUS-CKP": {
        "ogim_tag": "CHOKE_TEMP_DOWNSTREAM",
        "unit": "degC",
        "description": "Choke Temperature (Downstream)",
        "conversion_factor": 1.0,
    },
    "P-JUS-CKGL": {
        "ogim_tag": "GASLIFT_CHOKE_PRESSURE",
        "unit": "bar",
        "description": "Gas Lift Choke Pressure (Upstream)",
        "conversion_factor": 1.0,
    },
    "T-JUS-CKGL": {
        "ogim_tag": "GASLIFT_CHOKE_TEMP",
        "unit": "degC",
        "description": "Gas Lift Choke Temperature (Upstream)",
        "conversion_factor": 1.0,
    },
    "QGL": {
        "ogim_tag": "GAS_LIFT_FLOW",
        "unit": "m3_per_day",
        "description": "Gas Lift Flow Rate",
        "conversion_factor": 1.0,
    },
}

# Reverse mapping for convenience
OGIM_TO_3W = {v["ogim_tag"]: k for k, v in VARIABLE_MAPPING.items()}


def adapt_3w_to_ogim(df: pd.DataFrame, well_id: str) -> pd.DataFrame:
    """
    Convert 3W DataFrame to OGIM schema.

    Args:
        df: Raw 3W DataFrame
        well_id: Well identifier (e.g., "WELL-00001")

    Returns:
        DataFrame in OGIM format with columns:
        - timestamp
        - well_id
        - sensor_tag (OGIM tag name)
        - value (converted value)
        - unit
        - quality (data quality flag)
        - event_type (ground truth label)
    """
    records = []

    # Ensure timestamp column
    if "timestamp" not in df.columns:
        # Generate timestamps if missing (1 Hz assumption)
        df["timestamp"] = pd.date_range("2017-01-01", periods=len(df), freq="1s")

    for idx, row in df.iterrows():
        timestamp = row["timestamp"]
        event_type = row.get("event_type", 0)

        for col_3w, mapping in VARIABLE_MAPPING.items():
            if col_3w in df.columns:
                raw_value = row[col_3w]

                # Apply conversion factor
                converted_value = raw_value * mapping["conversion_factor"]

                # Data quality: 1=good, 0=bad/missing
                quality = 1 if not pd.isna(converted_value) else 0

                records.append(
                    {
                        "timestamp": timestamp,
                        "well_id": well_id,
                        "sensor_tag": mapping["ogim_tag"],
                        "value": converted_value if quality == 1 else 0.0,
                        "unit": mapping["unit"],
                        "quality": quality,
                        "event_type": event_type,
                    }
                )

    ogim_df = pd.DataFrame(records)
    logger.info(
        f"Adapted {len(df)} samples from {well_id} to {len(ogim_df)} OGIM records"
    )
    return ogim_df


def create_feature_vectors(
    df: pd.DataFrame, sequence_length: int = 60, downsample_seconds: int = 10
) -> pd.DataFrame:
    """
    Create feature vectors for ML inference from OGIM-formatted data.
    OPTIMIZED with vectorized pandas operations and downsampling.

    Args:
        df: OGIM-formatted DataFrame
        sequence_length: Number of past samples to include (default 60)
        downsample_seconds: Downsample to 1 sample every N seconds (default 10)

    Returns:
        DataFrame with feature vectors suitable for ML model input
    """
    # Pivot to wide format (one row per timestamp)
    df_wide = df.pivot_table(
        index=["timestamp", "well_id"],
        columns="sensor_tag",
        values="value",
        aggfunc="first",
    ).reset_index()

    # Sort by timestamp
    df_wide = df_wide.sort_values("timestamp").reset_index(drop=True)

    # OPTIMIZATION 1: Downsample to reduce samples
    if downsample_seconds > 1:
        df_wide = df_wide.iloc[::downsample_seconds].reset_index(drop=True)
        logger.info(f"Downsampled to 1/{downsample_seconds}s: {len(df_wide)} samples")

    # Extract sensor columns
    sensor_cols = [
        col for col in df_wide.columns if col not in ["timestamp", "well_id"]
    ]

    # OPTIMIZATION 2: Drop frozen/all-NaN sensors
    active_sensors = []
    for col in sensor_cols:
        values = df_wide[col].dropna()
        if len(values) > 0 and values.std() > 1e-6:  # Not frozen
            active_sensors.append(col)

    if not active_sensors:
        logger.warning("No active sensors found")
        return pd.DataFrame()

    logger.info(f"Active sensors: {len(active_sensors)}/{len(sensor_cols)}")

    # OPTIMIZATION 3: Vectorized rolling statistics with float32
    features_dict = {
        "timestamp": df_wide["timestamp"].values,
        "well_id": df_wide["well_id"].values,
    }

    for col in active_sensors:
        series = df_wide[col].astype("float32")

        # Current values
        features_dict[f"{col}_current"] = series.values

        # Rolling statistics (vectorized)
        rolling = series.rolling(window=sequence_length, min_periods=1)
        features_dict[f"{col}_mean"] = rolling.mean().values
        features_dict[f"{col}_std"] = rolling.std().fillna(0).values
        features_dict[f"{col}_min"] = rolling.min().values
        features_dict[f"{col}_max"] = rolling.max().values
        features_dict[f"{col}_range"] = (rolling.max() - rolling.min()).fillna(0).values

        # Rate of change (vectorized diff)
        rate = series.diff(periods=sequence_length).fillna(0) / sequence_length
        features_dict[f"{col}_rate"] = rate.values

    features_df = pd.DataFrame(features_dict)

    # Drop rows where we don't have full window
    features_df = features_df.iloc[sequence_length:].reset_index(drop=True)

    # Convert all numeric columns to float32 for memory efficiency
    numeric_cols = features_df.select_dtypes(include=[np.number]).columns
    features_df[numeric_cols] = features_df[numeric_cols].astype("float32")

    # Replace inf/NaN with safe values
    features_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    features_df.fillna(0, inplace=True)

    logger.info(
        "Created %d feature vectors with %d features (vectorized, float32)",
        len(features_df),
        len(features_df.columns),
    )
    return features_df


def get_mapping_documentation() -> str:
    """Generate human-readable mapping documentation."""
    doc = "Petrobras 3W to OGIM Variable Mapping\n"
    doc += "=" * 60 + "\n\n"

    for col_3w, mapping in VARIABLE_MAPPING.items():
        doc += f"{col_3w:15} -> {mapping['ogim_tag']:25} ({mapping['unit']})\n"
        doc += f"{'':15}    {mapping['description']}\n"
        if mapping["conversion_factor"] != 1.0:
            doc += f"{'':15}    Conversion: x {mapping['conversion_factor']}\n"
        doc += "\n"

    return doc


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print(get_mapping_documentation())

    # Test with synthetic data
    from loader import load_all_real_instances

    instances = load_all_real_instances()

    if instances:
        well_id, df_3w = next(iter(instances.items()))
        print(f"\nTesting adapter with {well_id}...")
        print(f"Raw 3W data shape: {df_3w.shape}")

        # Adapt to OGIM
        df_ogim = adapt_3w_to_ogim(df_3w, well_id)
        print(f"OGIM data shape: {df_ogim.shape}")
        print(f"\nOGIM columns: {df_ogim.columns.tolist()}")
        print("\nSample OGIM records:")
        print(df_ogim.head(10))

        # Create features
        features_df = create_feature_vectors(df_ogim)
        print(f"\nFeature vectors shape: {features_df.shape}")
        print(f"Feature columns: {features_df.columns.tolist()[:10]}...")
