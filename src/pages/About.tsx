import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  ShieldAlert, 
  Target, 
  Workflow, 
  HardDrive, 
  AlertTriangle
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Research Documentation
          </span>
          <span className="text-xs text-slate-400 font-mono">Phase 1 Technical Overview</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          Multimodal Deep Fusion Networks for Automated Detection and Staging of Liver Cirrhosis
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Comprehensive project background, clinical rationale, METAVIR staging criteria, 
          deep learning topology roadmap, and prototype boundaries.
        </p>
      </div>

      {/* Prominent Mandatory Clinical Disclaimer */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-300 text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-900 uppercase tracking-wide">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Regulatory Notice & Clinical Disclaimer</span>
        </div>
        <p className="text-xs sm:text-sm font-semibold leading-relaxed text-amber-900">
          “Research prototype only. Not intended for clinical diagnosis.”
        </p>
        <p className="text-xs text-amber-800 leading-relaxed">
          LiverFusion AI is an exploratory research and translational software engineering project. 
          In its current Phase 1 state, it provides the frontend user experience, API integration layer, 
          and validation interfaces. It does <strong>not</strong> produce validated clinical predictions, 
          and must never be utilized as a substitute for professional diagnostic radiology or histological biopsy.
        </p>
      </div>

      {/* Research Objective & Clinical Rationale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200/90">
          <CardHeader className="bg-slate-50/50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <Target className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                Research Objective
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              Chronic liver disease (CLD) causes progressive fibrous tissue accumulation leading to irreversible 
              cirrhosis, portal hypertension, and hepatocellular carcinoma. Percutaneous needle biopsy is the 
              historical gold standard but is invasive, painful, and prone to significant sampling error.
            </p>
            <p>
              <strong>LiverFusion AI</strong> aims to develop non-invasive, objective deep learning networks capable of 
              classifying liver tissue into standardized <strong>METAVIR stages (F0 through F4)</strong>. 
              By extracting microscopic parenchymal acoustic attenuation patterns from accessible ultrasound imaging, 
              the system seeks to reduce dependence on invasive biopsies.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90">
          <CardHeader className="bg-slate-50/50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                <HardDrive className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                Verified Local Dataset Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-slate-600 space-y-3 leading-relaxed">
            <p>
              Our workspace contains <strong>6,323 verified liver ultrasound scans (JPG)</strong> organized into five folder tiers:
            </p>
            <div className="grid grid-cols-5 gap-2 text-center font-mono text-[11px]">
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-800">F0</div>
                <div className="text-[10px] text-slate-600">2,114</div>
              </div>
              <div className="p-2 rounded bg-teal-50 border border-teal-200">
                <div className="font-bold text-teal-800">F1</div>
                <div className="text-[10px] text-slate-600">861</div>
              </div>
              <div className="p-2 rounded bg-blue-50 border border-blue-200">
                <div className="font-bold text-blue-800">F2</div>
                <div className="text-[10px] text-slate-600">793</div>
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-200">
                <div className="font-bold text-amber-800">F3</div>
                <div className="text-[10px] text-slate-600">857</div>
              </div>
              <div className="p-2 rounded bg-rose-50 border border-rose-200">
                <div className="font-bold text-rose-800">F4</div>
                <div className="text-[10px] text-slate-600">1,698</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              *Notice: In accordance with project protocol, folder labels are not assumed clinically validated 
              until certified by institutional radiologist review. The separately downloaded 3D NIfTI volumes are 
              isolated and not mixed with this 2D cohort.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Phased Execution Roadmap */}
      <Card className="border-slate-200/90">
        <CardHeader className="bg-slate-50/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Workflow className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-bold text-slate-900">
              Phased Implementation & Research Pipeline
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phase 1 */}
            <div className="p-4 rounded-xl border border-teal-300 bg-teal-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="teal" size="sm">Phase 1 (Active)</Badge>
                <span className="text-[10px] font-bold text-teal-800 font-mono">Completed</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Clinical Frontend Architecture</h4>
              <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                <li>Vite + React + TypeScript responsive dashboard</li>
                <li>Clinical design system with navy & teal styling</li>
                <li>Image drag-and-drop & local client validation</li>
                <li>Modality & neural architecture selectors</li>
                <li>Clean API service layer for future FastAPI</li>
                <li>Dataset verification (6,323 ultrasound images)</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" size="sm">Phase 2 (Upcoming)</Badge>
                <span className="text-[10px] font-bold text-blue-700 font-mono">Next Step</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">PyTorch ResNet50 & FastAPI</h4>
              <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                <li>FastAPI server (<code className="font-mono text-slate-800">/api/v1/analyze</code>)</li>
                <li>PyTorch ResNet50 classifier training on 6,323 scans</li>
                <li>5-fold cross-validation & data augmentation</li>
                <li>Grad-CAM explainability tensor generation</li>
                <li>Model checkpoint loading & GPU acceleration</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="stage" size="sm">Phase 3 (Research)</Badge>
                <span className="text-[10px] font-bold text-indigo-700 font-mono">Future</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Multimodal Deep Fusion</h4>
              <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                <li>Comparative CNN and Vision Transformer (ViT) training</li>
                <li>Cross-attention deep fusion mechanism</li>
                <li>NIfTI 3D volume & DICOM PACS streaming</li>
                <li>Clinical trials and validation publication</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prototype Boundaries & Limitations */}
      <Card className="border-slate-200/90">
        <CardHeader className="bg-slate-50/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-bold text-slate-900">
              Current Prototype Limitations (Phase 1 Boundaries)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600 space-y-3 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-800 block text-[11px] uppercase tracking-wide">
                1. No Simulated Fake Inference
              </strong>
              <p className="text-[11px] text-slate-600 leading-snug">
                The frontend strictly refrains from generating fake medical diagnoses. All metrics are labeled as template demonstrations until live weights are evaluated.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-800 block text-[11px] uppercase tracking-wide">
                2. Non-Persistent In-Memory History
              </strong>
              <p className="text-[11px] text-slate-600 leading-snug">
                Analysis records reside in client browser memory (localStorage) during Phase 1. A relational database will be introduced in the backend phase.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-800 block text-[11px] uppercase tracking-wide">
                3. Primary Modality Specialization
              </strong>
              <p className="text-[11px] text-slate-600 leading-snug">
                Initial image analysis workflows focus exclusively on B-mode ultrasound. CT, MRI, and Histopathology are visible for architectural roadmap planning.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <strong className="text-slate-800 block text-[11px] uppercase tracking-wide">
                4. Dataset Privacy & Isolation
              </strong>
              <p className="text-[11px] text-slate-600 leading-snug">
                Dataset files and model weight checkpoints are kept outside the frontend public build assets to safeguard clinical data integrity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
