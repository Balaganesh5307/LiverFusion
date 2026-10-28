export interface ModelInfo {
  id: string;
  name: string;
  modality: string;
}


export interface PredictResult {
  id?: string;
  stage: string;
  probabilities: Record<string, number>;
  saliency_png_base64: string | null;
  model_id: string;
  demo: boolean;
  color_warning?: string | null;
  low_confidence?: boolean;
  confidence_threshold?: number | null;
  timestamp?: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  model_id: string;
  predicted_stage: string;
  probabilities: Record<string, number>;
  color_warning?: string | null;
  low_confidence?: boolean;
}

export type ModalityType = "ultrasound" | "mri" | "ct";

export interface ModalityOption {
  id: ModalityType;
  name: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
}

