import { NextRequest, NextResponse } from "next/server";

const INFERENCE_URL = process.env.INFERENCE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const modelId = formData.get("model_id");

    if (!image) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 }
      );
    }

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required." },
        { status: 400 }
      );
    }

    // Forward multipart payload directly to FastAPI inference service
    const upstreamFormData = new FormData();
    upstreamFormData.append("image", image);
    upstreamFormData.append("model_id", modelId.toString());

    const res = await fetch(`${INFERENCE_URL}/predict`, {
      method: "POST",
      body: upstreamFormData,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || `Inference service error (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Inference service unreachable";
    return NextResponse.json(
      { error: `Inference service connection error: ${message}` },
      { status: 502 }
    );
  }
}
