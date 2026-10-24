import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  ZoomIn, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  FileImage,
  Sliders
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export interface UploadedImageMeta {
  file: File;
  previewUrl: string;
  fileName: string;
  fileSizeFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
}

interface ImageUploaderProps {
  imageMeta: UploadedImageMeta | null;
  onImageSelected: (meta: UploadedImageMeta) => void;
  onRemoveImage: () => void;
  error: string | null;
  onError: (err: string | null) => void;
}

const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE_MB = 25;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageMeta,
  onImageSelected,
  onRemoveImage,
  error,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contrastEnhanced, setContrastEnhanced] = useState(false);
  const [invertedEchogenicity, setInvertedEchogenicity] = useState(false);
  const [zoomPreview, setZoomPreview] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    onError(null);

    // Validate format
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      onError(`Unsupported file type (${file.type || 'unknown'}). Please upload a medical scan in JPG, JPEG, or PNG format.`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onError(`File exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB. Actual size: ${formatFileSize(file.size)}.`);
      return;
    }

    // Read and extract dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(img.width, img.height);
        const aspect = `${Math.round(img.width / divisor)}:${Math.round(img.height / divisor)}`;

        onImageSelected({
          file,
          previewUrl: result,
          fileName: file.name,
          fileSizeFormatted: formatFileSize(file.size),
          width: img.width,
          height: img.height,
          aspectRatio: aspect,
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
          3. Upload Liver Scan Image
        </label>
        <span className="text-[11px] text-slate-500">
          Supported: JPG, JPEG, PNG (Max {MAX_FILE_SIZE_MB}MB)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!imageMeta ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
            isDragOver
              ? 'border-teal-500 bg-teal-50/50 scale-[1.005]'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="h-12 w-12 rounded-2xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-3 shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">
            Drag & drop patient scan here, or click to browse
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-3">
            Upload B-mode liver ultrasound or cross-sectional hepatic scan. File processed strictly in your local browser memory in Phase 1.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select Local Scan
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200/90">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Image viewport */}
            <div className="md:col-span-7 bg-slate-950 flex flex-col items-center justify-center relative min-h-[280px] p-4 overflow-hidden">
              <img
                src={imageMeta.previewUrl}
                alt="Selected liver scan"
                className={`max-h-[300px] object-contain rounded-lg transition-all duration-200 ${
                  contrastEnhanced ? 'contrast-150 brightness-110' : ''
                } ${invertedEchogenicity ? 'invert' : ''} ${zoomPreview ? 'scale-125' : 'scale-100'}`}
              />

              {/* Viewport tool overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] border border-slate-700/60">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
                  <FileImage className="w-3.5 h-3.5 text-teal-400" />
                  <span>{imageMeta.width} × {imageMeta.height} px</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContrastEnhanced(!contrastEnhanced)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
                      contrastEnhanced ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Toggle high contrast parenchymal filter"
                  >
                    <Sliders className="w-3 h-3" />
                    Contrast
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvertedEchogenicity(!invertedEchogenicity)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
                      invertedEchogenicity ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Toggle inverted acoustic echogenicity"
                  >
                    <Eye className="w-3 h-3" />
                    Invert
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomPreview(!zoomPreview)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
                      zoomPreview ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Zoom in/out preview"
                  >
                    <ZoomIn className="w-3 h-3" />
                    Zoom
                  </button>
                </div>
              </div>
            </div>

            {/* Metadata & Controls */}
            <div className="md:col-span-5 p-5 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-semibold w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Image Validated Locally</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 break-all leading-snug">
                    {imageMeta.fileName}
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">File Size:</span>
                      <span className="font-mono font-medium">{imageMeta.fileSizeFormatted}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Resolution:</span>
                      <span className="font-mono font-medium">{imageMeta.width} × {imageMeta.height}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Aspect Ratio:</span>
                      <span className="font-mono font-medium">{imageMeta.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">MIME Type:</span>
                      <span className="font-mono font-medium">{imageMeta.file.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center gap-2 border-t border-slate-100 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={onRemoveImage}
                  className="text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
