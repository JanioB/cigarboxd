export type UserRole = "user" | "support" | "admin";
export type UserStatus = "active" | "banned" | "deleted";
export type CigaretteStatus = "active" | "archived";
export type ReviewStatus = "active" | "removed";
export type ImageProvider = "openverse" | "manual" | "placeholder";
export type ProductSource = "fda" | "manual";
export type UserListKind = "favorites" | "tried";

export interface SourceLink {
  label: string;
  url: string;
}

export interface CigaretteRecord {
  id: string;
  brand: string;
  name: string;
  company: string;
  subCategory: string;
  submissionType: string;
  dateOfAction: string;
  averageRating: number;
  reviewCount: number;
  status: CigaretteStatus;
  searchText: string;
  description?: string;
  imageUrl?: string;
  imageProvider?: ImageProvider;
  imageAttribution?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  stn?: string;
  additionalInformation?: string;
  associatedMrtp?: string;
  source: ProductSource;
  sourceLinks?: SourceLink[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ReviewRecord {
  id: string;
  cigaretteId: string;
  cigaretteName: string;
  cigaretteBrand: string;
  userId: string;
  userDisplayName: string;
  userPhotoUrl?: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
  removedBy?: string;
  removedReason?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  photoUrl?: string;
  role: UserRole;
  status: UserStatus;
  favorites: string[];
  tried: string[];
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  bannedAt?: string;
  deletedAt?: string;
}

export interface AccountResponse {
  profile: UserProfile;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  subjectType: "cigarette" | "review" | "user" | "blacklist";
  subjectId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface BlacklistedEmailRecord {
  email: string;
  emailKey: string;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface OpenverseImageResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  license: string;
  licenseUrl: string;
  creator: string;
  creatorUrl: string;
  source: string;
  attribution: string;
  foreignLandingUrl: string;
}

