import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api";
import { listPublicUsers } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const items = await listPublicUsers();
    return ok({
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

