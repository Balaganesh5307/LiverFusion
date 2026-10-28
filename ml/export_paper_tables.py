"""
LiverFusion AI - Phase 6 Paper Tables & Figures Exporter
Strictly adheres to:
- DO NOT IMPLEMENT: any paper text or any number not read from outputs/.
- Exports from outputs/:
  1. docs/dataset_table.csv
  2. docs/results_table.csv
  3. docs/efficiency_table.csv
  4. Copies / renders confusion matrix and saliency figures to docs/figures/
"""

import os
import sys
import json
import csv
import shutil
from typing import Dict, List, Any
import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")  # Headless backend
import matplotlib.pyplot as plt


def export_dataset_table(
    audit_json: str = "audit_report.json",
    splits_csv: str = "splits.csv",
    out_csv: str = "docs/dataset_table.csv"
):
    """Generates dataset table CSV strictly from audit_report.json and splits.csv."""
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)

    with open(audit_json, "r", encoding="utf-8") as f:
        audit = json.load(f)

    # Compute per-class counts per partition from splits.csv
    split_counts = {}
    with open(splits_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            cls = r["class_name"]
            s = r["split"]
            if cls not in split_counts:
                split_counts[cls] = {"train": 0, "val": 0, "test": 0, "total": 0}
            split_counts[cls][s] += 1
            split_counts[cls]["total"] += 1

    classes = audit["classes_discovered"]
    total_imgs = audit["total_valid_images"]

    rows = []
    for cls in classes:
        sc = split_counts.get(cls, {"train": 0, "val": 0, "test": 0, "total": 0})
        pct = (sc["total"] / total_imgs * 100) if total_imgs > 0 else 0
        rows.append({
            "stage": cls,
            "train_samples": sc["train"],
            "val_samples": sc["val"],
            "test_samples": sc["test"],
            "total_samples": sc["total"],
            "dataset_percentage": f"{pct:.2f}%"
        })

    # Total summary row
    t_train = sum(r["train_samples"] for r in rows)
    t_val = sum(r["val_samples"] for r in rows)
    t_test = sum(r["test_samples"] for r in rows)
    t_tot = sum(r["total_samples"] for r in rows)
    rows.append({
        "stage": "Total",
        "train_samples": t_train,
        "val_samples": t_val,
        "test_samples": t_test,
        "total_samples": t_tot,
        "dataset_percentage": "100.00%"
    })

    fieldnames = ["stage", "train_samples", "val_samples", "test_samples", "total_samples", "dataset_percentage"]
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported dataset table to: {out_csv}")


def export_results_table(
    comparison_csv: str = "outputs/model_comparison.csv",
    out_csv: str = "docs/results_table.csv"
):
    """Copies model comparison results table CSV directly from outputs/."""
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    shutil.copyfile(comparison_csv, out_csv)
    print(f"Exported results table to: {out_csv}")


def export_efficiency_table(
    outputs_dir: str = "outputs",
    runs: List[str] = ["resnet50_run", "vit_b16_run", "fusion_run", "fusion_gated_run"],
    out_csv: str = "docs/efficiency_table.csv"
):
    """Generates computational efficiency table from outputs/<run>/metrics.json."""
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    rows = []

    model_display = {
        "resnet50_run": "ResNet-50",
        "vit_b16_run": "ViT-B/16",
        "fusion_run": "Dual-Branch Fusion",
        "fusion_gated_run": "Gated Fusion (Ablation)"
    }

    for run_name in runs:
        m_path = os.path.join(outputs_dir, run_name, "metrics.json")
        if not os.path.exists(m_path):
            continue
        with open(m_path, "r", encoding="utf-8") as f:
            m = json.load(f)

        params = m.get("parameters_total")
        params_str = f"{params / 1e6:.2f}M" if params else "N/A"
        lat = m.get("latency_ms_per_sample")
        lat_str = f"{lat:.2f}" if lat is not None else "N/A"

        rows.append({
            "model_architecture": model_display.get(run_name, run_name),
            "parameters_total": params,
            "parameters_millions": params_str,
            "inference_latency_ms_per_sample": lat_str,
            "accuracy": m.get("accuracy"),
            "macro_f1": m.get("macro_f1")
        })

    fieldnames = [
        "model_architecture",
        "parameters_total",
        "parameters_millions",
        "inference_latency_ms_per_sample",
        "accuracy",
        "macro_f1"
    ]
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported efficiency table to: {out_csv}")


def export_confusion_matrices(
    outputs_dir: str = "outputs",
    runs: List[str] = ["resnet50_run", "vit_b16_run", "fusion_run", "fusion_gated_run"],
    out_dir: str = "docs/figures"
):
    """Renders confusion matrix heatmaps read from outputs/<run>/metrics.json."""
    os.makedirs(out_dir, exist_ok=True)
    classes = ["F0", "F1", "F2", "F3", "F4"]

    model_display = {
        "resnet50_run": "ResNet-50",
        "vit_b16_run": "ViT-B/16",
        "fusion_run": "Dual-Branch Fusion",
        "fusion_gated_run": "Gated Fusion (Ablation)"
    }

    for run_name in runs:
        m_path = os.path.join(outputs_dir, run_name, "metrics.json")
        if not os.path.exists(m_path):
            continue
        with open(m_path, "r", encoding="utf-8") as f:
            m = json.load(f)

        cm = np.array(m.get("confusion_matrix", []))
        if cm.size == 0:
            continue

        fig, ax = plt.subplots(figsize=(6, 5))
        cax = ax.matshow(cm, cmap="Blues")
        fig.colorbar(cax)

        ax.set_xticks(range(len(classes)))
        ax.set_yticks(range(len(classes)))
        ax.set_xticklabels(classes)
        ax.set_yticklabels(classes)

        ax.set_xlabel("Predicted Stage")
        ax.set_ylabel("True Stage")
        ax.set_title(f"Confusion Matrix: {model_display.get(run_name, run_name)}", pad=20)

        # Annotate cell counts
        for i in range(len(classes)):
            for j in range(len(classes)):
                val = cm[i, j]
                color = "white" if val > cm.max() / 2 else "black"
                ax.text(j, i, str(val), ha="center", va="center", color=color, fontweight="bold")

        plt.tight_layout()
        out_png = os.path.join(out_dir, f"confusion_matrix_{run_name.replace('_run', '')}.png")
        plt.savefig(out_png, dpi=300)
        plt.close(fig)
        print(f"Exported confusion matrix figure to: {out_png}")


def export_sample_saliency_figures(out_dir: str = "docs/figures"):
    """
    Renders sample explainability figures comparing raw ultrasound and saliency heatmap.
    """
    os.makedirs(out_dir, exist_ok=True)
    from ml.explainability import explain_prediction
    from ml.models.resnet50 import build_resnet50
    import torchvision.transforms as tf
    from PIL import Image

    sample_img_path = "Dataset/F0/a1051.jpg"
    if not os.path.exists(sample_img_path):
        return

    orig_pil = Image.open(sample_img_path).convert("L")
    transform = tf.Compose([
        tf.Resize((224, 224)),
        tf.ToTensor(),
        tf.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    inp = transform(orig_pil.convert("RGB")).unsqueeze(0)

    # Load ResNet checkpoint
    ckpt_path = "checkpoints/resnet50.pt"
    if not os.path.exists(ckpt_path):
        ckpt_path = "outputs/resnet50_run/best_model.pt"

    if os.path.exists(ckpt_path):
        m = build_resnet50(num_classes=5, pretrained=False)
        sd = torch.load(ckpt_path, map_location="cpu")
        m.load_state_dict(sd["model_state_dict"] if "model_state_dict" in sd else sd)
        m.eval()

        from ml.explainability import ResNetGradCAM
        cam_gen = ResNetGradCAM(m)
        heatmap = cam_gen.generate_heatmap(inp, class_idx=0)

        fig, axes = plt.subplots(1, 3, figsize=(12, 4))
        axes[0].imshow(orig_pil, cmap="gray")
        axes[0].set_title("Raw Ultrasound")
        axes[0].axis("off")

        axes[1].imshow(heatmap, cmap="jet")
        axes[1].set_title("Grad-CAM Saliency Heatmap")
        axes[1].axis("off")

        axes[2].imshow(orig_pil, cmap="gray")
        axes[2].imshow(Image.fromarray((heatmap * 255).astype(np.uint8)).resize(orig_pil.size), cmap="jet", alpha=0.5)
        axes[2].set_title("Composite Overlay")
        axes[2].axis("off")

        plt.tight_layout()
        saliency_png = os.path.join(out_dir, "saliency_overlay_sample.png")
        plt.savefig(saliency_png, dpi=300)
        plt.close(fig)
        print(f"Exported sample saliency figure to: {saliency_png}")


if __name__ == "__main__":
    print("Exporting paper dataset, results, and efficiency tables from outputs/...")
    export_dataset_table()
    export_results_table()
    export_efficiency_table()
    export_confusion_matrices()
    export_sample_saliency_figures()
    print("Phase 6 exports completed successfully.")
