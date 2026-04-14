import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getMissingPublicEnv, getMissingServerEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";

export async function GET() {
  const missingPublicEnv = getMissingPublicEnv();
  const missingServerEnv = getMissingServerEnv();

  if (missingPublicEnv.length || missingServerEnv.length) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-environment",
        missingPublicEnv,
        missingServerEnv,
      },
      { status: 503 }
    );
  }

  try {
    await adminDb().collection("cigarettes").limit(1).get();

    return NextResponse.json(
      {
        ok: true,
        checks: {
          env: "ok",
          firestore: "ok",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        reason: "firestore-unavailable",
      },
      { status: 503 }
    );
  }
}

