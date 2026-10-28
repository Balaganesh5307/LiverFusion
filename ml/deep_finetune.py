"""
LiverFusion AI - Deep Fine-Tuning Pipeline
Implements:
1. Ultrasound acoustic simulation augmentations (contrast, gain, rotation, affine)
2. Label-smoothed ordinal cross-entropy with class balancing weights
3. Differential learning rates:
   - Lower LR on unfrozen upper backbone layers (ResNet layer3-4, ViT blocks 8-11)
   - Higher LR on projection and MLP classification heads
4. Peak validation performance model selection
5. Single-evaluation on test set with updated checkpoints and metrics
"""

import os
import sys
import time
import json
import csv
import random
import yaml
from typing import Dict, List, Tuple, Optional
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from sklearn.metrics import f1_score, accuracy_score
from torchvision import transforms
from PIL import Image

from ml.data import UltrasoundDataset, get_class_weights
from ml.models.resnet50 import build_resnet50
from ml.models.vit_b16 import build_vit_b16
from ml.models.fusion import build_fusion_model
from ml.evaluate import compute_metrics_from_predictions


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


class OrdinalSmoothedCrossEntropyLoss(nn.Module):
    """
    Gaussian-smoothed ordinal cross-entropy with class-frequency weighting.
    Provides smooth gradients for adjacent stages while heavily penalizing distant errors.
    """
    def __init__(self, num_classes: int = 5, sigma: float = 0.55, class_weights: Optional[torch.Tensor] = None):
        super().__init__()
        self.num_classes = num_classes
        self.sigma = sigma
        self.class_weights = class_weights

        # Precompute target distribution matrix (num_classes x num_classes)
        targets = np.zeros((num_classes, num_classes), dtype=np.float32)
        for y in range(num_classes):
            for k in range(num_classes):
                targets[y, k] = np.exp(-((k - y) ** 2) / (2 * (sigma ** 2)))
            targets[y] /= targets[y].sum()  # Normalize to sum to 1.0

        self.register_buffer("target_matrix", torch.tensor(targets, dtype=torch.float32))

    def forward(self, logits: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
        # Soft targets: shape (B, K)
        soft_targets = self.target_matrix[labels]
        log_probs = F.log_softmax(logits, dim=-1)

        loss_per_sample = -(soft_targets * log_probs).sum(dim=-1)

        if self.class_weights is not None:
            sample_weights = self.class_weights[labels]
            loss_per_sample = loss_per_sample * sample_weights

        return loss_per_sample.mean()


def get_deep_finetune_transforms():
    """Ultrasound acoustic simulation augmentation pipeline."""
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.15, contrast=0.20),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
    ])

    eval_tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
    ])

    return train_tf, eval_tf


def get_deep_dataloaders(splits_csv: str = "splits.csv", data_root: str = "Dataset", batch_size: int = 32):
    train_tf, eval_tf = get_deep_finetune_transforms()
    weights_tensor, classes, _ = get_class_weights(splits_csv)

    train_ds = UltrasoundDataset(splits_csv, "train", data_root, classes, is_train=False)
    train_ds.transform = train_tf

    val_ds = UltrasoundDataset(splits_csv, "val", data_root, classes, is_train=False)
    val_ds.transform = eval_tf

    test_ds = UltrasoundDataset(splits_csv, "test", data_root, classes, is_train=False)
    test_ds.transform = eval_tf

    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = torch.utils.data.DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    return train_loader, val_loader, test_loader, classes, weights_tensor


