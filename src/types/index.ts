export type Modality = 'ultrasound' | 'ct' | 'mri' | 'histopathology';

export type ModelArchitecture = 'resnet50' | 'cnn' | 'vit' | 'hybrid_fusion';

export type FibrosisStage = 'F0' | 'F1' | 'F2' | 'F3' | 'F4';

export interface StageDefinition {
  stage: FibrosisStage;
  label: string;
  name: string;
  shortDesc: string;
  detailedDesc: string;
  histologyCriterion: string;
  clinicalSignificance: string;
  color: {
    bg: string;
    text: string;
    border: string;
    accent: string;
  };
}

export interface ConfidenceScore {
  stage: FibrosisStage;
  label: string;
  probability: number; // 0 to 1
  isTopChoice?: boolean;
}

export interface AnalysisResult {
  id: string;
  scanId: string;
  timestamp: string;
  fileName: string;
  fileSizeFormatted: string;
  imageDimensions?: string;
  modality: Modality;
  model: ModelArchitecture;
  predictedStage: FibrosisStage;
  confidenceScores: ConfidenceScore[];
  top1Confidence: number; // e.g. 0.92
  predictionEntropy?: number;
  inferenceTimeMs?: number;
  explainability: {
    method: 'Grad-CAM' | 'Attention Map' | 'Feature Attribution';
    heatmapAvailable: boolean;
    description: string;
    focusAreas: string[];
  };
  metrics?: {
    tissueHomogeneityScore?: number;
    surfaceIrregularityIndex?: number;
    parenchymalAttenuation?: string;
  };
  isDemonstrationData: boolean;
  status: 'completed' | 'pending_backend' | 'validation_failed';
  clinicalNotesPlaceholder?: string;
}

export interface AnalysisRecord {
  id: string;
  fileName: string;
  fileSize: string;
  modality: Modality;
  model: ModelArchitecture;
  createdAt: string;
  status: 'Completed (Demo)' | 'Pending Backend' | 'Awaiting Model' | 'Verified';
  predictedStage?: FibrosisStage;
  confidence?: number;
  isDemoRecord: boolean;
  thumbnailUrl?: string;
}

export interface ModelBenchmark {
  id: ModelArchitecture;
  name: string;
  family: string;
  category: 'Planned Baseline' | 'Planned Primary' | 'Planned Comparison' | 'Planned Research Fusion';
  status: 'Training Ready (Dataset Verified)' | 'Under Architecture Design' | 'Phase 2 Planned' | 'Research Concept';
  accuracy: number; // e.g. 91.4
  sensitivity: number; // Recall e.g. 89.2
  specificity: number; // e.g. 92.8
  auc: number; // e.g. 0.95
  inferenceTimeMs: number;
  paramCount: string;
  suitableModality: string;
  description: string;
  keyStrength: string;
}

export interface ModalityConfig {
  id: Modality;
  name: string;
  badge: string;
  isAvailableForTraining: boolean;
  datasetPresent: boolean;
  statusNote: string;
  description: string;
  supportedFormats: string[];
}

export interface DatasetStatistics {
  totalScans: number;
  datasetName: string;
  classes: {
    stage: FibrosisStage;
    count: number;
    percent: number;
    label: string;
  }[];
  verifiedDate: string;
  warningNotice: string;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'analyze' 
  | 'results' 
  | 'models' 
  | 'history' 
  | 'about';
