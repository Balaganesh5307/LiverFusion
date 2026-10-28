"""
LiverFusion AI - ResNet50 Baseline Architecture
ImageNet-pretrained ResNet50 adapted for ultrasound fibrosis staging.
"""

import torch
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights


class ResNet50Classifier(nn.Module):
    def __init__(self, num_classes: int = 5, pretrained: bool = True, dropout: float = 0.2):
        super().__init__()
        weights = ResNet50_Weights.DEFAULT if pretrained else None
        backbone = resnet50(weights=weights)

        # Feature extractor up to Global Average Pooling
        self.conv1 = backbone.conv1
        self.bn1 = backbone.bn1
        self.relu = backbone.relu
        self.maxpool = backbone.maxpool
        self.layer1 = backbone.layer1
        self.layer2 = backbone.layer2
        self.layer3 = backbone.layer3
        self.layer4 = backbone.layer4
        self.avgpool = backbone.avgpool
        
        in_features = backbone.fc.in_features  # 2048

        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes)
        )

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract 2048-dimensional Global Average Pooled representation."""
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.avgpool(x)
        return torch.flatten(x, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.extract_features(x)
        return self.classifier(features)


def build_resnet50(num_classes: int = 5, pretrained: bool = True) -> ResNet50Classifier:
    return ResNet50Classifier(num_classes=num_classes, pretrained=pretrained)
