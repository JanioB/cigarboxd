import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validators";
import { nowIso, sanitizeMultiline, trimText } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    return ok({
      profile: auth.profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await parseBody(request, profileUpdateSchema);
    const displayName = trimText(body.displayName);
    const bio = sanitizeMultiline(body.bio || "");

    await Promise.all([
      adminDb().collection("users").doc(auth.uid).update({
        displayName,
        bio,
        updatedAt: nowIso(),
      }),
      adminAuth().updateUser(auth.uid, {
        displayName,
      }),
    ]);

    const updated = await adminDb().collection("users").doc(auth.uid).get();
    return ok({
      profile: updated.data(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

