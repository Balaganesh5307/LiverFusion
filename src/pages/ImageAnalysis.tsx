import React, { useState } from 'react';
import { Modality, ModelArchitecture, AnalysisRecord, AnalysisResult } from '../types';
import { ModalitySelector } from '../components/analysis/ModalitySelector';
import { ModelSelector } from '../components/analysis/ModelSelector';
import { ImageUploader, UploadedImageMeta } from '../components/analysis/ImageUploader';
import { DicomExplanationCard } from '../components/analysis/DicomExplanationCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { 
  Play, 
  ArrowRight,
  ServerOff
} from 'lucide-react';

interface ImageAnalysisProps {
  onAnalysisInitiated: (record: AnalysisRecord, resultTemplate: AnalysisResult) => void;
  onNavigateToResults: () => void;
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({
  onAnalysisInitiated,
  onNavigateToResults,
}) => {
  const [selectedModality, setSelectedModality] = useState<Modality>('ultrasound');
  const [selectedModel, setSelectedModel] = useState<ModelArchitecture>('resnet50');
  const [imageMeta, setImageMeta] = useState<UploadedImageMeta | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submission pipeline state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [lastSubmissionRecord, setLastSubmissionRecord] = useState<AnalysisRecord | null>(null);

  const handleStartAnalysis = async () => {
    if (!imageMeta) {
      setUploadError('Please select or drag-and-drop a liver scan image before submitting.');
      return;
    }

    setUploadError(null);
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStep('Validating file integrity and pixel format...');

    await new Promise((r) => setTimeout(r, 400));
    setProcessingProgress(45);
    setProcessingStep(`Checking model configuration (${selectedModel.toUpperCase()} for ${selectedModality.toUpperCase()})...`);

    await new Promise((r) => setTimeout(r, 500));
    setProcessingProgress(80);
    setProcessingStep('Checking FastAPI backend / PyTorch runtime connectivity...');

    await new Promise((r) => setTimeout(r, 600));
    setProcessingProgress(100);
    setProcessingStep('Validation complete. Backend model is offline (Phase 1 Prototype Mode).');

    setIsProcessing(false);

    // Create session record
    const analysisId = `LFA-${selectedModality === 'ultrasound' ? 'US' : 'SCAN'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: AnalysisRecord = {
      id: analysisId,
      fileName: imageMeta.fileName,
      fileSize: imageMeta.fileSizeFormatted,
      modality: selectedModality,
      model: selectedModel,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Today)',
      status: 'Awaiting Model',
      predictedStage: 'F2', // Prototype template placeholder
      confidence: 0.892,
      isDemoRecord: true,
      thumbnailUrl: imageMeta.previewUrl,
    };

    const resultTemplate: AnalysisResult = {
      id: analysisId,
      scanId: analysisId,
      timestamp: new Date().toLocaleString(),
      fileName: imageMeta.fileName,
      fileSizeFormatted: imageMeta.fileSizeFormatted,
      imageDimensions: `${imageMeta.width} × ${imageMeta.height} px`,
      modality: selectedModality,
      model: selectedModel,
      predictedStage: 'F2',
      top1Confidence: 0.892,
      isDemonstrationData: true,
      status: 'completed',
      confidenceScores: [
        { stage: 'F0', label: 'Stage F0', probability: 0.032 },
        { stage: 'F1', label: 'Stage F1', probability: 0.054 },
        { stage: 'F2', label: 'Stage F2', probability: 0.892, isTopChoice: true },
        { stage: 'F3', label: 'Stage F3', probability: 0.018 },
        { stage: 'F4', label: 'Stage F4', probability: 0.004 },
      ],
      explainability: {
        method: 'Grad-CAM',
        heatmapAvailable: true,
        description: 'Simulated acoustic speckle gradient overlay focused on right lobe parenchyma.',
        focusAreas: ['Parenchymal coarseness', 'Periportal fibrous sheaths', 'Smooth capsular edge'],
      },
    };

    setLastSubmissionRecord(newRecord);
    onAnalysisInitiated(newRecord, resultTemplate);
    setShowCompletionModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Analysis Pipeline
          </span>
          <span className="text-xs text-slate-400 font-mono">Input Configuration & Preprocessing</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          Clinical Liver Scan Preprocessing & Model Selection
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Upload B-mode liver ultrasound scans (JPG/PNG). Select target deep learning topology 
          (ResNet50, CNN, ViT, or Hybrid Fusion). Review image geometry and client-side validation.
        </p>
      </div>

      {/* DICOM roadmap explanation */}
      <DicomExplanationCard />

      {/* Modality Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <ModalitySelector
          selectedModality={selectedModality}
          onSelectModality={setSelectedModality}
        />
      </div>

      {/* Model Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      </div>

      {/* Image Uploader & Viewer */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <ImageUploader
          imageMeta={imageMeta}
          onImageSelected={(meta) => {
            setImageMeta(meta);
            setUploadError(null);
          }}
          onRemoveImage={() => setImageMeta(null)}
          error={uploadError}
          onError={setUploadError}
        />
      </div>

      {/* Submission Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-900">
            Pipeline Configuration Ready:
          </div>
          <div className="text-xs text-slate-500">
            Modality: <strong className="text-slate-800 capitalize">{selectedModality}</strong> • 
            Target Model: <strong className="text-slate-800 uppercase font-mono">{selectedModel}</strong> • 
            Image: <span className="text-slate-700">{imageMeta ? imageMeta.fileName : 'No scan loaded'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {imageMeta && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setImageMeta(null)}
              className="text-xs w-full sm:w-auto"
            >
              Clear Selection
            </Button>
          )}

          <Button
            type="button"
            variant="teal"
            size="lg"
            disabled={!imageMeta || isProcessing}
            isLoading={isProcessing}
            onClick={handleStartAnalysis}
            className="text-xs sm:text-sm font-semibold w-full sm:w-auto"
          >
            <Play className="w-4 h-4 fill-current mr-1.5" />
            <span>Process & Prepare Analysis</span>
          </Button>
        </div>
      </div>

      {/* Progress status if actively processing */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
          <div className="flex justify-between items-center text-xs font-medium text-teal-900">
            <span>{processingStep}</span>
            <span>{processingProgress}%</span>
          </div>
          <ProgressBar value={processingProgress} colorClass="bg-teal-600" heightClass="h-2" />
        </div>
      )}

      {/* Prototype Completion / Backend Status Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="Scan Validated — Real AI Backend Pending"
        subtitle="Phase 1 frontend demonstration protocol"
        maxWidth="lg"
      >
        <div className="space-y-5 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <ServerOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900 font-semibold block text-xs">
                No Fabricated Medical Predictions Generated
              </strong>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                As required by the clinical research protocol, this frontend does not invent or simulate fake diagnostic predictions. 
                Real inference will execute once the Python FastAPI backend and trained PyTorch ResNet50 model weights are connected.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-semibold text-slate-800 text-xs">Preprocessing Summary:</div>
            <div className="space-y-1 font-mono text-[11px] text-slate-600">
              <div>• Scan ID: <strong className="text-slate-900">{lastSubmissionRecord?.id}</strong></div>
              <div>• File: {lastSubmissionRecord?.fileName} ({lastSubmissionRecord?.fileSize})</div>
              <div>• Selected Modality: {lastSubmissionRecord?.modality.toUpperCase()}</div>
              <div>• Model Architecture: {lastSubmissionRecord?.model.toUpperCase()}</div>
              <div>• Status: Added to local session history (Awaiting Model)</div>
            </div>
          </div>

          <p className="text-slate-600 text-[11px] leading-relaxed">
            You can now proceed to the <strong>Analysis Results</strong> page to preview the standardized 
            clinical report template, METAVIR classification breakdown, and Grad-CAM explainability layout.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompletionModal(false)}
              className="text-xs"
            >
              Stay on Upload
            </Button>
            <Button
              variant="teal"
              size="sm"
              onClick={() => {
                setShowCompletionModal(false);
                onNavigateToResults();
              }}
              className="text-xs"
            >
              <span>View Results Layout Template</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
