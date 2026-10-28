"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HistoryRecord } from "@/types";
import { UI_CONFIG } from "@/config/uiConfig";
import ReportModal, { ReportData } from "@/components/ReportModal";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [modelFilter, setModelFilter] = useState<string>("ALL");

  // Report Modal State
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/history");
      if (!res.ok) {
        throw new Error(`Failed to load history (Status ${res.status})`);
      }
      const data: HistoryRecord[] = await res.json();
      setHistory(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to history service";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openReport = (rec: HistoryRecord) => {
    setSelectedReport({
      id: rec.id,
      timestamp: rec.timestamp,
      model_id: rec.model_id,
      predicted_stage: rec.predicted_stage,
      probabilities: rec.probabilities,
      color_warning: rec.color_warning,
      low_confidence: rec.low_confidence,
    });
    setIsReportOpen(true);
  };

  // Filtered records
  const filteredHistory = history.filter((rec) => {
    const matchStage = stageFilter === "ALL" || rec.predicted_stage === stageFilter;
    const matchModel = modelFilter === "ALL" || rec.model_id === modelFilter;
    return matchStage && matchModel;
  });

  // Summary statistics
  const totalCount = history.length;
  const stageCounts: Record<string, number> = { F0: 0, F1: 0, F2: 0, F3: 0, F4: 0 };
  let sigCount = 0;

  history.forEach((rec) => {
    if (stageCounts[rec.predicted_stage] !== undefined) {
      stageCounts[rec.predicted_stage] += 1;
    }
    const num = parseInt(rec.predicted_stage.replace(/\D/g, ""), 10) || 0;
    if (num >= 2) sigCount += 1;
  });

  const modelLabels: Record<string, string> = {
    resnet50: "ResNet-50",
    vit_b16: "ViT-B/16",
    fusion: "Dual-Branch Fusion",
    fusion_gated: "Gated Fusion",
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-medium mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              MongoDB Metadata Archive
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Analysis History & Reports
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Historical metadata store (timestamp, model ID, predicted stage, probabilities).
              Uploaded ultrasound images are strictly volatile and are NEVER persisted to disk or database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`}
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
              <span>Refresh</span>
            </button>

            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Evaluation</span>
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg"
          >
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Database History Error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Total Recorded Runs
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Metadata only (no images)
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Significant Fibrosis (≥ F2)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">
              {totalCount > 0 ? `${((sigCount / totalCount) * 100).toFixed(0)}%` : "0%"}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {sigCount} of {totalCount} evaluations
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Normal Staging (F0)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
              {stageCounts["F0"]}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              No fibrosis observed
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Cirrhosis Staging (F4)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 block">
              {stageCounts["F4"]}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Severe architectural disruption
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Filter Stage:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {["ALL", "F0", "F1", "F2", "F3", "F4"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStageFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      stageFilter === st
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Filter Model:</span>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <option value="ALL">All Models</option>
                <option value="resnet50">ResNet-50</option>
                <option value="vit_b16">ViT-B/16</option>
                <option value="fusion">Dual-Branch Fusion</option>
                <option value="fusion_gated">Gated Fusion</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredHistory.length}</strong> of{" "}
            <strong className="text-white">{totalCount}</strong> runs
          </div>
        </div>

        {/* Main Records List / Empty State */}
        {loading && history.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/80 space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading analysis metadata archive...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/80 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">
                {totalCount === 0 ? "No Evaluation Runs Recorded Yet" : "No Matching Records"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {totalCount === 0
                  ? "When you perform ultrasound evaluations on the homepage, the result metadata is automatically logged here."
                  : "Try clearing your stage or model filters to view recorded evaluations."}
              </p>
            </div>
            {totalCount === 0 && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
              >
                Perform First Evaluation
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((rec) => {
              const dateObj = new Date(rec.timestamp);
              const formattedTime = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : rec.timestamp;

              const stageColorMap: Record<string, string> = {
                F0: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
                F1: "text-teal-400 bg-teal-950/60 border-teal-800/60",
                F2: "text-amber-400 bg-amber-950/60 border-amber-800/60",
                F3: "text-orange-400 bg-orange-950/60 border-orange-800/60",
                F4: "text-rose-400 bg-rose-950/60 border-rose-800/60",
              };

              const stageColor =
                stageColorMap[rec.predicted_stage] ||
                "text-cyan-400 bg-cyan-950/60 border-cyan-800/60";

              const maxProb = rec.probabilities[rec.predicted_stage] || 0;

              return (
                <div
                  key={rec.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className={`text-xl font-black px-3 py-1 rounded-xl border ${stageColor}`}
                      >
                        {rec.predicted_stage}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {UI_CONFIG.stageDescriptions[rec.predicted_stage] ||
                              `Predicted Stage ${rec.predicted_stage}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{formattedTime}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            ID: {rec.id.substring(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => openReport(rec)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                        <span>Export PDF Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata & Probabilities Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Model:</span>
                        <span className="font-semibold text-cyan-300">
                          {modelLabels[rec.model_id] || rec.model_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Peak Confidence:</span>
                        <span className="font-semibold text-slate-200">
                          {(maxProb * 100).toFixed(1)}%
                        </span>
                      </div>
                      {/* Warnings Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rec.color_warning && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
                            Color Heuristic Notice
                          </span>
                        )}
                        {rec.low_confidence && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-800/60 font-medium">
                            Low Confidence Notice
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Probability Distribution mini-bars */}
                    <div className="md:col-span-8 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Probability Breakdown (F0 – F4)
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {["F0", "F1", "F2", "F3", "F4"].map((st) => {
                          const p = rec.probabilities[st] || 0;
                          const pct = (p * 100).toFixed(1);
                          const isLead = st === rec.predicted_stage;

                          return (
                            <div key={st} className="space-y-1 text-center">
                              <div className="flex justify-between items-baseline text-[10px] font-mono px-0.5">
                                <span className={isLead ? "font-bold text-cyan-400" : "text-slate-400"}>
                                  {st}
                                </span>
                                <span className={isLead ? "font-bold text-slate-200" : "text-slate-500"}>
                                  {pct}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isLead ? "bg-cyan-400" : "bg-slate-700"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF Export Modal */}
      <ReportModal
        data={selectedReport}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
