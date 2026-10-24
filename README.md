# LiverFusion AI — Phase 1 Frontend Platform

**Multimodal Deep Fusion Networks for Automated Detection and Staging of Liver Cirrhosis**

A professional, clinical-grade medical AI web application frontend built with **React, Vite, TypeScript, Tailwind CSS, Recharts, and Lucide React**.

---

## 1. Verified Dataset Status

Inspection of the local workspace `Dataset/` directory confirms **6,323 liver ultrasound scans (JPG)** categorized into METAVIR fibrosis stages:

| Stage | Path | Scans | Description & Histological Correlation |
| :--- | :--- | :---: | :--- |
| **F0** | `Dataset/F0/` | **2,114** | Normal hepatic parenchyma (No architectural alteration) |
| **F1** | `Dataset/F1/` | **861** | Portal fibrous expansion without septa |
| **F2** | `Dataset/F2/` | **793** | Periportal fibrosis with few bridging septa |
| **F3** | `Dataset/F3/` | **857** | Bridging fibrosis with numerous septa |
| **F4** | `Dataset/F4/` | **1,698** | Established cirrhosis with regenerative nodules |
| **Total** | | **6,323** | **Primary cohort for upcoming PyTorch ResNet50 training** |

> **Clinical Protocol Note:** Folder labels represent research categories and are not assumed to be clinically certified until verified by institutional radiologist review. Large datasets, NIfTI volumes, and model weights are excluded from Git commits via `.gitignore`.

---

## 2. Implemented Pages & Features

- **Clinical Dashboard (`Dashboard.tsx`)**:
  - Live dataset verification card (6,323 files mapped across F0–F4).
  - Modality distribution donut chart (Ultrasound, CT, MRI, Histopathology).
  - Target benchmark comparison bar chart (Accuracy, Sensitivity, Specificity, AUC).
  - Recent analysis activity records table with quick preview actions.
  - Interactive METAVIR Fibrosis Staging Reference modal.

- **Image Analysis (`ImageAnalysis.tsx`)**:
  - Drag-and-drop file upload zone (JPG, JPEG, PNG, max 25MB) with local preview.
  - Image geometry inspection: Resolution, aspect ratio, file size, MIME type.
  - Clinical image filters: High-contrast parenchymal filter, inverted echogenicity, zoom.
  - Imaging modality selector: Ultrasound (primary), CT, MRI, Histopathology with compatibility warnings.
  - Deep learning architecture selector: ResNet50, Custom CNN, ViT-B/16, Multimodal Deep Fusion.
  - DICOM (.dcm) medical standard integration roadmap card.
  - Verification & validation modal (strictly prevents fake diagnostic predictions).

- **Analysis Results Layout (`Results.tsx`)**:
  - METAVIR classification card with histological & clinical significance.
  - Multiclass softmax confidence distribution with calibrated progress bars.
  - Visual explainability viewer with Grad-CAM activation heatmap overlay & side-by-side mode.
  - Scan runtime telemetry (Scan ID, Modality, Model, Latency, Entropy).
  - Downloadable standardized clinical research report (JSON format with disclaimer).
  - Interactive stage tester to preview UI layout for any stage (F0 through F4).

- **Model Comparison (`ModelComparison.tsx`)**:
  - Detailed comparative matrix of all 4 architectures.
  - Toggle between Target Literature Benchmarks and Genuine Experimental Empty State.
  - Mathematical principles and clinical advantages for ResNet50, CNN, ViT, and Hybrid Fusion.

- **Analysis History (`AnalysisHistory.tsx`)**:
  - Searchable and filterable audit table (by ID, filename, modality, model, stage).
  - Session-based storage with reset and delete capabilities.

- **About Project (`About.tsx`)**:
  - Comprehensive clinical background on chronic liver disease and cirrhosis staging.
  - Phased implementation roadmap (Phase 1 Frontend, Phase 2 PyTorch/FastAPI, Phase 3 Deep Fusion).
  - Visible regulatory disclaimer: *"Research prototype only. Not intended for clinical diagnosis."*

- **API Service Layer (`src/services/api.ts`)**:
  - Typed integration layer ready for upcoming Python FastAPI backend (`http://localhost:8000/api/v1`).
  - Automatic backend health check with fallback to Phase 1 prototype state.

---

## 3. Technology Stack

- **Framework**: React 18 with Vite 6
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 3 (Clinical Navy `#0F172A` & Teal `#0D9488` palette)
- **Charts & Visualizations**: Recharts 2
- **Icons**: Lucide React
- **Typography**: Google Fonts Inter

---

## 4. How to Run Locally

### Prerequisites
- Node.js (v18+ recommended, verified on v22.23.1)
- npm (v9+ recommended, verified on v10.9.8)

### Exact Terminal Commands

```bash
# 1. Navigate to project root
cd "c:\Users\bg695\Desktop\LiverFusion AI"

# 2. Install dependencies (if not already installed)
npm install

# 3. Compile and check TypeScript
npm run build

# 4. Start the local development server
npm run dev
```

The application will be accessible at: **`http://localhost:5173/`**

---

## 5. Next Steps for Phase 2 Backend Integration

1. Create a Python virtual environment and install `fastapi`, `uvicorn`, `torch`, `torchvision`, `pydicom`, `monai`.
2. Implement `GET /api/v1/health` and `POST /api/v1/analyze` endpoints.
3. Train the baseline `ResNet50` model on the verified 6,323 ultrasound images using 5-fold cross-validation.
4. Export model weights (`resnet50_ultrasound_best.pth`) and load them into FastAPI for authentic GPU/CPU inference.
