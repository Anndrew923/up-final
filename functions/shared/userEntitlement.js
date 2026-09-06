/**
 * Server-side entitlement mirrors for `src/logic/core/entitlement.ts`.
 * WHY: Single source on Functions — ladder + dynoIntel share the same user doc rules.
 */

import {
  isPromoExpiryActive,
  resolveEffectiveProExpiryMs,
  safeDate,
} from "./proExpiry.js";

export { safeDate, resolveEffectiveProExpiryMs, isPromoExpiryActive };

export function hasCoreFromUserDoc(data) {
  const purchaseStatus = data?.purchaseStatus ?? data?.purchase_status;
  // WHY: Download-includes-Core — client always normalizes to owned; missing Firestore
  // field on free Google users must not block Dyno trial (2/day) with core-required.
  if (purchaseStatus == null || purchaseStatus === "") return true;
  return purchaseStatus === "owned";
}

/**
 * Effective Pro = max(rcExpiresAt, promoExpiresAt) still in the future.
 * WHY: Promo-only users keep access after RC clear; paid users keep RC window.
 */
export function hasProFromUserDoc(data, now = new Date()) {
  if (!hasCoreFromUserDoc(data)) return false;

  const effectiveMs = resolveEffectiveProExpiryMs(data);
  if (effectiveMs == null || effectiveMs < now.getTime()) return false;

  const subscriptionStatus = data?.subscriptionStatus ?? data?.subscription_status;
  if (subscriptionStatus === "pro" || subscriptionStatus === "grace") return true;

  // Defense in depth: redeem always sets status=pro, but tolerate free+active promo.
  return isPromoExpiryActive(data, now);
}
