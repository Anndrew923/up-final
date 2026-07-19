import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { db } from "../shared/admin.js";
import {
  applyProEntitlementToUser,
  clearProEntitlementFromUser,
} from "../shared/proEntitlementSync.js";
import { hasCoreFromUserDoc } from "../shared/userEntitlement.js";
import { isDevProSyncAllowed, verifyRevenueCatProEntitlement } from "./verifyRevenueCat.js";

const revenueCatApiKey = defineSecret("REVENUECAT_SECRET_API_KEY");

function isAnonymousProvider(request) {
  const provider = request.auth?.token?.firebase?.sign_in_provider;
  return provider === "anonymous" || !provider;
}

/**
 * Activates Pro on the server after a verified purchase or emulator-only simulation.
 * WHY: Prevents "local Pro UI / Callable pro-required" split-brain.
 */
export const syncProSubscription = onCall(
  { ...CALLABLE_OPTS, secrets: [revenueCatApiKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid || isAnonymousProvider(request)) {
      throw new HttpsError("unauthenticated", "Google sign-in required");
    }

    const data = request.data ?? {};
    const source = typeof data.source === "string" ? data.source : "revenuecat";

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    let proExpiresAt =
      typeof data.proExpiresAt === "string" && data.proExpiresAt ? data.proExpiresAt : null;
    let planId = typeof data.planId === "string" && data.planId ? data.planId : "pro_monthly";
    let subscriptionStatus = "pro";
    const verifiedAtMs = Date.now();

    if (source === "client-simulation") {
      if (!isDevProSyncAllowed()) {
        throw new HttpsError("permission-denied", "simulation-not-allowed");
      }
      if (!proExpiresAt) {
        proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      const verified = await verifyRevenueCatProEntitlement(uid, revenueCatApiKey.value());
      if (verified === null) {
        if (!isDevProSyncAllowed()) {
          throw new HttpsError("failed-precondition", "revenuecat-verification-unconfigured");
        }
        if (!proExpiresAt) {
          proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      } else if (!verified.active) {
        // WHY: Restore/refresh is an authoritative inactive signal. Revoke both
        // local mirrors before returning a successful reconciliation result.
        const reconciled = await clearProEntitlementFromUser(uid, { verifiedAtMs });
        const active =
          reconciled &&
          (reconciled.subscriptionStatus === "pro" || reconciled.subscriptionStatus === "grace") &&
          typeof reconciled.proExpiresAt === "string" &&
          Date.parse(reconciled.proExpiresAt) > Date.now();
        return {
          ok: true,
          active: Boolean(active),
          subscriptionStatus: active ? reconciled.subscriptionStatus : "free",
          proExpiresAt: active ? reconciled.proExpiresAt : null,
          planId: active ? reconciled.planId : null,
        };
      } else {
        if (!verified.expiresDate) {
          throw new HttpsError("failed-precondition", "pro-expiry-missing");
        }
        proExpiresAt = verified.expiresDate;
        subscriptionStatus = verified.subscriptionStatus;
        if (verified.productIdentifier) {
          planId = verified.productIdentifier;
        }
      }
    }

    if (!hasCoreFromUserDoc(userData)) {
      const canMirrorCore =
        (source === "client-simulation" && isDevProSyncAllowed()) || source === "revenuecat";
      if (!canMirrorCore) {
        throw new HttpsError("failed-precondition", "core-required");
      }
      // WHY: Client already enforced Core before purchase; mirror so dyno/ladder server gates align.
      await userRef.set(
        { purchaseStatus: "owned", updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }

    const applied = await applyProEntitlementToUser(uid, {
      subscriptionStatus,
      proExpiresAt,
      planId,
      verifiedAtMs,
    });

    const active =
      (applied.subscriptionStatus === "pro" || applied.subscriptionStatus === "grace") &&
      typeof applied.proExpiresAt === "string" &&
      Date.parse(applied.proExpiresAt) > Date.now();
    return {
      ok: true,
      active,
      subscriptionStatus: active ? applied.subscriptionStatus : "free",
      proExpiresAt: active ? applied.proExpiresAt : null,
      planId: active ? applied.planId : null,
    };
  }
);
