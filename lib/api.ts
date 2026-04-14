import { ZodSchema } from "zod";
import { NextRequest, NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const parseBody = async <T>(
  request: NextRequest,
  schema: ZodSchema<T>
) => {
  const body = await request.json().catch(() => {
    throw new ApiError(400, "Invalid JSON payload.");
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, "Validation failed.", result.error.flatten());
  }

  return result.data;
};

export const ok = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, init);

export const fail = (status: number, message: string, details?: unknown) =>
  NextResponse.json(
    {
      error: message,
      details,
    },
    { status }
  );

export const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    return fail(error.status, error.message, error.details);
  }

  console.error(error);
  return fail(500, "Internal server error.");
};

export const getClientIp = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

