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


def create_feature_vectors(df: pd.DataFrame, sequence_length: int = 60) -> pd.DataFrame:
    """
    Create feature vectors for ML inference from OGIM-formatted data.

    Args:
        df: OGIM-formatted DataFrame
        sequence_length: Number of past samples to include (default 60 = 1 minute at 1 Hz)

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
    df_wide = df_wide.sort_values("timestamp")

    # Extract sensor columns
    sensor_cols = [col for col in df_wide.columns if col not in ["timestamp", "well_id"]]

    features = []

    for i in range(sequence_length, len(df_wide)):
        window = df_wide.iloc[i - sequence_length : i]
        current = df_wide.iloc[i]

        feature_dict = {
            "timestamp": current["timestamp"],
            "well_id": current["well_id"],
        }

        # Current values
        for col in sensor_cols:
            feature_dict[f"{col}_current"] = current[col]

        # Statistical features over window
        for col in sensor_cols:
            window_values = window[col].values
            feature_dict[f"{col}_mean"] = np.mean(window_values)
            feature_dict[f"{col}_std"] = np.std(window_values)
            feature_dict[f"{col}_min"] = np.min(window_values)
            feature_dict[f"{col}_max"] = np.max(window_values)
            feature_dict[f"{col}_range"] = np.max(window_values) - np.min(window_values)

            # Rate of change
            if len(window_values) > 1:
                feature_dict[f"{col}_rate"] = (window_values[-1] - window_values[0]) / len(
                    window_values
                )
            else:
                feature_dict[f"{col}_rate"] = 0.0

        features.append(feature_dict)

    features_df = pd.DataFrame(features)
    logger.info(f"Created {len(features_df)} feature vectors with {len(features_df.columns)} features")
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
        print(f"\nSample OGIM records:")
        print(df_ogim.head(10))

        # Create features
        features_df = create_feature_vectors(df_ogim)
        print(f"\nFeature vectors shape: {features_df.shape}")
        print(f"Feature columns: {features_df.columns.tolist()[:10]}...")
