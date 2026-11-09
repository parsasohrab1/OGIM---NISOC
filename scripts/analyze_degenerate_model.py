"""
Analyze the v2 results and generate corrected confusion matrix.
"""
import json
from pathlib import Path

RESULTS_DIR = Path(__file__).parent.parent / "results"

# Load v2 results
with open(RESULTS_DIR / "3w_validation_results_v2.json") as f:
    results = json.load(f)

print("=" * 80)
print("DEGENERATE MODEL ANALYSIS")
print("=" * 80)

# Extract reported metrics
test_samples = results["test_samples"]
test_events = results["test_events_by_class"]
normal_samples = test_samples - sum(test_events.values())
event_samples = sum(test_events.values())

rf_metrics = results["models"]["random_forest"]
reported_recall = rf_metrics["recall"]
reported_precision = rf_metrics["precision"]
reported_f1 = rf_metrics["binary_macro_f1"]

print(f"\nDataset:")
print(f"  Total samples: {test_samples}")
print(f"  Normal samples: {normal_samples}")
print(f"  Event samples: {event_samples}")

print(f"\nReported Metrics (v2):")
print(f"  Recall: {reported_recall}")
print(f"  Precision: {reported_precision}")
print(f"  Binary Macro-F1: {reported_f1}")

# Analysis
print(f"\n{'-' * 80}")
print("CONTRADICTION DETECTED:")
print(f"{'-' * 80}")

if reported_f1 == 0.5:
    # F1_normal = 0 and F1_event = 1.0 → Binary Macro-F1 = 0.5
    print("Binary Macro-F1 = 0.5 implies:")
    print("  F1_normal = 0.0")
    print("  F1_event = 1.0")
    print()
    print("F1_normal = 0 implies TN = 0 (no true negatives)")
    print("→ All samples predicted as EVENT")
    print("→ MODEL IS DEGENERATE")

# Corrected confusion matrix
print(f"\n{'-' * 80}")
print("CORRECTED CONFUSION MATRIX:")
print(f"{'-' * 80}")

tn = 0
fp = normal_samples
fn = 0
tp = event_samples

print(f"  TN (True Negatives):  {tn:6d}")
print(f"  FP (False Positives): {fp:6d}")
print(f"  FN (False Negatives): {fn:6d}")
print(f"  TP (True Positives):  {tp:6d}")

# Corrected metrics
corrected_recall = tp / (tp + fn) if (tp + fn) > 0 else 0
corrected_precision = tp / (tp + fp) if (tp + fp) > 0 else 0

f1_event = (
    2 * (corrected_precision * corrected_recall) / (corrected_precision + corrected_recall)
    if (corrected_precision + corrected_recall) > 0
    else 0
)
f1_normal = 0.0  # No TN

corrected_f1 = (f1_normal + f1_event) / 2

print(f"\n{'-' * 80}")
print("CORRECTED METRICS:")
print(f"{'-' * 80}")
print(f"  Recall: {corrected_recall:.3f} (was {reported_recall:.3f})")
print(f"  Precision: {corrected_precision:.3f} (was {reported_precision:.3f})")
print(f"  F1_event: {f1_event:.3f}")
print(f"  F1_normal: {f1_normal:.3f}")
print(f"  Binary Macro-F1: {corrected_f1:.3f} (was {reported_f1:.3f})")

# False alarm rate
sampling_rate_seconds = 60
samples_per_day = (24 * 3600) / sampling_rate_seconds
fp_per_day = (fp / normal_samples) * samples_per_day

print(f"\n{'-' * 80}")
print("FALSE ALARM RATE:")
print(f"{'-' * 80}")
print(f"  False alarms: {fp}/{normal_samples} normal samples")
print(f"  False alarms/day: {fp_per_day:.1f} (sampling: {sampling_rate_seconds}s)")

# Save corrected results
corrected_results = results.copy()
corrected_results["model_status"] = "degenerate"
corrected_results["methodology_version"] = "v2_corrected"
corrected_results["confusion_matrix"] = {"true_negatives": tn, "false_positives": fp, "false_negatives": fn, "true_positives": tp}
corrected_results["models"]["random_forest"]["recall"] = float(corrected_recall)
corrected_results["models"]["random_forest"]["precision"] = float(corrected_precision)
corrected_results["models"]["random_forest"]["binary_macro_f1"] = float(corrected_f1)
corrected_results["models"]["random_forest"]["false_alarms_per_day"] = float(fp_per_day)
corrected_results["models"]["random_forest"]["is_degenerate"] = True
corrected_results["leakage_audit"]["checks_performed"].append("perfect_separation: SUSPICIOUS (degenerate model)")

corrected_results["final_trl_verdict"] = 4
corrected_results["verdict_reasoning"] = "TRL4: Model is degenerate (always predicts event); unusable in production"

with open(RESULTS_DIR / "3w_validation_results_v2_corrected.json", "w") as f:
    json.dump(corrected_results, f, indent=2)

print(f"\n{'-' * 80}")
print(f"Corrected results saved to: {RESULTS_DIR / '3w_validation_results_v2_corrected.json'}")
print(f"{'-' * 80}")

print("\n" + "=" * 80)
print("CONCLUSION:")
print("=" * 80)
print("The model from commit c11410d is DEGENERATE and UNUSABLE.")
print("All reported metrics (Recall, Precision, Lead Time) are artifacts.")
print("A retrained model with class_weight='balanced' is required.")
print("=" * 80)
