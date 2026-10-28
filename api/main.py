"""
LiverFusion AI - FastAPI Inference Service
Phase 7: MongoDB Metadata History & Real Inference
- MongoDB stores result metadata only (timestamp, model_id, predicted_stage, probabilities)
- NEVER stores the uploaded image
- GET /models: Discover checkpoints on disk
- POST /predict: In-memory inference, explainability overlay, records metadata in MongoDB
- GET /history: Retrieve past evaluation metadata
- GET /history/{id}: Retrieve single analysis record
"""

import os
import io
import base64
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import yaml
import numpy as np
import torch
import torchvision.transforms as transforms
import pymongo
from bson import ObjectId

from ml.models.resnet50 import build_resnet50
from ml.models.vit_b16 import build_vit_b16
from ml.models.fusion import build_fusion_model
from ml.explainability import explain_prediction

# Environment configuration
DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")
CHECKPOINTS_DIR = os.environ.get("CHECKPOINTS_DIR", "checkpoints")
CONFIG_PATH = os.environ.get("CONFIG_PATH", "configs/data.yaml")
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://127.0.0.1:27017")
MONGODB_DB = os.environ.get("MONGODB_DB", "liverfusion")

app = FastAPI(
    title="LiverFusion AI Inference API",
    description="Research prototype inference service for ultrasound fibrosis staging. Not for clinical diagnosis.",
    version="0.7.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASSES = ["F0", "F1", "F2", "F3", "F4"]
LOADED_MODELS: Dict[str, Any] = {}

# MongoDB Client Setup
mongo_client = None
history_collection = None
try:
    mongo_client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    db = mongo_client[MONGODB_DB]
    history_collection = db["analysis_history"]
    # Ensure index on timestamp descending
    history_collection.create_index([("timestamp", pymongo.DESCENDING)])
except Exception as e:
    print(f"Warning: MongoDB connection initialization warning: {e}")


def get_confidence_threshold() -> Optional[float]:
    """Read confidence threshold from config. Never invents a default."""
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
            if cfg and "confidence_threshold" in cfg:
                val = cfg["confidence_threshold"]
                return float(val) if val is not None else None
    return None


def get_model_checkpoint_path(model_id: str) -> Optional[str]:
    """Finds checkpoint file for requested model."""
    candidates = [
        os.path.join(CHECKPOINTS_DIR, f"{model_id}.pt"),
        os.path.join(CHECKPOINTS_DIR, f"{model_id}_run", "best_model.pt"),
        os.path.join("outputs", f"{model_id}_run", "best_model.pt"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def load_model_instance(model_id: str, device: str = "cpu"):
    if model_id in LOADED_MODELS:
        return LOADED_MODELS[model_id]

    ckpt_path = get_model_checkpoint_path(model_id)
    if not ckpt_path:
        raise FileNotFoundError(f"Checkpoint for model '{model_id}' not found on disk.")

    ckpt = torch.load(ckpt_path, map_location=device)
    state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt

    if model_id == "resnet50":
        model = build_resnet50(num_classes=len(CLASSES), pretrained=False)
    elif model_id == "vit_b16":
        model = build_vit_b16(num_classes=len(CLASSES), pretrained=False)
    elif model_id == "fusion":
        model = build_fusion_model(num_classes=len(CLASSES), gated=False, pretrained=False)
    elif model_id == "fusion_gated":
        model = build_fusion_model(num_classes=len(CLASSES), gated=True, pretrained=False)
    else:
        raise ValueError(f"Unknown model_id: {model_id}")

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    LOADED_MODELS[model_id] = model
    return model


class ModelInfo(BaseModel):
    id: str
    name: str
    modality: str


class PredictResponse(BaseModel):
    id: Optional[str] = None
    stage: str
    probabilities: Dict[str, float]
    saliency_png_base64: Optional[str]
    model_id: str
    demo: bool
    color_warning: Optional[str] = None
    low_confidence: bool = False
    confidence_threshold: Optional[float] = None
    timestamp: str


class HistoryRecord(BaseModel):
    id: str
    timestamp: str
    model_id: str
    predicted_stage: str
    probabilities: Dict[str, float]
    color_warning: Optional[str] = None
    low_confidence: bool = False


@app.get("/health")
def health_check():
    mongo_status = "connected" if mongo_client is not None else "unavailable"
    return {
        "status": "healthy",
        "service": "LiverFusion AI Inference API",
        "demo_mode": DEMO_MODE,
        "mongodb": mongo_status,
        "disclaimer": "Research prototype. Not for clinical diagnosis."
    }


@app.get("/models", response_model=List[ModelInfo])
def get_models():
    if DEMO_MODE:
        return [
            ModelInfo(id="resnet50", name="ResNet-50 (Ultrasound)", modality="Ultrasound"),
            ModelInfo(id="vit_b16", name="ViT-B/16 (Ultrasound)", modality="Ultrasound"),
            ModelInfo(id="fusion", name="Dual-Branch Fusion", modality="Ultrasound"),
            ModelInfo(id="fusion_gated", name="Gated Fusion (Ablation)", modality="Ultrasound"),
        ]

    discovered = []
    model_defs = [
        ("resnet50", "ResNet-50 (Ultrasound)"),
        ("vit_b16", "ViT-B/16 (Ultrasound)"),
        ("fusion", "Dual-Branch Fusion (ResNet50 + ViT-B/16)"),
        ("fusion_gated", "Gated Fusion Ablation"),
    ]

    for m_id, m_name in model_defs:
        if get_model_checkpoint_path(m_id) is not None:
            discovered.append(ModelInfo(id=m_id, name=m_name, modality="Ultrasound"))

    return discovered


@app.get("/history", response_model=List[HistoryRecord])
def get_history(limit: int = 50):
    """
    Retrieves past analysis result metadata from MongoDB.
    Strictly contains timestamp, model_id, predicted_stage, and probabilities.
    NEVER contains or serves image data.
    """
    if history_collection is None:
        return []

    try:
        cursor = history_collection.find({}, {"_id": 1, "timestamp": 1, "model_id": 1, "predicted_stage": 1, "probabilities": 1, "color_warning": 1, "low_confidence": 1}).sort("timestamp", pymongo.DESCENDING).limit(limit)
        results = []
        for doc in cursor:
            results.append(HistoryRecord(
                id=str(doc["_id"]),
                timestamp=doc.get("timestamp", ""),
                model_id=doc.get("model_id", "unknown"),
                predicted_stage=doc.get("predicted_stage", ""),
                probabilities=doc.get("probabilities", {}),
                color_warning=doc.get("color_warning"),
                low_confidence=doc.get("low_confidence", False)
            ))
        return results
    except Exception as e:
        print(f"Error reading history from MongoDB: {e}")
        return []


@app.get("/history/{record_id}", response_model=HistoryRecord)
def get_history_record(record_id: str):
    """Retrieve a single analysis metadata record by ID."""
    if history_collection is None:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    try:
        doc = history_collection.find_one({"_id": ObjectId(record_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Analysis record not found")
        return HistoryRecord(
            id=str(doc["_id"]),
            timestamp=doc.get("timestamp", ""),
            model_id=doc.get("model_id", ""),
            predicted_stage=doc.get("predicted_stage", ""),
            probabilities=doc.get("probabilities", {}),
            color_warning=doc.get("color_warning"),
            low_confidence=doc.get("low_confidence", False)
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid record ID")


@app.post("/predict", response_model=PredictResponse)
async def predict(
    image: UploadFile = File(...),
    model_id: str = Form(...)
):
    """
    In-memory inference.
    Stores RESULT METADATA ONLY in MongoDB.
    Rule 5 & Phase 7 Compliance: NEVER stores the uploaded image.
    """
    allowed_types = ["image/jpeg", "image/png", "image/bmp", "image/tiff"]
    if image.content_type and image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload an ultrasound image.")

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        raw_pil = Image.open(io.BytesIO(image_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupt image data.")

    # 1. Color Heuristic Input Check
    color_warning = None
    if raw_pil.mode in ("RGB", "RGBA"):
        rgb_arr = np.array(raw_pil.convert("RGB"), dtype=np.float32)
        r, g, b = rgb_arr[:, :, 0], rgb_arr[:, :, 1], rgb_arr[:, :, 2]
        color_diff = (np.abs(r - g) + np.abs(g - b) + np.abs(b - r)) / 3.0
        mean_diff = float(np.mean(color_diff))
        if mean_diff > 15.0:
            color_warning = (
                "Notice (heuristic check, not out-of-distribution detection): "
                "Image contains strong color variation and may not be a standard grayscale ultrasound image."
            )

    # 2. Identical Preprocessing: Grayscale -> 224x224 -> 3 channels -> ImageNet Norm
    prep_pil = raw_pil.convert("L").convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    input_tensor = transform(prep_pil).unsqueeze(0)

    timestamp_str = datetime.now(timezone.utc).isoformat()

    # 3. Handle Demo Mode
    if DEMO_MODE:
        return PredictResponse(
            id="demo_sample",
            stage="F2",
            probabilities={"F0": 0.08, "F1": 0.18, "F2": 0.54, "F3": 0.14, "F4": 0.06},
            saliency_png_base64=None,
            model_id=model_id,
            demo=True,
            color_warning=color_warning,
            low_confidence=False,
            confidence_threshold=None,
            timestamp=timestamp_str
        )

    # 4. Real Model Inference
    try:
        model = load_model_instance(model_id, device="cpu")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    with torch.no_grad():
        logits = model(input_tensor)
        probs_tensor = torch.softmax(logits, dim=-1).squeeze(0)
        probs_np = probs_tensor.cpu().numpy()

    argmax_idx = int(np.argmax(probs_np))
    predicted_stage = CLASSES[argmax_idx]
    max_prob = float(probs_np[argmax_idx])
    probabilities = {CLASSES[i]: round(float(probs_np[i]), 4) for i in range(len(CLASSES))}

    # 5. Confidence Threshold Check
    conf_thresh = get_confidence_threshold()
    low_confidence = bool(conf_thresh is not None and max_prob < conf_thresh)

    # 6. Saliency Overlay Generation (In-Memory)
    try:
        saliency_b64 = explain_prediction(
            model=model,
            model_name=model_id,
            input_tensor=input_tensor.clone(),
            target_class=argmax_idx,
            orig_pil=raw_pil
        )
    except Exception:
        saliency_b64 = None

    # 7. Store Result METADATA ONLY in MongoDB (NEVER the image)
    inserted_id = None
    if history_collection is not None:
        try:
            meta_doc = {
                "timestamp": timestamp_str,
                "model_id": model_id,
                "predicted_stage": predicted_stage,
                "probabilities": probabilities,
                "color_warning": color_warning,
                "low_confidence": low_confidence
            }
            res = history_collection.insert_one(meta_doc)
            inserted_id = str(res.inserted_id)
        except Exception as e:
            print(f"Warning: Failed to save metadata to MongoDB: {e}")

    return PredictResponse(
        id=inserted_id,
        stage=predicted_stage,
        probabilities=probabilities,
        saliency_png_base64=saliency_b64,
        model_id=model_id,
        demo=False,
        color_warning=color_warning,
        low_confidence=low_confidence,
        confidence_threshold=conf_thresh,
        timestamp=timestamp_str
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
