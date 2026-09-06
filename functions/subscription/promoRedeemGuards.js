/**
 * Pure promo redeem guards — rate window + code-level capacity.
 * WHY: Keep TX predicates unit-testable without Firestore; Callable only wires Admin SDK.
 */
import {
  ONE_HOUR_MS,
  PROMO_REDEEM_MAX_ATTEMPTS_PER_HOUR,
} from "../shared/constants.js";

/**
 * @param {unknown} raw
 * @param {number} nowMs
 * @param {number} [windowMs]
 * @returns {{ windowStartMs: number; count: number }}
 */
export function normalizePromoRedeemRateDoc(
  raw,
  nowMs = Date.now(),
  windowMs = ONE_HOUR_MS
) {
  if (!raw || typeof raw !== "object") {
    return { windowStartMs: nowMs, count: 0 };
  }
  const windowStartMs = Number(raw.windowStartMs) || nowMs;
  if (nowMs - windowStartMs >= windowMs) {
    return { windowStartMs: nowMs, count: 0 };
  }
  return {
    windowStartMs,
    count: Math.max(0, Math.floor(Number(raw.count) || 0)),
  };
}

/**
 * Consume one attempt (success or failure). Mutates nothing — returns next doc.
 * @param {unknown} raw
 * @param {number} [nowMs]
 * @param {{ windowMs?: number; maxAttempts?: number }} [opts]
 * @returns {{
 *   allowed: boolean;
 *   reason?: string;
 *   remaining: number;
 *   resetAt: string;
 *   next: { windowStartMs: number; count: number };
 * }}
 */
export function consumePromoRedeemAttempt(raw, nowMs = Date.now(), opts = {}) {
  const windowMs = opts.windowMs ?? ONE_HOUR_MS;
  const maxAttempts = opts.maxAttempts ?? PROMO_REDEEM_MAX_ATTEMPTS_PER_HOUR;
  const bucket = normalizePromoRedeemRateDoc(raw, nowMs, windowMs);
  const resetAt = new Date(bucket.windowStartMs + windowMs).toISOString();

  if (bucket.count >= maxAttempts) {
    return {
      allowed: false,
      reason: "promo-redeem-rate-limited",
      remaining: 0,
      resetAt,
      next: bucket,
    };
  }

  const next = {
    windowStartMs: bucket.windowStartMs,
    count: bucket.count + 1,
  };
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - next.count),
    resetAt,
    next,
  };
}

/**
 * @param {Record<string, unknown>} promo
 * @returns {number | null} Positive cap, or null when uncapped / missing.
 */
export function resolveMaxRedemptions(promo) {
  if (!promo || typeof promo !== "object") return null;
  const raw = Number(promo.maxRedemptions ?? promo.max_redemptions);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.floor(raw);
}

/**
 * @param {Record<string, unknown>} promo
 * @returns {number}
 */
export function resolveRedeemedCount(promo) {
  if (!promo || typeof promo !== "object") return 0;
  const raw = Number(promo.redeemedCount ?? promo.redeemed_count);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
}

/**
 * True when maxRedemptions is set and redeemedCount has reached it.
 * @param {Record<string, unknown>} promo
 */
export function isPromoRedemptionCapacityExhausted(promo) {
  const max = resolveMaxRedemptions(promo);
  if (max == null) return false;
  return resolveRedeemedCount(promo) >= max;
}
