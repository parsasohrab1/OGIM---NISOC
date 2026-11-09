# TRL5 Acceptance Criteria for OGIM—NISOC Anomaly/Event Detection

**Date**: 2026-11-09  
**System**: OGIM Oil & Gas Intelligent Monitoring (Marun Field Deployment - NISOC)  
**Component**: ML Inference Service - Anomaly & Event Detection  
**Validation Dataset**: Petrobras 3W (REAL instances only)  
**Current TRL**: 4 (laboratory/simulated data)  
**Target TRL**: 5 (relevant environment validation)

---

## 1. Objective

Validate the anomaly/event-detection component of OGIM on **real field data** from the Petrobras 3W dataset to demonstrate capability in a relevant environment (offshore oil wells with similar operational characteristics to NISOC fields).

---

## 2. Dataset Requirements

### 2.1 Data Source
- **Dataset**: Petrobras 3W (https://github.com/petrobras/3W)
- **License**: Creative Commons BY 4.0 (compatible with this project)
- **Instances**: REAL instances ONLY (exclude simulated and hand-drawn)
- **Minimum wells**: At least 5 distinct wells for holdout validation
- **Minimum events**: At least 50 events across different fault classes

### 2.2 Data Quality
- Must include labeled event types (fault classes)
- Must include normal operation periods
- Must have complete sensor readings (P-PDG, P-TPT, T-TPT, etc.)
- Temporal continuity for each well (no major gaps)

---

## 3. Variable Mapping

All Petrobras 3W variables must be mapped to OGIM schema with explicit units:

| 3W Variable | OGIM Tag | Unit | Description |
|-------------|----------|------|-------------|
| P-PDG | PDG_PRESSURE | bar | Permanent Downhole Gauge Pressure |
| P-TPT | TPT_PRESSURE | bar | Tubing Pressure (Tree) |
| T-TPT | TPT_TEMPERATURE | °C | Tubing Temperature |
| P-MON-CKP | CHOKE_PRESSURE | bar | Choke Manifold Pressure |
| T-JUS-CKP | CHOKE_TEMPERATURE | °C | Choke Temperature (downstream) |
| QGL | GAS_LIFT_FLOW | m³/d | Gas Lift Flow Rate |

**Note**: Unit conversions must be documented and tested. 3W uses SI units; confirm compatibility.

---

## 4. Evaluation Protocol

### 4.1 Data Splitting Strategy
- **Holdout by well**: Split at well level (not time-based within wells)
- **Training set**: 60% of wells (minimum 3 wells)
- **Validation set**: 20% of wells (minimum 1 well)
- **Test set**: 20% of wells (minimum 1 well, unseen during training/validation)
- **Random seed**: 42 (for reproducibility)

### 4.2 Event-Level Detection Metrics

**Primary Metrics** (must meet ALL thresholds):

1. **Event Detection Recall** ≥ 0.75
   - Fraction of true events detected
   - Detection window: ±300 seconds from ground truth timestamp

2. **False Alarms per Day** ≤ 3.0
   - False positive events per 24-hour period
   - Averaged across all test wells

3. **Macro-F1 across Event Classes** ≥ 0.65
   - F1 score averaged across all fault types
   - Accounts for class imbalance

4. **Detection Lead Time** ≥ 60 seconds
   - Median time between first detection and labeled event start
   - Negative values mean late detection (penalty)

**Secondary Metrics** (for analysis, no hard threshold):
- Precision per class
- Confusion matrix across event types
- ROC-AUC for normal vs. anomaly
- Sensor-specific anomaly patterns

---

## 5. Baseline Comparison

The OGIM model must **outperform** at least one simple baseline on ALL primary metrics:

### 5.1 Baseline 1: Rolling Z-Score Threshold
- Window: 60 samples (1 hour at 1 Hz)
- Threshold: |z| > 3.0 on any sensor
- Aggregation: Vote (event if ≥2 sensors trigger)

### 5.2 Baseline 2: Static Threshold Rules
- Per-sensor thresholds based on training quantiles (5th, 95th percentile)
- Event if any sensor exceeds thresholds for >30 consecutive seconds

### 5.3 Comparison Requirement
- OGIM model must achieve:
  - **Higher Recall** than both baselines, OR
  - **Equal Recall** AND **≥20% fewer false alarms** than the better baseline

---

## 6. Model Requirements

### 6.1 Feature Engineering
- Must use temporal features (sliding windows, differences, rates of change)
- Must normalize/scale per-well (account for well heterogeneity)
- Feature extraction must be reproducible and documented

### 6.2 Model Training
- Must use REAL 3W training data (no synthetic augmentation unless explicitly documented)
- Hyperparameters must be selected on validation set (no test set leakage)
- Training time must be logged and reasonable (<24 hours on standard hardware)

### 6.3 Inference Latency
- Inference time per sample: <100 ms (median)
- Must support streaming/online mode (not batch-only)

---

## 7. Reproducibility Requirements

All experiments must be fully reproducible:

1. **Data Loader**: Deterministic, checksummed downloads
2. **Random Seeds**: Fixed (42 for splits, 123 for model training)
3. **Environment**: `requirements.txt` with pinned versions
4. **Experiment Tracking**: Results logged to JSON with timestamps
5. **Code Tests**: pytest suite with ≥80% coverage on new code

---

## 8. Limitations & Constraints

**Explicit Acknowledgments** (must be documented in final report):

1. **Geographic Difference**: 3W wells are offshore Brazil (subsea completions, pre-salt reservoirs); Marun is onshore Iran (different geology, production methods).

2. **Sensor Configuration**: 3W sensor suite may differ from actual NISOC SCADA (e.g., missing corrosion sensors, different sampling rates).

3. **Event Taxonomy**: 3W fault classes (e.g., "spurious closure of DHSV", "hydrate in production line") may not directly map to NISOC-specific faults.

4. **No Live Integration**: This is a retrospective validation; no real-time NISOC data ingestion or SCADA integration is performed.

5. **Stationarity Assumption**: Model assumes well behavior is stationary over the dataset period; does not account for long-term degradation or seasonal effects.

---

## 9. Success Criteria for TRL5

**TRL5 is ACHIEVED if and only if:**

1. ✅ All **Primary Metrics** meet or exceed thresholds (Section 4.2)
2. ✅ OGIM model **beats at least one baseline** per Section 5.3
3. ✅ **Test set** results are reported (no training on test data)
4. ✅ All **limitations** are transparently documented (Section 8)
5. ✅ Results are **reproducible** (code + tests pass in CI)

**If ANY criterion fails, TRL remains 4** with documented failure analysis.

---

## 10. Deliverables Checklist

- [ ] `backend/validation/petrobras_3w/` module:
  - [ ] `loader.py` - Data downloader with checksums
  - [ ] `adapter.py` - 3W → OGIM schema mapping
  - [ ] `splitter.py` - Well-based train/val/test split
  - [ ] `baselines.py` - Z-score and threshold baselines
  - [ ] `evaluator.py` - Event-level metrics computation
- [ ] `scripts/train_3w_model.py` - Training script
- [ ] `scripts/evaluate_3w_model.py` - Evaluation script
- [ ] `backend/tests/validation/test_3w_*.py` - Test suite (≥80% coverage)
- [ ] `docs/validation-real-data.md` - Final report with:
  - [ ] Metrics table (train/val/test)
  - [ ] Baseline comparison
  - [ ] Limitations section
  - [ ] TRL verdict (5 or 4 with reasons)
- [ ] `results/3w_validation_results.json` - Machine-readable results
- [ ] Updated `README.md` with TRL status

---

## 11. Review & Approval

**Pre-declared by**: Cloud Agent (automated)  
**Date**: 2026-11-09  
**Commit SHA**: (to be filled after commit)  
**Approval**: Pre-approved by repository owner for direct merge upon test pass

---

**IMPORTANT**: This criteria document is **locked**. No threshold relaxation is permitted after seeing results. Any criterion changes require a new acceptance criteria document with version increment.
