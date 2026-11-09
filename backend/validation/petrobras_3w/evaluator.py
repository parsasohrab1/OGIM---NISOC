"""
Event-Level Evaluator for Anomaly Detection

Implements TRL5 acceptance criteria evaluation:
- Event detection recall
- False alarms per day
- Detection lead time
- Macro-F1 across event classes
"""

import logging
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

logger = logging.getLogger(__name__)


class EventDetectionEvaluator:
    """
    Evaluate anomaly detection at event level.

    Converts sample-level predictions to event-level metrics.
    """

    def __init__(self, detection_window: int = 300, min_event_duration: int = 10):
        """
        Args:
            detection_window: Time window (seconds) for matching predictions to events (±window)
            min_event_duration: Minimum samples for an event to be considered valid
        """
        self.detection_window = detection_window
        self.min_event_duration = min_event_duration

        logger.info(
            f"Evaluator initialized: detection_window=±{detection_window}s, "
            f"min_event_duration={min_event_duration}"
        )

    def extract_events(
        self, df: pd.DataFrame, label_col: str = "event_type"
    ) -> List[Dict]:
        """
        Extract discrete events from continuous labels.

        Args:
            df: DataFrame with timestamp and event labels
            label_col: Column name for event labels

        Returns:
            List of event dictionaries with start, end, duration, type
        """
        events = []
        current_event = None

        for idx, row in df.iterrows():
            event_type = row[label_col]
            timestamp = row.get("timestamp", idx)

            if event_type > 0:  # Anomaly
                if current_event is None:
                    # Start new event
                    current_event = {
                        "start_idx": idx,
                        "start_time": timestamp,
                        "event_type": event_type,
                    }
                elif current_event["event_type"] != event_type:
                    # Event type changed, close current and start new
                    current_event["end_idx"] = idx - 1
                    current_event["end_time"] = df.iloc[idx - 1].get(
                        "timestamp", idx - 1
                    )
                    current_event["duration"] = (
                        current_event["end_idx"] - current_event["start_idx"] + 1
                    )
                    events.append(current_event)

                    current_event = {
                        "start_idx": idx,
                        "start_time": timestamp,
                        "event_type": event_type,
                    }
            else:
                # Normal operation
                if current_event is not None:
                    # Close current event
                    current_event["end_idx"] = idx - 1
                    current_event["end_time"] = df.iloc[idx - 1].get(
                        "timestamp", idx - 1
                    )
                    current_event["duration"] = (
                        current_event["end_idx"] - current_event["start_idx"] + 1
                    )
                    events.append(current_event)
                    current_event = None

        # Close final event if open
        if current_event is not None:
            current_event["end_idx"] = len(df) - 1
            current_event["end_time"] = df.iloc[-1].get("timestamp", len(df) - 1)
            current_event["duration"] = (
                current_event["end_idx"] - current_event["start_idx"] + 1
            )
            events.append(current_event)

        # Filter by minimum duration
        events = [e for e in events if e["duration"] >= self.min_event_duration]

        logger.info(
            f"Extracted {len(events)} events (min_duration={self.min_event_duration})"
        )
        return events

    def match_predictions_to_events(
        self,
        ground_truth_events: List[Dict],
        predictions: np.ndarray,
        df: pd.DataFrame,
    ) -> Tuple[List[Dict], int]:
        """
        Match predictions to ground truth events.

        Args:
            ground_truth_events: List of ground truth events
            predictions: Binary prediction array
            df: DataFrame with timestamps

        Returns:
            Tuple of (matched_events, false_positives)
        """
        matched_events = []
        used_predictions = set()

        for gt_event in ground_truth_events:
            start_idx = gt_event["start_idx"]
            end_idx = gt_event["end_idx"]

            # Expand search window
            search_start = max(0, start_idx - self.detection_window)
            search_end = min(len(predictions) - 1, end_idx + self.detection_window)

            # Find first prediction in window
            first_detection_idx = None
            for idx in range(search_start, search_end + 1):
                if predictions[idx] == 1 and idx not in used_predictions:
                    first_detection_idx = idx
                    break

            if first_detection_idx is not None:
                # Event detected
                lead_time = (
                    start_idx - first_detection_idx
                )  # Positive = early, negative = late

                matched_event = gt_event.copy()
                matched_event["detected"] = True
                matched_event["detection_idx"] = first_detection_idx
                matched_event["lead_time"] = lead_time
                matched_events.append(matched_event)

                # Mark all predictions in event window as used
                for idx in range(search_start, search_end + 1):
                    if predictions[idx] == 1:
                        used_predictions.add(idx)
            else:
                # Event missed
                matched_event = gt_event.copy()
                matched_event["detected"] = False
                matched_events.append(matched_event)

        # Count false positives (predictions not matched to any event)
        total_predictions = np.sum(predictions)
        false_positives = total_predictions - len(used_predictions)

        logger.info(
            f"Matched {len([e for e in matched_events if e['detected']])} / "
            f"{len(ground_truth_events)} events, {false_positives} false positives"
        )

        return matched_events, int(false_positives)

    def compute_metrics(
        self,
        ground_truth: np.ndarray,
        predictions: np.ndarray,
        df: pd.DataFrame,
        label_col: str = "event_type",
    ) -> Dict:
        """
        Compute comprehensive evaluation metrics.

        Args:
            ground_truth: Ground truth labels
            predictions: Model predictions
            df: DataFrame with timestamps and labels
            label_col: Column name for event labels

        Returns:
            Dictionary of metrics
        """
        # Extract events from ground truth
        gt_events = self.extract_events(df, label_col=label_col)

        # Match predictions to events
        matched_events, false_positives = self.match_predictions_to_events(
            gt_events, predictions, df
        )

        # Event detection recall
        detected_events = [e for e in matched_events if e["detected"]]
        event_recall = (
            len(detected_events) / len(gt_events) if len(gt_events) > 0 else 0.0
        )

        # False alarms per day
        total_days = len(df) / (3600 * 24)  # Assume 1 Hz sampling
        false_alarms_per_day = false_positives / total_days if total_days > 0 else 0.0

        # Detection lead time (median of detected events)
        lead_times = [e["lead_time"] for e in detected_events]
        median_lead_time = np.median(lead_times) if lead_times else 0.0

        # Sample-level metrics
        from sklearn.metrics import precision_recall_fscore_support

        binary_gt = (ground_truth > 0).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(
            binary_gt, predictions, average="binary", zero_division=0
        )

        # Macro-F1 across event classes (if multiple classes present)
        unique_classes = np.unique(ground_truth)
        if len(unique_classes) > 2:
            _, _, macro_f1, _ = precision_recall_fscore_support(
                ground_truth, predictions, average="macro", zero_division=0
            )
        else:
            macro_f1 = f1

        metrics = {
            # Event-level metrics (TRL5 criteria)
            "event_detection_recall": event_recall,
            "false_alarms_per_day": false_alarms_per_day,
            "detection_lead_time_median": median_lead_time,
            "macro_f1": macro_f1,
            # Additional event-level stats
            "total_events": len(gt_events),
            "detected_events": len(detected_events),
            "missed_events": len(gt_events) - len(detected_events),
            "false_positive_events": false_positives,
            # Sample-level metrics
            "sample_precision": precision,
            "sample_recall": recall,
            "sample_f1": f1,
            # Event details
            "events": matched_events,
        }

        logger.info(
            f"Metrics: event_recall={event_recall:.3f}, "
            f"FP/day={false_alarms_per_day:.2f}, "
            f"lead_time={median_lead_time:.1f}s, "
            f"macro_F1={macro_f1:.3f}"
        )

        return metrics

    def check_trl5_criteria(self, metrics: Dict) -> Tuple[bool, List[str]]:
        """
        Check if metrics meet TRL5 acceptance criteria.

        Args:
            metrics: Metrics dictionary from compute_metrics()

        Returns:
            Tuple of (passed, list of failure reasons)
        """
        failures = []

        # Criterion 1: Event Detection Recall ≥ 0.75
        if metrics["event_detection_recall"] < 0.75:
            failures.append(
                f"Event recall {metrics['event_detection_recall']:.3f} < 0.75"
            )

        # Criterion 2: False Alarms per Day ≤ 3.0
        if metrics["false_alarms_per_day"] > 3.0:
            failures.append(
                f"False alarms/day {metrics['false_alarms_per_day']:.2f} > 3.0"
            )

        # Criterion 3: Macro-F1 ≥ 0.65
        if metrics["macro_f1"] < 0.65:
            failures.append(f"Macro-F1 {metrics['macro_f1']:.3f} < 0.65")

        # Criterion 4: Detection Lead Time ≥ 60 seconds
        if metrics["detection_lead_time_median"] < 60:
            failures.append(
                f"Lead time {metrics['detection_lead_time_median']:.1f}s < 60s"
            )

        passed = len(failures) == 0
        return passed, failures


