import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 md:px-6 text-xs text-slate-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <span className="font-semibold text-slate-800">LiverFusion AI</span> — Multimodal Deep Fusion Networks for Automated Detection and Staging of Liver Cirrhosis
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Phase 1 Frontend Architecture</span>
          <span>•</span>
          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Research Prototype Only • Not for Clinical Diagnosis
          </span>
        </div>
      </div>
    </footer>
  );
};
