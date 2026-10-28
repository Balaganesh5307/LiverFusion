"""
LiverFusion AI - Model Benchmark Comparison Tool
Aggregates evaluation metrics from all four model runs:
1. resnet50
2. vit_b16
3. fusion
4. fusion_gated
Exports:
- outputs/model_comparison.csv
- outputs/model_comparison_summary.md
Reports results strictly as-is without fabrication.
"""

import os
import json
import csv
from typing import Dict, List, Any


def compile_comparison(
    runs: List[str] = ["resnet50_run", "vit_b16_run", "fusion_run", "fusion_gated_run"],
    outputs_dir: str = "outputs",
    output_csv: str = "outputs/model_comparison.csv"
) -> List[Dict[str, Any]]:
    """Compiles metrics from each run's metrics.json into a comparison table."""
    records = []

    for run_name in runs:
        metrics_file = os.path.join(outputs_dir, run_name, "metrics.json")
        config_file = os.path.join(outputs_dir, run_name, "config.yaml")

        if not os.path.exists(metrics_file):
            print(f"Warning: {metrics_file} not found. Skipping {run_name}.")
            continue

        with open(metrics_file, "r", encoding="utf-8") as f:
            m = json.load(f)

        model_display = {
            "resnet50_run": "ResNet-50",
            "vit_b16_run": "ViT-B/16",
            "fusion_run": "Dual-Branch Fusion",
            "fusion_gated_run": "Gated Fusion (Ablation)"
        }.get(run_name, run_name)

        rec = {
            "model_key": run_name.replace("_run", ""),
            "model_architecture": model_display,
            "accuracy": m.get("accuracy"),
            "macro_f1": m.get("macro_f1"),
            "macro_precision": m.get("macro_precision"),
            "macro_recall": m.get("macro_recall"),
            "macro_specificity": m.get("macro_specificity"),
            "macro_roc_auc": m.get("macro_roc_auc"),
            "quadratic_weighted_kappa": m.get("quadratic_weighted_kappa"),
            "adjacent_stage_error_share": m.get("adjacent_stage_error_share"),
            "parameters_total": m.get("parameters_total"),
            "latency_ms_per_sample": m.get("latency_ms_per_sample"),
            "f0_f1": m.get("per_class_f1", {}).get("F0"),
            "f1_f1": m.get("per_class_f1", {}).get("F1"),
            "f2_f1": m.get("per_class_f1", {}).get("F2"),
            "f3_f1": m.get("per_class_f1", {}).get("F3"),
            "f4_f1": m.get("per_class_f1", {}).get("F4")
        }
        records.append(rec)

    if records:
        os.makedirs(os.path.dirname(output_csv), exist_ok=True)
        fieldnames = list(records[0].keys())
        with open(output_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in records:
                writer.writerow(r)
        print(f"Wrote comparison CSV to: {output_csv}")

    return records


def print_comparison_markdown(records: List[Dict[str, Any]]):
    """Outputs markdown formatted comparison table."""
    print("\n### Model Benchmark Comparison (Identical Test Partition, N=741)")
    print("| Model Architecture | Accuracy | Macro F1 | QWK | Macro Specificity | Macro ROC-AUC | Adjacent Error Share | Latency (ms) |")
    print("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")
    for r in records:
        auc_str = f"{r['macro_roc_auc']:.4f}" if r['macro_roc_auc'] is not None else "N/A"
        lat_str = f"{r['latency_ms_per_sample']:.1f}" if r['latency_ms_per_sample'] is not None else "N/A"
        print(f"| **{r['model_architecture']}** | {r['accuracy']:.4f} | {r['macro_f1']:.4f} | {r['quadratic_weighted_kappa']:.4f} | {r['macro_specificity']:.4f} | {auc_str} | {r['adjacent_stage_error_share']:.4f} | {lat_str} |")
    print("")


if __name__ == "__main__":
    recs = compile_comparison()
    if recs:
        print_comparison_markdown(recs)
    else:
        print("No completed run directories found in outputs/ yet.")
