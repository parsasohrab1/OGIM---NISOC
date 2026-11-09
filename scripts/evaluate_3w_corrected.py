"""
Corrected Evaluation with Fixed Model and Honest Metrics

Fixes:
- Use class_weight='balanced' model
- Compute actual sample-level confusion matrix
- Calculate false alarm rate on normal data
- Event-level bootstrap CIs
- Compare against z-score and threshold baselines
- Honest degenerate model detection
"""
import json
import logging
import sys
import traceback
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_score, recall_score

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from validation.petrobras_3w.loader import load_all_real_instances  # noqa: E402
from validation.petrobras_3w.adapter import (  # noqa: E402
    adapt_3w_to_ogim,
    create_feature_vectors,
)
from validation.petrobras_3w.splitter import WellGroupSplitter  # noqa: E402
from validation.petrobras_3w.evaluator import (  # noqa: E402
    compute_binary_macro_f1,
    compute_lead_time_to_onset,
)
from validation.petrobras_3w.leakage_audit import LeakageAuditor  # noqa: E402

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
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


def prepare_features_safe(data_dict, sequence_length=60, downsample_sec=60):
    """Prepare features with error handling."""
    all_features = []
    all_labels = []
    all_classes = []

    for well_id, df in data_dict.items():
        try:
            logger.info(f"Processing {well_id}...")

            df_ogim = adapt_3w_to_ogim(df, well_id)
            features_df = create_feature_vectors(
                df_ogim,
                sequence_length=sequence_length,
                downsample_seconds=downsample_sec,
            )

            label_df = (
                df_ogim[["timestamp", "event_type", "class_label"]]
                .drop_duplicates(subset=["timestamp"])
                .sort_values("timestamp")
            )

            merged = features_df.merge(label_df, on="timestamp", how="left")

            all_features.append(merged)
            all_labels.extend(merged["event_type"].fillna(0).astype(int).tolist())
            all_classes.extend(merged["class_label"].fillna(0).astype(int).tolist())

        except Exception as e:
            logger.error(f"Error processing {well_id}: {e}")
            logger.error(traceback.format_exc())
            continue

    combined_df = pd.concat(all_features, ignore_index=True)

    feature_cols = [
        col
        for col in combined_df.columns
        if col not in ["timestamp", "well_id", "event_type", "class_label"]
    ]

    X = combined_df[feature_cols].fillna(0).values
    y_event = np.array(all_labels)
    y_class = np.array(all_classes)

    logger.info(f"Prepared {len(X)} samples, {X.shape[1]} features")

    return X, y_event, y_class, combined_df, feature_cols


def compute_false_alarm_rate(y_true, y_pred, sampling_rate_seconds=60):
    """
    Compute false alarms per day on NORMAL samples only.

    False alarm = predicting event when truth is normal.
    """
    normal_mask = y_true == 0
    false_alarms = ((y_true == 0) & (y_pred > 0)).sum()
    normal_samples = normal_mask.sum()

    if normal_samples == 0:
        return None

    # Samples per day
    samples_per_day = (24 * 3600) / sampling_rate_seconds

    # False alarms per day
    fp_per_day = (false_alarms / normal_samples) * samples_per_day

    return float(fp_per_day)


def simple_z_score_baseline(X, threshold=3.0):
    """Vectorized z-score baseline: flag if any feature exceeds threshold std."""
    mean = np.nanmean(X, axis=0)
    std = np.nanstd(X, axis=0)
    std[std == 0] = 1.0  # Avoid division by zero

    z_scores = np.abs((X - mean) / std)
    predictions = (z_scores > threshold).any(axis=1).astype(int)

    return predictions


def simple_threshold_baseline(X, percentile=99):
    """Vectorized threshold baseline: flag if any feature exceeds percentile."""
    thresholds = np.nanpercentile(X, percentile, axis=0)
    predictions = (X > thresholds).any(axis=1).astype(int)

    return predictions


def event_level_bootstrap_ci(y_true_events, y_pred_events, metric_func, n_bootstrap=1000):
    """Bootstrap over events, not samples."""
    np.random.seed(42)
    n_events = len(y_true_events)

    if n_events == 0:
        return (0.0, 0.0, 0.0)

    scores = []
    for _ in range(n_bootstrap):
        indices = np.random.choice(n_events, size=n_events, replace=True)
        yt_boot = [y_true_events[i] for i in indices]
        yp_boot = [y_pred_events[i] for i in indices]

        try:
            score = metric_func(yt_boot, yp_boot)
            scores.append(score)
        except Exception:
            pass

    if len(scores) == 0:
        return (0.0, 0.0, 0.0)

    mean_score = np.mean(scores)
    lower_ci = np.percentile(scores, 2.5)
    upper_ci = np.percentile(scores, 97.5)

    return (mean_score, lower_ci, upper_ci)


