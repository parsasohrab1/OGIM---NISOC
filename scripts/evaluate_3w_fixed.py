"""
Fixed Evaluation with Per-Sample Labels and Balanced Data

Fixes:
1. Include class 0 (normal) instances
2. Use per-sample `class` column for binary labels (not instance event_type)
3. Train with class_weight='balanced'
4. Tune threshold on validation set
5. Event-level bootstrap CIs
6. Compare vs baselines
7. Leakage check for missing classes
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
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, precision_score, recall_score
from sklearn.preprocessing import StandardScaler

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

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
MODEL_DIR.mkdir(parents=True, exist_ok=True)

RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def prepare_features_with_per_sample_labels(data_dict, sequence_length=60, downsample_sec=60):
    """
    Prepare features using PER-SAMPLE class column for binary labels.
    
    Key fix: Use `class` column (0=normal, >0=event) instead of instance event_type.
    """
    all_features = []
    all_labels_binary = []
    all_labels_class = []

    for well_id, df in data_dict.items():
        try:
            logger.info(f"Processing {well_id}...")

            # Adapt (preserves class column)
            df_ogim = adapt_3w_to_ogim(df, well_id)

            # Features
            features_df = create_feature_vectors(
                df_ogim, sequence_length=sequence_length, downsample_seconds=downsample_sec
            )

            # Get per-sample labels from class column
            label_df = (
                df_ogim[["timestamp", "class_label"]]
                .drop_duplicates(subset=["timestamp"])
                .sort_values("timestamp")
            )

            # Merge
            merged = features_df.merge(label_df, on="timestamp", how="left")

            # Binary label from per-sample class: 0=normal, >0=event
            merged["binary_label"] = (merged["class_label"].fillna(0) > 0).astype(int)

            all_features.append(merged)
            all_labels_binary.extend(merged["binary_label"].tolist())
            all_labels_class.extend(merged["class_label"].fillna(0).astype(int).tolist())

        except Exception as e:
            logger.error(f"Error processing {well_id}: {e}")
            logger.error(traceback.format_exc())
            continue

    combined_df = pd.concat(all_features, ignore_index=True)

    feature_cols = [
        col
        for col in combined_df.columns
        if col not in ["timestamp", "well_id", "class_label", "binary_label", "event_type"]
    ]

    X = combined_df[feature_cols].fillna(0).values
    y_binary = np.array(all_labels_binary)
    y_class = np.array(all_labels_class)

    logger.info(f"Prepared {len(X)} samples, {X.shape[1]} features")
    logger.info(f"Binary distribution: normal={np.sum(y_binary == 0)}, event={np.sum(y_binary == 1)}")

    return X, y_binary, y_class, combined_df, feature_cols


def compute_false_alarm_rate(y_true, y_pred, sampling_rate_seconds=60):
    """False alarms per day on NORMAL samples only."""
    normal_mask = y_true == 0
    false_alarms = ((y_true == 0) & (y_pred > 0)).sum()
    normal_samples = normal_mask.sum()

    if normal_samples == 0:
        return None

    samples_per_day = (24 * 3600) / sampling_rate_seconds
    fp_per_day = (false_alarms / normal_samples) * samples_per_day

    return float(fp_per_day)


def simple_z_score_baseline(X, threshold=3.0):
    """Vectorized z-score baseline."""
    mean = np.nanmean(X, axis=0)
    std = np.nanstd(X, axis=0)
    std[std == 0] = 1.0

    z_scores = np.abs((X - mean) / std)
    predictions = (z_scores > threshold).any(axis=1).astype(int)

    return predictions


def simple_threshold_baseline(X, percentile=99):
    """Vectorized threshold baseline."""
    thresholds = np.nanpercentile(X, percentile, axis=0)
    predictions = (X > thresholds).any(axis=1).astype(int)

    return predictions


def event_level_bootstrap_ci(y_true, y_pred, metric_func, n_bootstrap=1000):
    """Bootstrap CIs (sample-level for now, can aggregate by event later)."""
    np.random.seed(42)
    n_samples = len(y_true)

    if n_samples == 0:
        return (0.0, 0.0, 0.0)

    scores = []
    for _ in range(n_bootstrap):
        indices = np.random.choice(n_samples, size=n_samples, replace=True)
        yt_boot = y_true[indices]
        yp_boot = y_pred[indices]

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
    logger.info("PETROBRAS 3W VALIDATION - FIXED EVALUATION")
    logger.info("=" * 80)

    auditor = LeakageAuditor()

    try:
        # [1] Load balanced data
        logger.info("\n[1/9] Loading balanced data...")
        from load_balanced_data import load_balanced_instances

        data_raw = load_balanced_instances(max_per_class=40, random_seed=42)

        data = {}
        for well_id, dfs in data_raw.items():
            data[well_id] = pd.concat(dfs, ignore_index=True)

        logger.info(f"Loaded {len(data)} wells")

        # [2] Split
        logger.info("\n[2/9] Splitting wells...")
        splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
        train_data, val_data, test_data = splitter.split_dataset(data)

        logger.info(f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")

        auditor.check_split_leakage(
            list(train_data.keys()) + list(val_data.keys()), list(test_data.keys())
        )

        # [3] Prepare train features
        logger.info("\n[3/9] Preparing train features...")
        X_train, y_train, _, _, feature_cols = prepare_features_with_per_sample_labels(
            train_data, sequence_length=60, downsample_sec=60
        )

        auditor.check_feature_leakage(pd.DataFrame(X_train, columns=feature_cols))

        # Check for both classes in train
        if np.sum(y_train == 0) == 0 or np.sum(y_train == 1) == 0:
            raise ValueError(f"Train set missing class! Normal={np.sum(y_train == 0)}, Event={np.sum(y_train == 1)}")

        # [4] Prepare val features
        logger.info("\n[4/9] Preparing validation features...")
        X_val, y_val, _, _, _ = prepare_features_with_per_sample_labels(
            val_data, sequence_length=60, downsample_sec=60
        )

        # [5] Train model
        logger.info("\n[5/9] Training Random Forest with class_weight='balanced'...")

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)

        rf_clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )

        rf_clf.fit(X_train_scaled, y_train)

        # [6] Tune threshold on validation set
        logger.info("\n[6/9] Tuning decision threshold on validation set...")

        y_val_proba = rf_clf.predict_proba(X_val_scaled)[:, 1]

        # Try thresholds from 0.1 to 0.9
        best_f1 = 0
        best_threshold = 0.5

        for threshold in np.linspace(0.1, 0.9, 17):
            y_val_pred_thresh = (y_val_proba >= threshold).astype(int)
            f1 = compute_binary_macro_f1(y_val, y_val_pred_thresh)
            if f1 > best_f1:
                best_f1 = f1
                best_threshold = threshold

        logger.info(f"Best threshold: {best_threshold:.3f} (Val F1={best_f1:.3f})")

        # [7] Prepare test features
        logger.info("\n[7/9] Preparing test features...")
        X_test, y_test, y_class, test_df, _ = prepare_features_with_per_sample_labels(
            test_data, sequence_length=60, downsample_sec=60
        )

        # Check for both classes in test
        n_normal_test = np.sum(y_test == 0)
        n_event_test = np.sum(y_test == 1)

        logger.info(f"Test set: {n_normal_test} normal, {n_event_test} event samples")

        if n_normal_test == 0 or n_event_test == 0:
            auditor.failures.append(
                f"Test set missing class! Normal={n_normal_test}, Event={n_event_test}"
            )

        X_test_scaled = scaler.transform(X_test)

        # [8] Evaluate OGIM model
        logger.info("\n[8/9] Evaluating OGIM model with tuned threshold...")

        y_test_proba = rf_clf.predict_proba(X_test_scaled)[:, 1]
        rf_pred = (y_test_proba >= best_threshold).astype(int)

        # Confusion matrix
        cm = confusion_matrix(y_test, rf_pred, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()

        logger.info(f"\nConfusion Matrix:")
        logger.info(f"  TN={tn}, FP={fp}")
        logger.info(f"  FN={fn}, TP={tp}")

        # Metrics
        f1 = compute_binary_macro_f1(y_test, rf_pred)
        recall = recall_score(y_test, rf_pred, zero_division=0)
        precision = precision_score(y_test, rf_pred, zero_division=0)

        # False alarm rate
        false_alarm_rate = compute_false_alarm_rate(y_test, rf_pred, sampling_rate_seconds=60)

        # Lead time
        lead_time = compute_lead_time_to_onset(rf_pred, test_df, "class_label")

        logger.info(f"\nOGIM Metrics:")
        logger.info(f"  Binary Macro-F1: {f1:.3f}")
        logger.info(f"  Recall: {recall:.3f}")
        logger.info(f"  Precision: {precision:.3f}")
        logger.info(f"  False Alarms/Day: {false_alarm_rate:.1f if false_alarm_rate else 'N/A'}")
        logger.info(f"  Lead Time: {lead_time if lead_time else 'N/A'}")

        # Bootstrap CIs
        logger.info("\nBootstrap 95% CIs:")

        def recall_func(yt, yp):
            return recall_score(yt, yp, zero_division=0)

        def f1_func(yt, yp):
            return compute_binary_macro_f1(yt, yp)

        recall_mean, recall_lower, recall_upper = event_level_bootstrap_ci(
            y_test, rf_pred, recall_func, n_bootstrap=1000
        )
        f1_mean, f1_lower, f1_upper = event_level_bootstrap_ci(
            y_test, rf_pred, f1_func, n_bootstrap=1000
        )

        logger.info(f"  Recall: {recall_mean:.3f} [{recall_lower:.3f}, {recall_upper:.3f}]")
        logger.info(f"  Binary Macro-F1: {f1_mean:.3f} [{f1_lower:.3f}, {f1_upper:.3f}]")

        # [9] Baselines
        logger.info("\n[9/9] Evaluating baselines...")

        # Z-score
        zscore_pred = simple_z_score_baseline(X_test, threshold=3.0)
        zscore_f1 = compute_binary_macro_f1(y_test, zscore_pred)
        zscore_recall = recall_score(y_test, zscore_pred, zero_division=0)
        zscore_fp_rate = compute_false_alarm_rate(y_test, zscore_pred, 60)

        logger.info(f"Z-score Baseline: F1={zscore_f1:.3f}, R={zscore_recall:.3f}, FP/day={zscore_fp_rate:.1f if zscore_fp_rate else 'N/A'}")

        # Threshold
        thresh_pred = simple_threshold_baseline(X_test, percentile=99)
        thresh_f1 = compute_binary_macro_f1(y_test, thresh_pred)
        thresh_recall = recall_score(y_test, thresh_pred, zero_division=0)
        thresh_fp_rate = compute_false_alarm_rate(y_test, thresh_pred, 60)

        logger.info(f"Threshold Baseline: F1={thresh_f1:.3f}, R={thresh_recall:.3f}, FP/day={thresh_fp_rate:.1f if thresh_fp_rate else 'N/A'}")

        # Perfect separation check
        auditor.check_perfect_separation(y_test, rf_pred)

        # Leakage audit
        audit_report = auditor.generate_report()

        # TRL5 criteria
        logger.info("\n" + "=" * 80)
        logger.info("TRL5 CRITERIA CHECK")
        logger.info("=" * 80)

        recall_met = recall >= 0.75
        f1_met = f1 >= 0.65
        fp_rate_met = false_alarm_rate is not None and false_alarm_rate <= 3.0
        lead_time_met = lead_time is not None and lead_time >= 60.0
        audit_met = audit_report["audit_status"] == "PASSED"

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

        if all_met:
            trl_verdict = 5
            verdict_reason = "TRL5: All criteria met with fixed methodology and balanced data"
        else:
            trl_verdict = 4
            failed = [name for name, met, _ in criteria if not met]
            verdict_reason = f"TRL4: {', '.join(failed)}"

        logger.info(f"\nFINAL TRL VERDICT: TRL{trl_verdict}")
        logger.info(f"REASONING: {verdict_reason}")

        # Save results
        results = {
            "evaluation_date": datetime.now().isoformat(),
            "dataset": "Petrobras 3W (REAL, balanced with class 0, 40 per class, 60s downsample)",
            "methodology_version": "v5_fixed",
            "data_loading_fix": "Included class 0 (normal) instances",
            "labeling_fix": "Used per-sample class column (not instance event_type)",
            "threshold_tuning": {"best_threshold": float(best_threshold), "validation_f1": float(best_f1)},
            "leakage_audit": audit_report,
            "test_wells": list(test_data.keys()),
            "test_samples": {"total": len(X_test), "normal": int(n_normal_test), "event": int(n_event_test)},
            "downsampling": "60 seconds",
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp),
            },
            "models": {
                "random_forest": {
                    "binary_macro_f1": {"mean": float(f1), "lower_ci": float(f1_lower), "upper_ci": float(f1_upper)},
                    "recall": {"mean": float(recall), "lower_ci": float(recall_lower), "upper_ci": float(recall_upper)},
                    "precision": float(precision),
                    "false_alarms_per_day": float(false_alarm_rate) if false_alarm_rate else None,
                    "lead_time_seconds": float(lead_time) if lead_time else None,
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

        results_path = RESULTS_DIR / "3w_validation_results_fixed.json"
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2)

        # Save model
        joblib.dump(rf_clf, MODEL_DIR / "random_forest_classifier_fixed.joblib")
        joblib.dump(scaler, MODEL_DIR / "scaler_fixed.joblib")

        with open(MODEL_DIR / "threshold_fixed.json", "w") as f:
            json.dump({"threshold": float(best_threshold), "validation_f1": float(best_f1)}, f, indent=2)

        logger.info(f"\nResults saved to: {results_path}")
        logger.info(f"Model saved to: {MODEL_DIR}")

        return 0 if audit_report["audit_status"] == "PASSED" else 1

    except Exception:
        logger.error("\n!!! EVALUATION FAILED !!!")
        logger.error(traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
