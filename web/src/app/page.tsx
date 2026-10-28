"use client";

import { useState, useEffect } from "react";
import { ModelInfo, ModalityType, PredictResult } from "@/types";
import ModalitySelector from "@/components/ModalitySelector";
import ModelSelector from "@/components/ModelSelector";
import ImageUploader from "@/components/ImageUploader";
import ResultsDashboard from "@/components/ResultsDashboard";
import DemoBanner from "@/components/DemoBanner";

export default function HomePage() {
  const [selectedModality, setSelectedModality] = useState<ModalityType>("ultrasound");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [modelsLoading, setModelsLoading] = useState<boolean>(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);

  // Fetch available models from Next.js proxy route
  useEffect(() => {
    let isMounted = true;
    async function loadModels() {
      try {
        setModelsLoading(true);
        setModelsError(null);
        const res = await fetch("/api/models");
        if (!res.ok) {
          throw new Error(`Inference service error: ${res.status}`);
        }
        const data: ModelInfo[] = await res.json();
        if (isMounted) {
          setModels(data);
          if (data.length > 0) {
            setSelectedModelId(data[0].id);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load models";
          setModelsError(msg);
        }
      } finally {
        if (isMounted) setModelsLoading(false);
      }
    }

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAnalysisError(null);
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setAnalysisError(null);
  };

  const handleResetAnalysis = () => {
    setResult(null);
    setAnalysisError(null);
    handleClearFile();
  };

  const handleAnalyse = async () => {
    if (!selectedFile || !selectedModelId) return;

    try {
      setIsAnalysing(true);
      setAnalysisError(null);

      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("model_id", selectedModelId);

      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Inference evaluation failed.");
      }

      setResult(data as PredictResult);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis request failed";
      setAnalysisError(msg);
    } finally {
      setIsAnalysing(false);
    }
  };

  // Demo banner is strictly displayed only when the response demo flag is active
  const isDemoActive = Boolean(result?.demo);

  const activeModel = models.find((m) => m.id === (result ? result.model_id : selectedModelId));

  return (
    <div className="flex-1 flex flex-col">
      {/* Persistent Red Banner in Demo Mode */}
      {isDemoActive && <DemoBanner visible={true} />}

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* App Title & Header */}
        <header className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Ultrasound Fibrosis Evaluation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            LiverFusion AI
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Research prototype for model-predicted liver fibrosis stage evaluation from grayscale
            ultrasound images. Features dual-branch representation and in-memory saliency explanation.
          </p>
        </header>

        {/* Global Analysis Error Banner */}
        {analysisError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg"
          >
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Evaluation Error</span>
              <span>{analysisError}</span>
            </div>
          </div>
        )}

        {/* Main Content Area: Upload Workflow vs Results Dashboard */}
        {!result ? (
          <div className="space-y-8 bg-slate-900/30 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-md">
            {/* 1. Modality Selector */}
            <ModalitySelector
              selectedModality={selectedModality}
              onSelectModality={setSelectedModality}
            />

            {/* 2. Model Architecture Selector */}
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelectModelId={setSelectedModelId}
              isLoading={modelsLoading}
              error={modelsError}
            />

            {/* 3. Image Uploader */}
            <ImageUploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onClearFile={handleClearFile}
              errorMessage={uploadError}
              setErrorMessage={setUploadError}
            />

            {/* 4. Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || !selectedModelId || models.length === 0 || isAnalysing}
                onClick={handleAnalyse}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  !selectedFile || !selectedModelId || models.length === 0 || isAnalysing
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 hover:shadow-cyan-400/30 active:scale-[0.99]"
                }`}
              >
                {isAnalysing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing Ultrasound in Memory...
                  </>
                ) : (
                  <>
                    <span>Analyse Ultrasound Frame</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Results Dashboard View */
          <ResultsDashboard
            result={result}
            modelInfo={activeModel}
            rawImagePreviewUrl={previewUrl}
            onReset={handleResetAnalysis}
          />
        )}
      </div>

      {/* Footer Disclaimer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-800/80 bg-slate-950/40 mt-auto">
        <p>LiverFusion AI — Research Prototype. Not for clinical diagnosis.</p>
        <p className="mt-1 text-[11px] text-slate-400">
          All image data processed volatilely in memory without permanent persistence.
        </p>
      </footer>
    </div>
  );
}
