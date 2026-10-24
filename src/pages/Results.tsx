import React, { useState } from 'react';
import { AnalysisResult, FibrosisStage, NavigationTab } from '../types';
import { FibrosisStageCard } from '../components/results/FibrosisStageCard';
import { ConfidenceDistribution } from '../components/results/ConfidenceDistribution';
import { ExplainabilityViewer } from '../components/results/ExplainabilityViewer';
import { MetricsOverview } from '../components/results/MetricsOverview';
import { ClinicalReportModal } from '../components/results/ClinicalReportModal';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { 
  Download, 
  Upload, 
  RotateCcw
} from 'lucide-react';

interface ResultsProps {
  currentResult: AnalysisResult | null;
  uploadedImageUrl: string | null;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenStagingGuide: () => void;
}

// Default demonstration result when no image was uploaded in current session
const DEFAULT_DEMO_RESULT: AnalysisResult = {
  id: 'LFA-US-2026-0041',
  scanId: 'LFA-US-2026-0041',
  timestamp: '2026-10-24 11:20 AM',
  fileName: 'liver_us_patient_084_subcostal.jpg',
  fileSizeFormatted: '1.42 MB',
  imageDimensions: '768 × 576 px',
  modality: 'ultrasound',
  model: 'resnet50',
  predictedStage: 'F2',
  top1Confidence: 0.884,
  isDemonstrationData: true,
  status: 'completed',
  confidenceScores: [
    { stage: 'F0', label: 'Stage F0 (Normal)', probability: 0.021 },
    { stage: 'F1', label: 'Stage F1 (Mild)', probability: 0.068 },
    { stage: 'F2', label: 'Stage F2 (Moderate)', probability: 0.884, isTopChoice: true },
    { stage: 'F3', label: 'Stage F3 (Severe)', probability: 0.022 },
    { stage: 'F4', label: 'Stage F4 (Cirrhosis)', probability: 0.005 },
  ],
  explainability: {
    method: 'Grad-CAM',
    heatmapAvailable: true,
    description: 'Acoustic speckle gradient localized in liver right lobe parenchymal segment VI.',
    focusAreas: ['Parenchymal coarseness', 'Portal tract attenuation', 'Capsular contour'],
  },
};

export const Results: React.FC<ResultsProps> = ({
  currentResult,
  uploadedImageUrl,
  onNavigateTab,
  onOpenStagingGuide,
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedDemoStage, setSelectedDemoStage] = useState<FibrosisStage>('F2');

  const activeResult = currentResult || {
    ...DEFAULT_DEMO_RESULT,
    predictedStage: selectedDemoStage,
  };

  const displayImage = uploadedImageUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Diagnostic Visualization
            </span>
            <Badge variant="warning" size="sm" className="font-mono text-[10px]">
              Template Preview Layout
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Staging Assessment & Visual Explainability
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Standardized presentation layout for deep learning classification, METAVIR staging score, 
            per-class probability distribution, and Grad-CAM activation maps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateTab('analyze')}
            className="text-xs"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>Upload New Scan</span>
          </Button>

          <Button
            variant="teal"
            size="md"
            onClick={() => setIsReportOpen(true)}
            className="text-xs"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Generate Clinical Report</span>
          </Button>
        </div>
      </div>

      {/* Mandatory Non-Clinical Prediction Disclaimer */}
      <Alert variant="warning" title="Clinical Protocol Notice: Prototype Placeholders Only">
        The staging results, probability percentages, and activation heatmaps shown below are <strong>frontend layout placeholders</strong>. 
        They do not represent real medical findings or automated predictions for this image. 
        Real inference outputs will be rendered here once the PyTorch ResNet50 model is connected to the FastAPI backend.
      </Alert>

      {/* Interactive Staging Template Tester (Allows reviewer to test layout for F0-F4) */}
      <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <RotateCcw className="w-4 h-4 text-teal-600" />
          <span className="font-semibold">Test UI Staging Template:</span>
          <span className="text-slate-500 text-[11px]">(Toggle between METAVIR stages to verify card layouts)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {(['F0', 'F1', 'F2', 'F3', 'F4'] as FibrosisStage[]).map((stg) => (
            <button
              key={stg}
              onClick={() => setSelectedDemoStage(stg)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                (activeResult.predictedStage === stg)
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Top Runtime Telemetry Card */}
      <MetricsOverview
        scanId={activeResult.id}
        modality={activeResult.modality}
        model={activeResult.model}
        stage={activeResult.predictedStage}
        isDemo={true}
      />

      {/* Two Column Layout: Fibrosis Stage Card + Per-Class Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <FibrosisStageCard
            stage={activeResult.predictedStage}
            confidence={activeResult.top1Confidence}
            isPrototypePlaceholder={true}
            onOpenStagingGuide={onOpenStagingGuide}
          />
        </div>

        <div className="lg:col-span-6">
          <ConfidenceDistribution
            scores={activeResult.confidenceScores}
            isDemo={true}
          />
        </div>
      </div>

      {/* Visual Explainability & Grad-CAM Heatmap Viewer */}
      <ExplainabilityViewer
        imageSrc={displayImage}
        fileName={activeResult.fileName}
        modelName={activeResult.model.toUpperCase()}
      />

      {/* Clinical Report Download Dialog */}
      <ClinicalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={activeResult}
      />
    </div>
  );
};
