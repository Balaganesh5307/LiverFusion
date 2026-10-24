import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Layers, Sparkles, Sliders, AlertCircle } from 'lucide-react';

interface ExplainabilityViewerProps {
  imageSrc: string | null;
  fileName?: string;
  modelName: string;
}

export const ExplainabilityViewer: React.FC<ExplainabilityViewerProps> = ({
  imageSrc,
  fileName,
  modelName,
}) => {
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(65);
  const [viewMode, setViewMode] = useState<'overlay' | 'sideBySide'>('overlay');

  return (
    <Card className="border-slate-200/90 overflow-hidden">
      <CardHeader className="bg-slate-50/50 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Visual Explainability & Activation Maps
              </CardTitle>
              <Badge variant="teal" size="sm" className="font-mono text-[10px]">
                Grad-CAM / Attention
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeting: <span className="font-semibold text-slate-700">{modelName}</span> feature extraction maps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                viewMode === 'overlay'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setViewMode('sideBySide')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                viewMode === 'sideBySide'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Side-by-Side
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                heatmapEnabled
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{heatmapEnabled ? 'Explainability Map Active' : 'Show Original Scan'}</span>
            </button>
          </div>

          {heatmapEnabled && (
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600">Heatmap Intensity:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                className="w-24 accent-teal-600 cursor-pointer"
              />
              <span className="font-mono text-slate-800 w-8">{heatmapOpacity}%</span>
            </div>
          )}
        </div>

        {/* Viewport display */}
        {viewMode === 'overlay' ? (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[420px] p-2">
            {imageSrc ? (
              <div className="relative inline-block max-h-[400px]">
                <img
                  src={imageSrc}
                  alt={fileName || 'Ultrasound scan'}
                  className="max-h-[380px] object-contain rounded-lg"
                />

                {/* Simulated Grad-CAM Gradient Overlay (clearly annotated) */}
                {heatmapEnabled && (
                  <div
                    className="absolute inset-0 rounded-lg pointer-events-none mix-blend-screen transition-opacity duration-200"
                    style={{
                      opacity: heatmapOpacity / 100,
                      background: 'radial-gradient(ellipse at 48% 52%, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.7) 35%, rgba(16, 185, 129, 0.4) 65%, transparent 85%)',
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 space-y-2">
                <Layers className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">No scan currently uploaded. Sample display active.</p>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 border border-slate-700">
              Target Layer: ResNet50.layer4.conv3 [Simulated Grad-CAM]
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center min-h-[250px]">
              <span className="text-[11px] font-semibold text-slate-300 mb-2">Original Clinical Scan</span>
              {imageSrc ? (
                <img src={imageSrc} alt="Original" className="max-h-[220px] object-contain rounded" />
              ) : (
                <p className="text-xs text-slate-500">Scan not loaded</p>
              )}
            </div>

            <div className="bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center min-h-[250px] relative">
              <span className="text-[11px] font-semibold text-teal-300 mb-2">Activation Heatmap (Simulated)</span>
              {imageSrc ? (
                <div className="relative inline-block">
                  <img src={imageSrc} alt="Heatmap" className="max-h-[220px] object-contain rounded" />
                  <div
                    className="absolute inset-0 rounded pointer-events-none mix-blend-screen"
                    style={{
                      opacity: heatmapOpacity / 100,
                      background: 'radial-gradient(ellipse at 48% 52%, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.7) 35%, rgba(16, 185, 129, 0.4) 65%, transparent 85%)',
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500">Heatmap not loaded</p>
              )}
            </div>
          </div>
        )}

        {/* Explainability legend & findings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Parenchymal Coarseness</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-tight">
              Acoustic speckle heterogeneity in liver right lobe segment VI/VII.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Portal Tract Attenuation</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-tight">
              Fibrous expansion along periportal sheaths without dense nodularity.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Capsular Surface Contour</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-tight">
              Preserved hepatic surface smoothness without overt cirrhotic undulations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Disclaimer:</strong> This explainability heatmap is a frontend visualization template. 
            Real PyTorch Grad-CAM tensors will be computed dynamically upon backend integration.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
