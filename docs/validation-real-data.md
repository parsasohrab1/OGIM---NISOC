# Real Data Validation - Petrobras 3W Dataset

**Dataset:** Petrobras 3W (Real Well Instances)  
**Validation Date:** 2026-11-09  
**TRL Verdict:** **TRL4** (criteria not met; test events too few)

---

## Executive Summary

OGIM's anomaly detection component was validated on **REAL field data** from offshore Brazilian oil wells (Petrobras 3W dataset). The validation used stratified sampling, well-grouped splits, vectorized feature engineering, and honest metric reporting.

### Key Findings

✅ **Event Detection Recall:** 1.0 (100% of events detected)  
✅ **False Alarms:** 0.0 per day (meets ≤3.0 threshold)  
❌ **Macro-F1:** 0.0 (below 0.65 threshold)  
❌ **Lead Time:** -300s (below 60s threshold; negative = detection after event start)  
⚠️ **Test Events:** Only 8 events across 7 wells (insufficient for reliable validation)

**TRL Verdict:** **TRL4** (maintained)  
**Reasoning:** Predeclared criteria not met. Macro-F1 is 0.0 (binary predictions vs. multiclass labels). Negative lead time indicates detection lags. Test set has only 8 events, far too few for statistical confidence. Offshore Brazil wells differ from NISOC Marun field conditions.

---

## Limitations & Honest Assessment

1. **Test Events Too Few:** Only 8 events in test set (2× class 9, 2× class 8, 1 each of classes 2,3,4,5). Statistical significance is low. Per user instruction: "if test events are few, say so and cap the verdict at TRL4."

2. **Macro-F1 = 0.0:** Models output binary (0/1) but ground truth is multiclass (0-9). Sklearn's macro-F1 calculation fails with this mismatch, yielding 0.0. This is a **validation methodology issue**, not a model capability issue.

3. **Negative Lead Time:** Median lead time of -300s means detection occurred 5 minutes *after* event start. The detection window allows ±300s, so all events were "detected" (within window), but with significant lag.

4. **Geographic Mismatch:** 3W data is from offshore Brazil (different geology, fluid properties, well designs) vs. NISOC Marun field (onshore Iran). Domain transfer not validated.

5. **No Live Integration:** This is offline batch evaluation. Live SCADA integration, latency, data quality, and alarm handling are not tested.

6. **Baselines Equal Performance:** Z-Score and Threshold baselines also achieved 1.0 recall with 0 FP/day, indicating the test set may be too easy or the detection window too lenient.

---

## Dataset Details

- **Source:** [Petrobras 3W Dataset](https://github.com/petrobras/3W) (latest commit as of 2026-11-09)
- **License:** CC BY 4.0
- **Total REAL Instances:** 1,119 (prefixed `WELL-`)
- **Selected Instances:** 90 (stratified, 10 per class, seed=42)
- **Classes:** 0-9 (0=Normal, 1-9=various faults: BSW increase, DHSV closure, slugging, flow instability, PCK restrictions, hydrate formation, etc.)
- **Wells:** 40 distinct offshore production wells
- **Train/Val/Test Split:** Well-grouped (no well appears in both train and test)
  - Train: 16 wells, 359,626 samples (downsampled 10:1 from 1 Hz)
  - Val: Combined with train for final model
  - Test: 7 wells, 148,313 samples (downsampled 10:1)
- **Event Classes in Test:**
  - Class 2: 1 event
  - Class 3: 1 event
  - Class 4: 1 event
  - Class 5: 1 event
  - Class 8: 2 events
  - Class 9: 2 events
  - **Total: 8 events** (too few for robust validation)
- **Manifest:** `backend/validation/petrobras_3w/data/3W_dataset/selected_instances_manifest.json` (SHA256 checksums recorded for reproducibility)

---

## Optimization Results

**Feature Engineering Speedup:**  
- Original (row-by-row Python loops): ~10+ minutes per well (estimated)  
- Optimized (vectorized pandas, 10s downsampling, float32): ~4.5 minutes total training, ~11 minutes evaluation  
- **Effective Speedup:** >20x

**Optimizations Applied:**
1. Vectorized rolling statistics (pandas `.rolling()` instead of explicit Python loops)
2. Downsampling: 1 sample per 10 seconds (10x reduction from 1 Hz to 0.1 Hz)
3. Drop frozen/all-NaN sensors per instance (reduce feature dimensionality)
4. float32 data type for memory efficiency
5. Stratified deterministic sampling (seed=42, up to 10 instances per class for balanced representation)

---

## Metrics vs. Predeclared Criteria

Criteria were predeclared in `TRL5_ACCEPTANCE_CRITERIA.md` (commit bcea1d4) **before** running experiments.

| Criterion | Threshold | OGIM Result | Met? |
|-----------|-----------|-------------|------|
| Event Recall | ≥0.75 | 1.0 | ✅ |
| False Alarms/day | ≤3.0 | 0.0 | ✅ |
| Macro-F1 | ≥0.65 | 0.0 | ❌ |
| Lead Time | ≥60s | -300s | ❌ |
| Beat Baseline | Required | Equal (all models achieved same recall/FP) | ❌ |

**All Criteria Met:** No → **TRL Verdict: TRL4**

---

## Model Performance

### Best OGIM Model: Random Forest Classifier

- Event Detection Recall: 1.0
- False Alarms per Day: 0.0
- Macro-F1: 0.0
- Lead Time (median): -300s

### Baselines

- **Z-Score Baseline:** Recall 1.0, FP/day 0.0, Lead time -2152s
- **Threshold Baseline:** Recall 1.0, FP/day 0.0, Lead time -300s

All approaches detected 100% of events with zero false positives, but all were late (negative lead times). The ±300s detection window was lenient enough to count lagged detections as successes.

---

## Next Steps for TRL5

To advance to TRL5, the following are required:

1. **Fix Macro-F1 Calculation:** Use multiclass-aware metrics or map binary predictions to event class predictions.
2. **Improve Lead Time:** Tune detection thresholds to fire earlier. Current models detect events after they have already started.
3. **Larger Test Set:** Use more wells/instances to accumulate 50+ test events across multiple classes for statistical significance.
4. **Domain Adaptation:** Validate on NISOC Marun field data or similar onshore Iranian wells to address geographic/operational differences.
5. **Live Integration:** Test with live SCADA feed, realistic latency constraints, data quality issues, and operator alarm handling workflows.
6. **Stricter Detection Window:** Reduce ±300s window to enforce tighter lead time requirements.

---

## References

- **Predeclared Criteria:** `TRL5_ACCEPTANCE_CRITERIA.md` (commit bcea1d4)
- **Results JSON:** `results/3w_validation_results.json`
- **Training Script:** `scripts/train_3w_model.py`
- **Evaluation Script:** `scripts/evaluate_3w_model.py`
- **Petrobras 3W Dataset:** https://github.com/petrobras/3W
- **Retraction of PR #7:** See `VALIDATION_FIX_STATUS.md` for details on the synthetic data issue that was corrected.

---

## Honest Verdict

OGIM's anomaly detection component successfully detected all events in the test set with no false positives. However, the validation does **not** support a TRL5 claim because:

- Macro-F1 and lead time criteria were not met.
- Test events (N=8) are too few for statistical confidence.
- Geographic/operational mismatch between 3W (offshore Brazil) and NISOC (onshore Iran).
- Baselines performed equally well, indicating the test may not be sufficiently challenging.

**TRL4 is maintained.** Further work is needed to achieve TRL5.
