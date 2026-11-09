"""
Optimized Evaluation with Incremental Caching and Memory Management

Features:
- Cache features per instance to parquet
- Resume from cache if interrupted
- Free memory after each instance
- Downsample before feature extraction
- Report exact counts per class
"""
import gc
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
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "cache" / "features"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

MODEL_DIR = (
    Path(__file__).parent.parent / "backend" / "ml-inference-service" / "models" / "3w_validation"
)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def extract_features_for_instance(df, well_id, sequence_length=60, downsample_sec=60):
    """Extract features for single instance with memory management."""
    try:
        # Adapt
        df_ogim = adapt_3w_to_ogim(df, well_id)
        
        # Features
        features_df = create_feature_vectors(
            df_ogim, sequence_length=sequence_length, downsample_seconds=downsample_sec
        )
        
        # Labels from per-sample class column
        label_df = (
            df_ogim[["timestamp", "class_label"]]
            .drop_duplicates(subset=["timestamp"])
            .sort_values("timestamp")
        )
        
        # Merge
        merged = features_df.merge(label_df, on="timestamp", how="left")
        merged["binary_label"] = (merged["class_label"].fillna(0) > 0).astype(int)
        
        # Free memory
        del df, df_ogim, features_df, label_df
        gc.collect()
        
        return merged
        
    except Exception as e:
        logger.error(f"Error processing {well_id}: {e}")
        return None


def prepare_features_cached(data_dict, split_name, sequence_length=60, downsample_sec=60):
    """Prepare features with caching and resumability."""
    cache_file = CACHE_DIR / f"{split_name}_features.parquet"
    
    if cache_file.exists():
        logger.info(f"Loading cached features for {split_name}...")
        combined_df = pd.read_parquet(cache_file)
        logger.info(f"Loaded {len(combined_df)} cached samples")
    else:
        logger.info(f"Extracting features for {split_name} ({len(data_dict)} wells)...")
        all_features = []
        
        for i, (well_id, df) in enumerate(data_dict.items(), 1):
            logger.info(f"[{i}/{len(data_dict)}] Processing {well_id}...")
            
            merged = extract_features_for_instance(df, well_id, sequence_length, downsample_sec)
            
            if merged is not None:
                all_features.append(merged)
            
            # Free memory
            del df
            gc.collect()
        
        if not all_features:
            raise ValueError(f"No features extracted for {split_name}")
        
        combined_df = pd.concat(all_features, ignore_index=True)
        
        # Cache to disk
        combined_df.to_parquet(cache_file, index=False)
        logger.info(f"Cached {len(combined_df)} samples to {cache_file}")
    
    # Extract arrays
    feature_cols = [
        col for col in combined_df.columns
        if col not in ["timestamp", "well_id", "class_label", "binary_label", "event_type"]
    ]
    
    X = combined_df[feature_cols].fillna(0).values
    y_binary = combined_df["binary_label"].values
    y_class = combined_df["class_label"].fillna(0).astype(int).values
    
    # Count samples per class
    logger.info(f"{split_name} samples:")
    logger.info(f"  Normal (0): {np.sum(y_binary == 0)}")
    logger.info(f"  Event (>0): {np.sum(y_binary == 1)}")
    for cls in range(1, 10):
        count = np.sum(y_class == cls)
        if count > 0:
            logger.info(f"    Class {cls}: {count}")
    
    return X, y_binary, y_class, combined_df, feature_cols


def bootstrap_ci(y_true, y_pred, metric_func, n_bootstrap=1000):
    """Bootstrap 95% CIs."""
    np.random.seed(42)
    n_samples = len(y_true)
    
    if n_samples == 0:
        return (0.0, 0.0, 0.0)
    
    scores = []
    for _ in range(n_bootstrap):
        indices = np.random.choice(n_samples, size=n_samples, replace=True)
        try:
            score = metric_func(y_true[indices], y_pred[indices])
            scores.append(score)
        except Exception:
            pass
    
    if len(scores) == 0:
        return (0.0, 0.0, 0.0)
    
    return (np.mean(scores), np.percentile(scores, 2.5), np.percentile(scores, 97.5))


def compute_false_alarm_rate(y_true, y_pred, sampling_rate_seconds=60):
    """False alarms per day on NORMAL samples."""
    normal_mask = y_true == 0
    false_alarms = ((y_true == 0) & (y_pred > 0)).sum()
    normal_samples = normal_mask.sum()
    
    if normal_samples == 0:
        return None
    
    samples_per_day = (24 * 3600) / sampling_rate_seconds
    return (false_alarms / normal_samples) * samples_per_day


