import { NextResponse } from "next/server";

const INFERENCE_URL = process.env.INFERENCE_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${INFERENCE_URL}/models`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Inference service responded with status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Inference service unreachable";
    return NextResponse.json(
      { error: `Unable to connect to inference service at ${INFERENCE_URL}: ${message}` },
      { status: 502 }
    );
  }
}
