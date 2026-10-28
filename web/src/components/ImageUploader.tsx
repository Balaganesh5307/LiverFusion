"use client";

import { useState, useRef, DragEvent, ChangeEvent, KeyboardEvent } from "react";
import { UI_CONFIG } from "@/config/uiConfig";

interface ImageUploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export default function ImageUploader({
  selectedFile,
  previewUrl,
  onFileSelect,
  onClearFile,
  errorMessage,
  setErrorMessage,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    // 1. Content Type / Extension validation
    const mimeMatch = UI_CONFIG.allowedMimeTypes.includes(file.type.toLowerCase());
    const extMatch = UI_CONFIG.allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!mimeMatch && !extMatch) {
      setErrorMessage(
        `File rejected: "${file.name}" is not a supported image. Please upload a grayscale ultrasound image (JPEG, PNG, BMP).`
      );
      return;
    }

    // 2. File Size validation
    if (file.size > UI_CONFIG.maxFileSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `File rejected: File size (${sizeMB} MB) exceeds the maximum allowed limit of ${UI_CONFIG.maxFileSizeMB} MB.`
      );
      return;
    }

    // Calculate image dimensions using browser Image constructor in-memory
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        3. Upload Ultrasound Acquisition Frame
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={UI_CONFIG.allowedExtensions.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload ultrasound image"
      />

      {/* Rejection / Validation Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-3 shadow-sm"
        >
          <svg
            className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 font-medium leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Empty State / Dropzone */}
      {!selectedFile || !previewUrl ? (
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          aria-label="Upload image drop zone. Press Enter or Space to choose file."
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isDragging
              ? "border-cyan-400 bg-cyan-950/30 scale-[1.01]"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop ultrasound image here, or{" "}
                <span className="text-cyan-400 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPEG, PNG, BMP • Up to {UI_CONFIG.maxFileSizeMB} MB • In-memory processing only
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Preview State */
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-slate-700/60 bg-black flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Ultrasound preview"
              className="w-full h-full object-contain filter grayscale"
            />
          </div>
          <div className="flex-1 min-w-0 w-full space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-semibold text-sm text-slate-200 truncate">
                {selectedFile.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Format: {selectedFile.type || "image/jpeg"}
              {imageDimensions && ` • Dimensions: ${imageDimensions.width} × ${imageDimensions.height} px`}
            </p>
            <p className="text-[11px] text-cyan-400/90 font-medium pt-1">
              ✓ Ready for model evaluation (processed in memory, never saved)
            </p>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={onClearFile}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
