"""
Evaluate OGIM Model on Petrobras 3W Dataset

Performs comprehensive evaluation against TRL5 acceptance criteria.
Compares against baselines and generates final report.
"""

import json
import logging
import sys
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from validation.petrobras_3w.loader import load_all_real_instances
from validation.petrobras_3w.adapter import adapt_3w_to_ogim, create_feature_vectors
from validation.petrobras_3w.splitter import WellGroupSplitter
from validation.petrobras_3w.baselines import RollingZScoreBaseline, StaticThresholdBaseline
from validation.petrobras_3w.evaluator import EventDetectionEvaluator, compare_to_baseline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "backend" / "ml-inference-service" / "models" / "3w_validation"
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def prepare_test_features(test_data, sequence_length=60):
    """Prepare features from test data."""
    all_features = []
    all_dfs = []

    for well_id, df in test_data.items():
        logger.info(f"Processing test well {well_id}...")

        # Keep original df for evaluation
        df_ogim = adapt_3w_to_ogim(df, well_id)
        features_df = create_feature_vectors(df_ogim, sequence_length=sequence_length)

        # Add labels
        df_ogim_pivot = df_ogim.pivot_table(
            index="timestamp",
            columns="sensor_tag",
            values="event_type",
            aggfunc="first",
        ).reset_index()

        features_df = features_df.merge(
            df_ogim_pivot[["timestamp"]].assign(
                event_type=df_ogim_pivot.iloc[:, 1:].max(axis=1)
            ),
            on="timestamp",
            how="left",
        )

        all_features.append(features_df)
        all_dfs.append(df.assign(well_id=well_id))

    features_df = pd.concat(all_features, ignore_index=True)
    raw_df = pd.concat(all_dfs, ignore_index=True)

    labels = features_df["event_type"].fillna(0).astype(int).values

    feature_cols = [
        col
        for col in features_df.columns
        if col not in ["timestamp", "well_id", "event_type"]
    ]
    X = features_df[feature_cols].fillna(0).values

    logger.info(f"Prepared {len(X)} test samples")
    return X, labels, features_df, raw_df


def evaluate_model(model, X, y, df, model_name):
    """Evaluate a model."""
    logger.info(f"\nEvaluating {model_name}...")

    predictions = model.predict(X)

    # Handle Isolation Forest output (-1 for anomaly)
    if hasattr(model, "predict") and np.any(predictions == -1):
        predictions = (predictions == -1).astype(int)

    # Event-level evaluation
    evaluator = EventDetectionEvaluator(detection_window=300, min_event_duration=10)
    metrics = evaluator.compute_metrics(y, predictions, df, label_col="event_type")

    # Check TRL5 criteria
    passed, failures = evaluator.check_trl5_criteria(metrics)

    # Remove event details for JSON serialization
    metrics_clean = {k: v for k, v in metrics.items() if k != "events"}

    # Add TRL5 check results
    metrics_clean["trl5_passed"] = passed
    metrics_clean["trl5_failures"] = failures
    metrics_clean["model_name"] = model_name

    logger.info(f"{model_name} - Event Recall: {metrics['event_detection_recall']:.3f}")
    logger.info(f"{model_name} - FP/day: {metrics['false_alarms_per_day']:.2f}")
    logger.info(f"{model_name} - Lead Time: {metrics['detection_lead_time_median']:.1f}s")
    logger.info(f"{model_name} - Macro-F1: {metrics['macro_f1']:.3f}")
    logger.info(f"{model_name} - TRL5: {'PASSED' if passed else 'FAILED'}")

    return metrics_clean