def compare_to_baseline(model_metrics: Dict, baseline_metrics: Dict) -> Dict:
    """
    Compare model metrics to baseline.

    Args:
        model_metrics: Model evaluation metrics
        baseline_metrics: Baseline evaluation metrics

    Returns:
        Comparison dictionary
    """
    comparison = {
        "model_better": False,
        "details": {},
    }

    # Check recall improvement
    recall_improvement = (
        model_metrics["event_detection_recall"]
        - baseline_metrics["event_detection_recall"]
    )
    comparison["details"]["recall_improvement"] = recall_improvement

    # Check false alarm reduction
    fp_reduction = (
        baseline_metrics["false_alarms_per_day"] - model_metrics["false_alarms_per_day"]
    )
    comparison["details"]["fp_reduction"] = fp_reduction

    # Model is better if:
    # 1. Higher recall than baseline, OR
    # 2. Equal recall AND ≥20% fewer false alarms
    if recall_improvement > 0:
        comparison["model_better"] = True
        comparison["reason"] = "Higher recall than baseline"
    elif (
        recall_improvement == 0
        and fp_reduction >= 0.2 * baseline_metrics["false_alarms_per_day"]
    ):
        comparison["model_better"] = True
        comparison["reason"] = "Equal recall with 20%+ fewer false alarms"
    else:
        comparison["model_better"] = False
        comparison["reason"] = "Did not beat baseline"

    logger.info(
        f"Baseline comparison: {comparison['reason']} "
        f"(recall_delta={recall_improvement:.3f}, fp_reduction={fp_reduction:.2f})"
    )

    return comparison


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("=" * 60)
    print("Event-Level Evaluator Demo")
    print("=" * 60)

    # Create synthetic test data
    np.random.seed(42)
    n_samples = 3600

    # Ground truth: 3 events
    ground_truth = np.zeros(n_samples, dtype=int)
    ground_truth[500:700] = 1  # Event 1
    ground_truth[1500:1650] = 2  # Event 2
    ground_truth[2800:3000] = 1  # Event 3

    # Predictions: detect most events with some delay and false positives
    predictions = np.zeros(n_samples, dtype=int)
    predictions[550:750] = 1  # Event 1 detected (50s late)
    predictions[1450:1700] = 1  # Event 2 detected (50s early)
    predictions[1200:1230] = 1  # False positive

    # Create DataFrame
    df = pd.DataFrame(
        {
            "timestamp": pd.date_range("2017-01-01", periods=n_samples, freq="1s"),
            "event_type": ground_truth,
        }
    )

    # Evaluate
    evaluator = EventDetectionEvaluator(detection_window=300, min_event_duration=10)
    metrics = evaluator.compute_metrics(ground_truth, predictions, df)

    print(f"\nEvent Detection Recall: {metrics['event_detection_recall']:.3f}")
    print(f"False Alarms per Day: {metrics['false_alarms_per_day']:.2f}")
    print(f"Detection Lead Time (median): {metrics['detection_lead_time_median']:.1f}s")
    print(f"Macro-F1: {metrics['macro_f1']:.3f}")

    print(f"\nTotal Events: {metrics['total_events']}")
    print(f"Detected Events: {metrics['detected_events']}")
    print(f"Missed Events: {metrics['missed_events']}")

    # Check TRL5 criteria
    passed, failures = evaluator.check_trl5_criteria(metrics)
    print(f"\nTRL5 Criteria: {'PASSED' if passed else 'FAILED'}")
    if not passed:
        print("Failures:")
        for failure in failures:
            print(f"  - {failure}")
