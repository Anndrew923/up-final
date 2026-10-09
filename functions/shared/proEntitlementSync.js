/**
 * Authoritative Pro activation in the Firestore user document.
 * WHY: A mutable subscription must be checked against one revocable source;
 * ID-token custom claims can remain stale until token refresh.
 *
 * Dual-track expiry with credit stacking:
 * - `proExpiresAt` = RevenueCat / store billing window
 * - `promoCreditMs` = pausable gift remainder
 * - `effectiveUntil` = stacked access end (store + frozen credit, or now + remaining)
 * Dual-read still understands legacy max(store, promo) when credit fields are absent.
 */
import { db, FieldValue } from "./admin.js";
import {
  applyPromoGrant,
  applyStoreCleared,
  applyStoreEntitlement,
  resolveEffectiveProExpiryIso,
  resolvePromoExpiresAtIso,
  stackingFieldsFromSnapshot,
} from "./proExpiry.js";

const legacyAliasCleanup = {
  purchase_status: FieldValue.delete(),
  subscription_status: FieldValue.delete(),
  is_pro: FieldValue.delete(),
  pro_expires_at: FieldValue.delete(),
  pro_expires_at_ms: FieldValue.delete(),
  plan_id: FieldValue.delete(),
  promo_expires_at: FieldValue.delete(),
  promo_expires_at_ms: FieldValue.delete(),
};

function entitlementResult(data, applied) {
  const subscriptionStatus = data?.subscriptionStatus ?? data?.subscription_status ?? "free";
  const promoExpiresAt = resolvePromoExpiresAtIso(data);
  const effectiveIso = resolveEffectiveProExpiryIso(data);
  return {
    applied,
    subscriptionStatus,
    proExpiresAt: data?.proExpiresAt ?? data?.pro_expires_at ?? null,
    proExpiresAtMs: data?.proExpiresAtMs ?? data?.pro_expires_at_ms ?? null,
    promoExpiresAt,
    promoCreditMs: typeof data?.promoCreditMs === "number" ? data.promoCreditMs : null,
    promoPaused: data?.promoPaused === true,
    effectiveUntil: data?.effectiveUntil ?? effectiveIso,
    effectiveUntilMs:
      typeof data?.effectiveUntilMs === "number" ? data.effectiveUntilMs : null,
    effectiveProExpiresAt: effectiveIso,
    planId: data?.planId ?? data?.plan_id ?? null,
  };
}

async function writeEntitlementIfFresh(uid, verifiedAtMs, buildPatch) {
  const incomingVersion = Number.isFinite(verifiedAtMs) ? verifiedAtMs : Date.now();
  const ref = db.collection("users").doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data() ?? {};
    const currentVersion = Number(current.entitlementVerifiedAtMs) || 0;
    if (currentVersion > incomingVersion) {
      return entitlementResult(current, false);
    }
    const patch = buildPatch(current);
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

  return writeEntitlementIfFresh(uid, payload.verifiedAtMs, (current) => {
    const stacked = applyStoreEntitlement(current, expiryMs, Date.now());
    return {
      subscriptionStatus,
      planId,
      isPro: true,
      ...stackingFieldsFromSnapshot(stacked),
      ...legacyAliasCleanup,
    };
  });
}

/**
 * Extends (or sets) coach-promo Pro window without wiping RC billing fields.
 * @param {string} uid
 * @param {{
 *   promoExpiresAt?: string;
 *   grantMs?: number;
 *   verifiedAtMs?: number;
 * }} payload
 */
export async function applyPromoEntitlementToUser(uid, payload = {}) {
  if (!uid || typeof uid !== "string") {
    throw new Error("uid-required");
  }
  const nowMs = Date.now();
  let grantMs = Number(payload.grantMs);
  if (!Number.isFinite(grantMs) || grantMs <= 0) {
    const promoExpiresAt = payload.promoExpiresAt ?? null;
    const promoMs = promoExpiresAt ? Date.parse(promoExpiresAt) : Number.NaN;
    grantMs = Number.isFinite(promoMs) ? Math.max(0, promoMs - nowMs) : Number.NaN;
  }
  if (!Number.isFinite(grantMs) || grantMs <= 0) {
    throw new Error("valid-promo-expiry-required");
  }

  return writeEntitlementIfFresh(uid, payload.verifiedAtMs, (current) => {
    const stacked = applyPromoGrant(current, grantMs, nowMs);
    return {
      subscriptionStatus: "pro",
      isPro: true,
      ...stackingFieldsFromSnapshot(stacked),
      ...legacyAliasCleanup,
    };
  });
}

/**
 * Clears RC billing Pro when subscription lapses.
 * WHY: Unpause remaining gift credit — never let RC inactive wipe a still-valid grant.
 * @param {string} uid
 * @param {{ verifiedAtMs?: number }} options
 */
export async function clearProEntitlementFromUser(uid, options = {}) {
  if (!uid) return null;

  const incomingVersion = Number.isFinite(options.verifiedAtMs)
    ? options.verifiedAtMs
    : Date.now();
  const ref = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data() ?? {};
    const currentVersion = Number(current.entitlementVerifiedAtMs) || 0;
    if (currentVersion > incomingVersion) {
      return entitlementResult(current, false);
    }

    const now = new Date();
    const stacked = applyStoreCleared(current, now);
    const stillPro =
      stacked.effectiveUntilMs != null && stacked.effectiveUntilMs > now.getTime();
    const next = {
      userId: uid,
      subscriptionStatus: stillPro ? "pro" : "free",
      isPro: stillPro,
      planId: null,
      ...stackingFieldsFromSnapshot(stacked),
      entitlementVerifiedAtMs: incomingVersion,
      updatedAt: now.toISOString(),
      ...legacyAliasCleanup,
    };
    tx.set(ref, next, { merge: true });
    return entitlementResult({ ...current, ...next }, true);
  });
}
