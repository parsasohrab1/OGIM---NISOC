"""
Baseline Models for Anomaly Detection

Implements simple baselines for comparison:
1. Rolling Z-Score Threshold
2. Static Threshold Rules
"""

import logging
from typing import Dict, List

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class RollingZScoreBaseline:
    """
    Rolling Z-Score baseline detector.

    Flags anomalies when |z| > threshold on any sensor,
    with voting aggregation across sensors.
    """

    def __init__(
        self,
        window_size: int = 60,
        z_threshold: float = 3.0,
        min_sensors_trigger: int = 2,
    ):
        """
        Args:
            window_size: Rolling window size (samples)
            z_threshold: Z-score threshold for anomaly
            min_sensors_trigger: Minimum sensors that must trigger for event
        """
        self.window_size = window_size
        self.z_threshold = z_threshold
        self.min_sensors_trigger = min_sensors_trigger

        logger.info(
            f"Z-Score Baseline: window={window_size}, "
            f"threshold={z_threshold}, min_sensors={min_sensors_trigger}"
        )

    def fit(self, df: pd.DataFrame) -> None:
        """
        Fit baseline (no-op for rolling z-score, but kept for interface consistency).

        Args:
            df: Training DataFrame (wide format with sensor columns)
        """
        logger.info("Z-Score baseline does not require training (rolling statistics)")

    def predict(self, df: pd.DataFrame, sensor_cols: List[str]) -> np.ndarray:
        """
        Predict anomalies using rolling z-score.

        Args:
            df: DataFrame with sensor columns
            sensor_cols: List of sensor column names

        Returns:
            Binary array (1=anomaly, 0=normal)
        """
        predictions = np.zeros(len(df), dtype=int)

        for i in range(self.window_size, len(df)):
            window_start = i - self.window_size
            triggered_sensors = 0

            for col in sensor_cols:
                window_values = df[col].iloc[window_start:i].values
                current_value = df[col].iloc[i]

                # Compute z-score
                mean = np.mean(window_values)
                std = np.std(window_values)

                if std > 0:
                    z_score = abs((current_value - mean) / std)
                    if z_score > self.z_threshold:  # noqa: E226
                        triggered_sensors += 1

            # Vote: anomaly if enough sensors trigger
            if triggered_sensors >= self.min_sensors_trigger:
                predictions[i] = 1

        logger.info(
            f"Z-Score baseline detected {predictions.sum()} / {len(predictions)} "
            f"({predictions.sum() / len(predictions):.2%}) anomalies"
        )
        return predictions


class StaticThresholdBaseline:
    """
    Static threshold baseline detector.

    Uses training data quantiles to set per-sensor thresholds.
    Flags anomalies when values exceed thresholds for sustained period.
    """

    def __init__(
        self,
        lower_quantile: float = 0.05,
        upper_quantile: float = 0.95,
        min_consecutive: int = 30,
    ):
        """
        Args:
            lower_quantile: Lower threshold quantile
            upper_quantile: Upper threshold quantile
            min_consecutive: Minimum consecutive violations to flag anomaly
        """
        self.lower_quantile = lower_quantile
        self.upper_quantile = upper_quantile
        self.min_consecutive = min_consecutive
        self.thresholds = {}

        logger.info(
            f"Threshold Baseline: quantiles=({lower_quantile}, {upper_quantile}), "
            f"min_consecutive={min_consecutive}"
        )

    def fit(self, df: pd.DataFrame, sensor_cols: List[str]) -> None:
        """
        Fit thresholds from training data.

        Args:
            df: Training DataFrame (wide format)
            sensor_cols: List of sensor column names
        """
        for col in sensor_cols:
            values = df[col].dropna().values
            lower = np.quantile(values, self.lower_quantile)
            upper = np.quantile(values, self.upper_quantile)
            self.thresholds[col] = {"lower": lower, "upper": upper}

        logger.info(f"Fitted thresholds for {len(self.thresholds)} sensors")
        for col, thresh in self.thresholds.items():
            logger.debug(f"  {col}: [{thresh['lower']:.2f}, {thresh['upper']:.2f}]")

    def predict(self, df: pd.DataFrame, sensor_cols: List[str]) -> np.ndarray:
        """
        Predict anomalies using static thresholds.

        Args:
            df: DataFrame with sensor columns
            sensor_cols: List of sensor column names

        Returns:
            Binary array (1=anomaly, 0=normal)
        """
        if not self.thresholds:
            raise RuntimeError("Must call fit() before predict()")

        predictions = np.zeros(len(df), dtype=int)

        for col in sensor_cols:
            if col not in self.thresholds:
                continue

            values = df[col].values
            lower = self.thresholds[col]["lower"]
            upper = self.thresholds[col]["upper"]

            # Find violations
            violations = (values < lower) | (values > upper)

            # Find consecutive violations
            consecutive_count = 0
            for i, is_violation in enumerate(violations):
                if is_violation:
                    consecutive_count += 1
                    if consecutive_count >= self.min_consecutive:  # noqa: E226
                        # Mark this and previous samples as anomalies
                        start_idx = max(0, i - consecutive_count + 1)
                        predictions[start_idx : i + 1] = 1
                else:
                    consecutive_count = 0

        logger.info(
            f"Threshold baseline detected {predictions.sum()} / {len(predictions)} "
            f"({predictions.sum() / len(predictions):.2%}) anomalies"
        )
        return predictions


