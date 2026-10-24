import React from 'react';
import { ModelComparisonMatrix } from '../components/comparison/ModelComparisonMatrix';
import { ArchitectureInfoCard } from '../components/comparison/ArchitectureInfoCard';
import { HardDrive, CheckCircle2 } from 'lucide-react';

export const ModelComparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Comparative AI Benchmark
          </span>
          <span className="text-xs text-slate-400 font-mono">ResNet50 • CNN • ViT • Hybrid Deep Fusion</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          Architectural Staging Evaluation & Baseline Comparisons
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Comprehensive evaluation framework across our 4 neural network families. 
          Groundwork established for PyTorch ResNet50 baseline training on 6,323 liver ultrasound scans, 
          leading toward multimodal deep cross-attention fusion.
        </p>
      </div>

      {/* Dataset Training Roadmap Banner */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-teal-950">Training Cohort Verification (Phase 1 Status)</div>
            <p className="text-[11px] text-teal-800">
              6,323 physical ultrasound images verified in local workspace <code className="font-mono bg-teal-100/70 px-1 py-0.2 rounded">Dataset/</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            ResNet50 First In Line
          </span>
        </div>
      </div>

      {/* Comparison Matrix Component (includes empty state toggle) */}
      <ModelComparisonMatrix />

      {/* Deep Dive into Architecture Principles */}
      <ArchitectureInfoCard />
    </div>
  );
};
