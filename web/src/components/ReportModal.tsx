"use client";

import { useEffect } from "react";
import { UI_CONFIG } from "@/config/uiConfig";

export interface ReportData {
  id?: string;
  timestamp: string;
  model_id: string;
  predicted_stage: string;
  probabilities: Record<string, number>;
  color_warning?: string | null;
  low_confidence?: boolean;
  rawImagePreviewUrl?: string | null;
  saliency_png_base64?: string | null;
}

interface ReportModalProps {
  data: ReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ data, isOpen, onClose }: ReportModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = data.timestamp
    ? new Date(data.timestamp).toLocaleString("en-US", {
        timeZoneName: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toISOString();

  const stageDesc =
    UI_CONFIG.stageDescriptions[data.predicted_stage] ||
    `Predicted Stage ${data.predicted_stage}`;

  const stageNumber = parseInt(data.predicted_stage.replace(/\D/g, ""), 10) || 0;
  const isSignificant = stageNumber >= 2;
  const isAdvanced = stageNumber >= 3;
  const isCirrhosis = stageNumber === 4;

  const modelLabels: Record<string, string> = {
    resnet50: "ResNet-50 (Convolutional Baseline)",
    vit_b16: "Vision Transformer ViT-B/16",
    fusion: "Dual-Branch Fusion (ResNet-50 + ViT-B/16)",
    fusion_gated: "Gated Fusion Network (Ablation Variant)",
  };

  const modelDisplayName = modelLabels[data.model_id] || data.model_id;

  const sortedClasses = Object.keys(data.probabilities).sort();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:block">
      {/* Container Dialog */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Top Control Bar (Screen only) */}
        <div className="no-print p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-bold text-slate-200">
              Analysis Report Export
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <svg
                className="w-4 h-4"
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
              <span>Export / Print PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 bg-slate-900 print:bg-white print:text-black print:p-0 print:overflow-visible">
          {/* 1. Header Banner */}
          <div className="border-b-2 border-slate-700 print:border-black pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white print:text-black">
                    LIVERFUSION AI
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 print:bg-slate-200 text-cyan-400 print:text-black font-bold uppercase tracking-wider border border-cyan-800/60 print:border-slate-400">
                    Research Prototype
                  </span>
                </div>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-1 font-medium">
                  Ultrasound Liver Fibrosis Staging Analysis Report
                </p>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-400 print:text-slate-700">
                <div>Ref: {data.id ? data.id.substring(0, 16) : "EPHEMERAL_RUN"}</div>
                <div>Date: {formattedDate}</div>
              </div>
            </div>
          </div>

          {/* 2. Mandatory Prominent Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 print:bg-slate-100 print:border-amber-600 print:text-amber-900">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <svg
                className="w-5 h-5 text-amber-400 shrink-0"
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
              Research prototype. Not for clinical diagnosis.
            </div>
            <p className="text-xs mt-1.5 leading-relaxed font-medium">
              This automated analysis is produced by a research machine learning model.
              It is NOT cleared by any health authority, does NOT represent a medical diagnosis,
              and MUST NOT be used for patient management or clinical treatment decisions.
            </p>
          </div>

          {/* 3. Evaluation Context Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-500 uppercase tracking-wider block font-semibold">
                Modality
              </span>
              <span className="font-bold text-slate-200 print:text-black mt-0.5 block">
                Ultrasound (B-Mode)
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-500 uppercase tracking-wider block font-semibold">
                Model Architecture
              </span>
              <span className="font-bold text-slate-200 print:text-black mt-0.5 block">
                {modelDisplayName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-500 uppercase tracking-wider block font-semibold">
                Heuristic Check
              </span>
              <span
                className={`font-bold mt-0.5 block ${
                  data.color_warning ? "text-amber-400 print:text-amber-700" : "text-emerald-400 print:text-emerald-700"
                }`}
              >
                {data.color_warning ? "Color Notice" : "Grayscale Valid"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-500 uppercase tracking-wider block font-semibold">
                Model Confidence
              </span>
              <span
                className={`font-bold mt-0.5 block ${
                  data.low_confidence ? "text-orange-400 print:text-orange-700" : "text-cyan-400 print:text-cyan-700"
                }`}
              >
                {data.low_confidence ? "Low Confidence" : "Standard"}
              </span>
            </div>
          </div>

          {/* 4. Primary Finding (Predicted Stage) */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 print:from-slate-100 print:to-slate-100 border border-slate-800 print:border-slate-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 print:text-slate-600 block mb-1">
                  Model Output Staging
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-cyan-400 print:text-blue-700">
                    {data.predicted_stage}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white print:text-black">
                      {stageDesc}
                    </h3>
                    <p className="text-xs text-slate-400 print:text-slate-600">
                      METAVIR Fibrosis Staging Classification
                    </p>
                  </div>
                </div>
              </div>

              {/* Binary Threshold Indicators */}
              <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSignificant ? "bg-amber-400 print:bg-amber-600" : "bg-emerald-400 print:bg-emerald-600"
                    }`}
                  />
                  <span className="font-medium text-slate-300 print:text-black">
                    Significant Fibrosis (≥ F2):{" "}
                    <strong>{isSignificant ? "Indicated" : "Not Indicated"}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAdvanced ? "bg-orange-400 print:bg-orange-600" : "bg-emerald-400 print:bg-emerald-600"
                    }`}
                  />
                  <span className="font-medium text-slate-300 print:text-black">
                    Advanced Fibrosis (≥ F3):{" "}
                    <strong>{isAdvanced ? "Indicated" : "Not Indicated"}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCirrhosis ? "bg-red-500 print:bg-red-700" : "bg-emerald-400 print:bg-emerald-600"
                    }`}
                  />
                  <span className="font-medium text-slate-300 print:text-black">
                    Cirrhosis (F4):{" "}
                    <strong>{isCirrhosis ? "Indicated" : "Not Indicated"}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Complete Predicted Probability Distribution */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 print:text-slate-700 tracking-wider">
              Class Probability Distribution
            </h4>
            <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-slate-700 font-semibold border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Stage</th>
                    <th className="py-2.5 px-4">Clinical METAVIR Definition</th>
                    <th className="py-2.5 px-4 text-right">Probability</th>
                    <th className="py-2.5 px-4 w-1/3">Visual Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {sortedClasses.map((cls) => {
                    const prob = data.probabilities[cls] || 0;
                    const percent = (prob * 100).toFixed(1);
                    const isWinner = cls === data.predicted_stage;

                    return (
                      <tr
                        key={cls}
                        className={
                          isWinner
                            ? "bg-cyan-500/10 print:bg-blue-50 font-semibold"
                            : "bg-slate-900/40 print:bg-white"
                        }
                      >
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              isWinner
                                ? "bg-cyan-400 text-slate-950"
                                : "bg-slate-800 print:bg-slate-200 text-slate-300 print:text-slate-800"
                            }`}
                          >
                            {cls}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 print:text-slate-800">
                          {UI_CONFIG.stageDescriptions[cls] || cls}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-200 print:text-black">
                          {percent}%
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="w-full bg-slate-800 print:bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isWinner
                                  ? "bg-cyan-400 print:bg-blue-600"
                                  : "bg-slate-500 print:bg-slate-400"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Saliency Overlay (if available in active session) */}
          {(data.rawImagePreviewUrl || data.saliency_png_base64) && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase font-bold text-slate-400 print:text-slate-700 tracking-wider">
                Explainability & Spatial Saliency Visualizations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.rawImagePreviewUrl && (
                  <div className="p-3 rounded-xl bg-slate-950/70 print:bg-slate-100 border border-slate-800 print:border-slate-300 flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-slate-400 print:text-slate-600 mb-2">
                      Input B-Mode Ultrasound
                    </span>
                    <div className="w-full aspect-square max-h-48 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={data.rawImagePreviewUrl}
                        alt="Input ultrasound"
                        className="w-full h-full object-contain filter grayscale"
                      />
                    </div>
                  </div>
                )}
                {data.saliency_png_base64 && (
                  <div className="p-3 rounded-xl bg-slate-950/70 print:bg-slate-100 border border-slate-800 print:border-slate-300 flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-slate-400 print:text-slate-600 mb-2">
                      Model Saliency Heatmap Overlay
                    </span>
                    <div className="w-full aspect-square max-h-48 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${data.saliency_png_base64}`}
                        alt="Saliency Heatmap"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 print:text-slate-600 italic">
                Explainability heatmap reflects localized gradient-weighted activation mapping.
                Not intended as anatomical segmentation.
              </p>
            </div>
          )}

          {/* 7. Heuristic Warning Details (if any) */}
          {data.color_warning && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 print:bg-amber-50 border border-amber-600/40 text-amber-200 print:text-amber-900 text-xs">
              <span className="font-bold block mb-0.5">Input Heuristic Notice:</span>
              <span>{data.color_warning}</span>
            </div>
          )}

          {/* 8. Mandatory Footer Regulatory Notice */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-400 text-[10px] text-slate-400 print:text-slate-600 space-y-1 leading-relaxed">
            <p className="font-bold text-slate-300 print:text-black">
              REGULATORY & LEGAL NOTICE:
            </p>
            <p>
              LiverFusion AI is an academic research software prototype.
              It does not hold clearance, CE-mark, or certification from the FDA, EMA, or any national health agency.
              All classifications are experimental statistical predictions based on trained neural network weights.
              Under no circumstances should this document be used in clinical patient records, diagnostic reports,
              or for treatment determination.
            </p>
            <p className="text-slate-500 print:text-slate-500 pt-1">
              Generated via LiverFusion AI Architecture • Phase 7 Analysis & Metadata Export
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
