import { NextRequest } from "next/server";
import { ApiError, handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import {
  buildManualCigaretteRecord,
  getCigarette,
  listCigarettes,
  writeAuditLog,
} from "@/lib/data";
import { adminDb } from "@/lib/firebase-admin";
import { cigaretteSchema } from "@/lib/validators";
import { buildSearchText, makeProductId, nowIso } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const featured = searchParams.get("featured") === "1";
    const limit = Number(searchParams.get("limit") || (featured ? "12" : "60"));

    const items = await listCigarettes({
      search,
      limit,
    });

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
    const body = await parseBody(request, cigaretteSchema);

    let id = makeProductId(body.brand, body.name);
    const existing = await getCigarette(id);
    if (existing) {
      id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const record = buildManualCigaretteRecord({
      id,
      brand: body.brand,
      name: body.name,
      company: body.company,
      subCategory: body.subCategory,
      submissionType: body.submissionType,
      dateOfAction: body.dateOfAction,
      description: body.description,
      imageUrl: body.imageUrl || "",
      imageProvider: body.imageProvider,
      imageAttribution: body.imageAttribution,
      imageLicense: body.imageLicense,
      imageSourceUrl: body.imageSourceUrl,
      additionalInformation: body.additionalInformation,
      actorId: auth.uid,
    });

    await adminDb().collection("cigarettes").doc(id).set(record);
    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "cigarette.create",
      subjectType: "cigarette",
      subjectId: id,
      details: {
        brand: record.brand,
        name: record.name,
      },
    });

    return ok({
      item: record,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