def evaluate_baseline_on_raw(baseline, train_df, test_df, baseline_name):
    """Evaluate baseline on raw 3W data."""
    logger.info(f"\nEvaluating {baseline_name}...")

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

    # Fit baseline
    if hasattr(baseline, "fit"):
        if "sensor_cols" in baseline.fit.__code__.co_varnames:
            baseline.fit(train_df, sensor_cols)
        else:
            baseline.fit(train_df)

    # Predict
    predictions = baseline.predict(test_df, sensor_cols)

    # Ensure we have event_type or class column
    if "event_type" in test_df.columns:
        y = test_df["event_type"].values
    elif "class" in test_df.columns:
        y = test_df["class"].values
    else:
        raise ValueError("No ground truth column found")

    # Event-level evaluation
    evaluator = EventDetectionEvaluator(detection_window=300, min_event_duration=10)
    metrics = evaluator.compute_metrics(y, predictions, test_df, label_col="event_type" if "event_type" in test_df.columns else "class")

    # Remove event details
    metrics_clean = {k: v for k, v in metrics.items() if k != "events"}
    metrics_clean["model_name"] = baseline_name

    logger.info(f"{baseline_name} - Event Recall: {metrics['event_detection_recall']:.3f}")
    logger.info(f"{baseline_name} - FP/day: {metrics['false_alarms_per_day']:.2f}")
    logger.info(f"{baseline_name} - Macro-F1: {metrics['macro_f1']:.3f}")

    return metrics_clean


