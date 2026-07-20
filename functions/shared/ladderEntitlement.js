import { db } from "./admin.js";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "./userEntitlement.js";

/**
 * Server Pro gate — production-safe by default. Only an explicit `false` may
 * open emulator/beta/genesis flows; a missing deployment variable must never unlock writes.
 *
 * Genesis open access: set LEADERBOARD_PAYWALL_ENABLED=false in functions/.env (deployed dotenv).
 */
export async function assertLadderUploadAllowed(uid, now = new Date()) {
  const paywallEnabled =
    String(process.env.LEADERBOARD_PAYWALL_ENABLED ?? "true").toLowerCase() !== "false";
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
    String(process.env.LEADERBOARD_PAYWALL_ENABLED ?? "true").toLowerCase() !== "false";
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
