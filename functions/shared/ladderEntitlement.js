import { db } from "./admin.js";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "./userEntitlement.js";

/**
 * Server Pro gate — mirrors `hasProAccess` + `canUploadLeaderboard` when paywall is on.
 * Set `LEADERBOARD_PAYWALL_ENABLED=true` on the Functions runtime to enforce.
 */
export async function assertLadderUploadAllowed(uid, now = new Date()) {
  const paywallEnabled =
    String(process.env.LEADERBOARD_PAYWALL_ENABLED || "").toLowerCase() === "true";
  if (!paywallEnabled) return;

  const snap = await db.collection("users").doc(uid).get();
  if (hasProFromUserDoc(snap.data(), now)) return;

  const err = new Error("pro-required");
  err.code = "pro-required";
  throw err;
}

/**
 * Report gate mirrors client `canAccessLeaderboard` when paywall is on (read path).
 */
export async function assertLadderReportAllowed(uid, now = new Date()) {
  const paywallEnabled =
    String(process.env.LEADERBOARD_PAYWALL_ENABLED || "").toLowerCase() === "true";
  if (!paywallEnabled) return;

  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data();
  if (!hasCoreFromUserDoc(data)) {
    const err = new Error("core-required");
    err.code = "permission-denied";
    throw err;
  }
  if (hasProFromUserDoc(data, now)) return;

  const err = new Error("pro-required");
  err.code = "permission-denied";
  throw err;
}
