/**
 * syncGuildLadderScore — crew-only overall score sync (no public leaderboard write).
 * WHY: Privacy Phase 1 — Free members in a guild can update private roster without
 * publishing to leaderboards/{metric}/entries or burning ladder hourly quota / preview.
 *
 * Optional Club Progress Dispatch (`broadcast: true`): reads previousScore inside
 * fan-out TX before overwrite, then FCM multicast after commit (never blocks score write).
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { CALLABLE_OPTS } from "../shared/constants.js";
import { requireSignedInUid, rethrowGuildError } from "./guildAuth.js";
import {
  sanitizeAvatarUrl,
  sanitizeDisplayName,
} from "./guildCore.js";
import { fanOutLadderScoreToGuild } from "./guildScoreFanOut.js";
import { sanitizeGuildRadarScores } from "./guildRadarScores.js";
import {
  normalizeBroadcastMetricType,
  sanitizeDispatchComment,
} from "./clubProgressDispatch.js";
import { runClubProgressBroadcastAfterFanOut } from "./clubProgressBroadcast.js";

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
 *   radarScores?: Record<string, number>;
 *   broadcast: boolean;
 *   comment: string;
 *   broadcastMetricType: string;
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
  const radarScores = sanitizeGuildRadarScores(data.radarScores);
  const broadcast = data.broadcast === true;
  const comment = sanitizeDispatchComment(data.comment);
  const broadcastMetricType = normalizeBroadcastMetricType(data.broadcastMetricType);
  return {
    ok: true,
    ladderScore,
    displayName,
    avatarUrl: avatarUrl || null,
    isAnonymous,
    ...(radarScores ? { radarScores } : {}),
    broadcast,
    comment,
    broadcastMetricType,
  };
}

/**
 * Map fan-out result → Callable payload.
 * WHY: Soft-skip (no-guild) must stay ok:true; hard failures must stay ok:false for client failure UI.
 * @param {{ ok: boolean; reason?: string; guildId?: string }} result
 * @param {number} ladderScore
 * @param {Record<string, unknown>} [broadcastFields]
 */
export function mapFanOutToSyncGuildScoreResponse(result, ladderScore, broadcastFields = {}) {
  if (result.ok === false) {
    const reason = result.reason ?? "fan-out-error";
    return {
      ok: false,
      skipped: false,
      reason,
      error: reason,
      guildId: result.guildId ?? null,
      ...broadcastFields,
    };
  }
  if (result.reason) {
    return {
      ok: true,
      skipped: true,
      reason: result.reason,
      guildId: result.guildId ?? null,
      ...broadcastFields,
    };
  }
  return {
    ok: true,
    skipped: false,
    guildId: result.guildId ?? null,
    ladderScore,
    ...broadcastFields,
  };
}

/**
 * Resolve broadcast response fields after fan-out.
 * WHY: Soft/hard score skips must not claim `not-requested` when the client asked to broadcast.
 * @param {{
 *   broadcast: boolean;
 *   fanOutOk: boolean;
 *   fanOutSoftSkip: boolean;
 *   guildId?: string | null;
 *   broadcastBaseline: object | null;
 *   uid: string;
 *   normalized: object;
 * }} input
 * @param {(args: object) => Promise<Record<string, unknown>>} [broadcastRunner]
 */
export async function resolveSyncGuildBroadcastFields(input, broadcastRunner = runClubProgressBroadcastAfterFanOut) {
  if (input.broadcast !== true) {
    // WHY: Default club sync omits broadcast — return field for clients, do not info-log (hot path).
    return { broadcastSkipped: "not-requested" };
  }
  // Score did not land — skip FCM without lying about intent.
  if (!input.fanOutOk || input.fanOutSoftSkip || !input.guildId) {
    // WHY: Client asked to broadcast but score soft/hard-skipped — this IS diagnostic signal.
    console.info(
      `[ClubDispatch] Skipped for guild ${input.guildId ?? "n/a"}, user ${input.uid}: reason=score-not-landed`
    );
    console.info("[ClubDispatch] Skip detail", {
      fanOutOk: input.fanOutOk,
      fanOutSoftSkip: input.fanOutSoftSkip,
    });
    return {};
  }
  return broadcastRunner({
    uid: input.uid,
    normalized: input.normalized,
    guildId: input.guildId,
    broadcastBaseline: input.broadcastBaseline ?? null,
  });
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
      radarScores: normalized.radarScores,
      captureBroadcastBaseline: normalized.broadcast === true,
      broadcastMetricType: normalized.broadcastMetricType,
    });

    const broadcastFields = await resolveSyncGuildBroadcastFields({
      broadcast: normalized.broadcast,
      fanOutOk: result.ok !== false,
      fanOutSoftSkip: Boolean(result.reason),
      guildId: result.guildId ?? null,
      broadcastBaseline: result.broadcastBaseline ?? null,
      uid,
      normalized,
    });

    return mapFanOutToSyncGuildScoreResponse(result, normalized.ladderScore, broadcastFields);
  } catch (err) {
    rethrowGuildError(err, "[syncGuildLadderScore] unexpected", "sync-guild-score-failed");
  }
}

export const syncGuildLadderScore = onCall(CALLABLE_OPTS, async (request) => {
  return runSyncGuildLadderScore(request);
});
