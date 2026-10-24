import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

interface DataPoint {
  name: string;
  value: number;
  count: string;
  color: string;
  status: string;
}

const MODALITY_DATA: DataPoint[] = [
  { name: 'Ultrasound (B-Mode)', value: 82, count: '6,323 scans', color: '#0d9488', status: 'Active (F0–F4)' },
  { name: 'Computed Tomography (CT)', value: 10, count: '780 scans', color: '#3b82f6', status: 'Planned Modality' },
  { name: 'Magnetic Resonance (MRI)', value: 5, count: '390 scans', color: '#8b5cf6', status: 'Phase 2 NIfTI' },
  { name: 'Histopathology Biopsy', value: 3, count: '235 slides', color: '#f59e0b', status: 'Ground Truth' },
];

export const ModalityDistributionChart: React.FC = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Imaging Modality Distribution</CardTitle>
          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Prototype Demo Ratio
          </span>
        </div>
        <CardDescription>
          Distribution of imaging modalities in the planned research pipeline. Current Phase 1 active dataset is Ultrasound (6,323 scans).
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MODALITY_DATA}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {MODALITY_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DataPoint;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1">
                        <div className="font-semibold text-slate-800">{data.name}</div>
                        <div className="text-teal-600 font-medium">
                          {data.value}% ({data.count})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Status: <span className="font-medium text-slate-700">{data.status}</span>
                        </div>
                        <div className="text-[10px] text-amber-600 italic">
                          (Demonstration data ratio)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 mt-2">
          <strong className="text-slate-800 font-semibold">Active Dataset Focus:</strong> Initial deep learning models focus on the <strong>6,323 liver ultrasound</strong> scans currently in the workspace. CT and MRI modalities remain labeled as planned features.
        </div>
      </CardContent>
    </Card>
  );
};
