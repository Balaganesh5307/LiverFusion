import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { LOCAL_DATASET_STATS, METAVIR_STAGES } from '../../data/clinicalConstants';
import { ProgressBar } from '../ui/ProgressBar';
import { HardDrive, CheckCircle } from 'lucide-react';

export const DatasetBreakdown: React.FC = () => {
  return (
    <Card className="border-slate-200/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <HardDrive className="h-4 w-4" />
            </div>
            <CardTitle>Local Ultrasound Dataset Verification</CardTitle>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <CheckCircle className="h-3 w-3" />
            6,323 Files Verified
          </span>
        </div>
        <CardDescription>
          Physical filesystem inspection of the <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">Dataset/</code> directory. Primary training cohort for the upcoming PyTorch ResNet50 model.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {LOCAL_DATASET_STATS.classes.map((cls) => {
            const meta = METAVIR_STAGES[cls.stage];
            return (
              <div 
                key={cls.stage} 
                className={`p-3.5 rounded-xl border ${meta.color.bg} ${meta.color.border} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-base font-bold ${meta.color.text}`}>{cls.stage}</span>
                    <span className="text-[11px] font-bold text-slate-700">{cls.count} scans</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 leading-snug">{meta.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cls.percent}% of cohort</div>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    value={cls.percent * 2.5}
                    colorClass={
                      cls.stage === 'F0' ? 'bg-emerald-500' :
                      cls.stage === 'F1' ? 'bg-teal-500' :
                      cls.stage === 'F2' ? 'bg-blue-500' :
                      cls.stage === 'F3' ? 'bg-amber-500' : 'bg-rose-500'
                    }
                    heightClass="h-1.5"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 gap-2">
          <div>
            <strong className="text-slate-800">Class Distribution:</strong> F0 normal tissue (33.4%) and F4 established cirrhosis (26.9%) form dominant poles, with intermediate stages F1–F3 representing early fibrotic progression.
          </div>
          <div className="shrink-0 text-[11px] text-amber-700 font-medium">
            *Clinical ground-truth validation advised before production training.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
