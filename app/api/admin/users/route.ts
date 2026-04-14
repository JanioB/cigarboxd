import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ApiError, handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import {
  createDefaultProfile,
  listPublicUsers,
  upsertUserProfile,
  writeAuditLog,
} from "@/lib/data";
import { adminCreateUserSchema } from "@/lib/validators";
import { normalizeEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ["support", "admin"]);
    const snapshot = await adminDb().collection("users").get();
    const items = snapshot.docs
      .map((document) => document.data())
      .sort((left: any, right: any) => right.createdAt.localeCompare(left.createdAt));

    return ok({
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["admin"]);
    const body = await parseBody(request, adminCreateUserSchema);
    const email = normalizeEmail(body.email);

    const existing = await adminAuth().getUserByEmail(email).catch(() => null);
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const created = await adminAuth().createUser({
      email,
      password: body.password,
      displayName: body.displayName,
      disabled: false,
    });

    const profile = createDefaultProfile({
      uid: created.uid,
      email,
      displayName: body.displayName,
      role: body.role,
    });

    await upsertUserProfile(profile);
    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "user.create",
      subjectType: "user",
      subjectId: created.uid,
      details: {
        email,
        role: body.role,
      },
    });

    return ok({
      ok: true,
      item: profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

