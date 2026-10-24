import React from 'react';
import { 
  LayoutDashboard, 
  Scan, 
  FileBarChart2, 
  Layers, 
  History, 
  Info, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { cn } from '../../utils/cn';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    {
      id: 'dashboard',
      label: 'Clinical Dashboard',
      icon: LayoutDashboard,
      description: 'System overview & metrics',
    },
    {
      id: 'analyze',
      label: 'Image Analysis',
      icon: Scan,
      description: 'Upload & model selection',
    },
    {
      id: 'results',
      label: 'Analysis Results',
      icon: FileBarChart2,
      description: 'Staging & explainability layout',
    },
    {
      id: 'models',
      label: 'Model Comparison',
      icon: Layers,
      description: 'ResNet50, CNN, ViT & Fusion',
    },
    {
      id: 'history',
      label: 'Analysis History',
      icon: History,
      description: 'Previous scan records',
    },
    {
      id: 'about',
      label: 'About Project',
      icon: Info,
      description: 'Methodology & architecture',
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200 w-64 lg:w-72">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Research Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group',
                    isActive
                      ? 'bg-slate-900 text-white font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div
                        className={cn(
                          'text-[10px] leading-tight mt-0.5',
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 transition-transform opacity-40 group-hover:opacity-100',
                      isActive ? 'text-teal-300 translate-x-0.5' : 'text-slate-400'
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dataset Quick Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>Verified Dataset</span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
              Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Ultrasound cohort: <strong>6,323 scans</strong> categorized across stages F0 through F4.
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            Target: PyTorch ResNet50 Classifier
          </div>
        </div>
      </div>

      {/* Strict Clinical Disclaimer Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Research Disclaimer</span>
          </div>
          <p className="text-[10px] leading-relaxed text-amber-800">
            Research prototype only. Not intended for clinical diagnosis. No real predictions generated without backend.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
