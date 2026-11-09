# Evaluation Methodology Fixes - In Progress

## Status: Work In Progress

This document tracks the implementation of evaluation methodology fixes requested for TRL5 validation iteration 2.

## Completed ✅

### 1. ADDENDUM to TRL5 Acceptance Criteria
- ✅ Added ADDENDUM section to `TRL5_ACCEPTANCE_CRITERIA.md`
- ✅ **Binary Macro-F1 definition clarified:** (F1_event + F1_normal) / 2
- ✅ **Transient onset lead time defined:** Detection relative to class transition 0 → 101-109 or 0 → 1-9
- ✅ **One-sided detection window:** Only pre-onset detections count as early
- ✅ **Leakage prevention requirements:** Feature, split, temporal, and label leakage checks
- ✅ **Bootstrap 95% CIs required:** Statistical significance via 1000 resamples
- ✅ **All threshold values unchanged:** bcea1d4 criteria locked

### 2. Leakage Audit Module
- ✅ Created `backend/validation/petrobras_3w/leakage_audit.py`
- ✅ `LeakageAuditor` class with methods:
  - `check_feature_leakage()` - No event_type/class/state columns in features
  - `check_split_leakage()` - No well overlap between train/test
  - `check_temporal_leakage()` - No rolling windows crossing split boundary
  - `check_perfect_separation()` - Flag suspicious P=R=F1=1.0
  - `check_baseline_tie()` - Flag when all models have identical performance
  - `generate_report()` - Final PASSED/FAILED audit outcome

### 3. Evaluator Enhancements
- ✅ Added `compute_binary_macro_f1()` function
  - Binarize labels: 0=normal, >0=event
  - Compute F1 for each class separately
  - Return (F1_normal + F1_event) / 2

- ✅ Added `find_transient_onset()` function
  - Detects first transition from class 0 to class >0
  - Handles transient labels 101-109 and fault labels 1-9

- ✅ Added `compute_lead_time_to_onset()` function
  - Measures time from first detection to transient onset
  - Positive lead time = early detection
  - Negative lead time = late detection
  - Returns None if no onset or no detection

- ✅ Added `bootstrap_confidence_intervals()` function
  - 1000 bootstrap resamples (seed=42)
  - Computes mean and 95% CI (2.5th, 97.5th percentiles)
  - Returns (mean, lower_ci, upper_ci)

### 4. Data Loading
- ✅ Increased `max_per_class` to 40 (from 10) for larger test set
- ✅ Preserved `class_label` column in adapter for onset detection
- ✅ Documented that `class_label` is for evaluation only, NOT features

## In Progress 🔄

### 5. Evaluation Script Integration
- ⏳ Update `scripts/evaluate_3w_model.py` to:
  - Call `LeakageAuditor` and generate audit report
  - Use `compute_binary_macro_f1()` instead of sklearn's default
  - Use `compute_lead_time_to_onset()` for each test well
  - Apply `bootstrap_confidence_intervals()` to all metrics
  - Report metrics as: `mean ± CI_95` or `mean [lower, upper]`

### 6. Training Script Updates
- ⏳ Exclude `class_label` and `event_type` from features explicitly
- ⏳ Add feature leakage check before training
- ⏳ Verify well-grouped split (no well in both train/test)

## Remaining Work ⏳

### 7. Full Validation Run
- [ ] Train models with 40 instances per class (larger dataset)
- [ ] Run leakage audit before and after evaluation
- [ ] Compute binary Macro-F1 (not multiclass)
- [ ] Measure lead time to transient onset (not to final fault label)
- [ ] Compute bootstrap 95% CIs for all metrics
- [ ] Count test events per class with CIs
- [ ] Generate honest report with audit outcome

### 8. Documentation Updates
- [ ] Update `docs/validation-real-data.md` with:
  - Leakage audit outcome (PASSED/FAILED)
  - Binary Macro-F1 methodology
  - Transient onset lead time methodology
  - Bootstrap CIs for all metrics
  - Per-class event counts with CIs
  - Honest TRL verdict based on updated metrics

### 9. Results JSON
- [ ] Add fields to `results/3w_validation_results.json`:
  - `leakage_audit`: {status, checks, failures}
  - `metrics_with_cis`: {metric: {mean, ci_lower, ci_upper}}
  - `test_events_by_class`: {class: {count, ci_lower, ci_upper}}
  - `transient_onset_count`: Number of onsets detected
  - `binary_macro_f1`: True binary F1 (not multiclass)

### 10. Final PR
- [ ] Push complete implementation
- [ ] Run full CI checks
- [ ] Merge when tests pass
- [ ] Report: PR URL, merged SHA, leakage audit outcome, metrics with CIs, TRL verdict

## Key Fixes Summary

### Issue 1: Macro-F1 = 0.0 (Binary vs. Multiclass Mismatch)
**Root Cause:** Models output binary (0/1) but sklearn's `macro_f1` expected multiclass (0-9).

**Fix:** 
- ADDENDUM clarifies Macro-F1 is binary (event vs. normal)
- New `compute_binary_macro_f1()` function computes (F1_event + F1_normal) / 2
- Both predictions and labels binarized before F1 calculation

### Issue 2: Negative Lead Time (Detection After Event Start)
**Root Cause:** Lead time measured to final fault label (1-9), not transient onset (101-109).

**Fix:**
- ADDENDUM defines lead time relative to transient onset
- New `find_transient_onset()` detects first 0 → >0 transition
- New `compute_lead_time_to_onset()` measures detection time to onset
- One-sided window: only pre-onset detections count as early

### Issue 3: Suspicious Perfect Metrics (P=R=F1=1.0)
**Root Cause:** Possible label leakage, trivial test set, or lenient detection window.

**Fix:**
- New `LeakageAuditor` checks for:
  - Feature leakage (no label columns in features)
  - Split leakage (no well overlap)
  - Perfect separation (flags P=R=F1=1.0 as suspicious)
  - Baseline tie (flags when all models perform identically)
- Audit outcome reported as PASSED/FAILED

### Issue 4: Insufficient Test Events (N=8)
**Root Cause:** Only 10 instances per class selected.

**Fix:**
- Increased `max_per_class` to 40
- Expected 40 × 9 classes = 360 instances total
- More wells, more events, better statistical power

### Issue 5: No Statistical Significance
**Root Cause:** Point estimates only, no confidence intervals.

**Fix:**
- New `bootstrap_confidence_intervals()` function
- 1000 resamples with replacement
- Report all metrics as: `mean ± CI_95` or `mean [lower, upper]`

## Next Steps

1. **Complete evaluation script integration** (use new functions)
2. **Run full validation** with 40 instances/class
3. **Generate leakage audit report** (PASSED/FAILED)
4. **Report metrics with 95% CIs**
5. **Document honest TRL verdict** based on updated methodology
6. **Merge PR** when CI passes

## References

- Original criteria: `TRL5_ACCEPTANCE_CRITERIA.md` (commit bcea1d4)
- ADDENDUM: `TRL5_ACCEPTANCE_CRITERIA.md` (this branch)
- Leakage audit: `backend/validation/petrobras_3w/leakage_audit.py`
- Evaluator fixes: `backend/validation/petrobras_3w/evaluator.py` (new functions appended)
- User request: Turn 3 (fix evaluation bugs, increase test events, report with CIs)
