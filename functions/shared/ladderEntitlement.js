import { db } from "./admin.js";
import {
  claimGenesisEarlyBirdSeat,
  ensureUserGenesisMirror,
  GENESIS_EARLY_BIRD_SEATS_COLLECTION,
  grantGenesisEarlyBirdSeatGrandfather,
  hasLegacyLadderPresence,
  readGenesisEarlyBirdClaimedCount,
  resolveGenesisEarlyBirdSeatLimit,
} from "./genesisEarlyBird.js";
import { hasCoreFromUserDoc, hasProFromUserDoc } from "./userEntitlement.js";

/**
 * WHY: Must stay aligned with `src/config/monetization.ts` → `leaderboardPaywallEnabled`
 * while genesis seats remain. Project dotenv (`.env.<projectId>`) sets `false` for open access;
 * unset defaults to `true` (fail-closed) so a missing env never accidentally free-uploads after cutover.
 */
function isLeaderboardPaywallForced() {
  // Production-safe default: only an explicit `false` opens genesis free uploads.
  return String(process.env.LEADERBOARD_PAYWALL_ENABLED ?? "true").toLowerCase() !== "false";
}

function throwProRequired() {
  const err = new Error("pro-required");
  err.code = "pro-required";
  throw err;
}

function isGenesisEarlyBirdUserDoc(userData) {
  return userData?.isGenesisEarlyBird === true || userData?.is_genesis_early_bird === true;
}

/**
 * Server ladder upload gate.
 *
 * @param {string} uid
 * @param {Date} [now]
 * @param {{ claimSeat?: boolean, userData?: Record<string, unknown> | null }} [options]
 *   claimSeat=true  → consume / grandfather a seat (real shard upload paths only)
 *   claimSeat=false → gate check only (preview / preflight; never burns the 2000 cap)
 *   userData        → optional preloaded `users/{uid}` doc (avoids a second read on submit)
 *
 * Order of authority (never trusts client seat constants):
 * 1) Active Pro → always allow
 * 2) Existing seat / user-doc genesis mirror / legacy presence → lifetime free (survives cutover)
 * 3) `LEADERBOARD_PAYWALL_ENABLED=true` → new free uploads denied
 * 4) Genesis open + claimSeat → atomic claim; seats-full → Pro required
 * 5) Genesis open + !claimSeat → allow only while under cap (no write to counter)
 *
 * @returns {Promise<{ isPro: boolean }>}
 */
export async function assertLadderUploadAllowed(uid, now = new Date(), options = {}) {
  const claimSeat = options.claimSeat === true;
  const paywallForced = isLeaderboardPaywallForced();
  const userData =
    options.userData !== undefined
      ? options.userData
      : (await db.collection("users").doc(uid).get()).data();
  const hasPro = hasProFromUserDoc(userData, now);

  if (hasPro) return { isPro: true };

  // WHY: Returning free uploaders already hold a seat — skip the claim counter write.
  // Seat check must run BEFORE paywallForced so founding seats survive cutover.
  const existingSeat = await db.collection(GENESIS_EARLY_BIRD_SEATS_COLLECTION).doc(uid).get();
  if (existingSeat.exists) {
    await ensureUserGenesisMirror(uid, existingSeat.data()?.seatNumber ?? null);
    return { isPro: false };
  }

  // WHY: Scheme A user-doc mirror is defense-in-depth when seat collection is momentarily laggy.
  if (isGenesisEarlyBirdUserDoc(userData)) {
    return { isPro: false };
  }

  // WHY: Pre-counter ladder veterans keep free access without consuming post-deploy seats.
  if (await hasLegacyLadderPresence(uid)) {
    await grantGenesisEarlyBirdSeatGrandfather(uid, { now });
    return { isPro: false };
  }

  if (paywallForced) {
    throwProRequired();
  }

  const seatLimit = resolveGenesisEarlyBirdSeatLimit();

  if (!claimSeat) {
    const claimedCount = await readGenesisEarlyBirdClaimedCount();
    if (claimedCount >= seatLimit) {
      throwProRequired();
    }
    return { isPro: false };
  }

  const claim = await claimGenesisEarlyBirdSeat(uid, { seatLimit, now });
  if (claim.ok) return { isPro: false };

  throwProRequired();
}

/**
 * Report gate mirrors client `canAccessLeaderboard` when paywall is on (read path).
 * Genesis founding seats keep report access — same lifetime ladder contract as upload.
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
  if (isGenesisEarlyBirdUserDoc(data)) return;

  const err = new Error("pro-required");
  err.code = "permission-denied";
  throw err;
}
