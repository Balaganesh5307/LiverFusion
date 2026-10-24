import React from 'react';
import { HistoryTable } from '../components/history/HistoryTable';
import { AnalysisRecord, NavigationTab } from '../types';
import { Alert } from '../components/ui/Alert';

interface AnalysisHistoryProps {
  records: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onDeleteRecord: (id: string) => void;
  onResetDemoRecords: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onResetDemoRecords,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Audit & Session Logs
          </span>
          <span className="text-xs text-slate-400 font-mono">Phase 1 In-Memory Records</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          Clinical Scan Analysis Records
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Log of processed ultrasound scans, selected neural topologies, and simulated METAVIR classification outputs.
        </p>
      </div>

      {/* Persistence Disclaimer Alert */}
      <Alert variant="warning" title="Session Storage & Non-Persistent Database Notice">
        In this Phase 1 frontend prototype, analysis records are managed in your local browser session and 
        demonstration state. <strong>No cloud database or persistent medical records</strong> are connected yet. 
        Phase 2 will integrate a secure, HIPAA-compliant SQLite/PostgreSQL schema via FastAPI backend.
      </Alert>

      {/* Main Filterable History Table */}
      <HistoryTable
        records={records}
        onSelectRecord={(rec) => {
          onSelectRecord(rec);
          onNavigateTab('results');
        }}
        onDeleteRecord={onDeleteRecord}
        onResetDemoRecords={onResetDemoRecords}
      />
    </div>
  );
};
