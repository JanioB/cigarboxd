import { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { removeReview, writeAuditLog } from "@/lib/data";
import { ReviewRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;
    const snapshot = await adminDb().collection("reviews").doc(id).get();
    if (!snapshot.exists) {
      throw new ApiError(404, "Review not found.");
    }

    const review = snapshot.data() as ReviewRecord;
    const canModerate =
      review.userId === auth.uid ||
      auth.profile.role === "support" ||
      auth.profile.role === "admin";

    if (!canModerate) {
      throw new ApiError(403, "You cannot remove this review.");
    }

    await removeReview({
      reviewId: id,
      actorId: auth.uid,
      reason: review.userId === auth.uid ? "self-delete" : "moderated",
    });

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "review.remove",
      subjectType: "review",
      subjectId: id,
      details: {
        cigaretteId: review.cigaretteId,
      },
    });

    return ok({
      ok: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

