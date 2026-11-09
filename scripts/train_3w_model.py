"""
Train OGIM Anomaly Detection Model on Petrobras 3W Dataset

Trains the model on REAL 3W data for TRL5 validation.
"""

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from validation.petrobras_3w.loader import load_all_real_instances
from validation.petrobras_3w.adapter import adapt_3w_to_ogim, create_feature_vectors
from validation.petrobras_3w.splitter import WellGroupSplitter, validate_split_integrity

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Model storage
MODEL_DIR = (
    Path(__file__).parent.parent
    / "backend"
    / "ml-inference-service"
    / "models"
    / "3w_validation"
)
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def prepare_features(data_dict, sequence_length=60):
    """
    Prepare feature vectors from well data.

    Args:
        data_dict: Dictionary of well_id -> DataFrame
        sequence_length: Window size for feature extraction

    Returns:
        Tuple of (features_df, labels)
    """
    all_features = []

    for well_id, df in data_dict.items():
        logger.info(f"Processing {well_id}...")

        # Adapt to OGIM schema
        df_ogim = adapt_3w_to_ogim(df, well_id)

        # Create feature vectors
        features_df = create_feature_vectors(df_ogim, sequence_length=sequence_length)

        # Add ground truth labels
        # Map back to original timestamps
        df_ogim_pivot = df_ogim.pivot_table(
            index="timestamp",
            columns="sensor_tag",
            values="event_type",
            aggfunc="first",
        ).reset_index()

        # Merge labels
        features_df = features_df.merge(
            df_ogim_pivot[["timestamp"]].assign(
                event_type=df_ogim_pivot.iloc[:, 1:].max(axis=1)
            ),
            on="timestamp",
            how="left",
        )

        all_features.append(features_df)

    # Concatenate all wells
    features_df = pd.concat(all_features, ignore_index=True)

    # Extract labels
    labels = features_df["event_type"].fillna(0).astype(int).values

    # Drop non-feature columns
    feature_cols = [
        col
        for col in features_df.columns
        if col not in ["timestamp", "well_id", "event_type"]
    ]
    X = features_df[feature_cols].fillna(0).values

    logger.info(f"Prepared {len(X)} samples with {X.shape[1]} features")
    return X, labels, feature_cols


def train_isolation_forest(X_train, contamination=0.1):
    """Train Isolation Forest for anomaly detection."""
    logger.info(f"Training Isolation Forest (contamination={contamination})...")

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=123,
        n_jobs=-1,
        verbose=1,
    )

    model.fit(X_train)

    logger.info("Isolation Forest training completed")
    return model


def train_random_forest_classifier(X_train, y_train):
    """Train Random Forest classifier for multi-class event detection."""
    logger.info("Training Random Forest Classifier...")

    # Binary classification: normal (0) vs anomaly (>0)
    y_binary = (y_train > 0).astype(int)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=123,
        n_jobs=-1,
        verbose=1,
        class_weight="balanced",
    )

    model.fit(X_train, y_binary)

    logger.info("Random Forest Classifier training completed")
    return model


