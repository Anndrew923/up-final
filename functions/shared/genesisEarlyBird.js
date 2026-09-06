/**
 * Genesis early-bird seat claims — server-authoritative atomic counter.
 * WHY: Client `genesisEarlyBirdSeatLimit` is messaging only; upload defense lives here.
 *
 * Mirror contract (Scheme A): every seat grant also writes `users/{uid}` so the client
 * can hydrate `isGenesisEarlyBird` / `genesisSeatNumber` from the same owner-read doc
 * as Pro entitlement — zero extra Client round-trips.
 */
import { db, FieldValue } from "./admin.js";
import {
  ENTRIES_SUBCOLLECTION,
  LEADERBOARD_PREVIEWS_COLLECTION,
  LEADERBOARDS_COLLECTION,
} from "./constants.js";

/** Production seat cap — independent of client monetization constants. */
export const GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT = 2000;

export const GENESIS_EARLY_BIRD_META_PATH = "meta/genesisEarlyBird";
export const GENESIS_EARLY_BIRD_SEATS_COLLECTION = "genesis_early_bird_seats";
/**
 * Public FOMO summary — signed-in clients may read; never expose raw claimedCount.
 * WHY: Keep `meta/genesisEarlyBird` Admin-only while UI still gets staged disclosure.
 */
export const GENESIS_SEAT_PUBLIC_SUMMARY_PATH = "public_meta/genesisSeats";

/** Tiered progressive disclosure thresholds (claimedCount). Server-authoritative. */
export const GENESIS_SEAT_GROWTH_MIN = 300;
export const GENESIS_SEAT_CLOSING_AFTER = 1500;

export function resolveGenesisEarlyBirdSeatLimit() {
  const raw = process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT;
  if (raw == null || String(raw).trim() === "") return GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT;
  return Math.floor(parsed);
}

/**
 * Build the client-safe seat summary (no bare claimedCount).
 * WHY: Cold-start FOMO without tiny live numbers; closing stage gets exact remaining only.
 *
 * @param {{
 *   claimedCount: number;
 *   seatLimit?: number;
 *   paywallForced?: boolean;
 *   now?: Date;
 * }} input
 * @returns {{
 *   seatLimit: number;
 *   stage: 'early' | 'growth' | 'closing' | 'ended';
 *   percentBucket?: number;
 *   remaining?: number;
 *   updatedAt: string;
 * }}
 */
export function buildGenesisSeatPublicSummary(input) {
  const seatLimit =
    Number.isFinite(input.seatLimit) && input.seatLimit >= 1
      ? Math.floor(input.seatLimit)
      : GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT;
  const claimedCount = Number.isFinite(input.claimedCount)
    ? Math.max(0, Math.floor(input.claimedCount))
    : 0;
  const updatedAt = (input.now ?? new Date()).toISOString();

  if (input.paywallForced === true || claimedCount >= seatLimit) {
    return { seatLimit, stage: "ended", updatedAt };
  }

  if (claimedCount < GENESIS_SEAT_GROWTH_MIN) {
    return { seatLimit, stage: "early", updatedAt };
  }

  if (claimedCount <= GENESIS_SEAT_CLOSING_AFTER) {
    // Floor to whole tens so UI never shows noisy single-digit percent swings.
    const rawPct = (claimedCount / seatLimit) * 100;
    const percentBucket = Math.max(10, Math.floor(rawPct / 10) * 10);
    return { seatLimit, stage: "growth", percentBucket, updatedAt };
  }

  return {
    seatLimit,
    stage: "closing",
    remaining: Math.max(0, seatLimit - claimedCount),
    updatedAt,
  };
}

/**
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ claimedCount: number; seatLimit: number; paywallForced?: boolean; now?: Date }} input
 */
function writeGenesisSeatPublicSummaryTx(tx, input) {
  const publicRef = db.doc(GENESIS_SEAT_PUBLIC_SUMMARY_PATH);
  // WHY: Full replace — merge would leave stale percentBucket/remaining across stage flips.
  tx.set(publicRef, buildGenesisSeatPublicSummary(input));
}

/**
 * Normalize seat number for user-doc mirror (grandfather → null).
 * @param {unknown} raw
 * @returns {number | null}
 */
export function normalizeGenesisSeatNumber(raw) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
    return Math.floor(raw);
  }
  return null;
}

/**
 * Payload mirrored onto `users/{uid}` for Client entitlement hydrate.
 * @param {number | null} seatNumber
 */
export function buildUserGenesisMirrorFields(seatNumber) {
  return {
    isGenesisEarlyBird: true,
    genesisSeatNumber: normalizeGenesisSeatNumber(seatNumber),
  };
}

/**
 * Transaction write: mirror genesis flags onto the user profile doc.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} uid
 * @param {number | null} seatNumber
 */
function mirrorGenesisToUserTx(tx, uid, seatNumber) {
  const userRef = db.collection("users").doc(uid);
  tx.set(userRef, buildUserGenesisMirrorFields(seatNumber), { merge: true });
}

/**
 * Idempotent backfill when a seat already exists (pre-mirror deploy or race).
 * @param {string} uid
 * @param {unknown} seatNumber
 */
export async function ensureUserGenesisMirror(uid, seatNumber = null) {
  await db
    .collection("users")
    .doc(uid)
    .set(buildUserGenesisMirrorFields(seatNumber), { merge: true });
}

/**
 * Pure gate for unit tests — no I/O.
 *
 * @param {{
 *   hasPro: boolean;
 *   paywallForced: boolean;
 *   alreadyClaimed: boolean;
 *   claimedCount: number;
 *   seatLimit: number;
 * }} input
 * @returns {{ allow: boolean; action: 'none' | 'claim'; reason?: 'pro-required' | 'seats-full' }}
 */
