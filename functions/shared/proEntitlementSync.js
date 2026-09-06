/**
 * Authoritative Pro activation in the Firestore user document.
 * WHY: A mutable subscription must be checked against one revocable source;
 * ID-token custom claims can remain stale until token refresh.
 *
 * Dual-track expiry:
 * - `proExpiresAt` = RevenueCat / store billing window
 * - `promoExpiresAt` = coach invite grant (independent)
 * Effective access = max(rc, promo). clearPro must not wipe an active promo.
 */
import { db, FieldValue } from "./admin.js";
import {
  isPromoExpiryActive,
  resolveEffectiveProExpiryIso,
  resolvePromoExpiresAtIso,
  safeDate,
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
  const effectiveIso = resolveEffectiveProExpiryIso({
    proExpiresAt: data?.proExpiresAt ?? data?.pro_expires_at ?? null,
    promoExpiresAt,
  });
  return {
    applied,
    subscriptionStatus,
    proExpiresAt: data?.proExpiresAt ?? data?.pro_expires_at ?? null,
    proExpiresAtMs: data?.proExpiresAtMs ?? data?.pro_expires_at_ms ?? null,
    promoExpiresAt,
    effectiveProExpiresAt: effectiveIso,
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
 * Extends (or sets) coach-promo Pro window without touching RC billing fields.
 * @param {string} uid
 * @param {{
 *   promoExpiresAt: string;
 *   verifiedAtMs?: number;
 * }} payload
 */
export async function applyPromoEntitlementToUser(uid, payload = {}) {
  if (!uid || typeof uid !== "string") {
    throw new Error("uid-required");
  }
  const promoExpiresAt = payload.promoExpiresAt ?? null;
  const promoMs = promoExpiresAt ? Date.parse(promoExpiresAt) : Number.NaN;
  if (!Number.isFinite(promoMs) || promoMs <= Date.now()) {
    throw new Error("valid-promo-expiry-required");
  }

  return writeEntitlementIfFresh(
    uid,
    {
      subscriptionStatus: "pro",
      isPro: true,
      promoExpiresAt,
      promoExpiresAtMs: promoMs,
      ...legacyAliasCleanup,
    },
    payload.verifiedAtMs
  );
}

/**
 * Clears RC billing Pro when subscription lapses.
 * WHY: If promo window is still active, keep Pro — never let RC inactive wipe coach grant.
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
    if (isPromoExpiryActive(current, now)) {
      const promoIso = resolvePromoExpiresAtIso(current);
      const promoMs = safeDate(promoIso)?.getTime() ?? null;
      const next = {
        userId: uid,
        subscriptionStatus: "pro",
        isPro: true,
        // Clear store billing mirror only.
        proExpiresAt: null,
        proExpiresAtMs: null,
        planId: null,
        promoExpiresAt: promoIso,
        promoExpiresAtMs: promoMs,
        entitlementVerifiedAtMs: incomingVersion,
        updatedAt: now.toISOString(),
        ...legacyAliasCleanup,
      };
      tx.set(ref, next, { merge: true });
      return entitlementResult({ ...current, ...next }, true);
    }

    const next = {
      userId: uid,
      subscriptionStatus: "free",
      isPro: false,
      proExpiresAt: null,
      proExpiresAtMs: null,
      planId: null,
      promoExpiresAt: null,
      promoExpiresAtMs: null,
      entitlementVerifiedAtMs: incomingVersion,
      updatedAt: now.toISOString(),
      ...legacyAliasCleanup,
    };
    tx.set(ref, next, { merge: true });
    return entitlementResult({ ...current, ...next }, true);
  });
}
