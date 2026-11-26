# TRL5 Attempt Status: Advanced Features

**Date:** 2026-11-09  
**Branch:** `cursor/frequency-features-trl5-ddee`  
**Status:** ❌ **INCOMPLETE** - Technical issues prevented evaluation completion

---

## What Was Attempted

### Advanced Feature Engineering

Implemented frequency-domain and trend features to improve discrimination:

1. **FFT Band Powers** (5 frequency bands over 60/300/900s windows)
2. **Spectral Entropy** (frequency-domain randomness measure)
3. **Linear Slope** (trend direction)
4. **Acceleration** (second derivative for rate-of-change)

### Model Architecture

- **GradientBoostingClassifier** (sklearn) instead of Random Forest
- Class-balanced training
- Validation-tuned threshold
- Same methodology: well-grouped splits, per-sample labeling, bootstrap CIs

---

## Technical Issues Encountered

### 1. Float32 Overflow

**Problem:** Advanced features (especially FFT band powers and spectral entropy) produced extreme values that overflow `float32` even after clipping to [-1e10, 1e10].

**Root Cause:**
- FFT power values can be very large for low-frequency components
- Spectral entropy calculations occasionally produce inf/nan
- Cascading numerical instability in rolling window computations

**Attempted Fixes:**
- Clipping entropy to [0, 100]
- Clipping slope/acceleration to [-1e6, 1e6]
- Replacing inf/-inf with nan, then filling with 0
- Clipping to [-1e10, 1e10] before float32 cast
- **Result:** Still failed with "value too large for float32"

### 2. Feature Leakage False Positive

**Problem:** Leakage auditor flagged `spectral_entropy` columns as containing "label information" (substring match on "entropy" → "event").

**Impact:** False positive; spectral entropy is a legitimate frequency-domain feature with no label leakage.

### 3. Performance

**Observed:** Feature extraction took ~20 minutes for 22 training wells (vs. ~7 minutes for baseline rolling features).

**Cause:** Per-window FFT computation is O(n log n) per window, applied to 3 window sizes × 7 sensors × thousands of samples.

---

## Lessons Learned

### Why Advanced Features Failed

1. **Numerical Stability:** Frequency-domain features are inherently prone to extreme values without careful normalization:
   - FFT power should be log-transformed: `log(power + 1e-10)`
   - Spectral entropy should use normalized PSD
   - Need robust scaling (e.g., RobustScaler) instead of StandardScaler

2. **Feature Engineering Mismatch:** 
   - 3W data may not have strong frequency signatures in the 60s-900s range
   - Transient onset (class 101-109) may be better captured by wavelet transforms (time-frequency localization) than pure FFT
   - Slope/acceleration over 60s windows may be too coarse for rapid transients

3. **Computational Cost:**
   - Per-sample FFT is expensive; should downsample more aggressively or use pre-computed spectrograms
   - 900s windows at 60s downsample = only 15 samples → FFT has poor frequency resolution

---

## Recommendations for Future TRL5 Attempt

### Immediate Fixes (if retrying advanced features)

1. **Log-transform FFT power:**
   ```python
   band_power_db = 10 * np.log10(band_power + 1e-10)
   ```

2. **Use RobustScaler:**
   ```python
   from sklearn.preprocessing import RobustScaler
   scaler = RobustScaler()  # Robust to outliers
   ```

3. **Add feature selection:**
   - Remove features with >50% inf/nan
   - Use RFECV to select only discriminative features

### Alternative Approaches

1. **Wavelet Features:**
   - Continuous wavelet transform (CWT) for time-frequency localization
   - Better for transient detection than pure FFT
   - Libraries: `pywt`, `scipy.signal.cwt`

2. **Deep Learning (if TRL5 requires):**
   - 1D-CNN on raw downsampled time series (avoid hand-crafted features)
   - LSTM for sequence modeling
   - Requires more data and GPU resources

3. **Simpler Improvements to Baseline:**
   - Add more rolling window sizes (30s, 120s, 600s) to baseline
   - Add rolling quantiles (25th, 75th percentile)
   - Add time-of-day and well-specific features
   - **May be sufficient without frequency domain**

4. **Domain-Specific Features:**
   - Pressure drop rate (PDG - TPT derivative)
   - Temperature-pressure ratio
   - Gas lift efficiency metrics
   - Consult petroleum engineers for physically meaningful features

---

## Current State

**Code Delivered:**
- ✅ `scripts/advanced_features.py` - Feature extraction module (has numerical issues)
- ✅ `scripts/evaluate_3w_advanced.py` - Evaluation script (incomplete due to overflow)
- ❌ No results JSON (evaluation failed before model training)
- ❌ No PR (incomplete work)

**TRL Verdict:** **TRL4 maintained** (previous evaluation with baseline features stands)

---

## Conclusion

**Advanced frequency-domain features were attempted but encountered persistent numerical stability issues that prevented evaluation completion.** The baseline rolling statistics (TRL4) remain the validated approach. Future TRL5 attempts should:

1. Use log-transformed FFT power and robust scaling, OR
2. Try wavelet features for time-frequency localization, OR
3. Use deep learning (1D-CNN/LSTM) to avoid hand-crafted features, OR
4. Enhance baseline rolling features with domain-specific metrics

**Honest assessment:** The degenerate detector problem (TN=0) from the baseline evaluation suggests that **feature engineering alone may not be sufficient**. The root issue may be:
- **Labeling mismatch:** 3W transient classes (101-109) may not be detectable anomalies
- **Data distribution:** Offshore Brazil wells differ fundamentally from intended deployment (Marun/NISOC)
- **Task definition:** Binary event detection may be too coarse; multiclass or anomaly scores may be more appropriate

**Recommendation:** Before further feature engineering, validate the task definition and labeling scheme with domain experts.
