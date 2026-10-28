"""
LiverFusion AI - Dual-Branch Fusion Architecture & Gated Ablation
- ResNet50 GAP (2048) -> Linear -> LayerNorm -> d dims
- ViT-B/16 [CLS] (768) -> Linear -> LayerNorm -> d dims
- Concatenation (2*d) -> Two-layer MLP head
- Gated variant as an ablation: learnable sigmoid gating modulating branch contributions
- Supports two-stage training: frozen backbones (stage 1), then joint fine-tuning (stage 2)
"""

import torch
import torch.nn as nn
from ml.models.resnet50 import build_resnet50
from ml.models.vit_b16 import build_vit_b16


class DualBranchFusion(nn.Module):
    def __init__(
        self,
        num_classes: int = 5,
        proj_dim: int = 256,
        mlp_dim: int = 256,
        dropout: float = 0.2,
        pretrained: bool = True,
        gated: bool = False
    ):
        super().__init__()
        self.num_classes = num_classes
        self.proj_dim = proj_dim
        self.gated = gated

        # Backbones
        self.resnet_branch = build_resnet50(num_classes=num_classes, pretrained=pretrained)
        self.vit_branch = build_vit_b16(num_classes=num_classes, pretrained=pretrained)

        # Remove individual classifiers (we extract representations)
        self.resnet_in_dim = 2048
        self.vit_in_dim = 768

        # Branch 1: Linear -> LayerNorm -> proj_dim
        self.res_proj = nn.Sequential(
            nn.Linear(self.resnet_in_dim, proj_dim),
            nn.LayerNorm(proj_dim)
        )

        # Branch 2: Linear -> LayerNorm -> proj_dim
        self.vit_proj = nn.Sequential(
            nn.Linear(self.vit_in_dim, proj_dim),
            nn.LayerNorm(proj_dim)
        )

        # Optional Gated Fusion Ablation: Learnable sigmoid gating
        if self.gated:
            self.gate_net = nn.Sequential(
                nn.Linear(proj_dim * 2, proj_dim * 2),
                nn.Sigmoid()
            )

        # Two-layer MLP classification head
        self.mlp_head = nn.Sequential(
            nn.Linear(proj_dim * 2, mlp_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout),
            nn.Linear(mlp_dim, num_classes)
        )

    def freeze_backbones(self):
        """Stage 1: Freeze convolutional and transformer backbones."""
        for param in self.resnet_branch.parameters():
            param.requires_grad = False
        for param in self.vit_branch.parameters():
            param.requires_grad = False

    def unfreeze_backbones(self):
        """Stage 2: Unfreeze backbones for joint fine-tuning."""
        for param in self.resnet_branch.parameters():
            param.requires_grad = True
        for param in self.vit_branch.parameters():
            param.requires_grad = True

    def extract_branch_features(self, x: torch.Tensor):
        """Extract and project representations from both branches."""
        # 1. ResNet GAP representation
        res_gap = self.resnet_branch.extract_features(x)
        res_proj = self.res_proj(res_gap)

        # 2. ViT [CLS] representation
        vit_cls = self.vit_branch.extract_features(x)
        vit_proj = self.vit_proj(vit_cls)

        return res_proj, vit_proj

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res_proj, vit_proj = self.extract_branch_features(x)

        if self.gated:
            # Gated fusion ablation
            combined = torch.cat([res_proj, vit_proj], dim=-1)
            gates = self.gate_net(combined)
            res_gated = res_proj * gates[:, :self.proj_dim]
            vit_gated = vit_proj * gates[:, self.proj_dim:]
            fused = torch.cat([res_gated, vit_gated], dim=-1)
        else:
            # Standard concatenation
            fused = torch.cat([res_proj, vit_proj], dim=-1)

        # Two-layer MLP head
        return self.mlp_head(fused)


def build_fusion_model(
    num_classes: int = 5,
    gated: bool = False,
    pretrained: bool = True
) -> DualBranchFusion:
    return DualBranchFusion(num_classes=num_classes, gated=gated, pretrained=pretrained)
