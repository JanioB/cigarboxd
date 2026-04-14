import { NextRequest } from "next/server";
import { ApiError, handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getCigarette, toggleUserList, writeAuditLog } from "@/lib/data";
import { listToggleSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    const body = await parseBody(request, listToggleSchema);
    const { id } = await params;

    const cigarette = await getCigarette(id);
    if (!cigarette || cigarette.status !== "active") {
      throw new ApiError(404, "Cigarette not found.");
    }

    const enabled = await toggleUserList(auth.uid, id, body.list);
    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: `list.${body.list}.${enabled ? "add" : "remove"}`,
      subjectType: "cigarette",
      subjectId: id,
    });

    return ok({
      enabled,
      list: body.list,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

