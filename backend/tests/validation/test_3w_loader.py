"""
Tests for Petrobras 3W Loader
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from validation.petrobras_3w.loader import (
    compute_sha256,
    load_all_real_instances,
    get_dataset_summary,
    REAL_INSTANCES_MANIFEST,
)


def test_sha256_computation(tmp_path):
    """Test SHA256 checksum computation."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("hello world")

    checksum = compute_sha256(test_file)
    assert isinstance(checksum, str)
    assert len(checksum) == 64  # SHA256 produces 64 hex characters


def test_manifest_structure():
    """Test that manifest has required fields."""
    assert len(REAL_INSTANCES_MANIFEST) > 0

    for instance in REAL_INSTANCES_MANIFEST:
        assert "file" in instance
        assert "well" in instance
        assert "event" in instance
        assert "real" in instance
        assert "url_path" in instance
        assert instance["real"] is True


def test_load_all_real_instances():
    """Test loading all real instances."""
    instances = load_all_real_instances()

    assert isinstance(instances, dict)
    assert len(instances) > 0

    for well_id, df in instances.items():
        assert isinstance(df, pd.DataFrame)
        assert len(df) > 0
        assert "event_type" in df.columns
        assert "well_id" in df.columns


def test_dataset_summary():
    """Test dataset summary generation."""
    summary = get_dataset_summary()

    assert isinstance(summary, pd.DataFrame)
    assert len(summary) > 0
    assert "well_id" in summary.columns
    assert "total_samples" in summary.columns
    assert "duration_hours" in summary.columns


def test_data_quality():
    """Test data quality checks."""
    instances = load_all_real_instances()

    for well_id, df in instances.items():
        # Check no empty DataFrames
        assert len(df) > 0, f"{well_id} has no data"

        # Check event types are valid
        event_types = df["event_type"].unique()
        assert all(et >= 0 for et in event_types), f"{well_id} has negative event types"

        # Check for required columns (after synthetic generation)
        assert "P-PDG" in df.columns or "timestamp" in df.columns


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
