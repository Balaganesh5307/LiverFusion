"""
LiverFusion AI - PyTorch Data Pipeline
- Grayscale -> 224x224 -> 3 channels -> ImageNet normalisation
- Light train-only augmentation from configs/data.yaml
- Reads splits.csv directly
- Calculates exact balanced class weights for Weighted Cross-Entropy
"""

import os
import csv
from typing import Dict, List, Tuple, Optional
import numpy as np
from PIL import Image
import yaml
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms


def get_data_config(config_path: str = "configs/data.yaml") -> Dict:
    """Load dataset configuration."""
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def get_class_weights(splits_csv: str = "splits.csv") -> Tuple[torch.Tensor, List[str], Dict[str, float]]:
    """
    Computes exact balanced class weights from training partition:
    w_k = N / (K * N_k)
    where N is total train samples, K is number of classes, N_k is count for class k.
    """
    class_counts: Dict[str, int] = {}
    with open(splits_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["split"] == "train":
                cls = row["class_name"]
                class_counts[cls] = class_counts.get(cls, 0) + 1

    classes = sorted(list(class_counts.keys()))
    k = len(classes)
    n = sum(class_counts.values())

    weights = []
    weight_dict = {}
    for cls in classes:
        n_k = class_counts[cls]
        w = n / (k * n_k)
        weights.append(w)
        weight_dict[cls] = round(w, 4)

    return torch.tensor(weights, dtype=torch.float32), classes, weight_dict


class UltrasoundDataset(Dataset):
    """
    Ultrasound Dataset reading from splits.csv.
    Transforms: Grayscale -> 224x224 -> 3 channels -> ImageNet normalisation.
    """
    def __init__(
        self,
        splits_csv: str,
        split_name: str,
        data_root: str = "Dataset",
        classes: Optional[List[str]] = None,
        is_train: bool = False
    ):
        self.data_root = data_root
        self.split_name = split_name
        self.is_train = is_train

        # Read samples for this split
        self.samples = []
        found_classes = set()
        with open(splits_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                found_classes.add(row["class_name"])
                if row["split"] == split_name:
                    self.samples.append(row)

        self.classes = classes or sorted(list(found_classes))
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}

        # ImageNet normalization standard
        imagenet_mean = [0.485, 0.456, 0.406]
        imagenet_std = [0.229, 0.224, 0.225]

        if is_train:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(degrees=7),
                transforms.ToTensor(),
                transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
            ])
        else:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
            ])

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        row = self.samples[idx]
        rel_path = row["relative_path"]
        abs_path = os.path.join(self.data_root, rel_path)

        # Grayscale load -> convert to RGB mode for 3 channels -> 224x224 -> ImageNet norm
        img = Image.open(abs_path).convert("L").convert("RGB")
        tensor = self.transform(img)
        label = self.class_to_idx[row["class_name"]]

        return tensor, label, rel_path


def get_dataloaders(
    splits_csv: str = "splits.csv",
    data_root: str = "Dataset",
    batch_size: int = 32,
    num_workers: int = 0
) -> Tuple[DataLoader, DataLoader, DataLoader, List[str], torch.Tensor]:
    """
    Returns train, val, and test DataLoaders, class names list, and class weights tensor.
    """
    weights_tensor, classes, weight_dict = get_class_weights(splits_csv)

    train_ds = UltrasoundDataset(splits_csv, "train", data_root, classes, is_train=True)
    val_ds = UltrasoundDataset(splits_csv, "val", data_root, classes, is_train=False)
    test_ds = UltrasoundDataset(splits_csv, "test", data_root, classes, is_train=False)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, test_loader, classes, weights_tensor


if __name__ == "__main__":
    weights, classes, w_dict = get_class_weights()
    print("Classes:", classes)
    print("Computed Weighted Cross-Entropy Weights (w_k = N / (K * N_k)):")
    for c, w in w_dict.items():
        print(f"  {c}: {w}")
    tr, va, te, cls_list, w_t = get_dataloaders(batch_size=8)
    print(f"Dataset loaded: Train={len(tr.dataset)}, Val={len(va.dataset)}, Test={len(te.dataset)}")
    batch_imgs, batch_lbls, batch_paths = next(iter(tr))
    print("Sample batch tensor shape:", batch_imgs.shape)
