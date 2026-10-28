import { NextRequest, NextResponse } from "next/server";

const INFERENCE_URL = process.env.INFERENCE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "50";

    const res = await fetch(`${INFERENCE_URL}/history?limit=${limit}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Inference service returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database connection failed";
    return NextResponse.json(
      { error: `Failed to fetch analysis history: ${message}` },
      { status: 502 }
    );
  }
}
