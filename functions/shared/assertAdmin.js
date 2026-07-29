import { db } from "./admin.js";

/**
 * WHY: Admin ladder moderation must fail closed at the Callable boundary —
 * Firestore rules already deny client reads on `ladder_reports`.
 * @param {string | undefined | null} uid
 * @param {{ token?: { firebase?: { sign_in_provider?: string } } } | null | undefined} [auth]
 */
export async function assertAdmin(uid, auth = null) {
  if (!uid || typeof uid !== "string") {
    const err = new Error("unauthenticated");
    err.code = "unauthenticated";
    throw err;
  }

  if (auth?.token?.firebase?.sign_in_provider === "anonymous") {
    const err = new Error("admin-required");
    err.code = "permission-denied";
    throw err;
  }

  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists || snap.data()?.isAdmin !== true) {
    const err = new Error("admin-required");
    err.code = "permission-denied";
    throw err;
  }
}
