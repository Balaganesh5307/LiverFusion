import { ModalityOption } from "@/types";

export const UI_CONFIG = {
  maxFileSizeMB: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/bmp", "image/tiff"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"],
  
  modalities: [
    {
      id: "ultrasound",
      name: "Ultrasound",
      description: "B-mode grayscale liver parenchyma acquisition",
      available: true,
    },
    {
      id: "mri",
      name: "MRI",
      description: "Magnetic resonance elastography & imaging",
      available: false,
      unavailableReason: "Not available yet",
    },
    {
      id: "ct",
      name: "CT",
      description: "Contrast-enhanced computed tomography",
      available: false,
      unavailableReason: "Not available yet",
    },
  ] as ModalityOption[],

  stageDescriptions: {
    F0: "Stage F0 — No fibrosis (normal liver parenchyma)",
    F1: "Stage F1 — Portal fibrosis without septa",
    F2: "Stage F2 — Portal fibrosis with few septa",
    F3: "Stage F3 — Numerous septa without cirrhosis",
    F4: "Stage F4 — Cirrhosis",
  } as Record<string, string>,
};
