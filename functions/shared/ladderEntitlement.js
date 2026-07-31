import { db } from "./admin.js";
import {
  claimGenesisEarlyBirdSeat,
  GENESIS_EARLY_BIRD_SEATS_COLLECTION,
} from "./genesisEarlyBird.js";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "./userEntitlement.js";

function isLeaderboardPaywallForced() {
  // Production-safe default: only an explicit `false` opens genesis free uploads.
  return String(process.env.LEADERBOARD_PAYWALL_ENABLED ?? "true").toLowerCase() !== "false";
}

function throwProRequired() {
  const err = new Error("pro-required");
  err.code = "pro-required";
  throw err;
}

/**
 * Server ladder upload gate.
 *
 * Order of authority (never trusts client seat constants):
 * 1) Active Pro → always allow
 * 2) `LEADERBOARD_PAYWALL_ENABLED=true` → free uploads denied
 * 3) Genesis open → atomic early-bird seat claim / grandfather; seats-full → Pro required
 */
export async function assertLadderUploadAllowed(uid, now = new Date()) {
  const paywallForced = isLeaderboardPaywallForced();
  const userSnap = await db.collection("users").doc(uid).get();
  const hasPro = hasProFromUserDoc(userSnap.data(), now);

  if (hasPro) return;
  if (paywallForced) {
    throwProRequired();
  }

  // WHY: Returning free uploaders already hold a seat — skip the write transaction.
  const existingSeat = await db.collection(GENESIS_EARLY_BIRD_SEATS_COLLECTION).doc(uid).get();
  if (existingSeat.exists) return;

  const claim = await claimGenesisEarlyBirdSeat(uid, { now });
  if (claim.ok) return;

  throwProRequired();
}

/**
 * Report gate mirrors client `canAccessLeaderboard` when paywall is on (read path).
 * Early-bird seats do not gate reports — only the explicit paywall flag does.
 */
export async function assertLadderReportAllowed(uid, now = new Date()) {
  if (!isLeaderboardPaywallForced()) return;

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
