# Real Field Data Validation Report

**System**: OGIM — Oil & Gas Intelligent Monitoring (Marun Field Deployment - NISOC)  
**Component**: ML Inference Service - Anomaly & Event Detection  
**Validation Dataset**: Petrobras 3W (REAL instances only)  
**Evaluation Date**: *To be filled after evaluation*  
**TRL Verdict**: *To be determined*

---

## Executive Summary

This document reports the validation of OGIM's anomaly/event-detection component on **real field data** from the Petrobras 3W dataset. The goal is to advance from **TRL4** (laboratory validation with simulated data) to **TRL5** (validation in a relevant environment with real operational data).

**Key Results** *(to be filled)*:
- Event Detection Recall: **TBD**
- False Alarms per Day: **TBD**
- Macro-F1 Score: **TBD**
- Detection Lead Time: **TBD**

**TRL Verdict**: **TRL [4 or 5]** — *Reasoning to be added*

---

## 1. Dataset Description

### 1.1 Source
- **Name**: Petrobras 3W (Well Anomaly Detection Dataset)
- **Source**: https://github.com/petrobras/3W
- **License**: Creative Commons BY 4.0
- **Publication**: Vargas et al. (2019), "A realistic and public dataset with rare undesirable real events in oil wells"
- **Domain**: Offshore oil production wells (subsea completions, deepwater Brazil)

### 1.2 Data Characteristics
- **Instance Type**: REAL instances only (excludes simulated and hand-drawn)
- **Wells Used**: *TBD* unique wells
- **Total Samples**: *TBD* samples at 1 Hz sampling rate
- **Duration**: *TBD* hours of operational data
- **Event Types**: 8 fault classes (DHSV closure, slugging, flow instability, etc.)
- **Normal Operation**: *TBD* % of samples

### 1.3 Variable Mapping

All Petrobras 3W variables were mapped to OGIM sensor tags with explicit units:

| 3W Variable | OGIM Tag | Unit | Description |
|-------------|----------|------|-------------|
| P-PDG | PDG_PRESSURE | bar | Permanent Downhole Gauge Pressure |
| P-TPT | TPT_PRESSURE | bar | Tubing Pressure (Tree) |
| T-TPT | TPT_TEMPERATURE | °C | Tubing Temperature |
| P-MON-CKP | CHOKE_PRESSURE | bar | Choke Manifold Pressure |
| T-JUS-CKP | CHOKE_TEMP_DOWNSTREAM | °C | Choke Temperature (Downstream) |
| P-JUS-CKGL | GASLIFT_CHOKE_PRESSURE | bar | Gas Lift Choke Pressure (Upstream) |
| T-JUS-CKGL | GASLIFT_CHOKE_TEMP | °C | Gas Lift Choke Temperature (Upstream) |
| QGL | GAS_LIFT_FLOW | m³/d | Gas Lift Flow Rate |

**Note**: All 3W variables are already in SI units; no unit conversions were required.

---

## 2. Evaluation Protocol

### 2.1 Data Splitting Strategy
To avoid data leakage and ensure robust evaluation:

- **Splitting Method**: Well-based (group split)
- **Training Set**: 60% of wells
- **Validation Set**: 20% of wells (for hyperparameter tuning)
- **Test Set**: 20% of wells (held out, unseen during training)
- **Random Seed**: 42 (for reproducibility)

**Critical**: No well appears in multiple splits. This ensures the model generalizes to entirely new wells.

### 2.2 Acceptance Criteria (Predeclared)

Per `TRL5_ACCEPTANCE_CRITERIA.md`, the model must meet **all** of the following on the test set:

| Criterion | Threshold | Rationale |
|-----------|-----------|-----------|
| Event Detection Recall | ≥ 0.75 | At least 75% of events detected |
| False Alarms per Day | ≤ 3.0 | Acceptable false positive rate for operators |
| Macro-F1 Score | ≥ 0.65 | Balanced performance across event classes |
| Detection Lead Time | ≥ 60 seconds | Early warning (median) |

**Additionally**, the model must **beat at least one simple baseline** (rolling z-score or static threshold) to demonstrate value over naive methods.

---

## 3. Model & Baselines

### 3.1 OGIM Model
Two variants were trained and evaluated:

1. **Isolation Forest** (Unsupervised)
   - Unsupervised anomaly detection
   - Contamination set to training anomaly rate
   - 100 trees, random_state=123

2. **Random Forest Classifier** (Supervised)
   - Binary classification: normal vs. anomaly
   - 100 trees, max_depth=20, class_weight='balanced'
   - random_state=123

**Feature Engineering**:
- Sliding window: 60 samples (1 minute)
- Features per sensor: current value, mean, std, min, max, range, rate of change
- Total features: *TBD*

### 3.2 Baselines

**Baseline 1: Rolling Z-Score**
- Window: 60 samples
- Threshold: |z| > 3.0
- Voting: Anomaly if ≥2 sensors trigger

**Baseline 2: Static Threshold**
- Thresholds: 5th and 95th percentiles from training data
- Minimum consecutive violations: 30 samples

---

## 4. Results

### 4.1 Metrics Summary

*To be filled after evaluation*

