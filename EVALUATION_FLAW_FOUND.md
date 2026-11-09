# Critical Evaluation Flaw Discovered

**Date:** 2026-11-09  
**Issue:** Test set contains NO NORMAL SAMPLES, making evaluation invalid

---

## Problem

The evaluation script calls:
```python
load_all_real_instances(
    max_per_class=10,
    event_classes=[1, 2, 3, 4, 5, 6, 7, 8, 9],  # EXCLUDES class 0 (normal)
    random_seed=42,
)
```

**Result:** Only event instances are loaded. Class 0 (normal/steady-state) is excluded.

## Evidence

Confusion matrix from balanced model evaluation:
```
TN=0, FP=0, FN=0, TP=24372
```

This means:
- y_test_binary is ALL ONES (all event samples)
- NO normal samples in test set
- Impossible to measure false alarm rate
- Binary Macro-F1 is meaningless (F1_normal cannot be computed)

## Impact

### All Previous Evaluations Invalid
1. **PR #9 evaluation:** Invalid (no normal samples)
2. **PR #10 evaluation (c11410d):** Invalid (no normal samples)
3. **Current balanced model eval:** Invalid (no normal samples)

### Metrics Cannot Be Computed
- **False Alarm Rate:** Undefined (denominator = 0)
- **Binary Macro-F1:** Meaningless (F1_normal = N/A)
- **Precision:** Inflated (no false positives possible)
- **Leakage Audit:** Incomplete (normal class not tested)

## Root Cause

The `load_all_real_instances` function with `event_classes=[1-9]` was designed to:
- Load representative instances of each EVENT TYPE
- Enable per-class stratification for event detection

But it **excludes normal operation data (class 0)**, making it unsuitable for:
- Binary classification (event vs normal)
- False alarm rate measurement
- Production-realistic evaluation

## Corrective Action Required

### Immediate
1. ✅ Document the flaw (this file)
2. ⏳ Load FULL instances (including normal periods)
3. ⏳ Rerun evaluation with balanced event/normal data

### Data Loading Fix
```python
# Option 1: Load complete instances (all classes)
data_raw = load_all_real_instances(
    max_per_class=10,
    event_classes=None,  # Include ALL classes (0-9)
    random_seed=42,
)

# Option 2: Separate loading
# - Load event instances (classes 1-9)
# - Load normal-only instances (class 0)
# - Merge for balanced dataset
```

### Evaluation Requirements
1. **Balanced dataset:**
   - Normal samples ≥ 50% of total
   - Event samples spread across classes 1-9
   
2. **Realistic split:**
   - Entire wells in train/val/test (preserve temporal structure)
   - Both normal and event periods in test set
   
3. **Proper metrics:**
   - Confusion matrix with TN, FP, FN, TP all > 0
   - False alarm rate on normal samples
   - Binary Macro-F1 on balanced data

## Why This Wasn't Caught Earlier

1. **F1_normal = 0** was attributed to "class imbalance"
   - Actual cause: NO normal samples in test set
   
2. **Precision = 1.0** seemed contradictory
   - Actual: With no normal samples, FP=0, so precision=TP/TP=1.0
   
3. **Leakage audit passed**
   - Only checked event samples (all that existed)
   - Didn't detect missing normal class

## Status

- [x] Flaw documented
- [ ] Data loading fixed
- [ ] Evaluation rerun with normal samples
- [ ] Results validated
- [ ] Documentation updated

---

**Priority:** BLOCKING - Evaluation cannot proceed without normal samples  
**Resolution:** Must load complete instances including class 0  
**ETA:** Requires complete re-evaluation

---

**Document Version:** v1  
**Author:** Cloud Agent (OGIM-NISOC Validation)  
**Status:** Critical blocker identified
