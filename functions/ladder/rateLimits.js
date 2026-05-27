import {
  FULL_SYNC_COOLDOWN_MS,
  FULL_SYNC_MAX_PER_DAY,
  LEADERBOARD_UPLOADS_PER_HOUR,
  LADDER_RATE_LIMITS_COLLECTION,
  ONE_HOUR_MS,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";

function dayKeyLocal(now) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextLocalDayStartIso(now) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function emptyRateDoc() {
  return { shards: {}, fullSync: { dayKey: dayKeyLocal(new Date()), countToday: 0, lastCompletedAt: null } };
}

function normalizeFullSync(fullSync, now) {
  const today = dayKeyLocal(now);
  if (!fullSync || typeof fullSync !== "object") {
    return { dayKey: today, countToday: 0, lastCompletedAt: null };
  }
  if (fullSync.dayKey !== today) {
    return {
      dayKey: today,
      countToday: 0,
      lastCompletedAt:
        typeof fullSync.lastCompletedAt === "string" ? fullSync.lastCompletedAt : null,
    };
  }
  return {
    dayKey: today,
    countToday: Math.min(
      FULL_SYNC_MAX_PER_DAY,
      Math.max(0, Math.floor(Number(fullSync.countToday) || 0))
    ),
    lastCompletedAt:
      typeof fullSync.lastCompletedAt === "string" ? fullSync.lastCompletedAt : null,
  };
}

function getShardBucket(rateDoc, rateKey, nowMs) {
  const shards = rateDoc.shards && typeof rateDoc.shards === "object" ? rateDoc.shards : {};
  const existing = shards[rateKey];
  if (!existing || nowMs - Number(existing.windowStartMs || 0) >= ONE_HOUR_MS) {
    return { used: 0, windowStartMs: nowMs };
  }
  return {
    used: Math.max(0, Math.floor(Number(existing.used) || 0)),
    windowStartMs: Number(existing.windowStartMs) || nowMs,
  };
}

export function checkShardRateLimit(rateDoc, rateKey, nowMs) {
  const bucket = getShardBucket(rateDoc, rateKey, nowMs);
  const remaining = Math.max(0, LEADERBOARD_UPLOADS_PER_HOUR - bucket.used);
  const resetAt = new Date(bucket.windowStartMs + ONE_HOUR_MS).toISOString();
  return {
    allowed: bucket.used < LEADERBOARD_UPLOADS_PER_HOUR,
    remaining,
    resetAt,
    limitPerHour: LEADERBOARD_UPLOADS_PER_HOUR,
  };
}

export function checkFullSyncRateLimit(rateDoc, now) {
  const fullSync = normalizeFullSync(rateDoc.fullSync, now);
  const remainingToday = Math.max(0, FULL_SYNC_MAX_PER_DAY - fullSync.countToday);

  if (fullSync.countToday >= FULL_SYNC_MAX_PER_DAY) {
    return {
      allowed: false,
      reason: "full-sync-daily-cap",
      nextAllowedAt: nextLocalDayStartIso(now),
      remainingToday: 0,
    };
  }

  if (fullSync.lastCompletedAt) {
    const lastMs = new Date(fullSync.lastCompletedAt).getTime();
    const elapsed = now.getTime() - lastMs;
    if (Number.isFinite(lastMs) && elapsed < FULL_SYNC_COOLDOWN_MS) {
      return {
        allowed: false,
        reason: "full-sync-cooldown",
        nextAllowedAt: new Date(lastMs + FULL_SYNC_COOLDOWN_MS).toISOString(),
        remainingToday,
      };
    }
  }

  return { allowed: true, remainingToday };
}

export function recordShardWrite(rateDoc, rateKey, nowMs) {
  const bucket = getShardBucket(rateDoc, rateKey, nowMs);
  const nextUsed = Math.min(LEADERBOARD_UPLOADS_PER_HOUR, bucket.used + 1);
  if (!rateDoc.shards || typeof rateDoc.shards !== "object") rateDoc.shards = {};
  rateDoc.shards[rateKey] = { used: nextUsed, windowStartMs: bucket.windowStartMs };
  const remaining = Math.max(0, LEADERBOARD_UPLOADS_PER_HOUR - nextUsed);
  return {
    remaining,
    resetAt: new Date(bucket.windowStartMs + ONE_HOUR_MS).toISOString(),
    limitPerHour: LEADERBOARD_UPLOADS_PER_HOUR,
  };
}

export function recordFullSyncSuccess(rateDoc, now) {
  const fullSync = normalizeFullSync(rateDoc.fullSync, now);
  const countToday = Math.min(FULL_SYNC_MAX_PER_DAY, fullSync.countToday + 1);
  rateDoc.fullSync = {
    dayKey: dayKeyLocal(now),
    countToday,
    lastCompletedAt: now.toISOString(),
  };
}

export async function loadRateLimitDoc(uid, tx) {
  const ref = db.collection(LADDER_RATE_LIMITS_COLLECTION).doc(uid);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) return { ref, data: emptyRateDoc() };
  const raw = snap.data() || {};
  return {
    ref,
    data: {
      shards: raw.shards && typeof raw.shards === "object" ? { ...raw.shards } : {},
      fullSync: normalizeFullSync(raw.fullSync, new Date()),
    },
  };
}
