import React from 'react';
import { ModelArchitecture } from '../../types';
import { MODEL_BENCHMARKS } from '../../data/clinicalConstants';
import { Badge } from '../ui/Badge';
import { Cpu, Network, Sparkles, Binary } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: ModelArchitecture;
  onSelectModel: (model: ModelArchitecture) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const getModelIcon = (id: ModelArchitecture) => {
    switch (id) {
      case 'resnet50':
        return <Network className="w-5 h-5 text-teal-600" />;
      case 'cnn':
        return <Binary className="w-5 h-5 text-slate-700" />;
      case 'vit':
        return <Cpu className="w-5 h-5 text-blue-600" />;
      case 'hybrid_fusion':
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
          2. Select Deep Learning Architecture
        </label>
        <span className="text-[11px] text-slate-500">
          Target neural network topology for feature extraction & classification
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MODEL_BENCHMARKS.map((mod) => {
          const isSelected = selectedModel === mod.id;
          const isPrimary = mod.id === 'resnet50';

          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModel(mod.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-100 text-teal-800' : 'bg-slate-100'}`}>
                    {getModelIcon(mod.id)}
                  </div>
                  <Badge
                    variant={isPrimary ? 'teal' : 'default'}
                    size="sm"
                    className="text-[10px]"
                  >
                    {isPrimary ? 'Primary Target' : mod.category}
                  </Badge>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-snug">{mod.name}</div>
                <div className="text-[10px] text-teal-700 font-medium mt-0.5">{mod.family}</div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Params: <strong>{mod.paramCount}</strong></span>
                <span className="font-mono text-slate-700">Latency: ~{mod.inferenceTimeMs}ms</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
