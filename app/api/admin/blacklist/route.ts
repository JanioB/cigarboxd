import { NextRequest } from "next/server";
import { handleApiError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import {
  listBlacklistRecords,
  upsertBlacklistRecord,
  writeAuditLog,
} from "@/lib/data";
import { blacklistSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ["admin"]);
    const items = await listBlacklistRecords();
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
    const body = await parseBody(request, blacklistSchema);
    const item = await upsertBlacklistRecord(body.email, body.reason, auth.uid);

    await writeAuditLog({
      actorId: auth.uid,
      actorEmail: auth.email,
      actorRole: auth.profile.role,
      action: "blacklist.add",
      subjectType: "blacklist",
      subjectId: item.emailKey,
      details: {
        email: item.email,
      },
    });

    return ok({
      item,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

