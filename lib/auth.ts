import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebase-admin";
import { ApiError } from "./api";
import { UserProfile, UserRole } from "./types";

export type AuthContext = {
  uid: string;
  email: string;
  profile: UserProfile;
};

const getBearerToken = (request: NextRequest) => {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing bearer token.");
  }

  return authorization.slice("Bearer ".length).trim();
};

export const requireAuth = async (
  request: NextRequest,
  roles?: UserRole[]
): Promise<AuthContext> => {
  const token = getBearerToken(request);
  const decoded = await adminAuth().verifyIdToken(token).catch(() => {
    throw new ApiError(401, "Invalid or expired access token.");
  });

  const uid = decoded.uid;
  const email = decoded.email || "";

  const userSnapshot = await adminDb().collection("users").doc(uid).get();
  if (!userSnapshot.exists) {
    throw new ApiError(403, "Account profile not found.");
  }

  const profile = userSnapshot.data() as UserProfile;
  if (profile.status === "banned") {
    throw new ApiError(403, "This account is banned.");
  }

  if (profile.status === "deleted") {
    throw new ApiError(403, "This account has been deleted.");
  }

  if (roles?.length && !roles.includes(profile.role)) {
    throw new ApiError(403, "You do not have permission for this action.");
  }

  return {
    uid,
    email,
    profile,
  };
};

