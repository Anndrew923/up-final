/**
 * Genesis early-bird seat claims — server-authoritative atomic counter.
 * WHY: Client `genesisEarlyBirdSeatLimit` is messaging only; upload defense lives here.
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

export function resolveGenesisEarlyBirdSeatLimit() {
  const raw = process.env.GENESIS_EARLY_BIRD_SEAT_LIMIT;
  if (raw == null || String(raw).trim() === "") return GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return GENESIS_EARLY_BIRD_SEAT_LIMIT_DEFAULT;
  return Math.floor(parsed);
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
  if (input.paywallForced) {
    return { allow: false, action: "none", reason: "pro-required" };
  }
  if (input.alreadyClaimed) {
    return { allow: true, action: "none" };
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
 *
 * @param {string} uid
 * @param {{ now?: Date }} [options]
 */
export async function grantGenesisEarlyBirdSeatGrandfather(uid, options = {}) {
  const nowIso = (options.now ?? new Date()).toISOString();
  const seatRef = db.collection(GENESIS_EARLY_BIRD_SEATS_COLLECTION).doc(uid);

  await db.runTransaction(async (tx) => {
    const seatSnap = await tx.get(seatRef);
    if (seatSnap.exists) return;
    tx.set(seatRef, {
      uid,
      claimedAt: nowIso,
      createdAt: FieldValue.serverTimestamp(),
      grandfather: true,
    });
  });
}

/**
 * Atomically claim a free early-bird seat for `uid`, or confirm an existing claim.
 *
 * @param {string} uid
 * @param {{ seatLimit?: number; now?: Date }} [options]
 * @returns {Promise<{ ok: true; claimed: boolean; alreadyHad: boolean; claimedCount: number } | { ok: false; reason: 'seats-full'; claimedCount: number }>}
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
      return { ok: true, claimed: false, alreadyHad: true, claimedCount };
    }

    const claimedCount = Number(metaSnap.data()?.claimedCount) || 0;
    if (claimedCount >= seatLimit) {
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
    });

    return { ok: true, claimed: true, alreadyHad: false, claimedCount: nextCount };
  });
}
