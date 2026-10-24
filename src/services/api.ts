/**
 * LiverFusion AI - API Service Layer
 * Designed for future integration with Python FastAPI backend and PyTorch models.
 * 
 * Future FastAPI Endpoints:
 * - GET  /api/v1/health          -> Backend service health & GPU availability
 * - POST /api/v1/analyze         -> Multipart upload for ResNet50 / ViT / CNN inference
 * - GET  /api/v1/models          -> Model registry & benchmark metrics
 * - GET  /api/v1/dataset/stats   -> Dataset statistics & validation status
 * - POST /api/v1/explain/gradcam -> Grad-CAM attention heatmap generator
 */

import { AnalysisRecord, AnalysisResult, Modality, ModelArchitecture } from '../types';
import { LOCAL_DATASET_STATS, MODEL_BENCHMARKS, INITIAL_DEMO_RECORDS } from '../data/clinicalConstants';

const API_BASE_URL = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface BackendHealthResponse {
  status: 'online' | 'offline';
  backendVersion?: string;
  torchVersion?: string;
  cudaAvailable?: boolean;
  activeModel?: string;
  message: string;
}

export interface AnalysisRequestPayload {
  file: File;
  modality: Modality;
  model: ModelArchitecture;
  notes?: string;
}

class LiverFusionApiService {
  private baseUrl: string;
  private isBackendOnline: boolean = false;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Health check for FastAPI backend
   */
  async checkBackendHealth(): Promise<BackendHealthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        this.isBackendOnline = true;
        return {
          status: 'online',
          backendVersion: data.version || '0.1.0',
          torchVersion: data.torch_version,
          cudaAvailable: data.cuda_available,
          activeModel: data.active_model || 'ResNet50-US-Baseline',
          message: 'FastAPI Backend & PyTorch Runtime Connected',
        };
      }
    } catch {
      // Backend not running in Phase 1 - expected behavior
      this.isBackendOnline = false;
    }

    return {
      status: 'offline',
      message: 'FastAPI backend not detected (Phase 1 Frontend Prototype Mode). Inference disabled.',
    };
  }

  /**
   * Submit an image for analysis.
   * In Phase 1: Does NOT fake clinical inferences.
   * If backend is not available, safely returns a structured response indicating
   * that inference requires backend integration, preventing fabricated diagnoses.
   */
  async analyzeImage(
    payload: AnalysisRequestPayload,
    onProgress?: (step: string, percentage: number) => void
  ): Promise<{
    success: boolean;
    result?: AnalysisResult;
    message: string;
    backendConnected: boolean;
  }> {
    onProgress?.('Validating image file and modality requirements...', 20);

    // If backend is running, attempt real API call
    if (this.isBackendOnline) {
      try {
        onProgress?.('Uploading scan to FastAPI PyTorch inference pipeline...', 50);
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('modality', payload.modality);
        formData.append('model', payload.model);

        const response = await fetch(`${this.baseUrl}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Inference server responded with ${response.status}`);
        }

        const data: AnalysisResult = await response.json();
        onProgress?.('Processing Grad-CAM explainability heatmap...', 90);
        return {
          success: true,
          result: data,
          message: 'Inference completed successfully via PyTorch engine.',
          backendConnected: true,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
        console.warn('Backend inference failed, falling back to prototype state:', errorMsg);
      }
    }

    // Phase 1 Prototype behavior:
    // We explicitly do NOT generate fake medical diagnosis.
    // Instead, we return a clearly labeled prototype preview structure.
    onProgress?.('Verifying Phase 1 prototype client validation...', 80);
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      success: false,
      message: 'PyTorch model backend is currently offline. Real inference will be activated once the FastAPI service and trained ResNet50 model weights are loaded.',
      backendConnected: false,
    };
  }

  /**
   * Fetch current model benchmark matrix
   */
  async getModelBenchmarks() {
    return MODEL_BENCHMARKS;
  }

  /**
   * Fetch verified dataset statistics
   */
  async getDatasetStats() {
    return LOCAL_DATASET_STATS;
  }

  /**
   * Manage local demo session history
   */
  getLocalHistory(): AnalysisRecord[] {
    try {
      const stored = localStorage.getItem('liverfusion_demo_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read history from localStorage', e);
    }
    return INITIAL_DEMO_RECORDS;
  }

  saveLocalRecord(record: AnalysisRecord): void {
    try {
      const current = this.getLocalHistory();
      const updated = [record, ...current];
      localStorage.setItem('liverfusion_demo_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  deleteLocalRecord(id: string): AnalysisRecord[] {
    try {
      const current = this.getLocalHistory();
      const filtered = current.filter((item) => item.id !== id);
      localStorage.setItem('liverfusion_demo_history', JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.warn('Could not delete from localStorage', e);
      return [];
    }
  }
}

export const apiService = new LiverFusionApiService();
