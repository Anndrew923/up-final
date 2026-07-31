import { db } from "./admin.js";
import {
  claimGenesisEarlyBirdSeat,
  GENESIS_EARLY_BIRD_SEATS_COLLECTION,
  grantGenesisEarlyBirdSeatGrandfather,
  hasLegacyLadderPresence,
  readGenesisEarlyBirdClaimedCount,
  resolveGenesisEarlyBirdSeatLimit,
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
 * @param {string} uid
 * @param {Date} [now]
 * @param {{ claimSeat?: boolean }} [options]
 *   claimSeat=true  → consume / grandfather a seat (real shard upload paths only)
 *   claimSeat=false → gate check only (preview / preflight; never burns the 2000 cap)
 *
 * Order of authority (never trusts client seat constants):
 * 1) Active Pro → always allow
 * 2) `LEADERBOARD_PAYWALL_ENABLED=true` → free uploads denied
 * 3) Existing seat / legacy ladder presence → allow (grandfather; legacy does not ++count)
 * 4) Genesis open + claimSeat → atomic claim; seats-full → Pro required
 * 5) Genesis open + !claimSeat → allow only while under cap (no write to counter)
 */
export async function assertLadderUploadAllowed(uid, now = new Date(), options = {}) {
  const claimSeat = options.claimSeat === true;
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

  // WHY: Pre-counter ladder veterans keep free access without consuming post-deploy seats.
  if (await hasLegacyLadderPresence(uid)) {
    await grantGenesisEarlyBirdSeatGrandfather(uid, { now });
    return;
  }

  const seatLimit = resolveGenesisEarlyBirdSeatLimit();

  if (!claimSeat) {
    const claimedCount = await readGenesisEarlyBirdClaimedCount();
    if (claimedCount >= seatLimit) {
      throwProRequired();
    }
    return;
  }

  const claim = await claimGenesisEarlyBirdSeat(uid, { seatLimit, now });
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
