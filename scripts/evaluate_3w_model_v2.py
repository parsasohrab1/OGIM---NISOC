"""
Evaluate OGIM Model on Petrobras 3W Dataset - Version 2

With evaluation methodology fixes:
- Binary Macro-F1 computation
- Transient onset lead time measurement  
- Leakage audit
- Bootstrap 95% confidence intervals
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
from validation.petrobras_3w.baselines import (
    RollingZScoreBaseline,
    StaticThresholdBaseline,
)
from validation.petrobras_3w.evaluator import (
    EventDetectionEvaluator,
    compute_binary_macro_f1,
    bootstrap_confidence_intervals,
)
from validation.petrobras_3w.leakage_audit import LeakageAuditor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

MODEL_DIR = (
    Path(__file__).parent.parent
    / "backend"
    / "ml-inference-service"
    / "models"
    / "3w_validation"
)
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def prepare_features_with_labels(data_dict, sequence_length=60):
    """Prepare features and preserve labels for evaluation."""
    all_features = []
    all_labels_df = []

    for well_id, df in data_dict.items():
        logger.info(f"Processing {well_id}...")

        # Adapt to OGIM schema (preserves class_label)
        df_ogim = adapt_3w_to_ogim(df, well_id)

        # OPTIMIZED: vectorized, downsampled, float32
        features_df = create_feature_vectors(
            df_ogim, sequence_length=sequence_length, downsample_seconds=10
        )

        # Merge labels back (for evaluation only, NOT features)
        # Get event_type and class_label at each timestamp
        label_df = (
            df_ogim[["timestamp", "event_type", "class_label"]]
            .drop_duplicates(subset=["timestamp"])
            .sort_values("timestamp")
        )

        # Merge on timestamp
        features_with_labels = features_df.merge(label_df, on="timestamp", how="left")

        all_features.append(features_with_labels)

    combined_df = pd.concat(all_features, ignore_index=True)

    # Extract labels
    y_event = combined_df["event_type"].fillna(0).astype(int).values
    y_class = combined_df["class_label"].fillna(0).astype(int).values

    # Extract features (NO label columns)
    feature_cols = [
        col
        for col in combined_df.columns
        if col not in ["timestamp", "well_id", "event_type", "class_label"]
    ]

    X = combined_df[feature_cols].fillna(0).values

    logger.info(f"Prepared {len(X)} samples with {X.shape[1]} features")

    return X, y_event, y_class, combined_df, feature_cols


def compute_metrics_with_cis(y_true, y_pred, df_with_labels):
    """Compute metrics with bootstrap 95% CIs."""
    from sklearn.metrics import recall_score, precision_score

    # Binary Macro-F1 with CI
    f1_mean, f1_lower, f1_upper = bootstrap_confidence_intervals(
        compute_binary_macro_f1, y_true, y_pred, n_bootstrap=1000
    )

    # Recall with CI
    def binary_recall(yt, yp):
        yt_bin = (yt > 0).astype(int)
        yp_bin = (yp > 0).astype(int)
        return recall_score(yt_bin, yp_bin, zero_division=0)

    recall_mean, recall_lower, recall_upper = bootstrap_confidence_intervals(
        binary_recall, y_true, y_pred, n_bootstrap=1000
    )

    # Precision with CI
    def binary_precision(yt, yp):
        yt_bin = (yt > 0).astype(int)
        yp_bin = (yp > 0).astype(int)
        return precision_score(yt_bin, yp_bin, zero_division=0)

    prec_mean, prec_lower, prec_upper = bootstrap_confidence_intervals(
        binary_precision, y_true, y_pred, n_bootstrap=1000
    )

    # Lead time to transient onset (single value, no CI for now - would need per-well bootstrap)
    # For simplicity, compute across all data
    from validation.petrobras_3w.evaluator import compute_lead_time_to_onset

    lead_time = compute_lead_time_to_onset(y_pred, df_with_labels, "class_label")

    metrics = {
        "binary_macro_f1": {
            "mean": float(f1_mean),
            "ci_lower": float(f1_lower),
            "ci_upper": float(f1_upper),
        },
        "recall": {
            "mean": float(recall_mean),
            "ci_lower": float(recall_lower),
            "ci_upper": float(recall_upper),
        },
        "precision": {
            "mean": float(prec_mean),
            "ci_lower": float(prec_lower),
            "ci_upper": float(prec_upper),
        },
        "lead_time_seconds": float(lead_time) if lead_time is not None else None,
    }

    logger.info(f"Binary Macro-F1: {f1_mean:.3f} [{f1_lower:.3f}, {f1_upper:.3f}]")
    logger.info(f"Recall: {recall_mean:.3f} [{recall_lower:.3f}, {recall_upper:.3f}]")
    logger.info(
        f"Precision: {prec_mean:.3f} [{prec_lower:.3f}, {prec_upper:.3f}]"
    )
    if lead_time is not None:
        logger.info(f"Lead Time to Onset: {lead_time:.1f}s")

    return metrics


def main():
    logger.info("=" * 80)
    logger.info("PETROBRAS 3W VALIDATION - EVALUATION (V2: Fixed Methodology)")
    logger.info("=" * 80)

    # Initialize leakage auditor
    auditor = LeakageAuditor()

    # Load data
    logger.info("\n[1/8] Loading Petrobras 3W dataset (40 instances per class)...")
    well_data_raw = load_all_real_instances(
        max_per_class=40,
        event_classes=[1, 2, 3, 4, 5, 6, 7, 8, 9],
        random_seed=42,
    )

    # Concatenate instances by well
    data = {}
    for well_id, dfs in well_data_raw.items():
        data[well_id] = pd.concat(dfs, ignore_index=True)

    logger.info(f"Loaded {len(data)} wells from REAL 3W data")

    # Split wells
    logger.info("\n[2/8] Splitting wells (group-based, no leakage)...")
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    logger.info(f"Train: {len(train_data)} wells")
    logger.info(f"Val: {len(val_data)} wells")
    logger.info(f"Test: {len(test_data)} wells")

    # Leakage check: split
    auditor.check_split_leakage(
        list(train_data.keys()) + list(val_data.keys()), list(test_data.keys())
    )

    # Prepare test features
    logger.info("\n[3/8] Preparing test features (optimized, vectorized)...")
    X_test, y_test_event, y_test_class, test_df, feature_cols = (
        prepare_features_with_labels(test_data, sequence_length=60)
    )

    # Leakage check: features
    auditor.check_feature_leakage(pd.DataFrame(X_test, columns=feature_cols))

    # Load models
    logger.info("\n[4/8] Loading trained models...")
    iso_forest = joblib.load(MODEL_DIR / "isolation_forest.joblib")
    rf_clf = joblib.load(MODEL_DIR / "random_forest_classifier.joblib")
    scaler = joblib.load(MODEL_DIR / "scaler.joblib")

    X_test_scaled = scaler.transform(X_test)

    # Evaluate OGIM models
    logger.info("\n[5/8] Evaluating OGIM models...")

    logger.info("\n--- Isolation Forest ---")
    iso_pred = iso_forest.predict(X_test_scaled)
    iso_pred = (iso_pred == -1).astype(int)  # -1 = anomaly

    iso_metrics = compute_metrics_with_cis(y_test_event, iso_pred, test_df)

    # Check for perfect separation
    auditor.check_perfect_separation(
        (y_test_event > 0).astype(int), iso_pred
    )

    logger.info("\n--- Random Forest ---")
    rf_pred = rf_clf.predict(X_test_scaled)

    rf_metrics = compute_metrics_with_cis(y_test_event, rf_pred, test_df)

    # Check for perfect separation
    auditor.check_perfect_separation((y_test_event > 0).astype(int), rf_pred)

    # Evaluate baselines
    logger.info("\n[6/8] Evaluating baselines...")

    # Prepare wide-format data for baselines
    test_data_for_baselines = {}
    for well_id, df in test_data.items():
        df_ogim = adapt_3w_to_ogim(df, well_id)
        # Pivot to wide
        df_wide = df_ogim.pivot_table(
            index="timestamp",
            columns="sensor_tag",
            values="value",
            aggfunc="first",
        ).reset_index()
        test_data_for_baselines[well_id] = df_wide

    logger.info("\n--- Z-Score Baseline ---")
    zscore_baseline = RollingZScoreBaseline(window=60, threshold=3.0, min_sensors=2)
    zscore_predictions = []
    for well_id, df_wide in test_data_for_baselines.items():
        zscore_baseline.fit(df_wide)  # Rolling, no actual training
        preds = zscore_baseline.predict(df_wide)
        zscore_predictions.extend(preds)

    zscore_pred = np.array(zscore_predictions)[: len(y_test_event)]
    zscore_metrics = compute_metrics_with_cis(y_test_event, zscore_pred, test_df)

    logger.info("\n--- Threshold Baseline ---")
    thresh_baseline = StaticThresholdBaseline(
        quantiles=(0.05, 0.95), min_consecutive=30
    )
    # Fit on train
    train_data_wide = {}
    for well_id, df in train_data.items():
        df_ogim = adapt_3w_to_ogim(df, well_id)
        df_wide = df_ogim.pivot_table(
            index="timestamp", columns="sensor_tag", values="value", aggfunc="first"
        ).reset_index()
        train_data_wide[well_id] = df_wide

    train_combined = pd.concat(train_data_wide.values(), ignore_index=True)
    thresh_baseline.fit(train_combined)

    thresh_predictions = []
    for well_id, df_wide in test_data_for_baselines.items():
        preds = thresh_baseline.predict(df_wide)
        thresh_predictions.extend(preds)

    thresh_pred = np.array(thresh_predictions)[: len(y_test_event)]
    thresh_metrics = compute_metrics_with_cis(y_test_event, thresh_pred, test_df)

    # Check baseline tie
    auditor.check_baseline_tie(
        rf_metrics["recall"]["mean"],
        0.0,  # FP rate not computed here, use 0 placeholder
        [zscore_metrics["recall"]["mean"], thresh_metrics["recall"]["mean"]],
        [0.0, 0.0],
    )

    # Count test events per class
    logger.info("\n[7/8] Counting test events per class...")
    test_events_by_class = {}
    for cls in range(1, 10):
        count = (y_test_class == cls).sum()
        test_events_by_class[cls] = int(count)
        logger.info(f"  Class {cls}: {count} samples")

    # Generate leakage audit report
    logger.info("\n[8/8] Generating leakage audit report...")
    audit_report = auditor.generate_report()

    # Check TRL5 criteria
    logger.info("\n" + "=" * 80)
    logger.info("TRL5 CRITERIA CHECK")
    logger.info("=" * 80)

    criteria_met = []

    # Use RF as best model
    recall_met = rf_metrics["recall"]["mean"] >= 0.75
    f1_met = rf_metrics["binary_macro_f1"]["mean"] >= 0.65
    lead_time = rf_metrics["lead_time_seconds"]
    lead_time_met = lead_time is not None and lead_time >= 60.0

    criteria_met.append(("Event Recall ≥0.75", recall_met, rf_metrics["recall"]["mean"]))
    criteria_met.append(
        ("Binary Macro-F1 ≥0.65", f1_met, rf_metrics["binary_macro_f1"]["mean"])
    )
    criteria_met.append(("Lead Time ≥60s", lead_time_met, lead_time))
    criteria_met.append(("Leakage Audit", audit_report["audit_status"] == "PASSED", audit_report["audit_status"]))

    for criterion, met, value in criteria_met:
        status = "✅ PASS" if met else "❌ FAIL"
        logger.info(f"{criterion}: {status} (value: {value})")

    all_met = all(met for _, met, _ in criteria_met)

    if all_met:
        trl_verdict = 5
        verdict_reason = "All TRL5 criteria met with fixed methodology"
    else:
        trl_verdict = 4
        failed = [name for name, met, _ in criteria_met if not met]
        verdict_reason = f"TRL4 maintained: {', '.join(failed)} not met"

    logger.info("\n" + "=" * 80)
    logger.info(f"FINAL TRL VERDICT: TRL{trl_verdict}")
    logger.info(f"REASONING: {verdict_reason}")
    logger.info("=" * 80)

    # Save results
    results = {
        "evaluation_date": datetime.utcnow().isoformat(),
        "dataset": "Petrobras 3W (REAL instances, 40 per class)",
        "methodology_version": "v2_fixed",
        "leakage_audit": audit_report,
        "test_wells": list(test_data.keys()),
        "test_samples": len(X_test),
        "test_events_by_class": test_events_by_class,
        "models": {
            "isolation_forest": iso_metrics,
            "random_forest": rf_metrics,
        },
        "baselines": {
            "zscore": zscore_metrics,
            "threshold": thresh_metrics,
        },
        "trl5_criteria": {
            "event_recall_threshold": 0.75,
            "macro_f1_threshold": 0.65,
            "lead_time_threshold": 60.0,
            "criteria_met": [
                {"criterion": name, "met": met, "value": value}
                for name, met, value in criteria_met
            ],
            "all_met": all_met,
        },
        "final_trl_verdict": trl_verdict,
        "verdict_reasoning": verdict_reason,
    }

    results_path = RESULTS_DIR / "3w_validation_results_v2.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    logger.info(f"\nResults saved to: {results_path}")

    return 0 if audit_report["audit_status"] == "PASSED" else 1


if __name__ == "__main__":
    sys.exit(main())
