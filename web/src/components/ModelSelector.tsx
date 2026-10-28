"use client";

import { ModelInfo } from "@/types";

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModelId: (id: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export default function ModelSelector({
  models,
  selectedModelId,
  onSelectModelId,
  isLoading,
  error,
}: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="model-select"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          2. Select Model Architecture
        </label>
        <span className="text-[11px] text-slate-400">
          {models.length} model{models.length === 1 ? "" : "s"} available
        </span>
      </div>

      {isLoading ? (
        <div className="h-11 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center px-4 text-xs text-slate-500">
          Discovering available models...
        </div>
      ) : error ? (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
          <span>Failed to load models: {error}</span>
        </div>
      ) : models.length === 0 ? (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-amber-400 shrink-0"
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
            <span className="font-medium">No trained model available</span>
          </div>
          <span className="text-[10px] text-slate-400">Checkpoints required</span>
        </div>
      ) : (
        <div className="relative">
          <select
            id="model-select"
            value={selectedModelId}
            onChange={(e) => onSelectModelId(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-500 cursor-pointer transition-colors pr-10"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                {m.name} ({m.modality})
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
