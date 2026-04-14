import { NextRequest } from "next/server";
import { ApiError, handleApiError, ok } from "@/lib/api";
import {
  getManyCigarettes,
  getUserProfile,
  listReviewsForUser,
} from "@/lib/data";
import { buildPublicUser } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getUserProfile(id);
    if (!profile || profile.status === "deleted") {
      throw new ApiError(404, "User not found.");
    }

    const [favorites, tried, reviews] = await Promise.all([
      getManyCigarettes(profile.favorites),
      getManyCigarettes(profile.tried),
      listReviewsForUser(profile.uid),
    ]);

    return ok({
      user: buildPublicUser(profile),
      favorites: favorites.filter((item) => item.status === "active"),
      tried: tried.filter((item) => item.status === "active"),
      reviews,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

