/**
 * ladderWithdrawPublicPresence — self-serve wipe of global ladder footprints.
 * WHY: Privacy Phase 2 — opting out of public ranking must be able to erase historical
 * entries/preview without touching crew private `guilds.members[]`.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS, erasureLeaderboardShardIds } from "../shared/constants.js";
import { deleteLadderPublicData } from "../account/userCloudDeletion.js";

function isHttpsError(err) {
  if (err instanceof HttpsError) return true;
  if (!err || typeof err !== "object") return false;
  return err.name === "HttpsError" && typeof err.code === "string";
}

/**
 * Pure plan for unit tests — which collections a withdraw touches (never guilds).
 * @returns {{
 *   previewCollection: string;
 *   shardIds: string[];
 *   clearsGuildMembers: false;
 *   clearRateLimits: false;
 *   clearAvatarStorage: true;
 * }}
 */
export function buildWithdrawPublicPresencePlan() {
  return {
    previewCollection: "leaderboard_previews",
    shardIds: erasureLeaderboardShardIds(),
    clearsGuildMembers: false,
    clearRateLimits: false,
    clearAvatarStorage: true,
  };
}

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runWithdrawPublicPresence(request) {
  const uid = request.auth?.uid;
  const provider = request.auth?.token?.firebase?.sign_in_provider;
  if (!uid || provider === "anonymous" || !provider) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }

  // Reuse shared erasure: idempotent deletes; never touches guilds/{id}.members.
  const result = await deleteLadderPublicData(uid, {
    clearRateLimits: false,
    clearAvatarStorage: true,
  });

  return {
    ok: true,
    previewDeleted: result.previewDeleted === true,
    shardsDeleted: Number(result.shardsDeleted) || 0,
    avatarStorageCleared: result.avatarStorageCleared === true,
  };
}

export const ladderWithdrawPublicPresence = onCall(CALLABLE_OPTS, async (request) => {
  try {
    return await runWithdrawPublicPresence(request);
  } catch (err) {
    // WHY: instanceof HttpsError can fail across TX wrappers — also match name+code.
    if (isHttpsError(err)) throw err;
    console.error("[ladderWithdrawPublicPresence] unexpected", err?.message);
    throw new HttpsError("internal", "Withdraw public presence failed");
  }
});
