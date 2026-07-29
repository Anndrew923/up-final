import { db } from "./admin.js";

/**
 * WHY: Admin APPROVE clears public nickname/avatar, but clients still hold local
 * identity and will re-upload on the next sync. Server-side lock forces anonymous
 * / stripped avatar until an admin clears `users.ladderIdentityLock`.
 *
 * @typedef {{ lockNickname: boolean, lockAvatar: boolean }} LadderIdentityLock
 */

/**
 * @param {unknown} raw
 * @returns {LadderIdentityLock | null}
 */
export function parseLadderIdentityLock(raw) {
  if (!raw || typeof raw !== "object") return null;
  const lockNickname = raw.lockNickname === true;
  const lockAvatar = raw.lockAvatar === true;
  if (!lockNickname && !lockAvatar) return null;
  return { lockNickname, lockAvatar };
}

/**
 * @param {string} uid
 * @returns {Promise<LadderIdentityLock | null>}
 */
export async function loadLadderIdentityLock(uid) {
  if (!uid) return null;
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return parseLadderIdentityLock(snap.data()?.ladderIdentityLock);
}

/**
 * Apply active moderation lock onto an upload identity payload.
 * @param {{
 *   displayName: string,
 *   avatarUrl: string | null | undefined,
 *   profile: Record<string, unknown> | null | undefined,
 *   lock: LadderIdentityLock | null,
 * }} input
 */
export function applyLadderIdentityLockToUpload(input) {
  const lock = input.lock;
  if (!lock) {
    return {
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      profile: input.profile ?? null,
    };
  }

  const profile = {
    ...(input.profile && typeof input.profile === "object" ? input.profile : {}),
  };
  let displayName = input.displayName;
  let avatarUrl = input.avatarUrl;

  if (lock.lockNickname) {
    displayName = "Anonymous";
    if (lock.lockAvatar) {
      profile.isAnonymousInLadder = true;
    }
  }
  if (lock.lockAvatar) {
    avatarUrl = null;
  }

  return { displayName, avatarUrl, profile };
}
