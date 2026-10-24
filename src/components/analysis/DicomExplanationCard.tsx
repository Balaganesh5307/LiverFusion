import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ChevronDown, ChevronUp, FileCode, Layers, Info } from 'lucide-react';

export const DicomExplanationCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-teal-200/70 bg-gradient-to-r from-teal-50/40 via-white to-white">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                DICOM (.dcm) Medical Standard Integration Roadmap
              </CardTitle>
              <Badge variant="teal" size="sm" className="text-[10px]">
                Phase 2 Architecture
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Native DICOM parser placeholder for clinical PACS integration and NIfTI 3D volume handling.
            </p>
          </div>
        </div>

        <button 
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          aria-label={isExpanded ? 'Collapse DICOM details' : 'Expand DICOM details'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2 pb-4 px-4 border-t border-teal-100/60 text-xs text-slate-600 space-y-3">
          <p className="leading-relaxed">
            While Phase 1 strictly accepts standardized <strong>JPG, JPEG, and PNG</strong> formats matching the current 6,323 ultrasound scans in the local workspace, Phase 2 will implement native DICOM parsing via <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">pydicom</code> and <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">MONAI</code> in FastAPI.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Pixel Spacing & Calibration</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Extracts physical pixel pitch (mm/px) from DICOM Tag (0028,0030) to compute true acoustic depth and nodular diameter.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                <FileCode className="w-3.5 h-3.5 text-teal-600" />
                <span>Hounsfield Units (HU)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Applies Rescale Slope and Intercept tags for CT scans to normalize attenuation coefficients across liver parenchyma.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                <Info className="w-3.5 h-3.5 text-teal-600" />
                <span>HIPAA De-identification</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Automated stripping of Protected Health Information (PHI) tags before passing pixel buffers to PyTorch tensor pipelines.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
