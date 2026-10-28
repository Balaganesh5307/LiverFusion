"use client";

import { UI_CONFIG } from "@/config/uiConfig";
import { ModalityType } from "@/types";

interface ModalitySelectorProps {
  selectedModality: ModalityType;
  onSelectModality: (modality: ModalityType) => void;
}

export default function ModalitySelector({
  selectedModality,
  onSelectModality,
}: ModalitySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        1. Select Imaging Modality
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {UI_CONFIG.modalities.map((modality) => {
          const isSelected = selectedModality === modality.id;
          const isAvailable = modality.available;

          return (
            <button
              key={modality.id}
              type="button"
              disabled={!isAvailable}
              aria-disabled={!isAvailable}
              aria-pressed={isSelected}
              onClick={() => {
                if (isAvailable) onSelectModality(modality.id);
              }}
              className={`relative p-3.5 rounded-xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isSelected && isAvailable
                  ? "bg-cyan-950/40 border-cyan-500/70 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : isAvailable
                  ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                  : "bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  {modality.name}
                </span>
                {isAvailable ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                    {modality.unavailableReason || "Not available yet"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {modality.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
