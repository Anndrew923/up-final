import { db } from "./admin.js";

function safeDate(input) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasProFromUserDoc(data, now = new Date()) {
  const purchaseStatus = data?.purchaseStatus ?? data?.purchase_status;
  const subscriptionStatus = data?.subscriptionStatus ?? data?.subscription_status;
  if (purchaseStatus !== "owned") return false;
  if (subscriptionStatus === "pro") return true;
  if (subscriptionStatus !== "grace") return false;
  const expiresAt = safeDate(data?.proExpiresAt ?? data?.pro_expires_at);
  if (!expiresAt) return false;
  return expiresAt.getTime() >= now.getTime();
}

/**
 * Server Pro gate — mirrors `hasProAccess` + `canUploadLeaderboard` when paywall is on.
 * Set `LEADERBOARD_PAYWALL_ENABLED=true` on the Functions runtime to enforce.
 */
export async function assertLadderUploadAllowed(uid, authToken) {
  const paywallEnabled =
    String(process.env.LEADERBOARD_PAYWALL_ENABLED || "").toLowerCase() === "true";
  if (!paywallEnabled) return;

  if (authToken?.pro === true) return;

  const snap = await db.collection("users").doc(uid).get();
  if (hasProFromUserDoc(snap.data())) return;

  const err = new Error("pro-required");
  err.code = "pro-required";
  throw err;
}

/**
 * Report gate mirrors client `canAccessLeaderboard` when paywall is on (read path).
 */
export async function assertLadderReportAllowed(uid, authToken) {
  const paywallEnabled =
    String(process.env.LEADERBOARD_PAYWALL_ENABLED || "").toLowerCase() === "true";
  if (!paywallEnabled) return;

  if (authToken?.pro === true) return;

  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data();
  if (data?.purchaseStatus !== "owned" && data?.purchase_status !== "owned") {
    const err = new Error("core-required");
    err.code = "permission-denied";
    throw err;
  }
  if (hasProFromUserDoc(data)) return;

  const err = new Error("pro-required");
  err.code = "permission-denied";
  throw err;
}
