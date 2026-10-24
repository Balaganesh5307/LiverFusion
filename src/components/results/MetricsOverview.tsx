import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modality, ModelArchitecture, FibrosisStage } from '../../types';
import { Gauge, Cpu, Radio, Hash } from 'lucide-react';

interface MetricsOverviewProps {
  scanId: string;
  modality: Modality;
  model: ModelArchitecture;
  stage: FibrosisStage;
  inferenceTimeMs?: number;
  entropy?: number;
  isDemo?: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  scanId,
  modality,
  model,
  stage,
  inferenceTimeMs = 42,
  entropy = 0.38,
  isDemo = true,
}) => {
  return (
    <Card className="border-slate-200/90">
      <CardHeader className="bg-slate-50/50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Scan & Model Runtime Telemetry
          </CardTitle>
          {isDemo && (
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              Prototype Metadata
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Analysis ID</span>
            </div>
            <div className="font-mono font-bold text-slate-900 truncate" title={scanId}>
              {scanId}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
              <Radio className="w-3.5 h-3.5 text-teal-600" />
              <span>Input Modality</span>
            </div>
            <div className="font-semibold text-slate-900 capitalize">
              {modality} (B-Mode)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Selected Model</span>
            </div>
            <div className="font-semibold text-slate-900 uppercase font-mono text-[11px]">
              {model === 'resnet50' ? 'ResNet50' : model === 'cnn' ? 'CNN Baseline' : model === 'vit' ? 'ViT-B/16' : 'Hybrid'}
              <span className="ml-1 text-slate-400 font-sans font-normal">({stage})</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inference & Entropy</span>
            </div>
            <div className="font-mono font-bold text-slate-900">
              ~{inferenceTimeMs}ms <span className="text-[10px] text-slate-400 font-normal">(H={entropy.toFixed(2)})</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
