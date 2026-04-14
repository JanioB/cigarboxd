import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ApiError, handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import {
  listReviewsForUser,
  recalculateCigaretteStats,
  upsertUserProfile,
  writeAuditLog,
} from "@/lib/data";
import { ReviewRecord, UserProfile } from "@/lib/types";
import { moderateUserSchema } from "@/lib/validators";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, ["support", "admin"]);
    const body = await parseBody(request, moderateUserSchema);
    const { id } = await params;
    const userRef = adminDb().collection("users").doc(id);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      throw new ApiError(404, "User not found.");
    }

    const target = snapshot.data() as UserProfile;
    if (target.role === "admin" && auth.profile.role !== "admin") {
      throw new ApiError(403, "Support accounts cannot modify admins.");
    }

    if (body.action === "set-role") {
      if (auth.profile.role !== "admin") {
        throw new ApiError(403, "Only admins can change roles.");
      }

      if (!body.role) {
        throw new ApiError(400, "A target role is required.");
      }

      await userRef.update({
        role: body.role,
        updatedAt: nowIso(),
      });
    }

    if (body.action === "ban") {
      await Promise.all([
        adminAuth().updateUser(id, { disabled: true }),
        userRef.update({
          status: "banned",
          bannedAt: nowIso(),
          updatedAt: nowIso(),
        }),
      ]);
    }

    if (body.action === "unban") {
      await Promise.all([
        adminAuth().updateUser(id, { disabled: false }),
        userRef.update({
          status: "active",
          bannedAt: "",
          updatedAt: nowIso(),
        }),
      ]);
    }

    if (body.action === "delete") {
      await adminAuth().updateUser(id, {
        disabled: true,
        displayName: "Deleted account",
      });

      const reviews = await listReviewsForUser(id);
      for (const review of reviews) {
        await adminDb().collection("reviews").doc(review.id).update({
          status: "removed",
          removedAt: nowIso(),
          removedBy: auth.uid,
          removedReason: "account-deleted",
          updatedAt: nowIso(),
        });
        await recalculateCigaretteStats(review.cigaretteId);
      }

      await userRef.update({
        status: "deleted",
        displayName: "Deleted account",
        bio: "",
        favorites: [],
        tried: [],
        reviewCount: 0,
        deletedAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: `user.${body.action}`,
      subjectType: "user",
      subjectId: id,
      details: {
        role: body.role || "",
        reason: body.reason || "",
      },
    });

    const updated = await userRef.get();
    return ok({
      item: updated.data(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

