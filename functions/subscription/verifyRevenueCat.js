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
 * @returns {Promise<{ active: boolean; productIdentifier: string | null; expiresDate: string | null } | null>}
 *   null when secret is unset (verification skipped by caller).
 */
export async function verifyRevenueCatProEntitlement(appUserId) {
  const secret = revenueCatSecret();
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
    return { active: false, productIdentifier: null, expiresDate: null };
  }

  const body = await response.json();
  const entitlementId = revenueCatEntitlementId();
  const entitlement = body?.subscriber?.entitlements?.[entitlementId];
  if (!entitlement) {
    return { active: false, productIdentifier: null, expiresDate: null };
  }

  const expiresAt = parseRcDate(entitlement.expires_date);
  const graceAt = parseRcDate(entitlement.grace_period_expires_date);
  const now = Date.now();
  const active =
    entitlement.expires_date == null ||
    (expiresAt != null && expiresAt.getTime() > now) ||
    (graceAt != null && graceAt.getTime() > now);

  return {
    active,
    productIdentifier: entitlement.product_identifier ?? null,
    expiresDate: entitlement.expires_date ?? null,
  };
}

export function isDevProSyncAllowed() {
  return process.env.FUNCTIONS_EMULATOR === "true";
}
