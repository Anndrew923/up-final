/**
 * Authoritative Pro activation — Firestore user doc + Firebase Auth custom claims.
 * WHY: Callable fast-path (`authToken.pro`) and user-doc checks must stay in lockstep after purchase.
 */
import { admin, db } from "./admin.js";

/**
 * @param {string} uid
 * @param {{
 *   subscriptionStatus?: string;
 *   proExpiresAt?: string | null;
 *   planId?: string | null;
 * }} payload
 */
export async function applyProEntitlementToUser(uid, payload = {}) {
  if (!uid || typeof uid !== "string") {
    throw new Error("uid-required");
  }

  const subscriptionStatus = payload.subscriptionStatus ?? "pro";
  const proExpiresAt = payload.proExpiresAt ?? null;
  const planId = payload.planId ?? "pro_monthly";

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        subscriptionStatus,
        proExpiresAt,
        planId,
        isPro: subscriptionStatus === "pro" || subscriptionStatus === "grace",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

  const authUser = await admin.auth().getUser(uid);
  const existingClaims = authUser.customClaims ?? {};
  await admin.auth().setCustomUserClaims(uid, { ...existingClaims, pro: true });

  return {
    subscriptionStatus,
    proExpiresAt,
    planId,
  };
}

/**
 * Clears Pro custom claim when subscription lapses (webhook / restore path).
 * @param {string} uid
 */
export async function clearProEntitlementFromUser(uid) {
  if (!uid) return;
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        subscriptionStatus: "free",
        isPro: false,
        proExpiresAt: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  const authUser = await admin.auth().getUser(uid);
  const existingClaims = authUser.customClaims ?? {};
  await admin.auth().setCustomUserClaims(uid, { ...existingClaims, pro: false });
}
