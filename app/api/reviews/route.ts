import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api";
import { listLatestReviews } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "50");
    const items = await listLatestReviews(limit);
    return ok({
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

