/**
 * Server-side RevenueCat subscriber verification (REST v1).
 * WHY: Client purchase callbacks must not be trusted without provider proof in production.
 */

function revenueCatSecret() {
  return (process.env.REVENUECAT_SECRET_API_KEY || "").trim();
}

function revenueCatEntitlementId() {
  return (process.env.REVENUECAT_ENTITLEMENT_ID || "pro").trim();
}

function parseRcDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {string} appUserId Firebase uid used as RevenueCat app user id.
 * @param {string} apiKey Secret Manager value; env fallback keeps local tests compatible.
 * @returns {Promise<{ active: boolean; subscriptionStatus: "pro" | "grace" | "free"; productIdentifier: string | null; expiresDate: string | null } | null>}
 *   null when secret is unset (verification skipped by caller).
 */
export async function verifyRevenueCatProEntitlement(appUserId, apiKey = revenueCatSecret()) {
  const secret = apiKey.trim();
  if (!secret) return null;

  const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        active: false,
        subscriptionStatus: "free",
        productIdentifier: null,
        expiresDate: null,
      };
    }
    // Provider/config outages are unknown, not proof of cancellation. Throw so
    // callers preserve the last known entitlement instead of revoking Pro.
    throw new Error(`revenuecat-http-${response.status}`);
  }

  const body = await response.json();
  const entitlementId = revenueCatEntitlementId();
  const entitlement = body?.subscriber?.entitlements?.[entitlementId];
  if (!entitlement) {
    return {
      active: false,
      subscriptionStatus: "free",
      productIdentifier: null,
      expiresDate: null,
    };
  }

  const expiresAt = parseRcDate(entitlement.expires_date);
  const graceAt = parseRcDate(entitlement.grace_period_expires_date);
  const now = Date.now();
  const expiresAtMs = expiresAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const graceAtMs = graceAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const accessUntilMs = Math.max(expiresAtMs, graceAtMs);
  const active = Number.isFinite(accessUntilMs) && accessUntilMs > now;
  const inGrace = active && graceAtMs > expiresAtMs && expiresAtMs <= now;

  return {
    active,
    subscriptionStatus: active ? (inGrace ? "grace" : "pro") : "free",
    productIdentifier: entitlement.product_identifier ?? null,
    expiresDate: active ? new Date(accessUntilMs).toISOString() : null,
  };
}

export function isDevProSyncAllowed() {
  return process.env.FUNCTIONS_EMULATOR === "true";
}
