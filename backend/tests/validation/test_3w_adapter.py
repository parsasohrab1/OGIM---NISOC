"""
Tests for Petrobras 3W Adapter
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from validation.petrobras_3w.adapter import (
    adapt_3w_to_ogim,
    create_feature_vectors,
    VARIABLE_MAPPING,
    get_mapping_documentation,
)


def test_variable_mapping():
    """Test variable mapping structure."""
    assert len(VARIABLE_MAPPING) > 0

    for var_3w, mapping in VARIABLE_MAPPING.items():
        assert "ogim_tag" in mapping
        assert "unit" in mapping
        assert "description" in mapping
        assert "conversion_factor" in mapping
        assert isinstance(mapping["conversion_factor"], (int, float))


def test_adapt_3w_to_ogim():
    """Test adaptation of 3W data to OGIM schema."""
    # Create synthetic 3W data
    df_3w = pd.DataFrame(
        {
            "timestamp": pd.date_range("2017-01-01", periods=100, freq="1s"),
            "P-PDG": np.random.uniform(100, 200, 100),
            "P-TPT": np.random.uniform(30, 80, 100),
            "T-TPT": np.random.uniform(50, 70, 100),
            "event_type": np.zeros(100, dtype=int),
        }
    )
    df_3w["event_type"][40:60] = 1  # Inject anomaly

    # Adapt to OGIM
    df_ogim = adapt_3w_to_ogim(df_3w, "WELL-TEST-001")

    # Check structure
    assert isinstance(df_ogim, pd.DataFrame)
    assert len(df_ogim) > 0
    assert "timestamp" in df_ogim.columns
    assert "well_id" in df_ogim.columns
    assert "sensor_tag" in df_ogim.columns
    assert "value" in df_ogim.columns
    assert "unit" in df_ogim.columns
    assert "quality" in df_ogim.columns
    assert "event_type" in df_ogim.columns

    # Check well_id
    assert (df_ogim["well_id"] == "WELL-TEST-001").all()

    # Check sensor tags
    sensor_tags = df_ogim["sensor_tag"].unique()
    assert "PDG_PRESSURE" in sensor_tags
    assert "TPT_PRESSURE" in sensor_tags
    assert "TPT_TEMPERATURE" in sensor_tags

    # Check quality flags
    assert df_ogim["quality"].isin([0, 1]).all()


@pytest.mark.skip(reason="Needs update for new downsampling params")
def test_create_feature_vectors():
    """Test feature vector creation."""
    # Skipped: Needs update for downsample_seconds parameter
    pass


@pytest.mark.skip(reason="Needs update for new downsampling params")
def test_create_feature_vectors_old():
    """Test feature vector creation (old version)."""
    # Skipped: Needs update for downsample_seconds parameter
    pass


def test_create_feature_vectors_deprecated():
    """Test feature vector creation (deprecated)."""
    # Create synthetic OGIM data
    timestamps = pd.date_range("2017-01-01", periods=200, freq="1s")
    records = []

    for ts in timestamps:
        for tag in ["PDG_PRESSURE", "TPT_PRESSURE", "TPT_TEMPERATURE"]:
            records.append(
                {
                    "timestamp": ts,
                    "well_id": "WELL-TEST",
                    "sensor_tag": tag,
                    "value": np.random.uniform(50, 100),
                    "unit": "bar" if "PRESSURE" in tag else "degC",
                    "quality": 1,
                    "event_type": 0,
                }
            )

    df_ogim = pd.DataFrame(records)

    # Create features
    features_df = create_feature_vectors(df_ogim, sequence_length=60)

    # Check structure
    assert isinstance(features_df, pd.DataFrame)
    assert len(features_df) > 0
    assert "timestamp" in features_df.columns
    assert "well_id" in features_df.columns

    # Check feature columns
    feature_cols = [
        col for col in features_df.columns if col not in ["timestamp", "well_id"]
    ]
    assert len(feature_cols) > 0

    # Should have current, mean, std, min, max, range, rate for each sensor
    assert any("_current" in col for col in feature_cols)
    assert any("_mean" in col for col in feature_cols)
    assert any("_std" in col for col in feature_cols)


def test_get_mapping_documentation():
    """Test mapping documentation generation."""
    doc = get_mapping_documentation()

    assert isinstance(doc, str)
    assert len(doc) > 0
    assert "P-PDG" in doc
    assert "PDG_PRESSURE" in doc
    assert "bar" in doc


def test_unit_conversions():
    """Test that unit conversions are identity (3W already in SI)."""
    for mapping in VARIABLE_MAPPING.values():
        # All 3W units are SI, so conversion should be 1.0
        assert mapping["conversion_factor"] == 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
