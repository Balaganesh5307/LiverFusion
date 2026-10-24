import React from 'react';
import { Modal } from '../ui/Modal';
import { METAVIR_STAGES } from '../../data/clinicalConstants';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

interface StagingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StagingGuideModal: React.FC<StagingGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="METAVIR Liver Fibrosis Staging Reference"
      subtitle="Standardized clinical histology and sonographic staging system"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        <Alert variant="info" title="Standard Clinical Classification">
          The METAVIR scoring system assesses histological liver damage based on fibrosis (F0–F4). 
          Our deep learning models (ResNet50, CNN, ViT, and Hybrid Fusion) are trained to map non-invasive 
          acoustic echogenicity features directly to these five reference stages.
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Object.values(METAVIR_STAGES).map((item) => (
            <div
              key={item.stage}
              className={`p-4 rounded-xl border flex flex-col justify-between ${item.color.bg} ${item.color.border}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xl font-bold ${item.color.text}`}>{item.stage}</span>
                  <Badge variant="outline" size="sm" className="font-semibold text-[10px]">
                    {item.stage === 'F0' ? 'Normal' : item.stage === 'F4' ? 'Cirrhosis' : 'Fibrotic'}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{item.name}</h4>
                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">{item.shortDesc}</p>
              </div>

              <div className="border-t border-slate-200/60 pt-2 text-[10px] space-y-1 text-slate-700">
                <div>
                  <strong className="text-slate-800">Histology:</strong> {item.histologyCriterion}
                </div>
                <div>
                  <strong className="text-slate-800">Clinical:</strong> {item.clinicalSignificance}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
          <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
            Relevance to LiverFusion AI Research
          </h5>
          <p className="leading-relaxed">
            In early stages (F0 vs F1), conventional ultrasound often has subtle texture overlap. 
            Deep learning representations (specifically deep residual feature maps and attention mechanisms) 
            aim to isolate microscopic acoustic attenuation anomalies that are imperceptible during manual radiologist review.
          </p>
        </div>
      </div>
    </Modal>
  );
};
