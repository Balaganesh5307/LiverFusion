"""
LiverFusion AI - Unified Training Pipeline
Supports:
- resnet50: ImageNet-pretrained ResNet50 baseline
- vit_b16: ImageNet-pretrained ViT-B/16 baseline
- fusion: Dual-Branch Fusion (ResNet50 GAP + ViT [CLS] -> Linear -> LN -> MLP)
- fusion_gated: Gated Dual-Branch Fusion ablation
Features:
- Weighted Cross-Entropy Loss: w_k = N / (K * N_k)
- Model selection strictly based on Validation Macro-F1
- Two-stage training for fusion (stage 1: frozen backbones; stage 2: joint fine-tuning)
- Evaluates test set strictly ONCE with best validation checkpoint
- Saves frozen config, checkpoints, and per-sample test predictions under outputs/<run>/
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
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from sklearn.metrics import f1_score

from ml.data import get_dataloaders
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


@torch.no_grad()
def precompute_backbone_features(
    backbone_name: str,
    dataloader,
    device: str,
    split_name: str = "train",
    cache_dir: str = "outputs/.cache"
) -> Tuple[torch.Tensor, torch.Tensor, List[str]]:
    """
    Precomputes fixed ImageNet backbone representations with on-disk caching.
    Reuses existing features if already computed for that split.
    """
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{backbone_name}_{split_name}.pt")

    if os.path.exists(cache_file):
        data = torch.load(cache_file, map_location="cpu")
        return data["feats"], data["labels"], data["paths"]

    if backbone_name == "resnet50":
        m = build_resnet50(num_classes=5, pretrained=True).to(device)
        extract_fn = m.extract_features
    elif backbone_name == "vit_b16":
        m = build_vit_b16(num_classes=5, pretrained=True).to(device)
        extract_fn = m.extract_features
    else:
        raise ValueError(backbone_name)

    m.eval()
    feat_list = []
    lbl_list = []
    path_list = []

    for imgs, lbls, paths in dataloader:
        imgs = imgs.to(device)
        feats = extract_fn(imgs)
        feat_list.append(feats.cpu())
        lbl_list.append(lbls)
        path_list.extend(paths)

    all_feats = torch.cat(feat_list, dim=0)
    all_lbls = torch.cat(lbl_list, dim=0)
    torch.save({"feats": all_feats, "labels": all_lbls, "paths": path_list}, cache_file)
    return all_feats, all_lbls, path_list


@torch.no_grad()
def precompute_dual_features(
    dataloader,
    device: str
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, List[str]]:
    """Precomputes ResNet50 GAP and ViT [CLS] features simultaneously."""
    res_m = build_resnet50(num_classes=5, pretrained=True).to(device)
    vit_m = build_vit_b16(num_classes=5, pretrained=True).to(device)
    res_m.eval()
    vit_m.eval()

    res_list, vit_list, lbl_list, path_list = [], [], [], []
    for imgs, lbls, paths in dataloader:
        imgs = imgs.to(device)
        rf = res_m.extract_features(imgs)
        vf = vit_m.extract_features(imgs)
        res_list.append(rf.cpu())
        vit_list.append(vf.cpu())
        lbl_list.append(lbls)
        path_list.extend(paths)

    return (
        torch.cat(res_list, dim=0),
        torch.cat(vit_list, dim=0),
        torch.cat(lbl_list, dim=0),
        path_list
    )


@torch.no_grad()
def evaluate_features_single(classifier, feats, labels, criterion, batch_size=64):
    classifier.eval()
    total_loss = 0.0
    all_preds = []
    n = len(labels)
    for i in range(0, n, batch_size):
        bf = feats[i:i + batch_size]
        bl = labels[i:i + batch_size]
        out = classifier(bf)
        loss = criterion(out, bl)
        total_loss += loss.item() * len(bl)
        all_preds.extend(torch.argmax(out, dim=1).numpy())

    avg_loss = total_loss / n
    macro_f1 = float(f1_score(labels.numpy(), all_preds, average="macro", zero_division=0))
    acc = float(np.mean(np.array(all_preds) == labels.numpy()))
    return avg_loss, macro_f1, acc


@torch.no_grad()
def evaluate_features_dual(fusion_model, res_feats, vit_feats, labels, criterion, batch_size=64):
    fusion_model.eval()
    total_loss = 0.0
    all_preds = []
    n = len(labels)
    for i in range(0, n, batch_size):
        br = res_feats[i:i + batch_size]
        bv = vit_feats[i:i + batch_size]
        bl = labels[i:i + batch_size]

        # Forward through fusion head
        rp = fusion_model.res_proj(br)
        vp = fusion_model.vit_proj(bv)

        if fusion_model.gated:
            combined = torch.cat([rp, vp], dim=-1)
            gates = fusion_model.gate_net(combined)
            res_g = rp * gates[:, :fusion_model.proj_dim]
            vit_g = vp * gates[:, fusion_model.proj_dim:]
            fused = torch.cat([res_g, vit_g], dim=-1)
        else:
            fused = torch.cat([rp, vp], dim=-1)

        out = fusion_model.mlp_head(fused)
        loss = criterion(out, bl)
        total_loss += loss.item() * len(bl)
        all_preds.extend(torch.argmax(out, dim=1).numpy())

    avg_loss = total_loss / n
    macro_f1 = float(f1_score(labels.numpy(), all_preds, average="macro", zero_division=0))
    acc = float(np.mean(np.array(all_preds) == labels.numpy()))
    return avg_loss, macro_f1, acc


def generate_predictions_csv(
    test_probs: np.ndarray,
    test_labels: np.ndarray,
    test_paths: List[str],
    classes: List[str],
    output_csv: str
):
    preds = np.argmax(test_probs, axis=1)
    fieldnames = [
        "relative_path",
        "class_name",
        "true_label",
        "predicted_label",
        "predicted_stage"
    ] + [f"p_{c}" for c in classes]

    records = []
    for idx in range(len(test_paths)):
        rec = {
            "relative_path": test_paths[idx],
            "class_name": classes[test_labels[idx]],
            "true_label": int(test_labels[idx]),
            "predicted_label": int(preds[idx]),
            "predicted_stage": classes[preds[idx]],
        }
        for c_idx, c_name in enumerate(classes):
            rec[f"p_{c_name}"] = f"{test_probs[idx, c_idx]:.5f}"
        records.append(rec)

    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow(r)


def train_single_model(
    model_name: str,  # 'resnet50' or 'vit_b16'
    epochs: int = 5,
    batch_size: int = 32,
    lr: float = 1e-4,
    fine_tune_lr: float = 2e-5,
    seed: int = 42,
    splits_csv: str = "splits.csv",
    data_root: str = "Dataset",
    device: str = "cpu"
):
    set_seed(seed)
    run_dir = os.path.join("outputs", f"{model_name}_run")
    os.makedirs(run_dir, exist_ok=True)

    print(f"\n==========================================")
    print(f"Training Baseline Model: {model_name.upper()} on {device}")
    print(f"Run output directory: {run_dir}")
    print(f"==========================================")

    # 1. Load DataLoaders and exact class weights
    train_loader, val_loader, test_loader, classes, class_weights = get_dataloaders(
        splits_csv=splits_csv,
        data_root=data_root,
        batch_size=batch_size
    )
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Save frozen configuration
    run_config = {
        "model_name": model_name,
        "seed": seed,
        "epochs": epochs,
        "batch_size": batch_size,
        "lr": lr,
        "fine_tune_lr": fine_tune_lr,
        "optimizer": "AdamW",
        "loss": "Weighted_Cross_Entropy",
        "classes": classes,
        "class_weights": {classes[i]: float(class_weights[i].item()) for i in range(len(classes))},
        "device": device
    }
    with open(os.path.join(run_dir, "config.yaml"), "w", encoding="utf-8") as f:
        yaml.dump(run_config, f)

    # Precompute frozen backbone features
    print(f"Loading/extracting {model_name} representations for training and validation splits...")
    t0_cache = time.time()
    train_feats, train_lbls, _ = precompute_backbone_features(model_name, train_loader, device, split_name="train")
    val_feats, val_lbls, _ = precompute_backbone_features(model_name, val_loader, device, split_name="val")
    test_feats, test_lbls, test_paths = precompute_backbone_features(model_name, test_loader, device, split_name="test")
    print(f"Representation loading/extraction completed in {time.time() - t0_cache:.2f}s.")

    # 2. Build model
    if model_name == "resnet50":
        full_model = build_resnet50(num_classes=len(classes), pretrained=True)
    else:
        full_model = build_vit_b16(num_classes=len(classes), pretrained=True)

    classifier = full_model.classifier
    optimizer = AdamW(classifier.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_f1 = -1.0
    best_classifier_state = None
    best_epoch = 1

    # 3. Training Loop
    n_train = len(train_lbls)
    indices = np.arange(n_train)

    for ep in range(1, epochs + 1):
        classifier.train()
        np.random.shuffle(indices)
        train_loss = 0.0

        for i in range(0, n_train, batch_size):
            batch_idx = indices[i:i + batch_size]
            bf = train_feats[batch_idx]
            bl = train_lbls[batch_idx]

            optimizer.zero_grad()
            out = classifier(bf)
            loss = criterion(out, bl)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(bl)

        train_loss /= n_train
        val_loss, val_f1, val_acc = evaluate_features_single(classifier, val_feats, val_lbls, criterion)
        scheduler.step()

        print(f"Epoch {ep}/{epochs} - Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f} | Val Macro-F1: {val_f1:.4f}")

        # Model selection: Peak Validation Macro-F1
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_epoch = ep
            best_classifier_state = {k: v.cpu().clone() for k, v in classifier.state_dict().items()}

    print(f"\nModel selection complete. Best Validation Macro-F1: {best_val_f1:.4f} (Epoch {best_epoch})")

    # Load best weights into full model
    classifier.load_state_dict(best_classifier_state)

    # 4. Measure Inference Latency
    classifier.eval()
    t_start = time.perf_counter()
    with torch.no_grad():
        test_out = classifier(test_feats)
        test_probs = torch.softmax(test_out, dim=-1).numpy()
    t_end = time.perf_counter()
    latency_ms = ((t_end - t_start) / len(test_feats)) * 1000.0

    # Save full model checkpoint
    best_checkpoint_path = os.path.join(run_dir, "best_model.pt")
    torch.save({
        "model_name": model_name,
        "selected_epoch": best_epoch,
        "val_macro_f1": best_val_f1,
        "benchmark_latency_ms": round(latency_ms, 2),
        "model_state_dict": full_model.state_dict(),
        "classes": classes
    }, best_checkpoint_path)
    print(f"Saved best model checkpoint to: {best_checkpoint_path}")

    # 5. Save per-sample test predictions (used strictly ONCE)
    test_pred_path = os.path.join(run_dir, "test_predictions.csv")
    generate_predictions_csv(test_probs, test_lbls.numpy(), test_paths, classes, test_pred_path)
    print(f"Saved test predictions to: {test_pred_path}")

    # 6. Evaluate metrics from predictions
    metrics = compute_metrics_from_predictions(test_pred_path, best_checkpoint_path, device)
    metrics_path = os.path.join(run_dir, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Test Accuracy: {metrics['accuracy']:.4f} | Macro F1: {metrics['macro_f1']:.4f} | QWK: {metrics['quadratic_weighted_kappa']:.4f}")
    return metrics


def train_fusion_model(
    model_name: str,  # 'fusion' or 'fusion_gated'
    epochs: int = 5,
    batch_size: int = 32,
    lr: float = 1e-4,
    seed: int = 42,
    splits_csv: str = "splits.csv",
    data_root: str = "Dataset",
    device: str = "cpu"
):
    set_seed(seed)
    is_gated = (model_name == "fusion_gated")
    run_dir = os.path.join("outputs", f"{model_name}_run")
    os.makedirs(run_dir, exist_ok=True)

    print(f"\n==========================================")
    print(f"Training Model: {model_name.upper()} on {device}")
    print(f"Run output directory: {run_dir}")
    print(f"==========================================")

    # 1. Load DataLoaders
    train_loader, val_loader, test_loader, classes, class_weights = get_dataloaders(
        splits_csv=splits_csv,
        data_root=data_root,
        batch_size=batch_size
    )
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Save frozen configuration
    run_config = {
        "model_name": model_name,
        "gated_ablation": is_gated,
        "seed": seed,
        "epochs": epochs,
        "batch_size": batch_size,
        "lr": lr,
        "optimizer": "AdamW",
        "loss": "Weighted_Cross_Entropy",
        "classes": classes,
        "class_weights": {classes[i]: float(class_weights[i].item()) for i in range(len(classes))},
        "device": device
    }
    with open(os.path.join(run_dir, "config.yaml"), "w", encoding="utf-8") as f:
        yaml.dump(run_config, f)

    # Precompute / load features from both backbones using cache
    print("Loading/extracting dual representations (ResNet50 GAP + ViT [CLS])...")
    t0_cache = time.time()
    train_rf, train_lbls, _ = precompute_backbone_features("resnet50", train_loader, device, split_name="train")
    train_vf, _, _ = precompute_backbone_features("vit_b16", train_loader, device, split_name="train")

    val_rf, val_lbls, _ = precompute_backbone_features("resnet50", val_loader, device, split_name="val")
    val_vf, _, _ = precompute_backbone_features("vit_b16", val_loader, device, split_name="val")

    test_rf, test_lbls, test_paths = precompute_backbone_features("resnet50", test_loader, device, split_name="test")
    test_vf, _, _ = precompute_backbone_features("vit_b16", test_loader, device, split_name="test")
    print(f"Dual representation loading/extraction completed in {time.time() - t0_cache:.2f}s.")

    # 2. Build full model
    fusion_model = build_fusion_model(num_classes=len(classes), gated=is_gated, pretrained=True)

    # Stage 1: Train projections and MLP head (frozen backbones)
    fusion_params = list(fusion_model.res_proj.parameters()) + list(fusion_model.vit_proj.parameters()) + list(fusion_model.mlp_head.parameters())
    if is_gated:
        fusion_params += list(fusion_model.gate_net.parameters())

    optimizer = AdamW(fusion_params, lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_f1 = -1.0
    best_weights = None
    best_epoch = 1

    n_train = len(train_lbls)
    indices = np.arange(n_train)

    # 3. Training Loop
    for ep in range(1, epochs + 1):
        fusion_model.train()
        np.random.shuffle(indices)
        train_loss = 0.0

        for i in range(0, n_train, batch_size):
            batch_idx = indices[i:i + batch_size]
            br = train_rf[batch_idx]
            bv = train_vf[batch_idx]
            bl = train_lbls[batch_idx]

            optimizer.zero_grad()
            rp = fusion_model.res_proj(br)
            vp = fusion_model.vit_proj(bv)

            if is_gated:
                comb = torch.cat([rp, vp], dim=-1)
                g = fusion_model.gate_net(comb)
                fused = torch.cat([rp * g[:, :fusion_model.proj_dim], vp * g[:, fusion_model.proj_dim:]], dim=-1)
            else:
                fused = torch.cat([rp, vp], dim=-1)

            out = fusion_model.mlp_head(fused)
            loss = criterion(out, bl)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(bl)

        train_loss /= n_train
        val_loss, val_f1, val_acc = evaluate_features_dual(fusion_model, val_rf, val_vf, val_lbls, criterion)
        scheduler.step()

        print(f"Epoch {ep}/{epochs} - Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f} | Val Macro-F1: {val_f1:.4f}")

        # Model selection: Peak Validation Macro-F1
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_epoch = ep
            best_weights = {k: v.cpu().clone() for k, v in fusion_model.state_dict().items()}

    print(f"\nModel selection complete. Best Validation Macro-F1: {best_val_f1:.4f} (Epoch {best_epoch})")
    fusion_model.load_state_dict(best_weights)

    # 4. Measure Inference Latency
    fusion_model.eval()
    t_start = time.perf_counter()
    with torch.no_grad():
        rp = fusion_model.res_proj(test_rf)
        vp = fusion_model.vit_proj(test_vf)
        if is_gated:
            comb = torch.cat([rp, vp], dim=-1)
            g = fusion_model.gate_net(comb)
            fused = torch.cat([rp * g[:, :fusion_model.proj_dim], vp * g[:, fusion_model.proj_dim:]], dim=-1)
        else:
            fused = torch.cat([rp, vp], dim=-1)
        test_out = fusion_model.mlp_head(fused)
        test_probs = torch.softmax(test_out, dim=-1).numpy()
    t_end = time.perf_counter()
    latency_ms = ((t_end - t_start) / len(test_rf)) * 1000.0

    # Save full model checkpoint
    best_checkpoint_path = os.path.join(run_dir, "best_model.pt")
    torch.save({
        "model_name": model_name,
        "selected_epoch": best_epoch,
        "val_macro_f1": best_val_f1,
        "benchmark_latency_ms": round(latency_ms, 2),
        "model_state_dict": fusion_model.state_dict(),
        "classes": classes
    }, best_checkpoint_path)
    print(f"Saved best model checkpoint to: {best_checkpoint_path}")

    # 5. Save per-sample test predictions (used strictly ONCE)
    test_pred_path = os.path.join(run_dir, "test_predictions.csv")
    generate_predictions_csv(test_probs, test_lbls.numpy(), test_paths, classes, test_pred_path)
    print(f"Saved test predictions to: {test_pred_path}")

    # 6. Evaluate metrics from predictions
    metrics = compute_metrics_from_predictions(test_pred_path, best_checkpoint_path, device)
    metrics_path = os.path.join(run_dir, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Test Accuracy: {metrics['accuracy']:.4f} | Macro F1: {metrics['macro_f1']:.4f} | QWK: {metrics['quadratic_weighted_kappa']:.4f}")
    return metrics


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train model")
    parser.add_argument("--model", required=True, choices=["resnet50", "vit_b16", "fusion", "fusion_gated"])
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--splits", default="splits.csv")
    parser.add_argument("--data-root", default="Dataset")
    args = parser.parse_args()

    if args.model in ("resnet50", "vit_b16"):
        train_single_model(
            model_name=args.model,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr,
            seed=args.seed,
            splits_csv=args.splits,
            data_root=args.data_root
        )
    else:
        train_fusion_model(
            model_name=args.model,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr,
            seed=args.seed,
            splits_csv=args.splits,
            data_root=args.data_root
        )
