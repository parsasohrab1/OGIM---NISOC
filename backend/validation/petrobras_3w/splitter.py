"""
Data Splitter for 3W Dataset

Implements well-based (group) splitting to avoid data leakage.
Ensures each well appears in only one split (train/val/test).
"""

import logging
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class WellGroupSplitter:
    """
    Split dataset by well (group-based split).

    Ensures no well appears in multiple splits to avoid leakage.
    """

    def __init__(
        self, train_ratio: float = 0.6, val_ratio: float = 0.2, random_seed: int = 42
    ):
        """
        Args:
            train_ratio: Fraction of wells for training
            val_ratio: Fraction of wells for validation
            random_seed: Random seed for reproducibility
        """
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = 1.0 - train_ratio - val_ratio
        self.random_seed = random_seed

        if self.test_ratio <= 0:
            raise ValueError("train_ratio + val_ratio must be < 1.0")

        logger.info(
            f"Splitter initialized: train={train_ratio:.1%}, "
            f"val={val_ratio:.1%}, test={self.test_ratio:.1%}, seed={random_seed}"
        )

    def split_wells(self, well_ids: List[str]) -> Dict[str, List[str]]:
        """
        Split well IDs into train/val/test sets.

        Args:
            well_ids: List of well identifiers

        Returns:
            Dictionary with keys 'train', 'val', 'test' mapping to well ID lists
        """
        np.random.seed(self.random_seed)

        well_ids = sorted(well_ids)  # Ensure deterministic ordering
        n_wells = len(well_ids)

        if n_wells < 5:
            logger.warning(
                f"Only {n_wells} wells available. Minimum 5 recommended for robust split."
            )

        # Shuffle wells
        shuffled_wells = np.random.permutation(well_ids).tolist()

        # Calculate split indices
        n_train = max(1, int(n_wells * self.train_ratio))
        n_val = max(1, int(n_wells * self.val_ratio))

        train_wells = shuffled_wells[:n_train]
        val_wells = shuffled_wells[n_train : n_train + n_val]
        test_wells = shuffled_wells[n_train + n_val :]

        if len(test_wells) == 0:
            logger.warning("No wells in test set! Reassigning from validation.")
            test_wells = [val_wells.pop()]

        split = {"train": train_wells, "val": val_wells, "test": test_wells}

        logger.info(
            f"Split {n_wells} wells: "
            f"train={len(train_wells)}, val={len(val_wells)}, test={len(test_wells)}"
        )
        logger.info(f"Train wells: {train_wells}")
        logger.info(f"Val wells: {val_wells}")
        logger.info(f"Test wells: {test_wells}")

        return split

    def split_dataset(
        self, data: Dict[str, pd.DataFrame]
    ) -> Tuple[
        Dict[str, pd.DataFrame], Dict[str, pd.DataFrame], Dict[str, pd.DataFrame]
    ]:
        """
        Split dataset dictionary by wells.

        Args:
            data: Dictionary mapping well_id to DataFrame

        Returns:
            Tuple of (train_data, val_data, test_data) dictionaries
        """
        well_ids = list(data.keys())
        split = self.split_wells(well_ids)

        train_data = {well: data[well] for well in split["train"]}
        val_data = {well: data[well] for well in split["val"]}
        test_data = {well: data[well] for well in split["test"]}

        # Log statistics
        train_samples = sum(len(df) for df in train_data.values())
        val_samples = sum(len(df) for df in val_data.values())
        test_samples = sum(len(df) for df in test_data.values())
        total_samples = train_samples + val_samples + test_samples

        logger.info(
            f"Sample distribution: "
            f"train={train_samples} ({train_samples/total_samples:.1%}), "
            f"val={val_samples} ({val_samples/total_samples:.1%}), "
            f"test={test_samples} ({test_samples/total_samples:.1%})"
        )

        return train_data, val_data, test_data

    def get_split_summary(
        self,
        train_data: Dict[str, pd.DataFrame],
        val_data: Dict[str, pd.DataFrame],
        test_data: Dict[str, pd.DataFrame],
    ) -> pd.DataFrame:
        """Generate summary statistics for each split."""
        summaries = []

        for split_name, split_data in [
            ("train", train_data),
            ("val", val_data),
            ("test", test_data),
        ]:
            for well_id, df in split_data.items():
                event_counts = (
                    df["event_type"].value_counts()
                    if "event_type" in df.columns
                    else {}
                )

                summaries.append(
                    {
                        "split": split_name,
                        "well_id": well_id,
                        "total_samples": len(df),
                        "duration_hours": len(df) / 3600,
                        "normal_samples": (
                            (df["event_type"] == 0).sum()
                            if "event_type" in df.columns
                            else 0
                        ),
                        "anomaly_samples": (
                            (df["event_type"] > 0).sum()
                            if "event_type" in df.columns
                            else 0
                        ),
                        "unique_events": len(event_counts),
                    }
                )

        return pd.DataFrame(summaries)


def validate_split_integrity(
    train_data: Dict[str, pd.DataFrame],
    val_data: Dict[str, pd.DataFrame],
    test_data: Dict[str, pd.DataFrame],
) -> bool:
    """
    Validate that splits don't overlap.

    Args:
        train_data: Training split
        val_data: Validation split
        test_data: Test split

    Returns:
        True if splits are valid (no overlap)

    Raises:
        AssertionError if validation fails
    """
    train_wells = set(train_data.keys())
    val_wells = set(val_data.keys())
    test_wells = set(test_data.keys())

    # Check no overlap
    assert train_wells.isdisjoint(val_wells), "Train and val splits overlap!"
    assert train_wells.isdisjoint(test_wells), "Train and test splits overlap!"
    assert val_wells.isdisjoint(test_wells), "Val and test splits overlap!"

    # Check all wells accounted for
    all_wells = train_wells | val_wells | test_wells
    logger.info(f"Split validation passed: {len(all_wells)} unique wells, no overlap")

    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    from loader import load_all_real_instances

    print("=" * 60)
    print("Well-Based Data Splitting")
    print("=" * 60)

    # Load data
    data = load_all_real_instances()
    print(f"\nLoaded {len(data)} wells")

    # Split data
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    # Validate split
    validate_split_integrity(train_data, val_data, test_data)

    # Print summary
    summary = splitter.get_split_summary(train_data, val_data, test_data)
    print("\nSplit Summary:")
    print(summary.to_string(index=False))

    # Aggregate by split
    print("\nAggregate Statistics:")
    agg_summary = (
        summary.groupby("split")
        .agg(
            {
                "well_id": "count",
                "total_samples": "sum",
                "duration_hours": "sum",
                "normal_samples": "sum",
                "anomaly_samples": "sum",
            }
        )
        .rename(columns={"well_id": "n_wells"})
    )
    print(agg_summary)
