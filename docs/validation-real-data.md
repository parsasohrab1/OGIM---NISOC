# Real-World Validation on Petrobras 3W Dataset

**Status:** ✅ **COMPLETED** — Fixed methodology, balanced sampling, validation-tuned threshold

**Date:** 2026-11-09  
**Dataset:** Petrobras 3W (REAL instances, 20 per class, 60s downsample)  
**Methodology:** v6_optimized (balanced, incremental caching, per-sample labeling)

---

## Executive Summary

The OGIM anomaly detection component was evaluated on **real field data** from the Petrobras 3W dataset (https://github.com/petrobras/3W), using 20 instances per class across 10 event classes (0-9). The evaluation employed:
- **Balanced sampling** including normal (class-0) instances
- **Per-sample binary labeling** from the 3W `class` column (0=normal, >0=event)
- **Well-grouped splits** to prevent leakage (60% train, 20% validation, 20% test)
- **Class-weighted training** (`class_weight='balanced'`)
- **Threshold tuning on validation wells only** (never on test)
- **Event-level bootstrap 95% confidence intervals**

### Key Findings

**Sample Counts:**
- Train: 93,224 samples (36,350 normal / 56,874 event)
- Validation: 17,775 samples (5,344 normal / 12,431 event)
- Test: 100,306 samples (19,607 normal / 80,699 event)

**Confusion Matrix (Test):**
| Predicted | Normal | Event |
|-----------|--------|-------|
| **Normal** | TN=0 | FN=0 |
| **Event** | FP=19,607 | TP=80,699 |

**Metrics (with 95% CI):**
- **Binary Macro-F1:** 0.446 [0.445, 0.447] ❌ (Criterion: ≥0.65)
- **Event Recall:** 1.000 [1.000, 1.000] (trivial; detector always alarms)
- **Precision:** 0.805
- **False Alarms/Day:** 1440.0 ❌ (Criterion: ≤3.0; alarms every minute)
- **Lead Time:** 49,080 seconds (~13.6 hrs) (not meaningful; detector alarms immediately)

**Baseline Comparison:**
- Z-score: F1=0.187, R=0.032, FP/day=102.0
- Threshold (99th percentile): F1=0.232, R=0.105, FP/day=327.1
- **OGIM detector is degenerate (TN=0):** predicts event 100% of the time, providing no practical discrimination. Recall and lead time metrics are not meaningful.

**Leakage Audit:** ✅ **PASSED**
- ✅ Split leakage: no well overlap
- ✅ Feature leakage: no label columns in features
- ✅ Perfect separation: metrics reasonable (P=0.805, R=1.0, F1=0.446)
- ✅ Missing class check: both normal and event classes present in test set

### TRL Verdict

**TRL4** — Validated in a laboratory environment  
**Reasoning:** Failed 2 of 4 predeclared criteria:
- ❌ Binary Macro-F1 ≥0.65 (achieved 0.446)
- ❌ False Alarms/Day ≤3.0 (achieved 1440.0 = every minute)

**Root Cause:** The detector is degenerate (TN=0): it predicts event 100% of the time despite class-weighted training and validation-tuned threshold. The features (rolling statistics over 60s windows) provide no practical discrimination between normal steady-state and pre-onset transients in 3W data. The detector has no operational value; recall and lead time are trivial artifacts of always alarming.

---

## Methodology Changes from PR #10

**PR #10 Issues:**
1. **Missing normal instances:** `event_classes=[1..9]` excluded class 0
2. **Instance-level labeling:** All samples in an event file were labeled as event, ignoring per-sample `class` transitions
3. **Result:** TN=0, FP=20,629, FN=0, TP=3,743 (degenerate, 100% false alarms)

**PR #11 Fixes:**
1. ✅ Load class-0 (normal) instances up to `max_per_class`
2. ✅ Extract binary labels per sample: `y = (df["class"] > 0).astype(int)`
3. ✅ Train with `class_weight='balanced'`
4. ✅ Tune decision threshold on validation wells only (threshold=0.27 maximized val F1)
5. ✅ Incremental parquet caching per instance (crash-resumable)
6. ✅ Downsample to 60s before feature extraction (memory management)
7. ✅ Leakage audit check enforcing both classes present in test

---

## Data Source

- **Repository:** https://github.com/petrobras/3W
- **Dataset:** REAL instances only (prefix `WELL-*.parquet`, 1,119 files across ~40 wells)
- **Variables:** P-PDG, P-TPT, T-TPT, P-MON-CKP, T-JUS-CKP, P-JUS-CKGL, T-JUS-CKGL, QGL
- **Labels:** Per-sample `class` column (0=normal, 1-9=fault types, 101-109=transients)
- **Instance Selection:** Stratified random sampling (20 per class, seed=42)

## Evaluation Protocol

**Predeclared Criteria (commit bcea1d4, unchanged):**
1. Event Recall ≥ 0.75
2. Binary Macro-F1 ≥ 0.65
3. False Alarms/Day ≤ 3.0
4. Lead Time ≥ 60s
5. Leakage Audit: PASSED

**Split Strategy:**
- Train: 60% wells
- Validation: 20% wells (threshold tuning only)
- Test: 20% wells (final evaluation)
- Zero well overlap across splits

**Baselines:**
- Z-score: flag if any sensor exceeds 3 standard deviations
- Threshold: flag if any sensor exceeds 99th percentile

## Limitations

1. **Offshore Brazil vs. Marun/NISOC:** 3W wells may differ in geology, fluid properties, and operational regimes.
2. **No live integration:** Evaluation is offline; TRL5+ requires real NISOC deployment.
3. **Degenerate predictions:** Model predicts event on nearly all samples, suggesting feature engineering or labeling misalignment with 3W's transient classes.
4. **Class imbalance persists:** Despite `class_weight='balanced'`, the model favors recall over precision.

## Recommendations

1. **Feature engineering:** Investigate frequency-domain, wavelet, or deep features; current rolling stats may not capture pre-onset signatures.
2. **Labeling alignment:** Verify that 3W transient classes (101-109) correspond to detectable anomalies vs. normal operational transients.
3. **Cost-sensitive threshold:** If false alarms are critical, tune threshold for precision ≥0.95 at cost of recall.
4. **NISOC pilot:** Deploy on 1-2 Marun wells with subject-matter expert feedback to recalibrate.

## Files

- **Loader:** `backend/validation/petrobras_3w/loader.py`
- **Adapter:** `backend/validation/petrobras_3w/adapter.py`
- **Evaluator:** `scripts/evaluate_3w_optimized.py`
- **Results:** `results/3w_validation_results.json`
- **Leakage Audit:** `backend/validation/petrobras_3w/leakage_audit.py`

## Conclusion

The OGIM anomaly detector was evaluated on real Petrobras 3W field data with honest reporting. **The detector is degenerate (TN=0):** it predicts event 100% of the time, providing no practical discrimination. Recall (1.0) and lead time (13.6 hrs) are trivial artifacts of always alarming and are not meaningful metrics. The detector failed Binary Macro-F1 and false alarm rate criteria. **TRL4 verdict is maintained.** TRL5 advancement requires feature engineering redesign and NISOC-specific tuning with field data.

---

**PR:** https://github.com/parsasohrab1/OGIM---NISOC/pull/11  
**Commit:** (pending merge)
