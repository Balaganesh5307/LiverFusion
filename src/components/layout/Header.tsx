import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  HelpCircle, 
  Menu,
  HardDrive
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { apiService, BackendHealthResponse } from '../../services/api';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenStagingGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleMobileSidebar,
  onOpenStagingGuide 
}) => {
  const [backendStatus, setBackendStatus] = useState<BackendHealthResponse>({
    status: 'offline',
    message: 'FastAPI backend offline (Phase 1 Frontend Prototype)',
  });

  useEffect(() => {
    // Check backend status silently
    apiService.checkBackendHealth().then((status) => {
      setBackendStatus(status);
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-teal-400 shadow-sm ring-1 ring-slate-900/10">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">LiverFusion</span>
              <span className="font-semibold text-teal-600 text-base tracking-tight">AI</span>
              <Badge variant="navy" size="sm" className="hidden sm:inline-flex text-[10px] uppercase font-mono px-1.5 py-0">
                Phase 1 Prototype
              </Badge>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-normal">
              Cirrhosis Staging & Multimodal Deep Fusion Research Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Backend status indicator */}
        <div 
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600"
          title={backendStatus.message}
        >
          <Server className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Backend:</span>
          <span className="inline-flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${backendStatus.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-medium text-slate-700">
              {backendStatus.status === 'online' ? 'PyTorch Active' : 'Phase 1 Local'}
            </span>
          </span>
        </div>

        {/* Dataset tag */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-teal-200/80 bg-teal-50/70 text-teal-800 font-medium">
          <HardDrive className="h-3.5 w-3.5 text-teal-600" />
          <span>6,323 Ultrasound Scans (F0–F4)</span>
        </div>

        {/* Staging Guide Quick Button */}
        <button
          onClick={onOpenStagingGuide}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors shadow-sm"
          title="View METAVIR Fibrosis Staging Criteria Reference"
        >
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden md:inline">METAVIR Guide</span>
        </button>
      </div>
    </header>
  );
};
