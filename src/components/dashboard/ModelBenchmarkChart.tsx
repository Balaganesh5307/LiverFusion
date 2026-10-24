import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { MODEL_BENCHMARKS } from '../../data/clinicalConstants';

export const ModelBenchmarkChart: React.FC = () => {
  const chartData = MODEL_BENCHMARKS.map((m) => ({
    name: m.id === 'resnet50' ? 'ResNet50' : m.id === 'cnn' ? 'Standard CNN' : m.id === 'vit' ? 'ViT-B/16' : 'Hybrid Fusion',
    accuracy: m.accuracy,
    sensitivity: m.sensitivity,
    specificity: m.specificity,
    auc: (m.auc * 100),
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Model Architecture Target Benchmarks</CardTitle>
          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Target / Literature Benchmarks
          </span>
        </div>
        <CardDescription>
          Comparison of baseline CNN, primary ResNet50, Vision Transformer, and proposed Deep Fusion architecture (Evaluation Metric Targets in %).
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1">
                        <div className="font-semibold text-slate-800">{label}</div>
                        {payload.map((item, idx) => (
                          <div key={idx} className="flex justify-between gap-4">
                            <span style={{ color: item.color }}>{item.name}:</span>
                            <span className="font-semibold">{item.value}%</span>
                          </div>
                        ))}
                        <div className="text-[10px] text-amber-600 italic border-t border-slate-100 pt-1 mt-1">
                          Benchmark targets — not actual trained run metrics
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span className="text-slate-700">{value}</span>}
              />
              <Bar dataKey="accuracy" name="Accuracy" fill="#0f172a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sensitivity" name="Sensitivity" fill="#0d9488" radius={[3, 3, 0, 0]} />
              <Bar dataKey="specificity" name="Specificity" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="auc" name="AUC (scaled %)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 mt-2">
          <strong>Validation Protocol:</strong> PyTorch training pipeline in Phase 2 will replace these benchmark literature targets with authentic 5-fold cross-validation metrics trained on the 6,323 ultrasound images.
        </div>
      </CardContent>
    </Card>
  );
};
