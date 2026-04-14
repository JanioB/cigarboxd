import { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { searchOpenverse } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ["support", "admin"]);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      throw new ApiError(400, "A search query is required.");
    }

    const items = await searchOpenverse(query);
    return ok({
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
