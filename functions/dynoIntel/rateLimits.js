import {
  DYNO_INTEL_PRO_PER_DAY,
  DYNO_INTEL_RATE_LIMITS_COLLECTION,
  DYNO_INTEL_TRIAL_PER_DAY,
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

function emptyDynoRateDoc(now = new Date()) {
  return {
    dayKey: dayKeyLocal(now),
    countToday: 0,
    limit: DYNO_INTEL_TRIAL_PER_DAY,
  };
}

function normalizeDynoRateDoc(raw, isPro, now = new Date()) {
  const today = dayKeyLocal(now);
  const limit = isPro ? DYNO_INTEL_PRO_PER_DAY : DYNO_INTEL_TRIAL_PER_DAY;
  if (!raw || typeof raw !== "object" || raw.dayKey !== today) {
    return { dayKey: today, countToday: 0, limit };
  }
  return {
    dayKey: today,
    countToday: Math.min(limit, Math.max(0, Math.floor(Number(raw.countToday) || 0))),
    limit,
  };
}

export function checkDynoIntelDailyLimit(rateDoc, isPro, now = new Date()) {
  const bucket = normalizeDynoRateDoc(rateDoc, isPro, now);
  const remaining = Math.max(0, bucket.limit - bucket.countToday);
  return {
    allowed: bucket.countToday < bucket.limit,
    remaining,
    limit: bucket.limit,
    resetAt: nextLocalDayStartIso(now),
    bucket,
  };
}

export function recordDynoIntelUsage(rateDoc, isPro, now = new Date()) {
  const bucket = normalizeDynoRateDoc(rateDoc, isPro, now);
  const countToday = Math.min(bucket.limit, bucket.countToday + 1);
  return {
    dayKey: bucket.dayKey,
    countToday,
    limit: bucket.limit,
    remaining: Math.max(0, bucket.limit - countToday),
    resetAt: nextLocalDayStartIso(now),
  };
}

export async function loadDynoRateLimitDoc(uid, tx) {
  const ref = db.collection(DYNO_INTEL_RATE_LIMITS_COLLECTION).doc(uid);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    return { ref, data: emptyDynoRateDoc() };
  }
  return { ref, data: snap.data() || emptyDynoRateDoc() };
}