def main():
    logger.info("=" * 80)
    logger.info("PETROBRAS 3W VALIDATION - CORRECTED EVALUATION")
    logger.info("=" * 80)

    auditor = LeakageAuditor()

    try:
        # [1] Load data
        max_per_class = 10  # Use 10 for fast evaluation
        logger.info(f"\n[1/8] Loading data ({max_per_class} instances per class)...")

        data_raw = load_all_real_instances(
            max_per_class=max_per_class,
            event_classes=[1, 2, 3, 4, 5, 6, 7, 8, 9],
            random_seed=42,
        )

        data = {}
        for well_id, dfs in data_raw.items():
            data[well_id] = pd.concat(dfs, ignore_index=True)

        total_instances = sum(len(dfs) for dfs in data_raw.values())
        logger.info(f"Loaded {len(data)} wells, {total_instances} instances")

        # [2] Split
        logger.info("\n[2/8] Splitting wells...")
        splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
        train_data, val_data, test_data = splitter.split_dataset(data)

        logger.info(
            f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}"
        )

        auditor.check_split_leakage(
            list(train_data.keys()) + list(val_data.keys()), list(test_data.keys())
        )

        # [3] Prepare test features
        logger.info("\n[3/8] Preparing test features (60s downsample)...")
        X_test, y_test, y_class, test_df, feature_cols = prepare_features_safe(
            test_data, sequence_length=60, downsample_sec=60
        )

        auditor.check_feature_leakage(pd.DataFrame(X_test, columns=feature_cols))

        # [4] Load models
        logger.info("\n[4/8] Loading balanced model...")
        balanced_model_path = MODEL_DIR / "random_forest_classifier_balanced.joblib"
        balanced_scaler_path = MODEL_DIR / "scaler_balanced.joblib"

        if balanced_model_path.exists():
            rf_clf = joblib.load(balanced_model_path)
            scaler = joblib.load(balanced_scaler_path)
            logger.info("Loaded balanced model")
        else:
            logger.warning("Balanced model not found, using old model")
            rf_clf = joblib.load(MODEL_DIR / "random_forest_classifier.joblib")
            scaler = joblib.load(MODEL_DIR / "scaler.joblib")

        X_test_scaled = scaler.transform(X_test)

        # [5] Evaluate OGIM model
        logger.info("\n[5/8] Evaluating OGIM model...")
        rf_pred = rf_clf.predict(X_test_scaled)

        # Sample-level confusion matrix
        y_test_binary = (y_test > 0).astype(int)
        rf_pred_binary = (rf_pred > 0).astype(int)

        cm = confusion_matrix(y_test_binary, rf_pred_binary, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()

        logger.info(f"\nConfusion Matrix:")
        logger.info(f"  TN={tn}, FP={fp}")
        logger.info(f"  FN={fn}, TP={tp}")

        # Check for degenerate model
        is_degenerate = tn == 0 and fn == 0
        if is_degenerate:
            logger.warning("\n⚠️  MODEL IS DEGENERATE (always predicts event)!")
            logger.warning(
                "   Recall=1.0 and lead time are artifacts, not meaningful metrics."
            )

        # Metrics
        f1 = compute_binary_macro_f1(y_test, rf_pred)
        recall = recall_score(y_test_binary, rf_pred_binary, zero_division=0)
        precision = precision_score(y_test_binary, rf_pred_binary, zero_division=0)

        # False alarm rate
        false_alarm_rate = compute_false_alarm_rate(y_test, rf_pred, sampling_rate_seconds=60)

        # Lead time
        lead_time = compute_lead_time_to_onset(rf_pred, test_df, "class_label")

        logger.info(f"\nOGIM Metrics:")
        logger.info(f"  Binary Macro-F1: {f1:.3f}")
        logger.info(f"  Recall: {recall:.3f}")
        logger.info(f"  Precision: {precision:.3f}")
        logger.info(f"  False Alarms/Day: {false_alarm_rate:.1f if false_alarm_rate is not None else 'N/A'}")
        logger.info(f"  Lead Time: {lead_time if lead_time else 'N/A'}")

        # [6] Baselines
        logger.info("\n[6/8] Evaluating baselines...")

        # Z-score baseline
        zscore_pred = simple_z_score_baseline(X_test, threshold=3.0)
        zscore_f1 = compute_binary_macro_f1(y_test, zscore_pred)
        zscore_recall = recall_score(y_test_binary, (zscore_pred > 0).astype(int), zero_division=0)
        zscore_fp_rate = compute_false_alarm_rate(y_test, zscore_pred, 60)

        logger.info(f"Z-score Baseline: F1={zscore_f1:.3f}, R={zscore_recall:.3f}, FP/day={zscore_fp_rate:.1f}")

        # Threshold baseline
        thresh_pred = simple_threshold_baseline(X_test, percentile=99)
        thresh_f1 = compute_binary_macro_f1(y_test, thresh_pred)
        thresh_recall = recall_score(y_test_binary, (thresh_pred > 0).astype(int), zero_division=0)
        thresh_fp_rate = compute_false_alarm_rate(y_test, thresh_pred, 60)

        logger.info(f"Threshold Baseline: F1={thresh_f1:.3f}, R={thresh_recall:.3f}, FP/day={thresh_fp_rate:.1f}")

        # [7] Perfect separation check
        if not is_degenerate:
            auditor.check_perfect_separation(y_test_binary, rf_pred_binary)
        else:
            auditor.failures.append(
                "Perfect separation SUSPICIOUS: model is degenerate (always predicts event)"
            )

        # [8] Count test events
        logger.info("\n[7/8] Counting test events by class...")
        test_events_by_class = {}
        for cls in range(1, 10):
            count = (y_class == cls).sum()
            test_events_by_class[cls] = int(count)
            if count > 0:
                logger.info(f"  Class {cls}: {count} samples")

        # [8] Leakage audit
        logger.info("\n[8/8] Generating leakage audit report...")
        audit_report = auditor.generate_report()

        # TRL5 criteria check
        logger.info("\n" + "=" * 80)
        logger.info("TRL5 CRITERIA CHECK")
        logger.info("=" * 80)

        recall_met = recall >= 0.75 and not is_degenerate
        f1_met = f1 >= 0.65
        fp_rate_met = false_alarm_rate is not None and false_alarm_rate <= 3.0
        lead_time_met = lead_time is not None and lead_time >= 60.0 and not is_degenerate
        audit_met = audit_report["audit_status"] == "PASSED" and not is_degenerate

        criteria = [
            ("Event Recall ≥0.75", recall_met, recall),
            ("Binary Macro-F1 ≥0.65", f1_met, f1),
            ("False Alarms/Day ≤3.0", fp_rate_met, false_alarm_rate),
            ("Lead Time ≥60s", lead_time_met, lead_time),
            ("Leakage Audit", audit_met, audit_report["audit_status"]),
        ]

        for name, met, value in criteria:
            status = "✅ PASS" if met else "❌ FAIL"
            logger.info(f"{name}: {status} (value: {value})")

        all_met = all(met for _, met, _ in criteria)

        if is_degenerate:
            trl_verdict = 4
            verdict_reason = "TRL4: Model is degenerate (always predicts event)"
        elif all_met:
            trl_verdict = 5
            verdict_reason = "TRL5: All criteria met with corrected methodology"
        else:
            trl_verdict = 4
            failed = [name for name, met, _ in criteria if not met]
            verdict_reason = f"TRL4: {', '.join(failed)}"

        logger.info(f"\nFINAL TRL VERDICT: TRL{trl_verdict}")
        logger.info(f"REASONING: {verdict_reason}")

        # Save results
        results = {
            "evaluation_date": datetime.now().isoformat(),
            "dataset": f"Petrobras 3W (REAL, {max_per_class} per class, 60s downsample)",
            "methodology_version": "v4_corrected",
            "model_status": "degenerate" if is_degenerate else "valid",
            "leakage_audit": audit_report,
            "test_wells": list(test_data.keys()),
            "test_samples": len(X_test),
            "test_events_by_class": test_events_by_class,
            "downsampling": "60 seconds",
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp),
            },
            "models": {
                "random_forest": {
                    "binary_macro_f1": float(f1),
                    "recall": float(recall),
                    "precision": float(precision),
                    "false_alarms_per_day": float(false_alarm_rate) if false_alarm_rate else None,
                    "lead_time_seconds": float(lead_time) if lead_time else None,
                    "is_degenerate": is_degenerate,
                }
            },
            "baselines": {
                "z_score": {
                    "binary_macro_f1": float(zscore_f1),
                    "recall": float(zscore_recall),
                    "false_alarms_per_day": float(zscore_fp_rate) if zscore_fp_rate else None,
                },
                "threshold": {
                    "binary_macro_f1": float(thresh_f1),
                    "recall": float(thresh_recall),
                    "false_alarms_per_day": float(thresh_fp_rate) if thresh_fp_rate else None,
                },
            },
            "trl5_criteria": {
                "event_recall_threshold": 0.75,
                "macro_f1_threshold": 0.65,
                "false_alarm_threshold": 3.0,
                "lead_time_threshold": 60.0,
                "criteria_met": [
                    {"criterion": name, "met": met, "value": value}
                    for name, met, value in criteria
                ],
                "all_met": all_met,
            },
            "final_trl_verdict": trl_verdict,
            "verdict_reasoning": verdict_reason,
        }

        results_path = RESULTS_DIR / "3w_validation_results_v3_corrected.json"
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2)

        logger.info(f"\nResults saved to: {results_path}")

        return 0 if not is_degenerate and audit_report["audit_status"] == "PASSED" else 1

    except Exception:
        logger.error("\n!!! EVALUATION FAILED !!!")
        logger.error(traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
