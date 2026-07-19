/**
 * Authoritative Pro activation in the Firestore user document.
 * WHY: A mutable subscription must be checked against one revocable source;
 * ID-token custom claims can remain stale until token refresh.
 */
import { db, FieldValue } from "./admin.js";

const legacyAliasCleanup = {
  purchase_status: FieldValue.delete(),
  subscription_status: FieldValue.delete(),
  is_pro: FieldValue.delete(),
  pro_expires_at: FieldValue.delete(),
  pro_expires_at_ms: FieldValue.delete(),
  plan_id: FieldValue.delete(),
};

function entitlementResult(data, applied) {
  const subscriptionStatus = data?.subscriptionStatus ?? data?.subscription_status ?? "free";
  return {
    applied,
    subscriptionStatus,
    proExpiresAt: data?.proExpiresAt ?? data?.pro_expires_at ?? null,
    proExpiresAtMs: data?.proExpiresAtMs ?? data?.pro_expires_at_ms ?? null,
    planId: data?.planId ?? data?.plan_id ?? null,
  };
}

async function writeEntitlementIfFresh(uid, patch, verifiedAtMs) {
  const incomingVersion = Number.isFinite(verifiedAtMs) ? verifiedAtMs : Date.now();
  const ref = db.collection("users").doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data() ?? {};
    const currentVersion = Number(current.entitlementVerifiedAtMs) || 0;
    if (currentVersion > incomingVersion) {
      return entitlementResult(current, false);
    }
    const next = {
      // Entitlement webhooks may arrive before any client profile write. Keep
      // the canonical identity invariant so later rules never see a partial user doc.
      userId: uid,
      ...patch,
      entitlementVerifiedAtMs: incomingVersion,
      updatedAt: new Date().toISOString(),
    };
    tx.set(ref, next, { merge: true });
    return entitlementResult({ ...current, ...next }, true);
  });
}

/**
 * @param {string} uid
 * @param {{
 *   subscriptionStatus?: string;
 *   proExpiresAt?: string | null;
 *   planId?: string | null;
 *   verifiedAtMs?: number;
 * }} payload
 */
export async function applyProEntitlementToUser(uid, payload = {}) {
  if (!uid || typeof uid !== "string") {
    throw new Error("uid-required");
  }

  const subscriptionStatus = payload.subscriptionStatus ?? "pro";
  if (subscriptionStatus !== "pro" && subscriptionStatus !== "grace") {
    throw new Error("active-pro-status-required");
  }
  const proExpiresAt = payload.proExpiresAt ?? null;
  const planId = payload.planId ?? "pro_monthly";
  const expiryMs = proExpiresAt ? Date.parse(proExpiresAt) : Number.NaN;
  if (
    (subscriptionStatus === "pro" || subscriptionStatus === "grace") &&
    (!Number.isFinite(expiryMs) || expiryMs <= Date.now())
  ) {
    throw new Error("valid-pro-expiry-required");
  }

  return writeEntitlementIfFresh(
    uid,
    {
      subscriptionStatus,
      proExpiresAt,
      proExpiresAtMs: expiryMs,
      planId,
      isPro: true,
      ...legacyAliasCleanup,
    },
    payload.verifiedAtMs
  );
}

/**
 * Clears Pro when subscription lapses (webhook / restore path).
 * @param {string} uid
 * @param {{ verifiedAtMs?: number }} options
 */
export async function clearProEntitlementFromUser(uid, options = {}) {
  if (!uid) return null;
  return writeEntitlementIfFresh(
    uid,
    {
      subscriptionStatus: "free",
      isPro: false,
      proExpiresAt: null,
      proExpiresAtMs: null,
      planId: null,
      ...legacyAliasCleanup,
    },
    options.verifiedAtMs
  );
}
