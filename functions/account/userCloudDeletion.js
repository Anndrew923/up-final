/**
 * Shared cloud-data erasure helpers used by self-serve delete and admin ops.
 */
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import {
  erasureLeaderboardShardIds,
  LADDER_AVATARS_STORAGE_PREFIX,
} from "../shared/constants.js";
import { db } from "../shared/admin.js";

const RECENT_AUTH_MAX_AGE_SECONDS = 10 * 60;

export function assertRecentAuthentication(request, nowSeconds = Math.floor(Date.now() / 1000)) {
  const authTime = Number(request.auth?.token?.auth_time);
  if (!Number.isFinite(authTime) || nowSeconds - authTime > RECENT_AUTH_MAX_AGE_SECONDS) {
    const err = new Error("recent-login-required");
    err.code = "failed-precondition";
    throw err;
  }
}

async function recursiveDeleteQuery(collectionName, field, uid) {
  const query = db.collection(collectionName).where(field, "==", uid);
  await db.recursiveDelete(query);
}

/**
 * Delete Storage objects under `ladder-avatars/{uid}/`.
 * WHY: Preview/entry wipe alone leaves HTTPS avatar URLs reachable forever.
 */
export async function deleteLadderAvatarStorage(uid) {
  if (!uid || typeof uid !== "string" || uid.includes("/")) return { deleted: false };
  try {
    const bucket = getStorage().bucket();
    await bucket.deleteFiles({ prefix: `${LADDER_AVATARS_STORAGE_PREFIX}/${uid}/` });
    return { deleted: true };
  } catch (err) {
    // Missing bucket / empty prefix should not block cloud erasure.
    console.warn("[deleteLadderAvatarStorage]", uid, err?.message || err);
    return { deleted: false, error: String(err?.message || err) };
  }
}

/**
 * Remove public ladder presence (preview + shards).
 * @param {string} uid
 * @param {{ clearRateLimits?: boolean, clearAvatarStorage?: boolean }} [opts]
 * @returns {Promise<{ previewDeleted: boolean, shardsDeleted: number, rateLimitCleared: boolean, avatarStorageCleared: boolean }>}
 */
export async function deleteLadderPublicData(uid, opts = {}) {
  const clearRateLimits = opts.clearRateLimits !== false;
  const clearAvatarStorage = opts.clearAvatarStorage !== false;
  let previewDeleted = false;
  let shardsDeleted = 0;
  let rateLimitCleared = false;

  const previewRef = db.collection("leaderboard_previews").doc(uid);
  const previewSnap = await previewRef.get();
  if (previewSnap.exists) {
    await previewRef.delete();
    previewDeleted = true;
  }

  const entryRefs = [];
  for (const metric of erasureLeaderboardShardIds()) {
    entryRefs.push(
      db.collection("leaderboards").doc(metric).collection("entries").doc(uid)
    );
  }
  if (entryRefs.length > 0) {
    const snaps = await db.getAll(...entryRefs);
    const batch = db.batch();
    let ops = 0;
    for (let i = 0; i < snaps.length; i += 1) {
      if (!snaps[i]?.exists) continue;
      batch.delete(entryRefs[i]);
      shardsDeleted += 1;
      ops += 1;
    }
    if (ops > 0) await batch.commit();
  }

  // WHY: Admin "remove from ladder" must not reset upload quotas (abuse-friendly).
  // Full account delete clears the doc so nothing orphaned remains.
  if (clearRateLimits) {
    const rateRef = db.collection("ladder_rate_limits").doc(uid);
    const rateSnap = await rateRef.get();
    if (rateSnap.exists) {
      await rateRef.delete();
      rateLimitCleared = true;
    }
  }

  let avatarStorageCleared = false;
  if (clearAvatarStorage) {
    const storageResult = await deleteLadderAvatarStorage(uid);
    avatarStorageCleared = Boolean(storageResult.deleted);
  }

  return {
    previewDeleted,
    shardsDeleted,
    rateLimitCleared,
    avatarStorageCleared,
  };
}

/**
 * Full cloud erasure for a uid (Firestore trees + ladder avatar Storage). Does not delete Auth.
 */
export async function deleteUserCloudData(uid) {
  await deleteLadderPublicData(uid, { clearRateLimits: true, clearAvatarStorage: true });

  const directRefs = [
    db.collection("dyno_intel_rate_limits").doc(uid),
    db.collection("userSettings").doc(uid),
  ];
  for (const ref of directRefs) {
    await ref.delete().catch(() => {});
  }

  const scopedQueries = [
    ["friendInvitations", "fromUserId"],
    ["friendInvitations", "toUserId"],
    ["communityPosts", "userId"],
    ["assessments", "userId"],
    ["ladderRankings", "userId"],
    ["history", "userId"],
    ["verificationRequests", "userId"],
    ["reports", "reporterId"],
    ["reports", "reportedUserId"],
    ["notifications", "userId"],
    ["ladder_reports", "reporterUid"],
    ["ladder_reports", "targetUid"],
  ];

  for (const [collectionName, field] of scopedQueries) {
    await recursiveDeleteQuery(collectionName, field, uid);
  }
  await db.recursiveDelete(db.collection("users").doc(uid));
}

/**
 * Full account wipe: cloud data + Firebase Auth user.
 */
export async function deleteAuthAndCloudUser(uid) {
  await deleteUserCloudData(uid);
  await getAuth().deleteUser(uid);
}

export { RECENT_AUTH_MAX_AGE_SECONDS };
