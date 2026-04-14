import { NextRequest } from "next/server";
import { ApiError, getClientIp, handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import {
  createReview,
  getCigarette,
  listReviewsForCigarette,
  writeAuditLog,
} from "@/lib/data";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validators";
import { nowIso, sanitizeMultiline } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = await listReviewsForCigarette(id);
    return ok({
      items: reviews,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;
    const cigarette = await getCigarette(id);
    if (!cigarette || cigarette.status !== "active") {
      throw new ApiError(404, "Cigarette not found.");
    }

    const ip = getClientIp(request);
    const limiter = enforceRateLimit(`review:${auth.uid}:${ip}`, {
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    if (!limiter.allowed) {
      throw new ApiError(429, "Too many review attempts. Try again later.");
    }

    const body = await parseBody(request, reviewSchema);
    const existing = await listReviewsForCigarette(id);
    if (existing.some((review) => review.userId === auth.uid)) {
      throw new ApiError(409, "You already reviewed this cigarette.");
    }

    const timestamp = nowIso();
    const reviewId = await createReview({
      cigaretteId: id,
      cigaretteName: cigarette.name,
      cigaretteBrand: cigarette.brand,
      userId: auth.uid,
      userDisplayName: auth.profile.displayName,
      userPhotoUrl: auth.profile.photoUrl || "",
      rating: body.rating,
      body: sanitizeMultiline(body.body),
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "review.create",
      subjectType: "review",
      subjectId: reviewId,
      details: {
        cigaretteId: id,
      },
    });

    return ok({
      ok: true,
      reviewId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

