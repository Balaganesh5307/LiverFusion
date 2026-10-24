import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ConfidenceScore } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { METAVIR_STAGES } from '../../data/clinicalConstants';

interface ConfidenceDistributionProps {
  scores: ConfidenceScore[];
  isDemo?: boolean;
}

export const ConfidenceDistribution: React.FC<ConfidenceDistributionProps> = ({
  scores,
  isDemo = true,
}) => {
  return (
    <Card className="border-slate-200/90 h-full flex flex-col justify-between">
      <div>
        <CardHeader className="bg-slate-50/50 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Multiclass Softmax Distribution
            </span>
            {isDemo && (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Demo Probabilities
              </span>
            )}
          </div>
          <CardTitle className="text-base font-bold text-slate-900 mt-1">
            Per-Class Staging Probabilities
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-3.5">
          {scores.map((score) => {
            const stageMeta = METAVIR_STAGES[score.stage];
            const percent = (score.probability * 100);
            const isHighest = score.isTopChoice;

            return (
              <div key={score.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${stageMeta.color.bg} ${stageMeta.color.text} border ${stageMeta.color.border}`}>
                      {score.stage}
                    </span>
                    <span className="font-medium text-slate-700">
                      {stageMeta.name}
                    </span>
                    {isHighest && (
                      <span className="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        Top Prediction
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {percent.toFixed(1)}%
                  </span>
                </div>

                <ProgressBar
                  value={percent}
                  colorClass={
                    isHighest ? 'bg-teal-600' :
                    score.stage === 'F4' ? 'bg-rose-400' :
                    score.stage === 'F3' ? 'bg-amber-400' :
                    score.stage === 'F0' ? 'bg-emerald-400' : 'bg-slate-300'
                  }
                  heightClass="h-2"
                />
              </div>
            );
          })}
        </CardContent>
      </div>

      <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
        <strong>Softmax Calibration:</strong> True output tensors from the PyTorch ResNet50 classifier will populate this vector after model inference integration in Phase 2.
      </div>
    </Card>
  );
};
