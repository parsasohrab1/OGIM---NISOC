"""
Tests for Well-Based Data Splitter
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from validation.petrobras_3w.splitter import (
    WellGroupSplitter,
    validate_split_integrity,
)


def create_mock_data(n_wells=8):
    """Create mock well data."""
    data = {}
    for i in range(n_wells):
        well_id = f"WELL-{i:03d}"
        df = pd.DataFrame({
            "timestamp": pd.date_range("2017-01-01", periods=1000, freq="1s"),
            "value": np.random.randn(1000),
            "event_type": np.random.choice([0, 1, 2], 1000, p=[0.8, 0.1, 0.1]),
        })
        data[well_id] = df
    return data


def test_splitter_initialization():
    """Test splitter initialization."""
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)

    assert splitter.train_ratio == 0.6
    assert splitter.val_ratio == 0.2
    assert splitter.test_ratio == 0.2
    assert splitter.random_seed == 42


def test_splitter_invalid_ratios():
    """Test that invalid ratios raise error."""
    with pytest.raises(ValueError):
        WellGroupSplitter(train_ratio=0.7, val_ratio=0.5)  # Sum > 1


def test_split_wells():
    """Test well splitting."""
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    well_ids = [f"WELL-{i:03d}" for i in range(8)]

    split = splitter.split_wells(well_ids)

    # Check structure
    assert "train" in split
    assert "val" in split
    assert "test" in split

    # Check no overlap
    train_set = set(split["train"])
    val_set = set(split["val"])
    test_set = set(split["test"])

    assert train_set.isdisjoint(val_set)
    assert train_set.isdisjoint(test_set)
    assert val_set.isdisjoint(test_set)

    # Check all wells accounted for
    assert train_set | val_set | test_set == set(well_ids)

    # Check approximate ratios
    assert len(split["train"]) >= 1
    assert len(split["val"]) >= 1
    assert len(split["test"]) >= 1


def test_split_dataset():
    """Test dataset splitting."""
    data = create_mock_data(n_wells=8)
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)

    train_data, val_data, test_data = splitter.split_dataset(data)

    # Check types
    assert isinstance(train_data, dict)
    assert isinstance(val_data, dict)
    assert isinstance(test_data, dict)

    # Check all wells accounted for
    all_wells = set(train_data.keys()) | set(val_data.keys()) | set(test_data.keys())
    assert all_wells == set(data.keys())

    # Check each split has data
    assert len(train_data) > 0
    assert len(val_data) > 0
    assert len(test_data) > 0


def test_validate_split_integrity():
    """Test split integrity validation."""
    data = create_mock_data(n_wells=8)
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    # Should not raise
    assert validate_split_integrity(train_data, val_data, test_data) is True


def test_split_reproducibility():
    """Test that splits are reproducible with same seed."""
    data = create_mock_data(n_wells=8)

    splitter1 = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train1, val1, test1 = splitter1.split_dataset(data)

    splitter2 = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train2, val2, test2 = splitter2.split_dataset(data)

    # Should produce identical splits
    assert set(train1.keys()) == set(train2.keys())
    assert set(val1.keys()) == set(val2.keys())
    assert set(test1.keys()) == set(test2.keys())


def test_get_split_summary():
    """Test split summary generation."""
    data = create_mock_data(n_wells=6)
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    summary = splitter.get_split_summary(train_data, val_data, test_data)

    assert isinstance(summary, pd.DataFrame)
    assert "split" in summary.columns
    assert "well_id" in summary.columns
    assert "total_samples" in summary.columns

    # Check all splits represented
    assert "train" in summary["split"].values
    assert "val" in summary["split"].values
    assert "test" in summary["split"].values


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