def main():
    """Main evaluation pipeline."""
    logger.info("=" * 80)
    logger.info("OGIM 3W Validation - Model Evaluation")
    logger.info("=" * 80)

    # Load data
    logger.info("\n[1/7] Loading Petrobras 3W dataset...")
    data = load_all_real_instances()

    # Split data
    logger.info("\n[2/7] Splitting data...")
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    logger.info(f"Test wells: {list(test_data.keys())}")

    # Prepare test features
    logger.info("\n[3/7] Preparing test features...")
    X_test, y_test, features_df, raw_test_df = prepare_test_features(test_data, sequence_length=60)

    # Load models
    logger.info("\n[4/7] Loading trained models...")

    scaler = joblib.load(MODEL_DIR / "scaler.joblib")
    X_test_scaled = scaler.transform(X_test)

    iso_forest = joblib.load(MODEL_DIR / "isolation_forest.joblib")
    rf_classifier = joblib.load(MODEL_DIR / "random_forest_classifier.joblib")

    with open(MODEL_DIR / "metadata.json") as f:
        metadata = json.load(f)

    logger.info(f"Models trained on: {metadata['training_date']}")
    logger.info(f"Training wells: {metadata['train_wells']}")

    # Evaluate OGIM models
    logger.info("\n[5/7] Evaluating OGIM models on test set...")

    iso_metrics = evaluate_model(iso_forest, X_test_scaled, y_test, features_df, "Isolation Forest")
    rf_metrics = evaluate_model(rf_classifier, X_test_scaled, y_test, features_df, "Random Forest Classifier")

    # Select best OGIM model
    if rf_metrics["event_detection_recall"] >= iso_metrics["event_detection_recall"]:
        best_ogim_metrics = rf_metrics
        best_ogim_name = "Random Forest Classifier"
    else:
        best_ogim_metrics = iso_metrics
        best_ogim_name = "Isolation Forest"

    logger.info(f"\nBest OGIM model: {best_ogim_name}")

    # Evaluate baselines
    logger.info("\n[6/7] Evaluating baselines...")

    # Prepare raw data for baselines
    train_df = pd.concat(train_data.values(), ignore_index=True)
    test_df = pd.concat(test_data.values(), ignore_index=True)

    zscore_baseline = RollingZScoreBaseline(window_size=60, z_threshold=3.0, min_sensors_trigger=2)
    zscore_metrics = evaluate_baseline_on_raw(zscore_baseline, train_df, test_df, "Z-Score Baseline")

    threshold_baseline = StaticThresholdBaseline(
        lower_quantile=0.05, upper_quantile=0.95, min_consecutive=30
    )
    threshold_metrics = evaluate_baseline_on_raw(threshold_baseline, train_df, test_df, "Threshold Baseline")

    # Select better baseline
    if zscore_metrics["event_detection_recall"] >= threshold_metrics["event_detection_recall"]:
        better_baseline_metrics = zscore_metrics
        better_baseline_name = "Z-Score Baseline"
    else:
        better_baseline_metrics = threshold_metrics
        better_baseline_name = "Threshold Baseline"

    # Compare to baseline
    logger.info("\n[7/7] Comparing OGIM model to baselines...")

    comparison = compare_to_baseline(best_ogim_metrics, better_baseline_metrics)

    # Determine final TRL verdict
    trl5_criteria_met = best_ogim_metrics.get("trl5_passed", False)
    beats_baseline = comparison["model_better"]

    final_trl = 5 if (trl5_criteria_met and beats_baseline) else 4

    # Compile final results
    results = {
        "evaluation_date": datetime.utcnow().isoformat(),
        "dataset": "Petrobras 3W (REAL instances only)",
        "test_wells": list(test_data.keys()),
        "test_samples": len(X_test),
        "models": {
            "isolation_forest": iso_metrics,
            "random_forest": rf_metrics,
        },
        "baselines": {
            "zscore": zscore_metrics,
            "threshold": threshold_metrics,
        },
        "best_ogim_model": {
            "name": best_ogim_name,
            "metrics": best_ogim_metrics,
        },
        "better_baseline": {
            "name": better_baseline_name,
            "metrics": better_baseline_metrics,
        },
        "comparison": comparison,
        "trl5_criteria": {
            "event_recall_threshold": 0.75,
            "false_alarms_per_day_threshold": 3.0,
            "macro_f1_threshold": 0.65,
            "lead_time_threshold": 60.0,
            "all_criteria_met": trl5_criteria_met,
            "beats_baseline": beats_baseline,
        },
        "final_trl_verdict": final_trl,
        "verdict_reasoning": (
            "TRL5 ACHIEVED: All acceptance criteria met and model beats baseline"
            if final_trl == 5
            else f"TRL4 MAINTAINED: {'Criteria not met' if not trl5_criteria_met else 'Did not beat baseline'}"
        ),
    }

    # Save results
    results_path = RESULTS_DIR / "3w_validation_results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    logger.info("\n" + "=" * 80)
    logger.info("EVALUATION COMPLETE")
    logger.info("=" * 80)
    logger.info(f"\nFinal TRL Verdict: TRL{final_trl}")
    logger.info(f"Reasoning: {results['verdict_reasoning']}")
    logger.info(f"\nResults saved to: {results_path}")
    logger.info("=" * 80)

    # Print summary table
    print("\n" + "=" * 80)
    print("METRICS SUMMARY")
    print("=" * 80)

    summary_data = {
        "Model": [best_ogim_name, better_baseline_name, "TRL5 Threshold"],
        "Event Recall": [
            f"{best_ogim_metrics['event_detection_recall']:.3f}",
            f"{better_baseline_metrics['event_detection_recall']:.3f}",
            "≥0.750",
        ],
        "FP/Day": [
            f"{best_ogim_metrics['false_alarms_per_day']:.2f}",
            f"{better_baseline_metrics['false_alarms_per_day']:.2f}",
            "≤3.00",
        ],
        "Macro-F1": [
            f"{best_ogim_metrics['macro_f1']:.3f}",
            f"{better_baseline_metrics['macro_f1']:.3f}",
            "≥0.650",
        ],
        "Lead Time (s)": [
            f"{best_ogim_metrics['detection_lead_time_median']:.1f}",
            f"{better_baseline_metrics['detection_lead_time_median']:.1f}",
            "≥60.0",
        ],
    }

    summary_df = pd.DataFrame(summary_data)
    print(summary_df.to_string(index=False))
    print("=" * 80)

    return final_trl


if __name__ == "__main__":
    final_trl = main()
    sys.exit(0 if final_trl == 5 else 1)
