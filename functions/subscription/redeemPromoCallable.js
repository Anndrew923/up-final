/**
 * redeemPromoCode — coach invite → 60-day promo Pro + 12-month attribution.
 * WHY: Client must never write promo_codes / attributions; all grants go through this Callable.
 * Attribution + promoExpiresAt are written in ONE transaction to avoid locked attribution without grant.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  CALLABLE_OPTS,
  COMMISSION_COACH_SHARE_DEFAULT,
  PROMO_CODES_COLLECTION,
  PROMO_DEFAULT_ATTRIBUTION_MONTHS,
  PROMO_DEFAULT_GRANT_DAYS,
  USER_ATTRIBUTIONS_COLLECTION,
} from "../shared/constants.js";
import { db, FieldValue } from "../shared/admin.js";
import { resolvePromoExpiresAtIso, safeDate } from "../shared/proExpiry.js";

function isAnonymousProvider(request) {
  const provider = request.auth?.token?.firebase?.sign_in_provider;
  return provider === "anonymous" || !provider;
}

function normalizePromoCode(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase();
}

function addDaysIso(fromMs, days) {
  return new Date(fromMs + days * 24 * 60 * 60 * 1000).toISOString();
}

function addMonthsIso(fromMs, months) {
  const d = new Date(fromMs);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

function resolveGrantDays(promo) {
  const raw = Number(promo.grantDays ?? promo.grant_days);
  if (Number.isFinite(raw) && raw > 0 && raw <= 3650) {
    return Math.floor(raw);
  }
  return PROMO_DEFAULT_GRANT_DAYS;
}

function resolveAttributionMonths(promo) {
  const raw = Number(promo.attributionMonths ?? promo.attribution_months);
  if (Number.isFinite(raw) && raw > 0 && raw <= 120) {
    return Math.floor(raw);
  }
  return PROMO_DEFAULT_ATTRIBUTION_MONTHS;
}

function resolveCommissionRate(promo) {
  const raw = Number(promo.commissionRate ?? promo.commission_rate);
  if (!Number.isFinite(raw)) return COMMISSION_COACH_SHARE_DEFAULT;
  return Math.min(1, Math.max(0, raw));
}

export const redeemPromoCode = onCall(CALLABLE_OPTS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid || isAnonymousProvider(request)) {
    throw new HttpsError("unauthenticated", "sign-in-required");
  }

  const code = normalizePromoCode(request.data?.code);
  if (!code || code.length > 64) {
    throw new HttpsError("invalid-argument", "invalid-promo-code");
  }

  const promoRef = db.collection(PROMO_CODES_COLLECTION).doc(code);
  const attributionRef = db.collection(USER_ATTRIBUTIONS_COLLECTION).doc(uid);
  const userRef = db.collection("users").doc(uid);
  const now = Date.now();

  const txResult = await db.runTransaction(async (tx) => {
    const promoSnap = await tx.get(promoRef);
    const attrSnap = await tx.get(attributionRef);
    const userSnap = await tx.get(userRef);

    if (!promoSnap.exists) {
      throw new HttpsError("not-found", "invalid-promo-code");
    }

    const promo = promoSnap.data() ?? {};
    const isActive = promo.isActive !== false && promo.is_active !== false;
    if (!isActive) {
      throw new HttpsError("failed-precondition", "invalid-promo-code");
    }

    const coachUid =
      typeof promo.coachId === "string"
        ? promo.coachId
        : typeof promo.coach_id === "string"
          ? promo.coach_id
          : "";
    if (!coachUid) {
      throw new HttpsError("failed-precondition", "invalid-promo-code");
    }
    if (coachUid === uid) {
      throw new HttpsError("failed-precondition", "self-redeem-forbidden");
    }

    const deadlineRaw = promo.redemptionDeadline ?? promo.redemption_deadline ?? null;
    const deadline = safeDate(deadlineRaw);
    if (deadline && deadline.getTime() < now) {
      throw new HttpsError("failed-precondition", "promo-code-expired");
    }

    if (attrSnap.exists) {
      throw new HttpsError("already-exists", "already-redeemed");
    }

    const grantDays = resolveGrantDays(promo);
    const attributionMonths = resolveAttributionMonths(promo);
    const commissionRate = resolveCommissionRate(promo);

    const userData = userSnap.data() ?? {};
    const existingPromoIso = resolvePromoExpiresAtIso(userData);
    const existingPromoMs = safeDate(existingPromoIso)?.getTime() ?? 0;
    const grantUntilMs = Date.parse(addDaysIso(now, grantDays));
    // WHY: Never shorten an existing longer promo window on re-entry paths.
    const nextPromoMs = Math.max(existingPromoMs, grantUntilMs);
    if (!Number.isFinite(nextPromoMs) || nextPromoMs <= now) {
      throw new HttpsError("failed-precondition", "invalid-promo-grant");
    }
    const nextPromoIso = new Date(nextPromoMs).toISOString();
    const attributionEndsAt = addMonthsIso(now, attributionMonths);
    const redeemedAt = new Date(now).toISOString();

    // WHY: Redeem must beat a concurrent older webhook version in the same ms window.
    const currentVersion = Number(userData.entitlementVerifiedAtMs) || 0;
    const writeVersion = Math.max(currentVersion + 1, now);

    tx.set(
      attributionRef,
      {
        uid,
        coachUid,
        promoCode: code,
        redeemedAt,
        attributionEndsAt,
        grantDays,
        commissionRate,
      },
      { merge: false }
    );

    // WHY: Same TX as attribution — never leave a locked redeem without promo grant.
    tx.set(
      userRef,
      {
        userId: uid,
        subscriptionStatus: "pro",
        isPro: true,
        promoExpiresAt: nextPromoIso,
        promoExpiresAtMs: nextPromoMs,
        entitlementVerifiedAtMs: writeVersion,
        updatedAt: redeemedAt,
        purchase_status: FieldValue.delete(),
        subscription_status: FieldValue.delete(),
        is_pro: FieldValue.delete(),
        pro_expires_at: FieldValue.delete(),
        pro_expires_at_ms: FieldValue.delete(),
        plan_id: FieldValue.delete(),
        promo_expires_at: FieldValue.delete(),
        promo_expires_at_ms: FieldValue.delete(),
      },
      { merge: true }
    );

    return {
      nextPromoIso,
      grantDays,
      attributionEndsAt,
      coachUid,
    };
  });

  return {
    ok: true,
    promoExpiresAt: txResult.nextPromoIso,
    grantDays: txResult.grantDays,
    attributionEndsAt: txResult.attributionEndsAt,
  };
});
