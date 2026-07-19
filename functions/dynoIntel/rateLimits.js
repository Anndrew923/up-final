import {
  DYNO_INTEL_PRO_PER_DAY,
  DYNO_INTEL_RATE_LIMITS_COLLECTION,
  DYNO_INTEL_TRIAL_PER_DAY,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";

const TAIPEI_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
export const DYNO_INTEL_RESERVATION_LEASE_MS = 3 * 60 * 1000;

function taipeiDayKey(now) {
  return new Date(now.getTime() + TAIPEI_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function nextTaipeiDayStartIso(now) {
  const [year, month, day] = taipeiDayKey(now).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1) - TAIPEI_UTC_OFFSET_MS).toISOString();
}

function quotaTier(isPro) {
  return isPro ? "pro" : "trial";
}

function emptyDynoRateDoc(now = new Date()) {
  return {
    dayKey: taipeiDayKey(now),
    countToday: 0,
    limit: DYNO_INTEL_TRIAL_PER_DAY,
    pendingReservations: {},
  };
}

function normalizePendingReservations(raw, now) {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => {
      const expiresAtMs =
        value && typeof value === "object" ? Number(value.expiresAtMs) : Number.NaN;
      return Number.isFinite(expiresAtMs) && expiresAtMs > now.getTime();
    })
  );
}

function normalizeDynoRateDoc(raw, isPro, now = new Date()) {
  const today = taipeiDayKey(now);
  const limit = isPro ? DYNO_INTEL_PRO_PER_DAY : DYNO_INTEL_TRIAL_PER_DAY;
  if (!raw || typeof raw !== "object" || raw.dayKey !== today) {
    return { dayKey: today, countToday: 0, limit, pendingReservations: {} };
  }
  return {
    dayKey: today,
    countToday: Math.min(limit, Math.max(0, Math.floor(Number(raw.countToday) || 0))),
    limit,
    pendingReservations: normalizePendingReservations(raw.pendingReservations, now),
  };
}

export function checkDynoIntelDailyLimit(rateDoc, isPro, now = new Date()) {
  const bucket = normalizeDynoRateDoc(rateDoc, isPro, now);
  const reserved = Object.keys(bucket.pendingReservations).length;
  const remaining = Math.max(0, bucket.limit - bucket.countToday - reserved);
  return {
    allowed: bucket.countToday + reserved < bucket.limit,
    remaining,
    limit: bucket.limit,
    quotaTier: quotaTier(isPro),
    resetAt: nextTaipeiDayStartIso(now),
    bucket,
  };
}

export function reserveDynoIntelUsage(
  rateDoc,
  isPro,
  requestId,
  now = new Date(),
  leaseMs = DYNO_INTEL_RESERVATION_LEASE_MS
) {
  const check = checkDynoIntelDailyLimit(rateDoc, isPro, now);
  if (check.bucket.pendingReservations[requestId]) {
    return { ...check, allowed: false, reason: "in-progress" };
  }
  if (!check.allowed) return { ...check, reason: "quota-exhausted" };

  const pendingReservations = {
    ...check.bucket.pendingReservations,
    [requestId]: {
      reservedAtMs: now.getTime(),
      expiresAtMs: now.getTime() + leaseMs,
    },
  };
  return {
    allowed: true,
    dayKey: check.bucket.dayKey,
    limit: check.limit,
    quotaTier: check.quotaTier,
    remaining: Math.max(
      0,
      check.limit - check.bucket.countToday - Object.keys(pendingReservations).length
    ),
    resetAt: check.resetAt,
    bucket: { ...check.bucket, pendingReservations },
  };
}

export function finalizeDynoIntelUsage(rateDoc, isPro, requestId, now = new Date()) {
  const bucket = normalizeDynoRateDoc(rateDoc, isPro, now);
  if (!bucket.pendingReservations[requestId]) return null;
  const pendingReservations = { ...bucket.pendingReservations };
  delete pendingReservations[requestId];
  const countToday = Math.min(bucket.limit, bucket.countToday + 1);
  return {
    dayKey: bucket.dayKey,
    countToday,
    limit: bucket.limit,
    pendingReservations,
    remaining: Math.max(0, bucket.limit - countToday - Object.keys(pendingReservations).length),
    quotaTier: quotaTier(isPro),
    resetAt: nextTaipeiDayStartIso(now),
  };
}

export function releasePendingDynoIntelUsage(rateDoc, isPro, requestId, now = new Date()) {
  const bucket = normalizeDynoRateDoc(rateDoc, isPro, now);
  if (!bucket.pendingReservations[requestId]) return null;
  const pendingReservations = { ...bucket.pendingReservations };
  delete pendingReservations[requestId];
  return { ...bucket, pendingReservations };
}

export async function loadDynoRateLimitDoc(uid, tx) {
  const ref = db.collection(DYNO_INTEL_RATE_LIMITS_COLLECTION).doc(uid);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    return { ref, data: emptyDynoRateDoc() };
  }
  return { ref, data: snap.data() || emptyDynoRateDoc() };
}

export async function finalizeDynoQuotaReservation(uid, isPro, requestId, now = new Date()) {
  return db.runTransaction(async (tx) => {
    const { ref, data } = await loadDynoRateLimitDoc(uid, tx);
    const finalized = finalizeDynoIntelUsage(data, isPro, requestId, now);
    if (!finalized) {
      return checkDynoIntelDailyLimit(data, isPro, now);
    }
    tx.set(
      ref,
      {
        dayKey: finalized.dayKey,
        countToday: finalized.countToday,
        limit: finalized.limit,
        pendingReservations: finalized.pendingReservations,
      },
      { merge: true }
    );
    return finalized;
  });
}

export async function releasePendingDynoQuotaReservation(uid, isPro, requestId, now = new Date()) {
  if (!uid || !requestId) return false;
  return db.runTransaction(async (tx) => {
    const { ref, data } = await loadDynoRateLimitDoc(uid, tx);
    const released = releasePendingDynoIntelUsage(data, isPro, requestId, now);
    if (!released) return false;
    tx.set(
      ref,
      {
        dayKey: released.dayKey,
        countToday: released.countToday,
        limit: released.limit,
        pendingReservations: released.pendingReservations,
      },
      { merge: true }
    );
    return true;
  });
}
