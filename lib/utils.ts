import { UserProfile } from "./types";

export const nowIso = () => new Date().toISOString();

export const normalizeEmail = (email: string) =>
  email.trim().toLowerCase();

export const normalizeSearch = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const splitSearchTokens = (...values: string[]) => {
  const tokens = new Set<string>();

  for (const value of values) {
    const normalized = normalizeSearch(value);
    if (!normalized) {
      continue;
    }

    normalized
      .split(" ")
      .filter(Boolean)
      .forEach((token) => tokens.add(token));
  }

  return [...tokens];
};

export const buildSearchText = (...values: string[]) =>
  splitSearchTokens(...values).join(" ");

export const slugify = (value: string) =>
  normalizeSearch(value).replace(/\s+/g, "-");

export const makeProductId = (brand: string, name: string, stn?: string) => {
  const prefix = [brand, name].filter(Boolean).join("-");
  return stn
    ? `${slugify(prefix)}-${slugify(stn)}`
    : `${slugify(prefix)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const emailToKey = (email: string) =>
  encodeURIComponent(normalizeEmail(email));

export const trimText = (value: string) => value.trim().replace(/\s+/g, " ");

export const sanitizeMultiline = (value: string) =>
  value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const average = (values: number[]) => {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
};

export const buildPublicUser = (profile: UserProfile) => ({
  uid: profile.uid,
  displayName: profile.displayName,
  bio: profile.bio,
  photoUrl: profile.photoUrl || "",
  reviewCount: profile.reviewCount,
  favoritesCount: profile.favorites.length,
  triedCount: profile.tried.length,
  role: profile.role,
  status: profile.status,
  createdAt: profile.createdAt,
});

