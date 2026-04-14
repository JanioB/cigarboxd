import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import {
  AuditLogRecord,
  BlacklistedEmailRecord,
  CigaretteRecord,
  OpenverseImageResult,
  ReviewRecord,
  UserListKind,
  UserProfile,
  UserRole,
} from "./types";
import {
  average,
  buildPublicUser,
  buildSearchText,
  emailToKey,
  nowIso,
  normalizeEmail,
  normalizeSearch,
  sanitizeMultiline,
  trimText,
} from "./utils";

const db = () => adminDb();

export const getUserProfile = async (uid: string) => {
  const snapshot = await db().collection("users").doc(uid).get();
  return snapshot.exists ? (snapshot.data() as UserProfile) : null;
};

export const listPublicUsers = async () => {
  const snapshot = await db().collection("users").get();
  return snapshot.docs
    .map((document) => document.data() as UserProfile)
    .filter((user) => user.status === "active")
    .sort((left, right) => right.reviewCount - left.reviewCount)
    .map(buildPublicUser);
};

export const getCigarette = async (id: string) => {
  const snapshot = await db().collection("cigarettes").doc(id).get();
  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<CigaretteRecord, "id">),
  } as CigaretteRecord;
};

export const getManyCigarettes = async (ids: string[]) => {
  if (!ids.length) {
    return [];
  }

  const snapshots = await Promise.all(
    ids.map((id) => db().collection("cigarettes").doc(id).get())
  );

  return snapshots
    .filter((snapshot) => snapshot.exists)
    .map(
      (snapshot) =>
        ({
          id: snapshot.id,
          ...(snapshot.data() as Omit<CigaretteRecord, "id">),
        }) as CigaretteRecord
    );
};

export const listCigarettes = async (options?: {
  search?: string;
  limit?: number;
  includeArchived?: boolean;
}) => {
  const limit = options?.limit ?? 50;
  const search = options?.search ? normalizeSearch(options.search) : "";
  const includeArchived = options?.includeArchived ?? false;

  const snapshot = await db().collection("cigarettes").get();

  return snapshot.docs
    .map(
      (document) =>
        ({
          id: document.id,
          ...(document.data() as Omit<CigaretteRecord, "id">),
        }) as CigaretteRecord
    )
    .filter((item) => includeArchived || item.status === "active")
    .filter((item) => !search || item.searchText.includes(search))
    .sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) {
        return right.reviewCount - left.reviewCount;
      }

      return left.brand.localeCompare(right.brand) || left.name.localeCompare(right.name);
    })
    .slice(0, limit);
};

export const listLatestReviews = async (limit = 20) => {
  const snapshot = await db().collection("reviews").get();
  return snapshot.docs
    .map(
      (document) =>
        ({
          id: document.id,
          ...(document.data() as Omit<ReviewRecord, "id">),
        }) as ReviewRecord
    )
    .filter((review) => review.status === "active")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
};

