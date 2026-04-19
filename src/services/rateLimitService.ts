export interface UploadRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

interface RateLimitBucket {
  used: number;
  windowStartMs: number;
}

const DEFAULT_KEY = 'leaderboard';
const DEFAULT_LIMIT_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;

const buckets = new Map<string, RateLimitBucket>();

function makeBucketKey(uid: string, key: string): string {
  return `${key}:${uid}`;
}

function getBucket(uid: string, key: string, nowMs: number): RateLimitBucket {
  const bucketKey = makeBucketKey(uid, key);
  const existing = buckets.get(bucketKey);

  if (!existing || nowMs - existing.windowStartMs >= ONE_HOUR_MS) {
    const fresh: RateLimitBucket = { used: 0, windowStartMs: nowMs };
    buckets.set(bucketKey, fresh);
    return fresh;
  }

  return existing;
}

function toResult(bucket: RateLimitBucket, limitPerHour: number): UploadRateLimitResult {
  const remaining = Math.max(0, limitPerHour - bucket.used);
  const resetAt = new Date(bucket.windowStartMs + ONE_HOUR_MS).toISOString();
  return {
    allowed: bucket.used < limitPerHour,
    remaining,
    resetAt,
  };
}

export function checkUploadRateLimit(params: {
  uid: string;
  key?: string;
  limitPerHour?: number;
  now?: Date;
}): UploadRateLimitResult {
  const key = params.key ?? DEFAULT_KEY;
  const limitPerHour = params.limitPerHour ?? DEFAULT_LIMIT_PER_HOUR;
  const nowMs = (params.now ?? new Date()).getTime();
  const bucket = getBucket(params.uid, key, nowMs);
  return toResult(bucket, limitPerHour);
}

export function consumeUploadQuota(params: {
  uid: string;
  key?: string;
  limitPerHour?: number;
  now?: Date;
}): UploadRateLimitResult {
  const key = params.key ?? DEFAULT_KEY;
  const limitPerHour = params.limitPerHour ?? DEFAULT_LIMIT_PER_HOUR;
  const nowMs = (params.now ?? new Date()).getTime();
  const bucket = getBucket(params.uid, key, nowMs);

  if (bucket.used < limitPerHour) {
    bucket.used += 1;
  }

  return toResult(bucket, limitPerHour);
}
