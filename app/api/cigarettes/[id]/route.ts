import { NextRequest } from "next/server";
import { ApiError, handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { getCigarette, writeAuditLog } from "@/lib/data";
import { cigaretteSchema } from "@/lib/validators";
import { buildSearchText, nowIso, sanitizeMultiline, trimText } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cigarette = await getCigarette(id);
    if (!cigarette || cigarette.status !== "active") {
      throw new ApiError(404, "Cigarette not found.");
    }

    return ok({
      item: cigarette,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, ["admin"]);
    const body = await parseBody(request, cigaretteSchema);
    const { id } = await params;
    const cigaretteRef = adminDb().collection("cigarettes").doc(id);
    const snapshot = await cigaretteRef.get();

    if (!snapshot.exists) {
      throw new ApiError(404, "Cigarette not found.");
    }

    await cigaretteRef.update({
      brand: trimText(body.brand),
      name: trimText(body.name),
      company: trimText(body.company),
      subCategory: trimText(body.subCategory),
      submissionType: trimText(body.submissionType),
      dateOfAction: trimText(body.dateOfAction),
      description: sanitizeMultiline(body.description || ""),
      imageUrl: body.imageUrl || "",
      imageProvider: body.imageUrl ? body.imageProvider : "placeholder",
      imageAttribution: body.imageAttribution || "",
      imageLicense: body.imageLicense || "",
      imageSourceUrl: body.imageSourceUrl || "",
      additionalInformation: body.additionalInformation || "",
      searchText: buildSearchText(body.brand, body.name, body.company),
      updatedAt: nowIso(),
      updatedBy: auth.uid,
    });

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "cigarette.update",
      subjectType: "cigarette",
      subjectId: id,
      details: {
        brand: body.brand,
        name: body.name,
      },
    });

    const updated = await cigaretteRef.get();
    return ok({
      item: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request, ["admin"]);
    const { id } = await params;
    const cigaretteRef = adminDb().collection("cigarettes").doc(id);
    const snapshot = await cigaretteRef.get();

    if (!snapshot.exists) {
      throw new ApiError(404, "Cigarette not found.");
    }

    await cigaretteRef.update({
      status: "archived",
      updatedAt: nowIso(),
      updatedBy: auth.uid,
    });

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "cigarette.archive",
      subjectType: "cigarette",
      subjectId: id,
    });

    return ok({
      ok: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

