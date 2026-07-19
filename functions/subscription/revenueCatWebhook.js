import { timingSafeEqual } from "node:crypto";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import {
  applyProEntitlementToUser,
  clearProEntitlementFromUser,
} from "../shared/proEntitlementSync.js";
import { verifyRevenueCatProEntitlement } from "./verifyRevenueCat.js";

const revenueCatApiKey = defineSecret("REVENUECAT_SECRET_API_KEY");
const revenueCatWebhookAuth = defineSecret("REVENUECAT_WEBHOOK_AUTH");

export function isRevenueCatWebhookAuthorized(actual, expected) {
  if (!actual || !expected) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export const revenueCatWebhook = onRequest(
  {
    region: process.env.FUNCTIONS_REGION || "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: [revenueCatApiKey, revenueCatWebhookAuth],
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("method-not-allowed");
      return;
    }
    if (
      !isRevenueCatWebhookAuthorized(request.get("authorization"), revenueCatWebhookAuth.value())
    ) {
      response.status(401).send("unauthorized");
      return;
    }

    const uid =
      request.body?.event && typeof request.body.event.app_user_id === "string"
        ? request.body.event.app_user_id.trim()
        : "";
    if (!uid || uid.startsWith("$RCAnonymousID:")) {
      response.status(400).send("invalid-app-user-id");
      return;
    }

    const verifiedAtMs = Date.now();
    try {
      // Re-query RevenueCat instead of trusting event ordering or event fields.
      const verified = await verifyRevenueCatProEntitlement(uid, revenueCatApiKey.value());
      if (!verified) {
        response.status(503).send("verification-unconfigured");
        return;
      }
      if (!verified.active) {
        await clearProEntitlementFromUser(uid, { verifiedAtMs });
      } else {
        await applyProEntitlementToUser(uid, {
          subscriptionStatus: verified.subscriptionStatus,
          proExpiresAt: verified.expiresDate,
          planId: verified.productIdentifier,
          verifiedAtMs,
        });
      }
      response.status(200).send("ok");
    } catch (error) {
      // Non-2xx asks RevenueCat to retry transient provider/Firestore failures.
      console.error("[revenueCatWebhook] reconciliation failed", error?.message ?? error);
      response.status(503).send("retry");
    }
  }
);