def evaluate_baseline(
    baseline,
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    sensor_cols: List[str],
) -> Dict:
    """
    Evaluate a baseline model.

    Args:
        baseline: Baseline model instance
        train_df: Training DataFrame (for fitting)
        test_df: Test DataFrame
        sensor_cols: Sensor column names

    Returns:
        Dictionary of evaluation metrics
    """
    # Fit baseline
    (
        baseline.fit(train_df, sensor_cols)
        if hasattr(baseline, "fit")
        else baseline.fit(train_df)
    )

    # Predict
    predictions = baseline.predict(test_df, sensor_cols)

    # Get ground truth
    if "event_type" in test_df.columns:
        ground_truth = (test_df["event_type"] > 0).astype(int).values
    elif "class" in test_df.columns:
        ground_truth = (test_df["class"] > 0).astype(int).values
    else:
        raise ValueError("No ground truth labels found in test data")

    # Compute metrics
    from sklearn.metrics import precision_recall_fscore_support, confusion_matrix

    precision, recall, f1, _ = precision_recall_fscore_support(
        ground_truth, predictions, average="binary", zero_division=0
    )

    tn, fp, fn, tp = confusion_matrix(ground_truth, predictions, labels=[0, 1]).ravel()

    # False alarms per day
    total_days = len(test_df) / (3600 * 24)  # Assume 1 Hz sampling
    false_alarms_per_day = fp / total_days if total_days > 0 else 0

    metrics = {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
        "false_alarms_per_day": false_alarms_per_day,
    }

    logger.info(f"Baseline metrics: {metrics}")
    return metrics


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    from loader import load_all_real_instances
    from splitter import WellGroupSplitter

    print("=" * 60)
    print("Baseline Model Evaluation")
    print("=" * 60)

    # Load and split data
    data = load_all_real_instances()
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    # Concatenate data
    train_df = pd.concat(train_data.values(), ignore_index=True)
    test_df = pd.concat(test_data.values(), ignore_index=True)

    # Identify sensor columns
    sensor_cols = [
        "P-PDG",
        "P-TPT",
        "T-TPT",
        "P-MON-CKP",
        "T-JUS-CKP",
        "P-JUS-CKGL",
        "T-JUS-CKGL",
        "QGL",
    ]
    sensor_cols = [col for col in sensor_cols if col in train_df.columns]

    print(
        f"\nEvaluating on {len(test_df)} test samples with {len(sensor_cols)} sensors"
    )

    # Evaluate Z-Score baseline
    print("\n" + "=" * 60)
    print("1. Rolling Z-Score Baseline")
    print("=" * 60)
    zscore_baseline = RollingZScoreBaseline(
        window_size=60, z_threshold=3.0, min_sensors_trigger=2
    )
    zscore_metrics = evaluate_baseline(zscore_baseline, train_df, test_df, sensor_cols)
    print(f"Recall: {zscore_metrics['recall']:.3f}")
    print(f"Precision: {zscore_metrics['precision']:.3f}")
    print(f"F1: {zscore_metrics['f1']:.3f}")
    print(f"False Alarms/Day: {zscore_metrics['false_alarms_per_day']:.2f}")

    # Evaluate Threshold baseline
    print("\n" + "=" * 60)
    print("2. Static Threshold Baseline")
    print("=" * 60)
    threshold_baseline = StaticThresholdBaseline(
        lower_quantile=0.05, upper_quantile=0.95, min_consecutive=30
    )
    threshold_metrics = evaluate_baseline(
        threshold_baseline, train_df, test_df, sensor_cols
    )
    print(f"Recall: {threshold_metrics['recall']:.3f}")
    print(f"Precision: {threshold_metrics['precision']:.3f}")
    print(f"F1: {threshold_metrics['f1']:.3f}")
    print(f"False Alarms/Day: {threshold_metrics['false_alarms_per_day']:.2f}")
