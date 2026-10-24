import React from 'react';
import { Modality } from '../../types';
import { MODALITY_CONFIGS } from '../../data/clinicalConstants';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Activity, Radio, Cpu, Microscope } from 'lucide-react';

interface ModalitySelectorProps {
  selectedModality: Modality;
  onSelectModality: (modality: Modality) => void;
}

export const ModalitySelector: React.FC<ModalitySelectorProps> = ({
  selectedModality,
  onSelectModality,
}) => {
  const getModalityIcon = (id: Modality) => {
    switch (id) {
      case 'ultrasound':
        return <Activity className="w-5 h-5 text-teal-600" />;
      case 'ct':
        return <Cpu className="w-5 h-5 text-blue-600" />;
      case 'mri':
        return <Radio className="w-5 h-5 text-indigo-600" />;
      case 'histopathology':
        return <Microscope className="w-5 h-5 text-amber-600" />;
    }
  };

  const isUltrasound = selectedModality === 'ultrasound';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
          1. Select Imaging Modality
        </label>
        <span className="text-[11px] text-slate-500">
          Target modality determines preprocessing & feature extraction
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MODALITY_CONFIGS.map((mod) => {
          const isSelected = selectedModality === mod.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModality(mod.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-100 text-teal-800' : 'bg-slate-100'}`}>
                    {getModalityIcon(mod.id)}
                  </div>
                  <Badge
                    variant={mod.isAvailableForTraining ? 'teal' : 'outline'}
                    size="sm"
                    className="text-[10px]"
                  >
                    {mod.badge}
                  </Badge>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-snug">{mod.name}</div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                Formats: {mod.supportedFormats.join(', ')}
              </div>
            </button>
          );
        })}
      </div>

      {!isUltrasound && (
        <Alert variant="warning" title="Modality Compatibility Notice">
          Compatible deep learning models are <strong>not yet available</strong> for {selectedModality.toUpperCase()}. 
          Our primary verified dataset is liver ultrasound (6,323 scans across F0–F4). CT, MRI, and Histopathology models 
          will be enabled in Phase 2 with multimodal deep fusion.
        </Alert>
      )}
    </div>
  );
};
