import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Network, Cpu, Binary, Sparkles, ArrowRight } from 'lucide-react';

export const ArchitectureInfoCard: React.FC = () => {
  const architectures = [
    {
      id: 'resnet50',
      title: 'ResNet50 Deep Residual Network',
      subtitle: 'Primary Model for Initial Training (Ultrasound Cohort)',
      icon: Network,
      iconColor: 'text-teal-600 bg-teal-50',
      badge: 'Primary Baseline',
      badgeVariant: 'teal' as const,
      description: 'Employs identity shortcut connections that allow gradients to propagate unimpeded across 50 layers. Specially tuned for acoustic speckle texture extraction from the 6,323 B-mode ultrasound images.',
      technicalDetails: [
        'Architecture: 4 residual stages with bottleneck blocks [1x1, 3x3, 1x1 conv]',
        'Weights: ImageNet-1K pretrained initialization with fine-tuning on liver ultrasound',
        'Input: 224x224 RGB acoustic echogenicity tensors',
        'Primary Training Objective: 5-class cross-entropy loss with focal reweighting',
      ],
      clinicalAdvantage: 'High sensitivity to subtle micro-nodular parenchymal coarsening characteristic of early F1–F2 transition.',
    },
    {
      id: 'cnn',
      title: 'Custom Multi-Scale CNN',
      subtitle: 'Lightweight Benchmark Baseline',
      icon: Binary,
      iconColor: 'text-slate-700 bg-slate-100',
      badge: 'Baseline',
      badgeVariant: 'default' as const,
      description: 'Standard multi-scale convolutional neural network with parallel kernel sizes (3x3, 5x5, 7x7) to capture local liver parenchymal patterns across varying spatial resolutions.',
      technicalDetails: [
        'Architecture: 5 convolutional blocks followed by global average pooling',
        'Parameter Count: ~4.8M (efficient edge deployment)',
        'Inference Speed: ~24 ms on modern GPU / ~85 ms on CPU',
      ],
      clinicalAdvantage: 'Rapid screening baseline with minimal compute requirements.',
    },
    {
      id: 'vit',
      title: 'Vision Transformer (ViT-B/16)',
      subtitle: 'Global Context & Self-Attention',
      icon: Cpu,
      iconColor: 'text-blue-600 bg-blue-50',
      badge: 'Comparative Architecture',
      badgeVariant: 'outline' as const,
      description: 'Deconstructs the hepatic ultrasound scan into a sequence of 16x16 non-overlapping patches, applying multi-head self-attention to model long-range anatomical dependencies across the entire liver capsule.',
      technicalDetails: [
        'Patch Resolution: 16x16 pixels (196 patch tokens + 1 [CLS] token)',
        'Transformer Blocks: 12 self-attention layers with 12 heads',
        'Parameter Count: ~86.4M parameters',
      ],
      clinicalAdvantage: 'Superior detection of global architectural distortion, such as liver volume redistribution and capsule undulation.',
    },
    {
      id: 'hybrid_fusion',
      title: 'Multimodal Deep Fusion (CNN–ViT)',
      subtitle: 'Core Research Innovation',
      icon: Sparkles,
      iconColor: 'text-indigo-600 bg-indigo-50',
      badge: 'Proposed Research Fusion',
      badgeVariant: 'stage' as const,
      description: 'Unified dual-stream cross-attention architecture that fuses local acoustic texture embeddings extracted by ResNet50 with global context tokens from ViT and patient clinical metadata.',
      technicalDetails: [
        'Fusion Layer: Multi-head cross-attention mechanism with gated linear units',
        'Modalities: Ultrasound B-mode + planned CT/MRI features and laboratory scores',
        'Optimization: Multi-task contrastive loss + staging cross-entropy',
      ],
      clinicalAdvantage: 'Resolves ambiguous border cases (specifically distinguishing F2 from F3) by synergizing fine speckle textures with macro-scale organ morphology.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          Neural Architecture Technical Deep Dive
        </h3>
        <span className="text-xs text-slate-500">
          Mathematical principles & clinical justification
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {architectures.map((arch) => {
          const Icon = arch.icon;
          return (
            <Card key={arch.id} className="border-slate-200/90 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 bg-slate-50/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${arch.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">
                          {arch.title}
                        </CardTitle>
                        <p className="text-[11px] text-slate-500">{arch.subtitle}</p>
                      </div>
                    </div>
                    <Badge variant={arch.badgeVariant} size="sm" className="text-[10px]">
                      {arch.badge}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-3 space-y-3 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    {arch.description}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                      Technical Architecture Specifications
                    </div>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {arch.technicalDetails.map((td, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ArrowRight className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                          <span>{td}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-700">
                <strong className="text-slate-900">Clinical Focus:</strong> {arch.clinicalAdvantage}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