export const listReviewsForCigarette = async (cigaretteId: string) => {
  const snapshot = await db()
    .collection("reviews")
    .where("cigaretteId", "==", cigaretteId)
    .get();

  return snapshot.docs
    .map(
      (document) =>
        ({
          id: document.id,
          ...(document.data() as Omit<ReviewRecord, "id">),
        }) as ReviewRecord
    )
    .filter((review) => review.status === "active")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

export const listReviewsForUser = async (userId: string) => {
  const snapshot = await db().collection("reviews").where("userId", "==", userId).get();

  return snapshot.docs
    .map(
      (document) =>
        ({
          id: document.id,
          ...(document.data() as Omit<ReviewRecord, "id">),
        }) as ReviewRecord
    )
    .filter((review) => review.status === "active")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

export const upsertUserProfile = async (profile: UserProfile) => {
  await db().collection("users").doc(profile.uid).set(profile, { merge: true });
};

export const createDefaultProfile = ({
  uid,
  email,
  displayName,
  role = "user",
}: {
  uid: string;
  email: string;
  displayName: string;
  role?: UserRole;
}): UserProfile => {
  const timestamp = nowIso();

  return {
    uid,
    email: normalizeEmail(email),
    displayName: trimText(displayName),
    bio: "Tracking cigarette packs, brands and personal tasting notes.",
    photoUrl: "",
    role,
    status: "active",
    favorites: [],
    tried: [],
    reviewCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const toggleUserList = async (
  userId: string,
  cigaretteId: string,
  list: UserListKind
) => {
  const fieldValue =
    list === "favorites"
      ? FieldValue.arrayUnion(cigaretteId)
      : FieldValue.arrayUnion(cigaretteId);

  const userRef = db().collection("users").doc(userId);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.exists) {
    throw new Error("User not found.");
  }

  const profile = userSnapshot.data() as UserProfile;
  const currentItems = new Set(profile[list] || []);
  const timestamp = nowIso();

  if (currentItems.has(cigaretteId)) {
    await userRef.update({
      [list]: FieldValue.arrayRemove(cigaretteId),
      updatedAt: timestamp,
    });
    return false;
  }

  await userRef.update({
    [list]: fieldValue,
    updatedAt: timestamp,
  });
  return true;
};

export const createReview = async (review: Omit<ReviewRecord, "id">) => {
  const reviewRef = db().collection("reviews").doc();
  await reviewRef.set(review);
  await Promise.all([
    recalculateCigaretteStats(review.cigaretteId),
    recalculateUserStats(review.userId),
  ]);

  return reviewRef.id;
};

export const removeReview = async ({
  reviewId,
  actorId,
  reason,
}: {
  reviewId: string;
  actorId: string;
  reason?: string;
}) => {
  const reviewRef = db().collection("reviews").doc(reviewId);
  const snapshot = await reviewRef.get();
  if (!snapshot.exists) {
    throw new Error("Review not found.");
  }

  const review = snapshot.data() as ReviewRecord;

  await reviewRef.update({
    status: "removed",
    removedAt: nowIso(),
    removedBy: actorId,
    removedReason: reason || "",
    updatedAt: nowIso(),
  });

  await Promise.all([
    recalculateCigaretteStats(review.cigaretteId),
    recalculateUserStats(review.userId),
  ]);

  return review;
};

export const recalculateCigaretteStats = async (cigaretteId: string) => {
  const cigaretteRef = db().collection("cigarettes").doc(cigaretteId);
  const cigaretteSnapshot = await cigaretteRef.get();
  if (!cigaretteSnapshot.exists) {
    return;
  }

  const reviews = await listReviewsForCigarette(cigaretteId);
  await cigaretteRef.update({
    averageRating: average(reviews.map((review) => review.rating)),
    reviewCount: reviews.length,
    updatedAt: nowIso(),
  });
};

export const recalculateUserStats = async (userId: string) => {
  const userRef = db().collection("users").doc(userId);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.exists) {
    return;
  }

  const reviews = await listReviewsForUser(userId);
  await userRef.update({
    reviewCount: reviews.length,
    updatedAt: nowIso(),
  });
};

export const writeAuditLog = async (
  log: Omit<AuditLogRecord, "id" | "createdAt">
) => {
  const reference = db().collection("auditLogs").doc();
  await reference.set({
    ...log,
    createdAt: nowIso(),
  });
};

export const getBlacklistRecord = async (email: string) => {
  const snapshot = await db()
    .collection("emailBlacklist")
    .doc(emailToKey(email))
    .get();

  return snapshot.exists
    ? ((snapshot.data() as BlacklistedEmailRecord) || null)
    : null;
};

export const listBlacklistRecords = async () => {
  const snapshot = await db().collection("emailBlacklist").get();
  return snapshot.docs
    .map(
      (document) =>
        ({
          emailKey: document.id,
          ...(document.data() as Omit<BlacklistedEmailRecord, "emailKey">),
        }) as BlacklistedEmailRecord
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

export const upsertBlacklistRecord = async (
  email: string,
  reason: string,
  createdBy: string
) => {
  const record: BlacklistedEmailRecord = {
    email: normalizeEmail(email),
    emailKey: emailToKey(email),
    reason: trimText(reason),
    createdAt: nowIso(),
    createdBy,
  };

  await db().collection("emailBlacklist").doc(record.emailKey).set(record);
  return record;
};

export const deleteBlacklistRecord = async (emailKey: string) => {
  await db().collection("emailBlacklist").doc(emailKey).delete();
};

export const buildManualCigaretteRecord = ({
  id,
  brand,
  name,
  company,
  subCategory,
  submissionType,
  dateOfAction,
  description,
  imageUrl,
  imageProvider,
  imageAttribution,
  imageLicense,
  imageSourceUrl,
  additionalInformation,
  actorId,
}: {
  id: string;
  brand: string;
  name: string;
  company: string;
  subCategory: string;
  submissionType: string;
  dateOfAction: string;
  description: string;
  imageUrl?: string;
  imageProvider?: CigaretteRecord["imageProvider"];
  imageAttribution?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  additionalInformation?: string;
  actorId: string;
}): CigaretteRecord => {
  const timestamp = nowIso();

  return {
    id,
    brand: trimText(brand),
    name: trimText(name),
    company: trimText(company),
    subCategory: trimText(subCategory),
    submissionType: trimText(submissionType),
    dateOfAction: trimText(dateOfAction),
    averageRating: 0,
    reviewCount: 0,
    status: "active",
    searchText: buildSearchText(brand, name, company),
    description: sanitizeMultiline(description),
    imageUrl: imageUrl || "",
    imageProvider: imageUrl ? imageProvider || "manual" : "placeholder",
    imageAttribution: imageAttribution || "",
    imageLicense: imageLicense || "",
    imageSourceUrl: imageSourceUrl || "",
    additionalInformation: additionalInformation || "",
    source: "manual",
    sourceLinks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: actorId,
    updatedBy: actorId,
  };
};

export const searchOpenverse = async (query: string): Promise<OpenverseImageResult[]> => {
  const search = encodeURIComponent(query.trim());
  const response = await fetch(
    `https://api.openverse.org/v1/images/?q=${search}&license_type=commercial&page_size=8`,
    {
      headers: {
        "User-Agent": "Cigarboxxd/1.0",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch image suggestions.");
  }

  const payload = await response.json();
  return (payload.results || []).map((item: any) => ({
    id: item.id,
    title: item.title || "Untitled",
    url: item.url,
    thumbnail: item.thumbnail,
    license: item.license || "",
    licenseUrl: item.license_url || "",
    creator: item.creator || "",
    creatorUrl: item.creator_url || "",
    source: item.source || "",
    attribution: item.attribution || "",
    foreignLandingUrl: item.foreign_landing_url || "",
  }));
};