export function resolveGenesisUploadDecision(input) {
  if (input.hasPro) {
    return { allow: true, action: "none" };
  }
  // WHY: Founding seats survive paywall cutover — lifetime ladder free is the product contract.
  if (input.alreadyClaimed) {
    return { allow: true, action: "none" };
  }
  if (input.paywallForced) {
    return { allow: false, action: "none", reason: "pro-required" };
  }
  const count = Number.isFinite(input.claimedCount) ? input.claimedCount : 0;
  if (count < input.seatLimit) {
    return { allow: true, action: "claim" };
  }
  return { allow: false, action: "none", reason: "seats-full" };
}

/**
 * Users who already appeared on the ladder before seat docs existed.
 * WHY: Grandfather without burning a post-deploy free seat against the 2000 cap.
 */
export async function hasLegacyLadderPresence(uid) {
  const previewSnap = await db.collection(LEADERBOARD_PREVIEWS_COLLECTION).doc(uid).get();
  if (previewSnap.exists) return true;

  const entrySnap = await db
    .collection(LEADERBOARDS_COLLECTION)
    .doc("ladderScore")
    .collection(ENTRIES_SUBCOLLECTION)
    .doc(uid)
    .get();
  return entrySnap.exists;
}

/** Read current claimedCount (0 when meta missing). */
export async function readGenesisEarlyBirdClaimedCount() {
  const metaSnap = await db.doc(GENESIS_EARLY_BIRD_META_PATH).get();
  return Number(metaSnap.data()?.claimedCount) || 0;
}

/**
 * Grant a seat marker without incrementing claimedCount (legacy grandfather).
 * Mirror `isGenesisEarlyBird` with `genesisSeatNumber: null` in the same transaction.
 *
 * @param {string} uid
 * @param {{ now?: Date }} [options]
 */
export async function grantGenesisEarlyBirdSeatGrandfather(uid, options = {}) {
  const nowIso = (options.now ?? new Date()).toISOString();
  const seatRef = db.collection(GENESIS_EARLY_BIRD_SEATS_COLLECTION).doc(uid);

  await db.runTransaction(async (tx) => {
    const seatSnap = await tx.get(seatRef);
    if (seatSnap.exists) {
      // WHY: Pre-mirror seat docs still need user-profile flags for Client hydrate.
      const existingNumber = normalizeGenesisSeatNumber(seatSnap.data()?.seatNumber);
      mirrorGenesisToUserTx(tx, uid, existingNumber);
      return;
    }
    tx.set(seatRef, {
      uid,
      claimedAt: nowIso,
      createdAt: FieldValue.serverTimestamp(),
      grandfather: true,
      seatNumber: null,
    });
    mirrorGenesisToUserTx(tx, uid, null);
  });
}

/**
 * Atomically claim a free early-bird seat for `uid`, or confirm an existing claim.
 * Fresh claims assign `seatNumber = claimedCount` and mirror onto `users/{uid}`.
 *
 * @param {string} uid
 * @param {{ seatLimit?: number; now?: Date }} [options]
 * @returns {Promise<{ ok: true; claimed: boolean; alreadyHad: boolean; claimedCount: number; seatNumber: number | null } | { ok: false; reason: 'seats-full'; claimedCount: number }>}
 */
export async function claimGenesisEarlyBirdSeat(uid, options = {}) {
  const seatLimit = options.seatLimit ?? resolveGenesisEarlyBirdSeatLimit();
  const nowIso = (options.now ?? new Date()).toISOString();
  const metaRef = db.doc(GENESIS_EARLY_BIRD_META_PATH);
  const seatRef = db.collection(GENESIS_EARLY_BIRD_SEATS_COLLECTION).doc(uid);

  return db.runTransaction(async (tx) => {
    const [seatSnap, metaSnap] = await Promise.all([tx.get(seatRef), tx.get(metaRef)]);

    if (seatSnap.exists) {
      const claimedCount = Number(metaSnap.data()?.claimedCount) || 0;
      const seatNumber = normalizeGenesisSeatNumber(seatSnap.data()?.seatNumber);
      // WHY: Idempotent user mirror for seats claimed before Scheme A deploy.
      mirrorGenesisToUserTx(tx, uid, seatNumber);
      return { ok: true, claimed: false, alreadyHad: true, claimedCount, seatNumber };
    }

    const claimedCount = Number(metaSnap.data()?.claimedCount) || 0;
    if (claimedCount >= seatLimit) {
      // WHY: Publish ended summary so clients stop FOMO countdown without reading private meta.
      writeGenesisSeatPublicSummaryTx(tx, {
        claimedCount,
        seatLimit,
        now: options.now ?? new Date(),
      });
      return { ok: false, reason: "seats-full", claimedCount };
    }

    const nextCount = claimedCount + 1;
    tx.set(
      metaRef,
      {
        claimedCount: nextCount,
        seatLimit,
        updatedAt: nowIso,
      },
      { merge: true }
    );
    tx.set(seatRef, {
      uid,
      claimedAt: nowIso,
      createdAt: FieldValue.serverTimestamp(),
      grandfather: false,
      seatNumber: nextCount,
    });
    mirrorGenesisToUserTx(tx, uid, nextCount);
    writeGenesisSeatPublicSummaryTx(tx, {
      claimedCount: nextCount,
      seatLimit,
      now: options.now ?? new Date(),
    });

    return {
      ok: true,
      claimed: true,
      alreadyHad: false,
      claimedCount: nextCount,
      seatNumber: nextCount,
    };
  });
}
