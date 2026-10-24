import React from 'react';
import { 
  Activity, 
  Layers, 
  Cpu, 
  HardDrive, 
  ArrowRight, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { DatasetBreakdown } from '../components/dashboard/DatasetBreakdown';
import { ModalityDistributionChart } from '../components/dashboard/ModalityDistributionChart';
import { ModelBenchmarkChart } from '../components/dashboard/ModelBenchmarkChart';
import { RecentActivityTable } from '../components/dashboard/RecentActivityTable';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { AnalysisRecord, NavigationTab } from '../types';

interface DashboardProps {
  onNavigateTab: (tab: NavigationTab) => void;
  recentRecords: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onOpenStagingGuide: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateTab,
  recentRecords,
  onSelectRecord,
  onOpenStagingGuide,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome & Objective Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Research Objective
            </span>
            <span className="text-xs text-slate-400 font-mono">Phase 1 Frontend Prototype</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Multimodal Deep Fusion Networks for Cirrhosis Staging
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Automated detection and METAVIR staging (F0–F4) of liver fibrosis from clinical imaging. 
            Groundwork established on <strong>6,323 verified ultrasound scans</strong>, priming the upcoming PyTorch ResNet50 training pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={onOpenStagingGuide}
            className="text-xs"
          >
            <BookOpen className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>METAVIR Guide</span>
          </Button>

          <Button
            variant="teal"
            size="md"
            onClick={() => onNavigateTab('analyze')}
            className="text-xs"
          >
            <Activity className="w-4 h-4 mr-1.5" />
            <span>Start Scan Analysis</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Mandatory Demo / Non-Clinical Alert */}
      <Alert variant="warning" title="Demonstration Data Identification Notice">
        All figures, confidence distributions, and benchmark curves shown on this dashboard are <strong>demonstration targets</strong> for frontend architecture validation. No actual clinical diagnoses are produced. Real AI model inference will be enabled after PyTorch backend and model weights are integrated.
      </Alert>

      {/* 4 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Ultrasound Cohort"
          value="6,323"
          subtitle="Physical scans organized F0–F4"
          badgeText="Local Dataset"
          badgeVariant="teal"
          icon={HardDrive}
          iconBg="bg-teal-50"
          iconColor="text-teal-700"
          isDemo={false}
        />

        <StatCard
          title="Architectures Configured"
          value="4 Models"
          subtitle="ResNet50, CNN, ViT & Deep Fusion"
          badgeText="1 Active Target"
          badgeVariant="stage"
          icon={Layers}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
          isDemo={false}
        />

        <StatCard
          title="Target Staging Accuracy"
          value="96.5%"
          subtitle="Multimodal Deep Fusion target"
          badgeText="Literature Target"
          badgeVariant="warning"
          icon={Sparkles}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          isDemo={true}
        />

        <StatCard
          title="Primary Training Target"
          value="ResNet50"
          subtitle="PyTorch Residual CNN baseline"
          badgeText="Ultrasound Focus"
          badgeVariant="teal"
          icon={Cpu}
          iconBg="bg-slate-100"
          iconColor="text-slate-800"
          isDemo={false}
        />
      </div>

      {/* Local Dataset Verification Breakdown */}
      <DatasetBreakdown />

      {/* Two Column Charts: Modality Distribution + Model Benchmark Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ModalityDistributionChart />
        </div>
        <div className="lg:col-span-7">
          <ModelBenchmarkChart />
        </div>
      </div>

      {/* Recent Analysis Activity Table */}
      <RecentActivityTable
        records={recentRecords}
        onNavigateTab={onNavigateTab}
        onSelectRecordForView={onSelectRecord}
      />
    </div>
  );
};