def main():
    """Main training pipeline."""
    logger.info("=" * 80)
    logger.info("OGIM 3W Validation - Model Training")
    logger.info("=" * 80)

    # Load data - use diverse event classes for proper validation
    logger.info("\n[1/6] Loading Petrobras 3W dataset (REAL instances)...")
    # Load from multiple event classes for diversity
    # Class 0: Normal, 1-9: Various faults
    # Limit instances to manageable size while maintaining diversity
    from validation.petrobras_3w.loader import load_all_real_instances
    
    well_data_raw = load_all_real_instances(
        max_instances=100,  # Use 100 instances for reasonable training time
        event_classes=None,  # Include all classes
    )
    
    # Concatenate instances by well
    data = {}
    for well_id, dfs in well_data_raw.items():
        data[well_id] = pd.concat(dfs, ignore_index=True)
    
    logger.info(f"Loaded {len(data)} wells from REAL 3W data")
    
    # Log event distribution
    all_events = pd.concat([df["event_type"] for df in data.values()])
    event_counts = all_events.value_counts().sort_index()
    logger.info(f"Event distribution: {event_counts.to_dict()}")

    # Split data
    logger.info("\n[2/6] Splitting data by wells...")
    splitter = WellGroupSplitter(train_ratio=0.6, val_ratio=0.2, random_seed=42)
    train_data, val_data, test_data = splitter.split_dataset(data)
    validate_split_integrity(train_data, val_data, test_data)

    # Prepare features
    logger.info("\n[3/6] Preparing features...")
    X_train, y_train, feature_cols = prepare_features(train_data, sequence_length=60)
    X_val, y_val, _ = prepare_features(val_data, sequence_length=60)

    logger.info(f"Training set: {X_train.shape}")
    logger.info(f"Validation set: {X_val.shape}")

    # Normalize features
    logger.info("\n[4/6] Normalizing features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    # Train models
    logger.info("\n[5/6] Training models...")

    # Isolation Forest (unsupervised)
    contamination = np.sum(y_train > 0) / len(y_train)
    contamination = min(contamination, 0.45)  # Cap at 0.45 (sklearn limit is 0.5)
    logger.info(f"Contamination rate: {contamination:.3%}")
    iso_forest = train_isolation_forest(X_train_scaled, contamination=contamination)

    # Random Forest Classifier (supervised)
    rf_classifier = train_random_forest_classifier(X_train_scaled, y_train)

    # Save models
    logger.info("\n[6/6] Saving models...")

    metadata = {
        "training_date": datetime.utcnow().isoformat(),
        "dataset": "Petrobras 3W (REAL instances)",
        "train_wells": list(train_data.keys()),
        "val_wells": list(val_data.keys()),
        "test_wells": list(test_data.keys()),
        "n_train_samples": len(X_train),
        "n_val_samples": len(X_val),
        "n_features": len(feature_cols),
        "feature_columns": feature_cols,
        "contamination": float(contamination),
        "random_seed": 42,
    }

    # Save Isolation Forest
    iso_forest_path = MODEL_DIR / "isolation_forest.joblib"
    joblib.dump(iso_forest, iso_forest_path)
    logger.info(f"Saved Isolation Forest: {iso_forest_path}")

    # Save Random Forest
    rf_path = MODEL_DIR / "random_forest_classifier.joblib"
    joblib.dump(rf_classifier, rf_path)
    logger.info(f"Saved Random Forest: {rf_path}")

    # Save scaler
    scaler_path = MODEL_DIR / "scaler.joblib"
    joblib.dump(scaler, scaler_path)
    logger.info(f"Saved scaler: {scaler_path}")

    # Save metadata
    metadata_path = MODEL_DIR / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved metadata: {metadata_path}")

    # Quick validation
    logger.info("\n" + "=" * 80)
    logger.info("Quick Validation on Validation Set")
    logger.info("=" * 80)

    # Isolation Forest predictions
    iso_preds = iso_forest.predict(X_val_scaled)
    iso_preds = (iso_preds == -1).astype(int)  # -1 = anomaly -> 1

    # Random Forest predictions
    rf_preds = rf_classifier.predict(X_val_scaled)

    # Compute accuracy
    y_val_binary = (y_val > 0).astype(int)

    from sklearn.metrics import precision_recall_fscore_support

    for name, preds in [("Isolation Forest", iso_preds), ("Random Forest", rf_preds)]:
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_val_binary, preds, average="binary", zero_division=0
        )
        logger.info(f"\n{name}:")
        logger.info(f"  Precision: {precision:.3f}")
        logger.info(f"  Recall: {recall:.3f}")
        logger.info(f"  F1: {f1:.3f}")

    logger.info("\n" + "=" * 80)
    logger.info("Training complete! Models saved to:")
    logger.info(f"  {MODEL_DIR}")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()
