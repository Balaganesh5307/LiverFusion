import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MODEL_BENCHMARKS } from '../../data/clinicalConstants';
import { ShieldAlert, Cpu, Sparkles, Binary, Network, RefreshCcw } from 'lucide-react';

export const ModelComparisonMatrix: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'benchmarks' | 'emptyState'>('benchmarks');

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'resnet50':
        return <Network className="w-4 h-4 text-teal-600" />;
      case 'cnn':
        return <Binary className="w-4 h-4 text-slate-700" />;
      case 'vit':
        return <Cpu className="w-4 h-4 text-blue-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Architectural Performance Comparison Matrix</CardTitle>
              <Badge variant={activeMode === 'benchmarks' ? 'warning' : 'default'} size="sm" className="font-mono text-[10px]">
                {activeMode === 'benchmarks' ? 'Target Benchmark Data' : 'Experimental Runs (Awaiting Training)'}
              </Badge>
            </div>
            <CardDescription>
              Quantitative evaluation across Standard CNN, ResNet50, Vision Transformer, and proposed Multimodal Deep Fusion.
            </CardDescription>
          </div>

          {/* Toggle between target benchmarks and genuine experimental empty state */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveMode('benchmarks')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeMode === 'benchmarks'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Target Benchmarks
            </button>
            <button
              onClick={() => setActiveMode('emptyState')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeMode === 'emptyState'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Experimental Runs (Empty)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {activeMode === 'emptyState' ? (
          <div className="p-12 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center mx-auto">
              <RefreshCcw className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              No Physical Training Runs Executed Yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              In accordance with project protocol, no fabricated training metrics are displayed. 
              Actual accuracy, sensitivity, specificity, and AUC curves will be recorded here once the 
              PyTorch training pipeline executes 5-fold cross-validation on the 6,323 ultrasound images.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMode('benchmarks')}
                className="text-xs"
              >
                Switch to Literature Target Benchmarks
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Architecture & Topology</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Sensitivity</th>
                  <th className="py-3 px-3">Specificity</th>
                  <th className="py-3 px-3">AUC-ROC</th>
                  <th className="py-3 px-3">Params</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {MODEL_BENCHMARKS.map((m) => {
                  const isPrimary = m.id === 'resnet50';
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPrimary ? 'bg-teal-50/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isPrimary ? 'bg-teal-100' : 'bg-slate-100'}`}>
                            {getModelIcon(m.id)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">
                              {m.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {m.family}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={isPrimary ? 'teal' : m.id === 'hybrid_fusion' ? 'stage' : 'default'}
                          size="sm"
                          className="text-[10px]"
                        >
                          {m.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {m.accuracy.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {m.sensitivity.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {m.specificity.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-teal-700">
                        {m.auc.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500">
                        {m.paramCount}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        ~{m.inferenceTimeMs}ms
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] text-slate-600 whitespace-nowrap">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Experimental Grounding:</strong> The values above reflect theoretical literature benchmark targets for liver fibrosis staging. They do not constitute actual completed training checkpoints.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