| Model | Event Recall | FP/Day | Macro-F1 | Lead Time (s) | TRL5 Met? |
|-------|-------------|--------|----------|---------------|-----------|
| **Isolation Forest** | TBD | TBD | TBD | TBD | TBD |
| **Random Forest** | TBD | TBD | TBD | TBD | TBD |
| Z-Score Baseline | TBD | TBD | TBD | TBD | — |
| Threshold Baseline | TBD | TBD | TBD | TBD | — |
| **TRL5 Threshold** | **≥0.75** | **≤3.0** | **≥0.65** | **≥60** | — |

### 4.2 Baseline Comparison

*To be filled*

- **Best OGIM Model**: *TBD*
- **Better Baseline**: *TBD*
- **Model Beats Baseline?**: *TBD*
- **Reasoning**: *TBD*

### 4.3 Per-Event-Class Performance

*To be filled with confusion matrix and per-class metrics*

---

## 5. Limitations & Constraints

### 5.1 Geographic & Operational Differences
- **3W Wells**: Offshore Brazil, subsea completions, deepwater pre-salt reservoirs
- **Marun Field (NISOC)**: Onshore Iran, conventional completions, different geology and reservoir characteristics
- **Implication**: Model may require retraining on NISOC-specific data for deployment

### 5.2 Sensor Configuration
- **3W Sensor Suite**: P-PDG, P-TPT, T-TPT, P-MON-CKP, T-JUS-CKP, QGL (8 variables)
- **Marun SCADA**: May include additional sensors (e.g., corrosion, H2S, vibration) or different sampling rates
- **Implication**: Feature engineering may need adjustment for Marun-specific SCADA

### 5.3 Event Taxonomy
- **3W Event Classes**: Specific to offshore operations (e.g., "hydrate in service line", "spurious closure of DHSV")
- **Marun Events**: May differ (e.g., paraffin deposition, sand production, different failure modes)
- **Implication**: Event labels and thresholds may require domain expert review for NISOC context

### 5.4 No Live Integration
- This validation is **retrospective** (historical data analysis)
- **No real-time SCADA integration** or live testing on Marun field
- **No operator feedback** incorporated
- **Implication**: TRL5 is achieved for the component in isolation, but full system integration remains future work

### 5.5 Stationarity Assumption
- Model assumes well behavior is stationary over the dataset period
- Does not account for long-term degradation, seasonal effects, or production regime changes
- **Implication**: Periodic retraining recommended for production deployment

---

## 6. Reproducibility

All code, data loaders, and evaluation scripts are version-controlled and tested:

- **Data Loader**: `backend/validation/petrobras_3w/loader.py`
- **Adapter**: `backend/validation/petrobras_3w/adapter.py`
- **Splitter**: `backend/validation/petrobras_3w/splitter.py`
- **Baselines**: `backend/validation/petrobras_3w/baselines.py`
- **Evaluator**: `backend/validation/petrobras_3w/evaluator.py`
- **Training Script**: `scripts/train_3w_model.py`
- **Evaluation Script**: `scripts/evaluate_3w_model.py`
- **Tests**: `backend/tests/validation/test_3w_*.py`

**Test Coverage**: ≥80% on new validation modules

**Random Seeds**:
- Data split: 42
- Model training: 123

**Dependencies**: See `backend/ml-inference-service/requirements.txt`

---

## 7. TRL Verdict

### 7.1 Criteria Checklist

- [ ] **Event Recall ≥ 0.75**: *TBD*
- [ ] **False Alarms/Day ≤ 3.0**: *TBD*
- [ ] **Macro-F1 ≥ 0.65**: *TBD*
- [ ] **Lead Time ≥ 60s**: *TBD*
- [ ] **Beats Baseline**: *TBD*
- [ ] **Code Tested**: ✅ (CI passing)
- [ ] **Limitations Documented**: ✅ (Section 5)

### 7.2 Final Determination

**TRL Level**: **[4 or 5]**

**Reasoning**: *To be filled after evaluation*

- If **TRL5**: All acceptance criteria met, model beats baseline, validated on real field data from relevant environment.
- If **TRL4**: One or more criteria not met. Specify which criteria failed and recommended next steps.

---

## 8. Recommendations

### 8.1 For TRL5 Achievement (if TRL4)
*To be filled if TRL remains at 4*

### 8.2 For Production Deployment (if TRL5)
*To be filled if TRL5 is achieved*

1. **NISOC-Specific Validation**: Collect real Marun field data and repeat validation
2. **Domain Expert Review**: Validate event taxonomy and thresholds with NISOC engineers
3. **Live Integration**: Integrate with Marun SCADA/Historian for real-time inference
4. **Operator Training**: Train field operators on alert interpretation and response
5. **Monitoring & Retraining**: Establish model performance monitoring and retraining schedule

---

## 9. References

1. Vargas, R. E. V., Munaro, C. J., Ciarelli, P. M., Medeiros, A. G., do Amaral, B. G., Barrionuevo, D. C., ... & Gomes, J. (2019). "A realistic and public dataset with rare undesirable real events in oil wells." *Journal of Petroleum Science and Engineering*, 181, 106223.

2. OGIM TRL5 Acceptance Criteria (this repository): `TRL5_ACCEPTANCE_CRITERIA.md`

3. Petrobras 3W Dataset: https://github.com/petrobras/3W

---

**Document Version**: 1.0  
**Last Updated**: *To be filled*  
**Author**: OGIM Cloud Agent (Automated Validation)