def setup_differential_learning_rates(model, model_name: str, backbone_lr: float = 1.5e-5, head_lr: float = 1.5e-4):
    """
    Unfreezes top feature layers and assigns differential learning rates.
    """
    params_group = []

    if model_name == "resnet50":
        # Freeze early layers: conv1, bn1, layer1, layer2
        for p in model.conv1.parameters(): p.requires_grad = False
        for p in model.bn1.parameters(): p.requires_grad = False
        for p in model.layer1.parameters(): p.requires_grad = False
        for p in model.layer2.parameters(): p.requires_grad = False

        # Unfreeze high-level feature extractors: layer3, layer4
        for p in model.layer3.parameters(): p.requires_grad = True
        for p in model.layer4.parameters(): p.requires_grad = True
        for p in model.classifier.parameters(): p.requires_grad = True

        params_group = [
            {"params": list(model.layer3.parameters()) + list(model.layer4.parameters()), "lr": backbone_lr},
            {"params": list(model.classifier.parameters()), "lr": head_lr}
        ]

    elif model_name == "vit_b16":
        # Freeze patch projection and first 8 transformer blocks
        for p in model.conv_proj.parameters(): p.requires_grad = False
        model.class_token.requires_grad = False
        for i in range(8):
            for p in model.encoder.layers[i].parameters():
                p.requires_grad = False

        # Unfreeze top 4 transformer blocks (8, 9, 10, 11) and classifier
        top_vit_params = []
        for i in range(8, 12):
            for p in model.encoder.layers[i].parameters():
                p.requires_grad = True
                top_vit_params.append(p)

        for p in model.classifier.parameters(): p.requires_grad = True

        params_group = [
            {"params": top_vit_params, "lr": backbone_lr},
            {"params": list(model.classifier.parameters()), "lr": head_lr}
        ]

    elif model_name in ("fusion", "fusion_gated"):
        # Freeze lower layers, unfreeze layer4 of ResNet and layers 9-11 of ViT
        model.unfreeze_backbones()
        # Freeze lower resnet
        for p in model.resnet_branch.conv1.parameters(): p.requires_grad = False
        for p in model.resnet_branch.layer1.parameters(): p.requires_grad = False
        for p in model.resnet_branch.layer2.parameters(): p.requires_grad = False
        # Freeze lower vit
        for i in range(8):
            for p in model.vit_branch.encoder.layers[i].parameters():
                p.requires_grad = False

        backbone_params = list(model.resnet_branch.layer4.parameters())
        for i in range(8, 12):
            backbone_params += list(model.vit_branch.encoder.layers[i].parameters())

        head_params = list(model.res_proj.parameters()) + list(model.vit_proj.parameters()) + list(model.mlp_head.parameters())
        if model.gated:
            head_params += list(model.gate_net.parameters())

        params_group = [
            {"params": backbone_params, "lr": backbone_lr},
            {"params": head_params, "lr": head_lr}
        ]

    return params_group


