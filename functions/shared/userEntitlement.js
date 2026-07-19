/**
 * Server-side entitlement mirrors for `src/logic/core/entitlement.ts`.
 * WHY: Single source on Functions — ladder + dynoIntel share the same user doc rules.
 */

function safeDate(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hasCoreFromUserDoc(data) {
  const purchaseStatus = data?.purchaseStatus ?? data?.purchase_status;
  // WHY: Download-includes-Core — client always normalizes to owned; missing Firestore
  // field on free Google users must not block Dyno trial (2/day) with core-required.
  if (purchaseStatus == null || purchaseStatus === "") return true;
  return purchaseStatus === "owned";
}

export function hasProFromUserDoc(data, now = new Date()) {
  if (!hasCoreFromUserDoc(data)) return false;
  const subscriptionStatus = data?.subscriptionStatus ?? data?.subscription_status;
  if (subscriptionStatus !== "pro" && subscriptionStatus !== "grace") return false;
  const expiresAt = safeDate(data?.proExpiresAt ?? data?.pro_expires_at);
  if (!expiresAt) return false;
  return expiresAt.getTime() >= now.getTime();
}
