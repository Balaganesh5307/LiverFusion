"use client";

import { useState } from "react";
import { PredictResult, ModelInfo } from "@/types";
import { UI_CONFIG } from "@/config/uiConfig";
import DemoBanner from "@/components/DemoBanner";
import ReportModal, { ReportData } from "@/components/ReportModal";

interface ResultsDashboardProps {
  result: PredictResult;
  modelInfo?: ModelInfo;
  rawImagePreviewUrl: string | null;
  onReset: () => void;
}

export default function ResultsDashboard({
  result,
  modelInfo,
  rawImagePreviewUrl,
  onReset,
}: ResultsDashboardProps) {
  const [viewMode, setViewMode] = useState<"composite" | "saliency" | "raw">("composite");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const stageDescription =
    UI_CONFIG.stageDescriptions[result.stage] || `Predicted Stage ${result.stage}`;

  const classList = Object.keys(result.probabilities).sort();

  const reportData: ReportData = {
    id: result.id,
    timestamp: result.timestamp || new Date().toISOString(),
    model_id: result.model_id,
    predicted_stage: result.stage,
    probabilities: result.probabilities,
    color_warning: result.color_warning,
    low_confidence: result.low_confidence,
    rawImagePreviewUrl,
    saliency_png_base64: result.saliency_png_base64,
  };


  return (
    <div className="space-y-6">
      {/* Demo Banner when result is demo */}
      {result.demo && <DemoBanner visible={true} />}

      {/* Color Heuristic Warning */}
      {result.color_warning && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-md"
        >
          <svg
            className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 font-medium leading-relaxed">
            {result.color_warning}
          </div>
        </div>
      )}

      {/* Low Confidence Notice */}
      {result.low_confidence && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-orange-950/40 border border-orange-600/60 text-orange-200 text-xs sm:text-sm flex items-start gap-3 shadow-md"
        >
          <svg
            className="w-5 h-5 text-orange-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1 font-medium leading-relaxed">
            Notice: Low Model Confidence — Maximum predicted probability is below the configured threshold
            {result.confidence_threshold !== null && result.confidence_threshold !== undefined && ` (${(result.confidence_threshold * 100).toFixed(0)}%)`}.
          </div>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-slate-400">
              Evaluation Model Used:
            </span>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
              {modelInfo?.name || result.model_id}
            </span>
            {result.demo && (
              <span className="text-[10px] font-bold text-red-200 bg-red-950 px-2 py-0.5 rounded-full border border-red-700">
                Demo Output
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Modality: Ultrasound (Grayscale B-Mode) • Real Checkpoint Inference
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Export PDF Report
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Evaluate Another Image
          </button>
        </div>
      </div>


      {/* Main Grid: Predictions & Probabilities + Saliency Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Predicted Stage & Probabilities */}
        <div className="lg:col-span-6 space-y-6">
          {/* Predicted Stage Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Model Output
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Classification Head
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Predicted Stage</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-extrabold text-cyan-400 tracking-tight">
                  {result.stage}
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  {stageDescription}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              Stage index determined by argmax probability over the model prediction vector.
            </div>
          </div>

          {/* Probability Distribution Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Stage Class Probabilities
              </span>
              <span className="text-xs text-slate-400">Softmax Normalized</span>
            </div>

            <div className="space-y-3 pt-1">
              {classList.map((cls) => {
                const prob = result.probabilities[cls] || 0;
                const percentage = (prob * 100).toFixed(1);
                const isTop = cls === result.stage;

                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-semibold ${isTop ? "text-cyan-300" : "text-slate-400"}`}>
                        Stage {cls}
                      </span>
                      <span className={`font-mono ${isTop ? "font-bold text-cyan-300" : "text-slate-400"}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                            : "bg-slate-700"
                        }`}
                        style={{ width: `${Math.max(Number(percentage), 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Saliency Explanation Overlay */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Explainability Saliency Overlay
                </span>
                <p className="text-[11px] text-slate-400">
                  Feature attribution indicating regions contributing to the predicted stage
                </p>
              </div>

              {/* View Mode Selector Tabs */}
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("composite")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                    viewMode === "composite"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Composite
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("saliency")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                    viewMode === "saliency"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                    viewMode === "raw"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Raw Image
                </button>
              </div>
            </div>

            {/* Viewer Canvas */}
            <div className="relative aspect-square max-h-[360px] w-full rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center mx-auto">
              {/* Raw Ultrasound Layer */}
              {rawImagePreviewUrl && (viewMode === "composite" || viewMode === "raw") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rawImagePreviewUrl}
                  alt="Raw ultrasound"
                  className="absolute inset-0 w-full h-full object-contain filter grayscale"
                />
              )}

              {/* Saliency Overlay Layer */}
              {result.saliency_png_base64 && (viewMode === "composite" || viewMode === "saliency") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${result.saliency_png_base64}`}
                  alt="Saliency heatmap overlay"
                  style={{
                    opacity: viewMode === "composite" ? overlayOpacity : 1.0,
                  }}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150 mix-blend-screen"
                />
              )}

              {!result.saliency_png_base64 && viewMode !== "raw" && (
                <div className="text-xs text-slate-500">
                  Saliency map not available for this model run.
                </div>
              )}
            </div>

            {/* Opacity Slider for Composite Mode */}
            {viewMode === "composite" && result.saliency_png_base64 && (
              <div className="pt-2 flex items-center gap-3">
                <label
                  htmlFor="opacity-slider"
                  className="text-xs font-medium text-slate-400 shrink-0"
                >
                  Overlay Opacity:
                </label>
                <input
                  id="opacity-slider"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400 w-9 text-right">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Export Modal */}
      <ReportModal
        data={reportData}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}