def run_deep_finetune(
    model_name: str,
    epochs: int = 6,
    batch_size: int = 32,
    backbone_lr: float = 1.5e-5,
    head_lr: float = 1.5e-4,
    seed: int = 42,
    splits_csv: str = "splits.csv",
    data_root: str = "Dataset",
    device: str = "cpu"
):
    set_seed(seed)
    run_dir = os.path.join("outputs", f"{model_name}_run")
    os.makedirs(run_dir, exist_ok=True)

    print(f"\n==========================================")
    print(f"Deep Fine-Tuning: {model_name.upper()} on {device}")
    print(f"Schedule: {epochs} epochs | Backbone LR: {backbone_lr} | Head LR: {head_lr}")
    print(f"Loss: Gaussian-Smoothed Ordinal Cross-Entropy (sigma=0.55)")
    print(f"==========================================")

    train_loader, val_loader, test_loader, classes, class_weights = get_deep_dataloaders(
        splits_csv=splits_csv,
        data_root=data_root,
        batch_size=batch_size
    )

    criterion = OrdinalSmoothedCrossEntropyLoss(
        num_classes=len(classes),
        sigma=0.55,
        class_weights=class_weights.to(device)
    )

    # Load existing best weights as starting point
    existing_ckpt_path = os.path.join(run_dir, "best_model.pt")
    is_gated = (model_name == "fusion_gated")

    if model_name == "resnet50":
        model = build_resnet50(num_classes=len(classes), pretrained=True)
    elif model_name == "vit_b16":
        model = build_vit_b16(num_classes=len(classes), pretrained=True)
    elif model_name == "fusion":
        model = build_fusion_model(num_classes=len(classes), gated=False, pretrained=True)
    elif model_name == "fusion_gated":
        model = build_fusion_model(num_classes=len(classes), gated=True, pretrained=True)

    if os.path.exists(existing_ckpt_path):
        print(f"Initializing from trained baseline checkpoint: {existing_ckpt_path}")
        ckpt_data = torch.load(existing_ckpt_path, map_location=device)
        model.load_state_dict(ckpt_data["model_state_dict"] if "model_state_dict" in ckpt_data else ckpt_data)

    model = model.to(device)

    # Setup differential parameter groups
    param_groups = setup_differential_learning_rates(model, model_name, backbone_lr, head_lr)
    optimizer = AdamW(param_groups, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    best_val_score = -1.0
    best_state = None
    best_epoch = 1

    for ep in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        t0 = time.time()

        for imgs, lbls, _ in train_loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, lbls)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item() * imgs.size(0)

        train_loss /= len(train_loader.dataset)
        scheduler.step()

        # Validation evaluation
        model.eval()
        val_loss = 0.0
        val_preds, val_targets = [], []
        with torch.no_grad():
            for imgs, lbls, _ in val_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                out = model(imgs)
                loss = criterion(out, lbls)
                val_loss += loss.item() * imgs.size(0)
                val_preds.extend(torch.argmax(out, dim=-1).cpu().numpy())
                val_targets.extend(lbls.cpu().numpy())

        val_loss /= len(val_loader.dataset)
        val_acc = float(accuracy_score(val_targets, val_preds))
        val_f1 = float(f1_score(val_targets, val_preds, average="macro", zero_division=0))

        # Composite validation selection score balancing raw accuracy and macro F1
        val_score = 0.6 * val_acc + 0.4 * val_f1
        elapsed = time.time() - t0

        print(f"Epoch {ep}/{epochs} [{elapsed:.1f}s] - Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f} | Val Macro-F1: {val_f1:.4f}")

        if val_score > best_val_score:
            best_val_score = val_score
            best_epoch = ep
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    print(f"\nModel selection complete. Selected Epoch {best_epoch} (Val Acc: {val_acc:.4f}, Val Macro-F1: {val_f1:.4f})")
    model.load_state_dict(best_state)

    # Measure test latency and generate final test predictions
    model.eval()
    test_preds, test_targets, test_paths, test_probs_list = [], [], [], []
    t_start = time.perf_counter()

    with torch.no_grad():
        for imgs, lbls, paths in test_loader:
            imgs = imgs.to(device)
            out = model(imgs)
            probs = F.softmax(out, dim=-1).cpu().numpy()
            test_probs_list.append(probs)
            test_preds.extend(np.argmax(probs, axis=1))
            test_targets.extend(lbls.numpy())
            test_paths.extend(paths)

    t_end = time.perf_counter()
    latency_ms = ((t_end - t_start) / len(test_targets)) * 1000.0

    all_test_probs = np.concatenate(test_probs_list, axis=0)

    # Save per-sample test predictions
    test_pred_path = os.path.join(run_dir, "test_predictions.csv")
    fieldnames = ["relative_path", "class_name", "true_label", "predicted_label", "predicted_stage"] + [f"p_{c}" for c in classes]
    records = []
    for idx in range(len(test_paths)):
        rec = {
            "relative_path": test_paths[idx],
            "class_name": classes[test_targets[idx]],
            "true_label": int(test_targets[idx]),
            "predicted_label": int(test_preds[idx]),
            "predicted_stage": classes[test_preds[idx]],
        }
        for c_idx, c_name in enumerate(classes):
            rec[f"p_{c_name}"] = f"{all_test_probs[idx, c_idx]:.5f}"
        records.append(rec)

    with open(test_pred_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    # Save best checkpoint
    best_checkpoint_path = os.path.join(run_dir, "best_model.pt")
    torch.save({
        "model_name": model_name,
        "selected_epoch": best_epoch,
        "val_score": best_val_score,
        "benchmark_latency_ms": round(latency_ms, 2),
        "model_state_dict": model.state_dict(),
        "classes": classes
    }, best_checkpoint_path)

    # Compute and save metrics
    metrics = compute_metrics_from_predictions(test_pred_path, best_checkpoint_path, device)
    metrics_path = os.path.join(run_dir, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Updated Test Accuracy: {metrics['accuracy']:.4f} | Macro F1: {metrics['macro_f1']:.4f} | QWK: {metrics['quadratic_weighted_kappa']:.4f}")
    return metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Deep fine-tuning pipeline")
    parser.add_argument("--model", required=True, choices=["resnet50", "vit_b16", "fusion", "fusion_gated"])
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--backbone-lr", type=float, default=1.5e-5)
    parser.add_argument("--head-lr", type=float, default=1.5e-4)
    args = parser.parse_args()

    run_deep_finetune(
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        backbone_lr=args.backbone_lr,
        head_lr=args.head_lr
    )
