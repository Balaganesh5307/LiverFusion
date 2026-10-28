# LiverFusion AI

> **Disclaimer:** Research prototype. Not for clinical diagnosis.

LiverFusion AI is a research prototype for model-predicted liver fibrosis staging from ultrasound imaging.

---

## Monorepo Structure

```
LiverFusion AI/
├── configs/            # YAML configurations (reproducibility & hyperparameters)
├── ml/                 # PyTorch training, evaluation, and explainability modules
├── api/                # FastAPI inference service (GET /health, POST /predict)
├── web/                # Next.js (App Router, TypeScript, Tailwind CSS) UI
├── requirements.txt    # Pinned Python dependencies
└── README.md           # Getting started and execution steps
```

---

## Prerequisites

* **Python:** 3.11 or 3.12
* **Node.js:** v18+ (tested on v22)
* **npm:** v9+

---

## Setup & Running the Services

### 1. Python Environment & API Service

From the repository root:

```bash
# 1. Install pinned Python dependencies
pip install -r requirements.txt

# 2. Run the FastAPI service with Uvicorn
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

Verify API health:
* Browser: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
* Shell:
  ```bash
  curl http://127.0.0.1:8000/health
  ```
  Expected output:
  ```json
  {
    "status": "healthy",
    "service": "LiverFusion AI Inference API",
    "disclaimer": "Research prototype. Not for clinical diagnosis."
  }
  ```

---

### 2. Next.js Web Frontend

From the `web/` directory:

```bash
cd web

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification Criteria (Phase 0 Acceptance)

1. `npm run dev` serves the blank landing page with the disclaimer banner at `http://localhost:3000`.
2. `uvicorn api.main:app --port 8000` serves `GET /health` with `status: healthy` at `http://localhost:8000/health`.
3. Repo tree matches monorepo specification (`/web`, `/api`, `/ml`, `/configs`).
4. No file tracked in git is over 1 MB (data and checkpoints are excluded via `.gitignore`).
