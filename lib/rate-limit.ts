type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const globalBuckets =
  (globalThis as typeof globalThis & {
    __cigarboxxdRateLimit?: Map<string, RateLimitBucket>;
  }).__cigarboxxdRateLimit ||
  new Map<string, RateLimitBucket>();

(globalThis as typeof globalThis & {
  __cigarboxxdRateLimit?: Map<string, RateLimitBucket>;
}).__cigarboxxdRateLimit = globalBuckets;

export const enforceRateLimit = (
  key: string,
  options: RateLimitOptions
) => {
  const now = Date.now();
  const bucket = globalBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    globalBuckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  globalBuckets.set(key, bucket);

  return {
    allowed: true,
    remaining: options.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
};

