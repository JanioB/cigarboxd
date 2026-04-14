import { NextRequest } from "next/server";
import { adminAuth, adminDb, initialAdminEmail } from "@/lib/firebase-admin";
import { ApiError, handleApiError, ok, parseBody, getClientIp } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { createDefaultProfile, getBlacklistRecord, upsertUserProfile } from "@/lib/data";
import { enforceRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request, registerSchema);
    const email = normalizeEmail(body.email);
    const ip = getClientIp(request);

    const ipLimit = enforceRateLimit(`register:ip:${ip}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.allowed) {
      throw new ApiError(429, "Too many registration attempts. Try again later.");
    }

    const emailLimit = enforceRateLimit(`register:email:${email}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!emailLimit.allowed) {
      throw new ApiError(429, "Too many registration attempts for this email.");
    }

    const blacklisted = await getBlacklistRecord(email);
    if (blacklisted) {
      throw new ApiError(403, "This email address has been blocked.");
    }

    const existingUser = await adminAuth()
      .getUserByEmail(email)
      .catch(() => null);

    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const usersSnapshot = await adminDb()
      .collection("users")
      .where("role", "==", "admin")
      .limit(1)
      .get();

    const isBootstrapAdmin =
      !usersSnapshot.docs.length && initialAdminEmail() === email;

    const authUser = await adminAuth().createUser({
      email,
      password: body.password,
      displayName: body.displayName,
      disabled: false,
    });

    const profile = createDefaultProfile({
      uid: authUser.uid,
      email,
      displayName: body.displayName,
      role: isBootstrapAdmin ? "admin" : "user",
    });

    await upsertUserProfile(profile);

    return ok({
      ok: true,
      role: profile.role,
      uid: authUser.uid,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

