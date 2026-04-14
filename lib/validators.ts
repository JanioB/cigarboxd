import { z } from "zod";

const textField = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max);

export const registerSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
  displayName: textField(60),
});

export const profileUpdateSchema = z.object({
  displayName: textField(60),
  bio: z
    .string()
    .trim()
    .max(280)
    .optional()
    .default(""),
});

export const cigaretteSchema = z.object({
  brand: textField(80),
  name: textField(160),
  company: z.string().trim().max(160).optional().default(""),
  subCategory: z.string().trim().max(80).optional().default(""),
  submissionType: z.string().trim().max(160).optional().default(""),
  dateOfAction: z.string().trim().max(40).optional().default(""),
  description: z.string().trim().max(1200).optional().default(""),
  imageUrl: z.string().trim().url().max(600).optional().or(z.literal("")).default(""),
  imageProvider: z
    .enum(["openverse", "manual", "placeholder"])
    .optional()
    .default("manual"),
  imageAttribution: z.string().trim().max(500).optional().default(""),
  imageLicense: z.string().trim().max(120).optional().default(""),
  imageSourceUrl: z.string().trim().url().max(600).optional().or(z.literal("")).default(""),
  additionalInformation: z.string().trim().max(1000).optional().default(""),
});

export const reviewSchema = z.object({
  rating: z.number().min(0.5).max(5),
  body: z
    .string()
    .trim()
    .min(10)
    .max(2000),
});

export const listToggleSchema = z.object({
  list: z.enum(["favorites", "tried"]),
});

export const blacklistSchema = z.object({
  email: z.string().trim().email().max(160),
  reason: textField(240),
});

export const adminCreateUserSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
  displayName: textField(60),
  role: z.enum(["user", "support", "admin"]),
});

export const moderateUserSchema = z.object({
  action: z.enum(["ban", "unban", "delete", "set-role"]),
  role: z.enum(["user", "support", "admin"]).optional(),
  reason: z.string().trim().max(240).optional().default(""),
});

export const imageSearchSchema = z.object({
  query: textField(200),
});
