# 3W Validation Fix Status

**Date**: 2026-11-09  
**Branch**: cursor/fix-3w-real-data-ddee  
**Status**: PARTIAL FIX - Real data loader implemented, full validation pending

---

## Critical Error Fixed

**Original Problem** (PR #7, commit ad8b07e):
- Validation reported use of "Petrobras 3W (REAL instances only)"
- **Actually used synthetic placeholder data** (all metrics INVALID)
- Loader silently fell back to generating fake data when downloads failed
- All reported metrics (recall=1.0, F1=0.947, TRL verdict) were meaningless

---

## Fixes Completed ✅

### 1. Retraction of Invalid Results
- **Commit dfaf6ba**: Marked all previous results as RETRACTED/INVALID
- Updated `results/3w_validation_results.json` with retraction notice
- Updated `docs/validation-real-data.md` with prominent INVALID warning
- Updated `README.md` to reflect invalid status

### 2. Loader Fixed to Use Real Data
- **Commit 68746ce**: Complete rewrite of loader
- Removes `create_synthetic_placeholder()` function entirely
- Clones actual 3W repository from GitHub
- Discovers REAL instances programmatically (WELL-*.parquet files)
- **FAILS if real data unavailable** (no silent fallback)
- Records 3W commit SHA and file checksums

### 3. Real Dataset Verified
- Successfully cloned 3W repository (2,588 files)
- Discovered **1,119 REAL instances** across 40 wells
- Event distribution:
  - Class 0 (Normal): 594 instances
  - Class 1-9 (Faults): 525 instances total
- Loader tested and working with actual 3W data

---

## Work Remaining ❌

### 1. Complete Training Run
**Status**: Attempted but not completed due to dataset size

**Issue**: Even with 15-20 instances, the dataset contains 200K+ samples which expand to millions of OGIM records during feature engineering, causing training to take 10+ minutes per well.

**What was attempted**:
- Multiple training runs with varying instance counts (100→40→30→20→15)
- All runs exceeded reasonable time limits
- Feature engineering creates 7 OGIM records per sample (one per sensor)
- Each feature vector requires 60-sample window aggregation

**What's needed**:
- Either: Accept longer training time (30-60 minutes) and let it complete
- Or: Further optimize feature engineering (reduce window size, subsample data)
- Or: Use pre-trained models if available

### 2. Baseline Evaluation
**Status**: Not run

**Dependencies**: Requires trained model from step 1

### 3. Final Metrics & TRL Verdict
**Status**: Cannot be determined without completing training

---

## Commits in This Branch

1. **dfaf6ba**: "RETRACT invalid validation results - used synthetic data, not real 3W"
   - Honest acknowledgment of error
   - Mark all previous metrics as INVALID
   
2. **68746ce**: "Fix loader: Remove synthetic fallback, use REAL 3W data"
   - Complete rewrite with real data discovery
   - No synthetic fallback
   - Documented 3W dataset structure

---

## Dataset Characteristics (Verified Real Data)

**Source**: https://github.com/petrobras/3W  
**Commit**: Latest (shallow clone)  
**License**: CC BY 4.0  

**Structure**:
- Class folders: `dataset/0/` through `dataset/9/`
- REAL instances: Prefixed with `WELL-*`
- Simulated instances: Prefixed with `SIMULATED_*` (excluded)
- Hand-drawn instances: Prefixed with `DRAWN_*` (excluded)

**Event Classes**:
- 0: Normal Operation (594 instances)
- 1: Abrupt Increase of BSW (4 instances)
- 2: Spurious Closure of DHSV (22 instances)
- 3: Severe Slugging (32 instances)
- 4: Flow Instability (343 instances)
- 5: Rapid Productivity Loss (11 instances)
- 6: Quick Restriction in PCK (6 instances)
- 7: Scaling in PCK (36 instances)
- 8: Hydrate in Production Line (14 instances)
- 9: Hydrate in Service Line (57 instances)

**Sensors** (8 variables, all SI units):
- P-PDG, P-TPT, T-TPT, P-MON-CKP, T-JUS-CKP, P-JUS-CKGL, T-JUS-CKGL, QGL

---

## Acceptance Criteria (Unchanged from bcea1d4)

Per user instruction, the predeclared criteria from `TRL5_ACCEPTANCE_CRITERIA.md` remain unchanged:

1. Event Detection Recall ≥ 0.75
2. False Alarms per Day ≤ 3.0
3. Macro-F1 ≥ 0.65
4. Detection Lead Time ≥ 60 seconds
5. Must beat at least one baseline

---

## Recommendations for Completion

### Option 1: Accept Longer Training Time
- Let training run for 30-60 minutes on current dataset
- Use 15-20 REAL instances from classes 1-4
- Complete full evaluation pipeline
- Report honest results even if small sample size

### Option 2: Optimize Feature Engineering
- Reduce window size from 60s to 30s
- Subsample data (e.g., 1 sample every 10 seconds instead of 1 Hz)
- Trade accuracy for speed

### Option 3: Use Minimal Viable Dataset
- Use only 5-10 instances
- Report metrics with caveat about small sample size
- Document that this is a proof-of-concept, not full validation

---

## Next Steps

1. Commit current fixes and push to PR
2. Choose optimization strategy (Option 1, 2, or 3)
3. Complete training run
4. Run evaluation
5. Document honest results with:
   - Number of REAL instances used
   - Number of wells
   - Number of events in test set
   - All metrics vs baselines
   - TRL verdict based on actual criteria
   - Limitations due to small sample if applicable

---

**Bottom Line**: The loader is fixed and verified to work with real 3W data. Training needs to complete to get valid metrics. The previous results are correctly retracted as invalid.
