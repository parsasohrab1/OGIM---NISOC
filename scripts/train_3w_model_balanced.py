"""
Train 3W model with class_weight='balanced' to fix degenerate model.
"""
import json
import logging
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from validation.petrobras_3w.loader import load_all_real_instances  # noqa: E402
from validation.petrobras_3w.adapter import (  # noqa: E402
    adapt_3w_to_ogim,
    create_feature_vectors,
)
from validation.petrobras_3w.splitter import WellGroupSplitter  # noqa: E402

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


def prepare_dataset(data_dict, sequence_length=60, downsample_sec=60):
    """Prepare features from raw data."""
    all_features = []
    all_labels = []

    for well_id, df in data_dict.items():
        try:
            logger.info(f"Processing {well_id}...")
            df_ogim = adapt_3w_to_ogim(df, well_id)
            features_df = create_feature_vectors(
                df_ogim, sequence_length=sequence_length, downsample_seconds=downsample_sec
            )

            label_df = (
                df_ogim[["timestamp", "event_type"]]
                .drop_duplicates(subset=["timestamp"])
                .sort_values("timestamp")
            )

            merged = features_df.merge(label_df, on="timestamp", how="left")
            all_features.append(merged)
            all_labels.extend(merged["event_type"].fillna(0).astype(int).tolist())

        except Exception as e:
            logger.error(f"Error processing {well_id}: {e}")
            continue

    combined_df = pd.concat(all_features, ignore_index=True)
    feature_cols = [
        col
        for col in combined_df.columns
        if col not in ["timestamp", "well_id", "event_type", "class_label"]
    ]

    X = combined_df[feature_cols].fillna(0).values
    y = np.array(all_labels)

    logger.info(f"Dataset: {len(X)} samples, {X.shape[1]} features")
    logger.info(f"Class distribution: {np.bincount(y)}")

    return X, y, feature_cols


def main():
    logger.info("=" * 80)
    logger.info("TRAIN 3W MODEL WITH BALANCED CLASS WEIGHTS")
    logger.info("=" * 80)

    # Load data
    logger.info("\n[1/6] Loading data (40 instances per class)...")
    data_raw = load_all_real_instances(
        max_per_class=40, event_classes=[1, 2, 3, 4, 5, 6, 7, 8, 9], random_seed=42
    )

    data = {}
    for well_id, dfs in data_raw.items():
        data[well_id] = pd.concat(dfs, ignore_index=True)

    logger.info(f"Loaded {len(data)} wells")

    # Split
    logger.info("\n[2/6] Splitting wells...")
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)

    logger.info(
        f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}"
    )

    # Prepare features (60s downsample)
    logger.info("\n[3/6] Preparing train features...")
    X_train, y_train, feature_cols = prepare_dataset(
        train_data, sequence_length=60, downsample_sec=60
    )

    logger.info("\n[4/6] Preparing validation features...")
    X_val, y_val, _ = prepare_dataset(val_data, sequence_length=60, downsample_sec=60)

    # Train with class_weight='balanced'
    logger.info("\n[5/6] Training Random Forest with class_weight='balanced'...")

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    rf_clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",  # Fix degenerate model
        random_state=42,
        n_jobs=-1,
        verbose=1,
    )

    rf_clf.fit(X_train_scaled, y_train)

    # Evaluate on validation set (for threshold tuning later)
    y_val_pred = rf_clf.predict(X_val_scaled)
    y_val_proba = rf_clf.predict_proba(X_val_scaled)

    val_recall = ((y_val > 0) & (y_val_pred > 0)).sum() / (y_val > 0).sum()
    val_precision = ((y_val > 0) & (y_val_pred > 0)).sum() / (y_val_pred > 0).sum()

    logger.info(f"Validation Recall: {val_recall:.3f}")
    logger.info(f"Validation Precision: {val_precision:.3f}")

    # Save model
    logger.info("\n[6/6] Saving model...")
    joblib.dump(rf_clf, MODEL_DIR / "random_forest_classifier_balanced.joblib")
    joblib.dump(scaler, MODEL_DIR / "scaler_balanced.joblib")

    with open(MODEL_DIR / "feature_columns_balanced.json", "w") as f:
        json.dump(feature_cols, f, indent=2)

    logger.info(f"Model saved to {MODEL_DIR}")
    logger.info("\n✓ Training complete!")


if __name__ == "__main__":
    main()
