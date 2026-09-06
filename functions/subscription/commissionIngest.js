/**
 * Idempotent commission ledger from RevenueCat paid events.
 * WHY: Webhook retries must not double-pay coaches — doc id = event.id.
 */
import {
  COMMISSION_LOGS_COLLECTION,
  COMMISSION_PLATFORM_CUT,
  USER_ATTRIBUTIONS_COLLECTION,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";
import { safeDate } from "../shared/proExpiry.js";

const PAID_EVENT_TYPES = new Set(["INITIAL_PURCHASE", "RENEWAL"]);

/**
 * @param {object} event RevenueCat webhook event body.event
 * @returns {Promise<{ written: boolean; skipped?: string }>}
 */
export async function ingestCommissionFromRevenueCatEvent(event) {
  if (!event || typeof event !== "object") {
    return { written: false, skipped: "missing-event" };
  }

  const type = typeof event.type === "string" ? event.type : "";
  if (!PAID_EVENT_TYPES.has(type)) {
    return { written: false, skipped: "non-paid-event" };
  }

  const eventId = typeof event.id === "string" ? event.id.trim() : "";
  if (!eventId) {
    return { written: false, skipped: "missing-event-id" };
  }

  const uid =
    typeof event.app_user_id === "string" ? event.app_user_id.trim() : "";
  if (!uid || uid.startsWith("$RCAnonymousID:")) {
    return { written: false, skipped: "invalid-uid" };
  }

  const priceRaw = event.price_in_purchased_currency ?? event.price;
  const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0) {
    return { written: false, skipped: "no-positive-price" };
  }

  const attrSnap = await db.collection(USER_ATTRIBUTIONS_COLLECTION).doc(uid).get();
  if (!attrSnap.exists) {
    return { written: false, skipped: "no-attribution" };
  }

  const attr = attrSnap.data() ?? {};
  const coachUid = typeof attr.coachUid === "string" ? attr.coachUid : "";
  if (!coachUid) {
    return { written: false, skipped: "missing-coach" };
  }

  const endsAt = safeDate(attr.attributionEndsAt);
  if (!endsAt || endsAt.getTime() < Date.now()) {
    return { written: false, skipped: "attribution-expired" };
  }

  const commissionRate = Number.isFinite(Number(attr.commissionRate))
    ? Math.min(1, Math.max(0, Number(attr.commissionRate)))
    : 0.5;
  const netAfterStore = price * (1 - COMMISSION_PLATFORM_CUT);
  const coachCommission = Math.round(netAfterStore * commissionRate * 100) / 100;
  const currency =
    typeof event.currency === "string" && event.currency.trim()
      ? event.currency.trim()
      : "USD";
  const productId =
    typeof event.product_id === "string"
      ? event.product_id
      : typeof event.product_identifier === "string"
        ? event.product_identifier
        : null;

  const logRef = db.collection(COMMISSION_LOGS_COLLECTION).doc(eventId);
  const existing = await logRef.get();
  if (existing.exists) {
    return { written: false, skipped: "already-logged" };
  }

  try {
    await logRef.create({
      eventId,
      uid,
      coachUid,
      eventType: type,
      productId,
      price,
      currency,
      platformCut: COMMISSION_PLATFORM_CUT,
      coachShareRate: commissionRate,
      coachCommission,
      promoCode: attr.promoCode ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Concurrent webhook retries — treat already-exists as idempotent success.
    if (error?.code === 6 || String(error?.code) === "already-exists") {
      return { written: false, skipped: "already-logged" };
    }
    throw error;
  }

  return { written: true };
}
