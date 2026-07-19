import { db } from "../shared/admin.js";
import {
  applyProEntitlementToUser,
  clearProEntitlementFromUser,
} from "../shared/proEntitlementSync.js";
import { verifyRevenueCatProEntitlement } from "../subscription/verifyRevenueCat.js";

const apiKey = (process.env.REVENUECAT_SECRET_API_KEY || "").trim();
if (!apiKey) {
  throw new Error("REVENUECAT_SECRET_API_KEY is required");
}

const snapshots = await Promise.all([
  db.collection("users").where("subscriptionStatus", "in", ["pro", "grace"]).get(),
  db.collection("users").where("subscription_status", "in", ["pro", "grace"]).get(),
  db.collection("users").where("isPro", "==", true).get(),
  db.collection("users").where("is_pro", "==", true).get(),
]);
const users = new Map();
for (const snapshot of snapshots) {
  for (const doc of snapshot.docs) users.set(doc.id, doc);
}

let activated = 0;
let revoked = 0;
for (const uid of users.keys()) {
  const verifiedAtMs = Date.now();
  const verified = await verifyRevenueCatProEntitlement(uid, apiKey);
  if (!verified) throw new Error("RevenueCat verification is unavailable");

  if (verified.active) {
    await applyProEntitlementToUser(uid, {
      subscriptionStatus: verified.subscriptionStatus,
      proExpiresAt: verified.expiresDate,
      planId: verified.productIdentifier,
      verifiedAtMs,
    });
    activated += 1;
  } else {
    await clearProEntitlementFromUser(uid, { verifiedAtMs });
    revoked += 1;
  }
}

console.info(
  `[backfillProEntitlements] complete: ${activated} active, ${revoked} revoked, ${users.size} total`
);
