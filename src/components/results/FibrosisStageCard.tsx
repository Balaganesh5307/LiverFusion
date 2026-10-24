import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FibrosisStage } from '../../types';
import { METAVIR_STAGES } from '../../data/clinicalConstants';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface FibrosisStageCardProps {
  stage: FibrosisStage;
  confidence: number;
  isPrototypePlaceholder?: boolean;
  onOpenStagingGuide?: () => void;
}

export const FibrosisStageCard: React.FC<FibrosisStageCardProps> = ({
  stage,
  confidence,
  isPrototypePlaceholder = true,
  onOpenStagingGuide,
}) => {
  const meta = METAVIR_STAGES[stage] || METAVIR_STAGES.F2;

  return (
    <Card className="overflow-hidden border-slate-200/90 h-full flex flex-col justify-between">
      <div>
        <CardHeader className="bg-slate-50/50 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Staging Output Classification
            </span>
            {isPrototypePlaceholder && (
              <Badge variant="warning" size="sm" className="font-mono text-[10px]">
                Placeholder Template
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg font-bold text-slate-900 mt-1">
            Predicted Fibrosis Assessment
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Main Stage Callout */}
          <div className={`p-4 rounded-xl border ${meta.color.bg} ${meta.color.border} flex items-center justify-between`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-extrabold ${meta.color.text}`}>
                  {meta.stage}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {meta.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    METAVIR Classification Scale
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                {meta.detailedDesc}
              </p>
            </div>

            <div className="text-right pl-4 shrink-0">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Demo Confidence</div>
              <div className={`text-2xl font-bold ${meta.color.text}`}>
                {(confidence * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-mono">
                simulated
              </span>
            </div>
          </div>

          {/* Histological Criterion & Clinical Significance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">
                Histology Correlation
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {meta.histologyCriterion}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">
                Clinical Significance
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {meta.clinicalSignificance}
              </p>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-amber-800 text-[11px]">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Notice: Non-clinical demonstration layout.</span>
        </div>
        {onOpenStagingGuide && (
          <button
            onClick={onOpenStagingGuide}
            className="text-teal-700 hover:text-teal-900 font-medium text-xs flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>F0–F4 Guide</span>
          </button>
        )}
      </div>
    </Card>
  );
};
