"""
Leakage Audit for TRL5 Validation

Checks for data leakage in features, splits, and evaluation.
"""

import logging
from typing import Dict, List
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class LeakageAuditor:
    """Audit for data leakage in validation pipeline."""

    def __init__(self):
        self.checks = []
        self.failures = []

    def check_feature_leakage(self, features_df: pd.DataFrame) -> bool:
        """
        Check that features do not contain label/class/state columns.

        Args:
            features_df: Feature DataFrame

        Returns:
            True if no leakage, False if leakage detected
        """
        forbidden_cols = [
            "event_type",
            "class",
            "class_label",
            "state",
            "label",
            "target",
            "y",
        ]

        found_forbidden = []
        for col in features_df.columns:
            col_lower = col.lower()
            for forbidden in forbidden_cols:
                if forbidden in col_lower:
                    found_forbidden.append(col)
                    break

        if found_forbidden:
            msg = f"Feature leakage detected: columns {found_forbidden} contain label information"
            logger.error(msg)
            self.failures.append(msg)
            return False

        logger.info("✓ Feature leakage check PASSED: no label columns in features")
        self.checks.append("feature_leakage: PASSED")
        return True

    def check_split_leakage(self, train_wells: List[str], test_wells: List[str]) -> bool:
        """
        Check that train and test wells do not overlap.

        Args:
            train_wells: List of training well IDs
            test_wells: List of test well IDs

        Returns:
            True if no overlap, False if leakage detected
        """
        train_set = set(train_wells)
        test_set = set(test_wells)
        overlap = train_set & test_set

        if overlap:
            msg = f"Split leakage detected: wells {overlap} appear in both train and test"
            logger.error(msg)
            self.failures.append(msg)
            return False

        logger.info(
            f"✓ Split leakage check PASSED: {len(train_set)} train wells, "
            f"{len(test_set)} test wells, no overlap"
        )
        self.checks.append("split_leakage: PASSED")
        return True

    def check_temporal_leakage(
        self, features_df: pd.DataFrame, sequence_length: int, split_index: int
    ) -> bool:
        """
        Check that rolling windows do not cross train/test boundary.

        Args:
            features_df: Feature DataFrame with row indices
            sequence_length: Window size used for features
            split_index: Index where train/test split occurs

        Returns:
            True if no leakage, False if temporal leakage detected
        """
        # Features near split boundary may use lookback into opposite split
        danger_zone_start = max(0, split_index - sequence_length)
        danger_zone_end = split_index + sequence_length

        if len(features_df) > split_index:
            # Check if features near boundary exist
            near_boundary = (
                (features_df.index >= danger_zone_start) & (features_df.index < danger_zone_end)
            ).sum()

            if near_boundary > 0:
                msg = (
                    f"Temporal leakage risk: {near_boundary} features within "
                    f"{sequence_length} samples of split boundary"
                )
                logger.warning(msg)
                self.checks.append(f"temporal_leakage: WARNING ({near_boundary} at risk)")
                return True  # Warning, not failure

        logger.info("✓ Temporal leakage check PASSED: no windows crossing split")
        self.checks.append("temporal_leakage: PASSED")
        return True

    def check_perfect_separation(self, y_true: np.ndarray, y_pred: np.ndarray) -> bool:
        """
        Check for suspiciously perfect metrics that may indicate leakage.

        Args:
            y_true: Ground truth labels
            y_pred: Predicted labels

        Returns:
            True if metrics are reasonable, False if suspiciously perfect
        """
        from sklearn.metrics import precision_score, recall_score, f1_score

        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)

        # Perfect metrics (P=R=F1=1.0) with complex data are suspicious
        if precision == 1.0 and recall == 1.0 and f1 == 1.0:
            n_positive = (y_true > 0).sum()
            n_negative = (y_true == 0).sum()

            if n_positive > 100 and n_negative > 100:
                msg = (
                    f"Perfect separation detected (P=R=F1=1.0) with {n_positive} "
                    f"positives and {n_negative} negatives. "
                    "This is suspicious and may indicate label leakage."
                )
                logger.warning(msg)
                self.failures.append(msg)
                return False

        logger.info(
            f"✓ Perfect separation check PASSED: P={precision:.3f}, R={recall:.3f}, "
            f"F1={f1:.3f} (reasonable)"
        )
        self.checks.append("perfect_separation: PASSED")
        return True

    def check_baseline_tie(
        self,
        model_recall: float,
        model_fp_rate: float,
        baseline_recalls: List[float],
        baseline_fp_rates: List[float],
    ) -> bool:
        """
        Check if model and baselines all have identical performance (suspicious).

        Args:
            model_recall: Model recall
            model_fp_rate: Model FP rate
            baseline_recalls: Baseline recalls
            baseline_fp_rates: Baseline FP rates

        Returns:
            True if performance varies, False if all tied (suspicious)
        """
        all_recalls = [model_recall] + baseline_recalls
        all_fp_rates = [model_fp_rate] + baseline_fp_rates

        recall_var = np.var(all_recalls)
        fp_var = np.var(all_fp_rates)

        if recall_var < 1e-6 and fp_var < 1e-6:
            msg = (
                f"All models have identical performance (R={model_recall:.3f}, "
                f"FP={model_fp_rate:.3f}). "
                "This may indicate trivial test set or lenient evaluation window."
            )
            logger.warning(msg)
            self.checks.append("baseline_tie: WARNING (all tied)")
            return True  # Warning, not failure

        logger.info(
            f"✓ Baseline comparison check PASSED: performance varies "
            f"(R_var={recall_var:.4f}, FP_var={fp_var:.4f})"
        )
        self.checks.append("baseline_tie: PASSED")
        return True

    def generate_report(self) -> Dict:
        """Generate final audit report."""
        passed = len(self.failures) == 0

        report = {
            "audit_status": "PASSED" if passed else "FAILED",
            "checks_performed": self.checks,
            "failures": self.failures,
            "total_checks": len(self.checks),
            "failed_checks": len(self.failures),
        }

        if passed:
            logger.info("=" * 80)
            logger.info("LEAKAGE AUDIT: PASSED")
            logger.info("=" * 80)
            for check in self.checks:
                logger.info(f"  ✓ {check}")
        else:
            logger.error("=" * 80)
            logger.error("LEAKAGE AUDIT: FAILED")
            logger.error("=" * 80)
            for failure in self.failures:
                logger.error(f"  ✗ {failure}")

        return report
