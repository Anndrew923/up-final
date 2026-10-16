/**
 * syncGuildLadderScore — crew-only overall score sync (no public leaderboard write).
 * WHY: Privacy Phase 1 — Free members in a guild can update private roster without
 * publishing to leaderboards/{metric}/entries or burning ladder hourly quota / preview.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  sanitizeAvatarUrl,
  sanitizeDisplayName,
} from "./guildCore.js";
import { fanOutLadderScoreToGuild } from "./guildScoreFanOut.js";

/**
 * Pure request normalize for unit tests (no Firestore).
 * @param {unknown} data
 * @param {string} uid
 * @returns {{
 *   ok: true;
 *   ladderScore: number;
 *   displayName: string;
 *   avatarUrl: string | null;
 *   isAnonymous: boolean;
 * } | { ok: false; reason: string }}
 */
export function normalizeSyncGuildScoreRequest(data, uid) {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "invalid-input" };
  }
  const score = Number(data.ladderScore ?? data.score);
  if (!Number.isFinite(score) || score < 0) {
    return { ok: false, reason: "invalid-score" };
  }
  const ladderScore = Math.max(0, score);
  const displayName = sanitizeDisplayName(data.displayName, uid);
  const avatarUrl = sanitizeAvatarUrl(data.avatarUrl);
  const isAnonymous = data.isAnonymous === true || data.isAnonymousInLadder === true;
  return {
    ok: true,
    ladderScore,
    displayName,
    avatarUrl: avatarUrl || null,
    isAnonymous,
  };
}

/**
 * Map fan-out result → Callable payload.
 * WHY: Soft-skip (no-guild) must stay ok:true; hard failures must stay ok:false for client failure UI.
 * @param {{ ok: boolean; reason?: string; guildId?: string }} result
 * @param {number} ladderScore
 */
export function mapFanOutToSyncGuildScoreResponse(result, ladderScore) {
  if (result.ok === false) {
    const reason = result.reason ?? "fan-out-error";
    return {
      ok: false,
      skipped: false,
      reason,
      error: reason,
      guildId: result.guildId ?? null,
    };
  }
  if (result.reason) {
    return {
      ok: true,
      skipped: true,
      reason: result.reason,
      guildId: result.guildId ?? null,
    };
  }
  return {
    ok: true,
    skipped: false,
    guildId: result.guildId ?? null,
    ladderScore,
  };
}

/**
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
export async function runSyncGuildLadderScore(request) {
  const uid = requireSignedInUid(request);
  const normalized = normalizeSyncGuildScoreRequest(request.data ?? {}, uid);
  if (!normalized.ok) {
    throw new HttpsError("invalid-argument", normalized.reason);
  }

  try {
    const result = await fanOutLadderScoreToGuild({
      uid,
      ladderScore: normalized.ladderScore,
      displayName: normalized.displayName,
      avatarUrl: normalized.avatarUrl,
      isAnonymous: normalized.isAnonymous,
    });
    return mapFanOutToSyncGuildScoreResponse(result, normalized.ladderScore);
  } catch (err) {
    rethrowGuildError(err, "[syncGuildLadderScore] unexpected", "sync-guild-score-failed");
  }
}

export const syncGuildLadderScore = onCall(CALLABLE_OPTS, async (request) => {
  return runSyncGuildLadderScore(request);
});
