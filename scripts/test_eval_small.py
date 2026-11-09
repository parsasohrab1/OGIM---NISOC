"""
Test evaluation on small dataset to isolate issues.
"""
import sys
import traceback
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

try:
    logger.info("=== SMALL SCALE TEST ===")
    
    # Test 1: Load 1 instance
    logger.info("\n[1] Testing data loading (1 instance)...")
    from validation.petrobras_3w.loader import load_all_real_instances
    
    data = load_all_real_instances(max_per_class=1, event_classes=[1], random_seed=42)
    logger.info(f"✓ Loaded {len(data)} wells")
    
    # Test 2: Adapt
    logger.info("\n[2] Testing adaptation...")
    from validation.petrobras_3w.adapter import adapt_3w_to_ogim
    import pandas as pd
    
    well_id = list(data.keys())[0]
    df = pd.concat(data[well_id], ignore_index=True)
    df_ogim = adapt_3w_to_ogim(df, well_id)
    logger.info(f"✓ Adapted {len(df_ogim)} records")
    
    # Test 3: Feature extraction
    logger.info("\n[3] Testing feature extraction...")
    from validation.petrobras_3w.adapter import create_feature_vectors
    
    features_df = create_feature_vectors(df_ogim, sequence_length=60, downsample_seconds=60)
    logger.info(f"✓ Created {len(features_df)} feature vectors")
    
    # Test 4: Binary F1
    logger.info("\n[4] Testing binary F1...")
    from validation.petrobras_3w.evaluator import compute_binary_macro_f1
    import numpy as np
    
    y_true = np.array([0, 0, 1, 1, 1])
    y_pred = np.array([0, 1, 1, 1, 0])
    f1 = compute_binary_macro_f1(y_true, y_pred)
    logger.info(f"✓ Binary F1: {f1:.3f}")
    
    # Test 5: Transient onset
    logger.info("\n[5] Testing transient onset detection...")
    from validation.petrobras_3w.evaluator import find_transient_onset
    
    test_df = pd.DataFrame({"class_label": [0, 0, 0, 101, 1, 1]})
    onset = find_transient_onset(test_df, "class_label")
    logger.info(f"✓ Transient onset at index: {onset}")
    
    # Test 6: Bootstrap CIs (small N)
    logger.info("\n[6] Testing bootstrap CIs...")
    from validation.petrobras_3w.evaluator import bootstrap_confidence_intervals
    from sklearn.metrics import recall_score
    
    def binary_recall(yt, yp):
        return recall_score((yt > 0).astype(int), (yp > 0).astype(int), zero_division=0)
    
    mean, lower, upper = bootstrap_confidence_intervals(
        binary_recall, y_true, y_pred, n_bootstrap=100
    )
    logger.info(f"✓ Recall: {mean:.3f} [{lower:.3f}, {upper:.3f}]")
    
    # Test 7: Leakage audit
    logger.info("\n[7] Testing leakage audit...")
    from validation.petrobras_3w.leakage_audit import LeakageAuditor
    
    auditor = LeakageAuditor()
    auditor.check_split_leakage(["WELL-00001"], ["WELL-00002"])
    report = auditor.generate_report()
    logger.info(f"✓ Audit status: {report['audit_status']}")
    
    logger.info("\n=== ALL TESTS PASSED ===")
    
except Exception as e:
    logger.error(f"\n!!! TEST FAILED !!!")
    logger.error(traceback.format_exc())
    sys.exit(1)
