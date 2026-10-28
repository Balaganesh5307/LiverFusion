"""
LiverFusion AI - Independent Evaluation Engine
Computes clinical & machine learning metrics exclusively from saved test predictions:
- Accuracy
- Macro Precision, Recall, and F1
- One-vs-Rest Specificity (mean and per-class)
- Macro ROC-AUC (one-vs-rest)
- Quadratic Weighted Kappa (QWK)
- Adjacent-Stage Error Share (fraction of misclassifications off by exactly 1 stage)
- Confusion Matrix (5x5)
- Parameter Count
- Latency (ms/sample)
"""

import os
import sys
import json
import csv
import time
from typing import Dict, List, Any, Optional
import numpy as np
import torch
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    cohen_kappa_score
)


def compute_metrics_from_predictions(
    predictions_csv: str,
    checkpoint_path: Optional[str] = None,
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Computes all evaluation metrics from test_predictions.csv.
    Deterministic and re-runnable with identical results.
    """
    if not os.path.exists(predictions_csv):
        raise FileNotFoundError(f"Predictions file not found: {predictions_csv}")

    rows = []
    with open(predictions_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    if not rows:
        raise ValueError(f"Predictions file is empty: {predictions_csv}")

    # Discover probability column names (e.g. p_F0, p_F1, etc.)
    prob_cols = sorted([c for c in rows[0].keys() if c.startswith("p_")])
    classes = [c.replace("p_", "") for c in prob_cols]
    k = len(classes)

    y_true = np.array([int(r["true_label"]) for r in rows], dtype=int)
    y_pred = np.array([int(r["predicted_label"]) for r in rows], dtype=int)
    
    # Probabilities matrix (N x K)
    y_probs = np.zeros((len(rows), k), dtype=float)
    for i, r in enumerate(rows):
        for j, pcol in enumerate(prob_cols):
            y_probs[i, j] = float(r[pcol])

    # 1. Accuracy
    acc = float(accuracy_score(y_true, y_pred))

    # 2. Macro Precision, Recall, F1
    macro_prec = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    macro_rec = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))

    # Per-class F1
    per_class_f1 = f1_score(y_true, y_pred, average=None, zero_division=0)
    per_class_f1_dict = {classes[i]: float(per_class_f1[i]) for i in range(k)}

    # 3. Confusion Matrix (5x5)
    cm = confusion_matrix(y_true, y_pred, labels=list(range(k)))

    # 4. One-vs-Rest Specificity
    # For class c: TN = sum of all elements not in row c or col c; FP = sum of col c except diagonal
    per_class_specificity = {}
    spec_values = []
    for c in range(k):
        tp = cm[c, c]
        fn = np.sum(cm[c, :]) - tp
        fp = np.sum(cm[:, c]) - tp
        tn = np.sum(cm) - (tp + fn + fp)
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        per_class_specificity[classes[c]] = float(spec)
        spec_values.append(spec)
    macro_specificity = float(np.mean(spec_values))

    # 5. Macro ROC-AUC (One-vs-Rest)
    try:
        # One-hot encode ground truth for multi-class ROC-AUC
        y_true_onehot = np.eye(k)[y_true]
        macro_auc = float(roc_auc_score(y_true_onehot, y_probs, multi_class="ovr", average="macro"))
    except Exception:
        macro_auc = None

    # 6. Quadratic Weighted Kappa (QWK)
    qwk = float(cohen_kappa_score(y_true, y_pred, weights="quadratic"))

    # 7. Adjacent-Stage Error Share
    # Errors: y_true != y_pred
    error_indices = np.where(y_true != y_pred)[0]
    total_errors = len(error_indices)
    if total_errors > 0:
        adjacent_errors = np.sum(np.abs(y_true[error_indices] - y_pred[error_indices]) == 1)
        adjacent_error_share = float(adjacent_errors / total_errors)
    else:
        adjacent_error_share = 1.0  # Zero errors means no distant errors

    # 8. Model Parameters & Latency
    params_total = None
    params_trainable = None
    latency_ms_per_sample = None

    if checkpoint_path and os.path.exists(checkpoint_path):
        try:
            ckpt = torch.load(checkpoint_path, map_location=device)
            if "model_state_dict" in ckpt:
                state_dict = ckpt["model_state_dict"]
                params_total = sum(p.numel() for p in state_dict.values())
            elif isinstance(ckpt, dict):
                params_total = sum(p.numel() for p in ckpt.values())
            
            # Read recorded benchmark latency if saved in checkpoint metadata
            if isinstance(ckpt, dict) and "benchmark_latency_ms" in ckpt:
                latency_ms_per_sample = ckpt["benchmark_latency_ms"]
        except Exception:
            pass

    metrics = {
        "dataset_total_test_samples": len(rows),
        "classes": classes,
        "accuracy": round(acc, 4),
        "macro_precision": round(macro_prec, 4),
        "macro_recall": round(macro_rec, 4),
        "macro_f1": round(macro_f1, 4),
        "macro_specificity": round(macro_specificity, 4),
        "macro_roc_auc": round(macro_auc, 4) if macro_auc is not None else None,
        "quadratic_weighted_kappa": round(qwk, 4),
        "adjacent_stage_error_share": round(adjacent_error_share, 4),
        "per_class_f1": per_class_f1_dict,
        "per_class_specificity": per_class_specificity,
        "confusion_matrix": cm.tolist(),
        "parameters_total": params_total,
        "parameters_trainable": params_trainable,
        "latency_ms_per_sample": latency_ms_per_sample
    }

    return metrics


def evaluate_run(run_dir: str) -> Dict[str, Any]:
    """Evaluates a single model run directory."""
    pred_csv = os.path.join(run_dir, "test_predictions.csv")
    ckpt_pt = os.path.join(run_dir, "best_model.pt")
    metrics = compute_metrics_from_predictions(pred_csv, ckpt_pt)

    out_json = os.path.join(run_dir, "metrics.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate test predictions")
    parser.add_argument("--run", required=True, help="Path to outputs/<run_dir>")
    args = parser.parse_args()

    results = evaluate_run(args.run)
    print("\n" + "=" * 50)
    print(f"Evaluation Results for: {args.run}")
    print("=" * 50)
    print(f"Accuracy:                   {results['accuracy']:.4f}")
    print(f"Macro F1:                   {results['macro_f1']:.4f}")
    print(f"Macro Precision:            {results['macro_precision']:.4f}")
    print(f"Macro Recall:               {results['macro_recall']:.4f}")
    print(f"Macro Specificity:          {results['macro_specificity']:.4f}")
    if results['macro_roc_auc'] is not None:
        print(f"Macro ROC-AUC:              {results['macro_roc_auc']:.4f}")
    print(f"Quadratic Weighted Kappa:   {results['quadratic_weighted_kappa']:.4f}")
    print(f"Adjacent-Stage Error Share: {results['adjacent_stage_error_share']:.4f} (errors off by 1 stage)")
    print("\nConfusion Matrix (F0..F4):")
    for row in results['confusion_matrix']:
        print(" ", row)
    print("=" * 50)
