"""
LiverFusion AI - ViT-B/16 Baseline Architecture
ImageNet-pretrained Vision Transformer (ViT-B/16) adapted for ultrasound fibrosis staging.
"""

import torch
import torch.nn as nn
from torchvision.models import vit_b_16, ViT_B_16_Weights


class ViTB16Classifier(nn.Module):
    def __init__(self, num_classes: int = 5, pretrained: bool = True, dropout: float = 0.2):
        super().__init__()
        weights = ViT_B_16_Weights.DEFAULT if pretrained else None
        backbone = vit_b_16(weights=weights)

        self.conv_proj = backbone.conv_proj
        self.class_token = backbone.class_token
        self.encoder = backbone.encoder
        self.heads = backbone.heads
        
        in_features = 768  # ViT-B/16 hidden dimension

        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes)
        )

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract 768-dimensional [CLS] token representation."""
        # Reshape and patch project
        n, c, h, w = x.shape
        p = 16
        x = self.conv_proj(x)
        # (n, hidden_dim, h/p, w/p) -> (n, hidden_dim, (h/p)*(w/p)) -> (n, seq_len, hidden_dim)
        x = x.reshape(n, 768, -1).permute(0, 2, 1)

        # Prepend class token
        batch_class_token = self.class_token.expand(n, -1, -1)
        x = torch.cat([batch_class_token, x], dim=1)

        # Transformer encoder
        x = self.encoder(x)
        # Return [CLS] token representation (index 0)
        return x[:, 0]

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        cls_feat = self.extract_features(x)
        return self.classifier(cls_feat)


def build_vit_b16(num_classes: int = 5, pretrained: bool = True) -> ViTB16Classifier:
    return ViTB16Classifier(num_classes=num_classes, pretrained=pretrained)