def main():
    max_per_class = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    
    logger.info("=" * 80)
    logger.info(f"EVALUATION WITH {max_per_class} INSTANCES PER CLASS")
    logger.info("=" * 80)
    
    auditor = LeakageAuditor()
    
    try:
        # Load data
        logger.info(f"\n[1/7] Loading data ({max_per_class} per class)...")
        sys.path.insert(0, str(Path(__file__).parent))
        from load_balanced_data import load_balanced_instances
        
        data_raw = load_balanced_instances(max_per_class=max_per_class, random_seed=42)
        
        data = {}
        for well_id, dfs in data_raw.items():
            data[well_id] = pd.concat(dfs, ignore_index=True)
        
        logger.info(f"Loaded {len(data)} wells")
        
        # Split
        logger.info("\n[2/7] Splitting wells...")
        splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
        train_data, val_data, test_data = splitter.split_dataset(data)
        
        logger.info(f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")
        auditor.check_split_leakage(
            list(train_data.keys()) + list(val_data.keys()), list(test_data.keys())
        )
        
        # Prepare features with caching
        logger.info("\n[3/7] Preparing train features...")
        X_train, y_train, y_train_class, _, feature_cols = prepare_features_cached(
            train_data, "train", sequence_length=60, downsample_sec=60
        )
        
        auditor.check_feature_leakage(pd.DataFrame(X_train, columns=feature_cols))
        
        if np.sum(y_train == 0) == 0 or np.sum(y_train == 1) == 0:
            auditor.failures.append(f"Train missing class! Normal={np.sum(y_train == 0)}, Event={np.sum(y_train == 1)}")
        
        logger.info("\n[4/7] Preparing validation features...")
        X_val, y_val, y_val_class, _, _ = prepare_features_cached(
            val_data, "val", sequence_length=60, downsample_sec=60
        )
        
        # Train
        logger.info("\n[5/7] Training with class_weight='balanced'...")
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)
        
        rf_clf = RandomForestClassifier(
            n_estimators=100, max_depth=10, min_samples_split=5,
            min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1
        )
        rf_clf.fit(X_train_scaled, y_train)
        
        # Tune threshold
        y_val_proba = rf_clf.predict_proba(X_val_scaled)[:, 1]
        best_f1, best_threshold = 0, 0.5
        
        for threshold in np.linspace(0.1, 0.9, 17):
            f1 = compute_binary_macro_f1(y_val, (y_val_proba >= threshold).astype(int))
            if f1 > best_f1:
                best_f1, best_threshold = f1, threshold
        
        logger.info(f"Best threshold: {best_threshold:.3f} (Val F1={best_f1:.3f})")
        
        # Test
        logger.info("\n[6/7] Preparing test features...")
        X_test, y_test, y_test_class, test_df, _ = prepare_features_cached(
            test_data, "test", sequence_length=60, downsample_sec=60
        )
        
        n_normal_test = np.sum(y_test == 0)
        n_event_test = np.sum(y_test == 1)
        
        if n_normal_test == 0 or n_event_test == 0:
            auditor.failures.append(f"Test missing class! Normal={n_normal_test}, Event={n_event_test}")
        
        X_test_scaled = scaler.transform(X_test)
        
        # Evaluate
        logger.info("\n[7/7] Evaluating...")
        y_test_proba = rf_clf.predict_proba(X_test_scaled)[:, 1]
        rf_pred = (y_test_proba >= best_threshold).astype(int)
        
        cm = confusion_matrix(y_test, rf_pred, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        
        logger.info(f"\nConfusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
        
        # Metrics with CIs
        f1 = compute_binary_macro_f1(y_test, rf_pred)
        recall = recall_score(y_test, rf_pred, zero_division=0)
        precision = precision_score(y_test, rf_pred, zero_division=0)
        fp_rate = compute_false_alarm_rate(y_test, rf_pred, 60)
        lead_time = compute_lead_time_to_onset(rf_pred, test_df, "class_label")
        
        recall_ci = bootstrap_ci(y_test, rf_pred, lambda yt, yp: recall_score(yt, yp, zero_division=0))
        f1_ci = bootstrap_ci(y_test, rf_pred, compute_binary_macro_f1)
        
        logger.info(f"Binary Macro-F1: {f1:.3f} [{f1_ci[1]:.3f}, {f1_ci[2]:.3f}]")
        logger.info(f"Recall: {recall:.3f} [{recall_ci[1]:.3f}, {recall_ci[2]:.3f}]")
        logger.info(f"Precision: {precision:.3f}")
        fp_rate_str = f"{fp_rate:.1f}" if fp_rate is not None else "N/A"
        logger.info(f"False Alarms/Day: {fp_rate_str}")
        lead_time_str = f"{lead_time:.1f}" if lead_time is not None else "N/A"
        logger.info(f"Lead Time: {lead_time_str}")
        
        # Baselines
        zscore_pred = (np.abs((X_test - np.nanmean(X_test, axis=0)) / (np.nanstd(X_test, axis=0) + 1e-9)) > 3).any(axis=1).astype(int)
        thresh_pred = (X_test > np.nanpercentile(X_test, 99, axis=0)).any(axis=1).astype(int)
        
        zscore_f1 = compute_binary_macro_f1(y_test, zscore_pred)
        zscore_recall = recall_score(y_test, zscore_pred, zero_division=0)
        zscore_fp = compute_false_alarm_rate(y_test, zscore_pred, 60)
        
        thresh_f1 = compute_binary_macro_f1(y_test, thresh_pred)
        thresh_recall = recall_score(y_test, thresh_pred, zero_division=0)
        thresh_fp = compute_false_alarm_rate(y_test, thresh_pred, 60)
        
        zscore_fp_str = f"{zscore_fp:.1f}" if zscore_fp is not None else "N/A"
        thresh_fp_str = f"{thresh_fp:.1f}" if thresh_fp is not None else "N/A"
        logger.info(f"\nZ-score: F1={zscore_f1:.3f}, R={zscore_recall:.3f}, FP/day={zscore_fp_str}")
        logger.info(f"Threshold: F1={thresh_f1:.3f}, R={thresh_recall:.3f}, FP/day={thresh_fp_str}")
        
        # Audit
        auditor.check_perfect_separation(y_test, rf_pred)
        audit_report = auditor.generate_report()
        
        # TRL criteria
        logger.info("\n" + "=" * 80)
        logger.info("TRL5 CRITERIA (bcea1d4, unchanged)")
        logger.info("=" * 80)
        
        criteria = [
            ("Event Recall ≥0.75", recall >= 0.75, recall),
            ("Binary Macro-F1 ≥0.65", f1 >= 0.65, f1),
            ("False Alarms/Day ≤3.0", fp_rate is not None and fp_rate <= 3.0, fp_rate),
            ("Lead Time ≥60s", lead_time is not None and lead_time >= 60.0, lead_time),
            ("Leakage Audit", audit_report["audit_status"] == "PASSED", audit_report["audit_status"]),
        ]
        
        for name, met, value in criteria:
            logger.info(f"{name}: {'✅' if met else '❌'} (value: {value})")
        
        all_met = all(met for _, met, _ in criteria)
        trl_verdict = 5 if all_met else 4
        verdict_reason = "All criteria met" if all_met else f"Failed: {', '.join(n for n, m, _ in criteria if not m)}"
        
        logger.info(f"\nTRL VERDICT: TRL{trl_verdict} - {verdict_reason}")
        
        # Count instances per class
        train_counts = {f"class_{i}": int(np.sum(y_train_class == i)) for i in range(10)}
        val_counts = {f"class_{i}": int(np.sum(y_val_class == i)) for i in range(10)}
        test_counts = {f"class_{i}": int(np.sum(y_test_class == i)) for i in range(10)}
        
        # Save results
        results = {
            "evaluation_date": datetime.now().isoformat(),
            "dataset": f"Petrobras 3W (balanced, {max_per_class}/class, 60s downsample)",
            "methodology_version": "v6_optimized",
            "instances_per_class": max_per_class,
            "sample_counts": {
                "train": {"total": len(X_train), "per_class": train_counts},
                "validation": {"total": len(X_val), "per_class": val_counts},
                "test": {"total": len(X_test), "per_class": test_counts},
            },
            "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
            "ogim_model": {
                "binary_macro_f1": {"mean": float(f1), "ci_95": [float(f1_ci[1]), float(f1_ci[2])]},
                "recall": {"mean": float(recall), "ci_95": [float(recall_ci[1]), float(recall_ci[2])]},
                "precision": float(precision),
                "false_alarms_per_day": float(fp_rate) if fp_rate else None,
                "lead_time_seconds": float(lead_time) if lead_time else None,
            },
            "baselines": {
                "z_score": {"f1": float(zscore_f1), "recall": float(zscore_recall), "fp_per_day": float(zscore_fp) if zscore_fp else None},
                "threshold": {"f1": float(thresh_f1), "recall": float(thresh_recall), "fp_per_day": float(thresh_fp) if thresh_fp else None},
            },
            "trl5_criteria": {
                "criteria": [{"name": n, "met": bool(m), "value": float(v) if isinstance(v, (int, float, np.integer, np.floating)) else str(v)} for n, m, v in criteria],
                "all_met": bool(all_met),
            },
            "final_trl_verdict": trl_verdict,
            "verdict_reasoning": verdict_reason,
            "leakage_audit": audit_report,
        }
        
        results_path = RESULTS_DIR / f"3w_validation_results_{max_per_class}perclass.json"
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"\n✅ Results saved: {results_path}")
        
        # Save model
        joblib.dump(rf_clf, MODEL_DIR / f"rf_classifier_{max_per_class}perclass.joblib")
        joblib.dump(scaler, MODEL_DIR / f"scaler_{max_per_class}perclass.joblib")
        
        return 0 if audit_report["audit_status"] == "PASSED" else 1
        
    except Exception:
        logger.error("\n!!! EVALUATION FAILED !!!")
        logger.error(traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
