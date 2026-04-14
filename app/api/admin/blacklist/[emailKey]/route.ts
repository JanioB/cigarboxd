import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { deleteBlacklistRecord, writeAuditLog } from "@/lib/data";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ emailKey: string }> }
) {
  try {
    const auth = await requireAuth(request, ["admin"]);
    const { emailKey } = await params;
    await deleteBlacklistRecord(emailKey);

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "blacklist.remove",
      subjectType: "blacklist",
      subjectId: emailKey,
    });

    return ok({
      ok: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

