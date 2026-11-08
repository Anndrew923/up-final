/**
 * Fan-out overall ladder score into `guilds/{guildId}.members[]`.
 * WHY: Private crew ladder is an embedded snapshot — must update on ladderScore writes
 * without ever failing the primary global ladder submit (graceful degradation).
 *
 * When `captureBroadcastBaseline: true`, reads previousScore / roster identity
 * BEFORE overwriting members[] so Club Progress Dispatch can compute delta safely.
 */
import { db } from "../shared/admin.js";
import { GUILDS_COLLECTION } from "../shared/constants.js";
import { readUserGuildId } from "./guildCore.js";
import { sanitizeGuildRadarScores } from "./guildRadarScores.js";
import {
  normalizeBroadcastMetricType,
  resolvePreviousScoreFromMember,
} from "./clubProgressDispatch.js";

/** @deprecated Prefer `readUserGuildId` from guildCore — kept as stable fan-out export. */
export const readGuildIdFromUserData = readUserGuildId;

/**
 * Pure member-array patch + score-desc sort (stable tie-break by name/uid).
 * @param {unknown} guildData
 * @param {string} uid
 * @param {{
 *   ladderScore: number;
 *   displayName?: string;
 *   avatarUrl?: string | null;
 *   clearAvatar?: boolean;
 *   radarScores?: unknown;
 *   updatedAt: string;
 * }} patch
 * @returns {{
 *   ok: true;
 *   members: object[];
 * } | { ok: false; reason: 'not-member' | 'invalid-guild' }}
 */
export function applyMemberLadderScorePatch(guildData, uid, patch) {
  if (!guildData || typeof guildData !== "object") {
    return { ok: false, reason: "invalid-guild" };
  }
  if (guildData.status === "disbanded") {
    return { ok: false, reason: "invalid-guild" };
  }

  const members = Array.isArray(guildData.members) ? [...guildData.members] : [];
  const idx = members.findIndex(
    (m) => m && typeof m === "object" && typeof m.uid === "string" && m.uid === uid
  );
  if (idx < 0) {
    return { ok: false, reason: "not-member" };
  }

  const prev = members[idx] && typeof members[idx] === "object" ? { ...members[idx] } : { uid };
  const score = Number(patch.ladderScore);
  prev.uid = uid;
  prev.ladderScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  prev.updatedAt = patch.updatedAt;
  if (typeof patch.displayName === "string" && patch.displayName.trim()) {
    prev.displayName = patch.displayName.trim().slice(0, 32);
  }
  if (patch.clearAvatar === true) {
    delete prev.avatarUrl;
  } else if (typeof patch.avatarUrl === "string" && patch.avatarUrl.startsWith("https://")) {
    prev.avatarUrl = patch.avatarUrl;
  }
  const radar = sanitizeGuildRadarScores(patch.radarScores);
  if (radar) {
    prev.radarScores = radar;
  }

  members[idx] = prev;
  // WHY: Same contract as client `sortGuildMembersByScore` — score desc, name, uid.
  members.sort((a, b) => {
    const sa = Number(a?.ladderScore) || 0;
    const sb = Number(b?.ladderScore) || 0;
    if (sb !== sa) return sb - sa;
    const na = typeof a?.displayName === "string" ? a.displayName : "";
    const nb = typeof b?.displayName === "string" ? b.displayName : "";
    const byName = na.localeCompare(nb);
    if (byName !== 0) return byName;
    return String(a?.uid ?? "").localeCompare(String(b?.uid ?? ""));
  });

  // Score/identity fan-out must not rewrite membership arrays — join/kick own those fields.
  return { ok: true, members };
}

/**
 * Snapshot broadcast baselines from guild doc BEFORE members[] overwrite.
 * @param {unknown} guildData
 * @param {string} uid
 * @param {string} [broadcastMetricType]
 */
export function captureGuildBroadcastBaseline(guildData, uid, broadcastMetricType) {
  if (!guildData || typeof guildData !== "object") {
    return null;
  }
  const members = Array.isArray(guildData.members) ? guildData.members : [];
  const member = members.find(
    (m) => m && typeof m === "object" && typeof m.uid === "string" && m.uid === uid
  );
  if (!member) return null;

  const metricType = normalizeBroadcastMetricType(broadcastMetricType);
  const previousScore = resolvePreviousScoreFromMember(member, metricType);
  const senderDisplayName =
    typeof member.displayName === "string" && member.displayName.trim()
      ? member.displayName.trim().slice(0, 32)
      : uid.slice(0, 8);
  const memberUids = Array.isArray(guildData.memberUids)
    ? guildData.memberUids.filter((id) => typeof id === "string" && id)
    : [];
  const clubName =
    typeof guildData.name === "string" && guildData.name.trim()
      ? guildData.name.trim()
      : "Club";

  return {
    previousScore,
    senderDisplayName,
    memberUids,
    clubName,
    metricType,
  };
}

/**
 * Best-effort guild snapshot update. Never throws to callers.
 * @param {{
 *   uid: string;
 *   ladderScore: number;
 *   displayName?: string;
 *   avatarUrl?: string | null;
 *   isAnonymous?: boolean;
 *   radarScores?: unknown;
 *   captureBroadcastBaseline?: boolean;
 *   broadcastMetricType?: string;
 * }} input
 * @returns {Promise<{
 *   ok: boolean;
 *   reason?: string;
 *   guildId?: string;
 *   broadcastBaseline?: {
 *     previousScore: number;
 *     senderDisplayName: string;
 *     memberUids: string[];
 *     clubName: string;
 *     metricType: string;
 *   } | null;
 * }>}
 */
export async function fanOutLadderScoreToGuild(input) {
  const uid = typeof input?.uid === "string" ? input.uid : "";
  if (!uid) {
    return { ok: false, reason: "missing-uid" };
  }

  try {
    const userSnap = await db.collection("users").doc(uid).get();
    const guildId = readUserGuildId(userSnap.exists ? userSnap.data() : null);
    if (!guildId) {
      return { ok: true, reason: "no-guild" };
    }

    const nowIso = new Date().toISOString();
    const score = Number(input.ladderScore);
    const ladderScore = Number.isFinite(score) ? Math.max(0, score) : 0;
    const radarScores = sanitizeGuildRadarScores(input.radarScores);
    const captureBaseline = input.captureBroadcastBaseline === true;

    /** @type {{ patched: boolean; skipReason?: string; broadcastBaseline?: object | null }} */
    const txResult = { patched: false, broadcastBaseline: null };

    await db.runTransaction(async (tx) => {
      const guildRef = db.collection(GUILDS_COLLECTION).doc(guildId);
      const guildSnap = await tx.get(guildRef);
      if (!guildSnap.exists) {
        txResult.skipReason = "guild-missing";
        return;
      }
      const guildData = guildSnap.data();

      // WHY: Must read previousScore before applyMemberLadderScorePatch overwrites members[].
      if (captureBaseline) {
        txResult.broadcastBaseline = captureGuildBroadcastBaseline(
          guildData,
          uid,
          input.broadcastMetricType
        );
      }

      const patched = applyMemberLadderScorePatch(guildData, uid, {
        ladderScore,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        clearAvatar: input.isAnonymous === true,
        radarScores,
        updatedAt: nowIso,
      });
      if (!patched.ok) {
        txResult.skipReason = patched.reason;
        console.warn("[guildScoreFanOut] skip patch", {
          uid,
          guildId,
          reason: patched.reason,
        });
        return;
      }
      // WHY: Membership fields stay owned by join/leave/kick Callables — score fan-out is members[] only.
      tx.update(guildRef, {
        members: patched.members,
        updatedAt: nowIso,
      });
      txResult.patched = true;
    });

    if (!txResult.patched) {
      return {
        ok: true,
        reason: txResult.skipReason ?? "skipped",
        guildId,
        broadcastBaseline: null,
      };
    }
    return {
      ok: true,
      guildId,
      broadcastBaseline: captureBaseline ? txResult.broadcastBaseline ?? null : null,
    };
  } catch (err) {
    console.warn("[guildScoreFanOut] failed (non-fatal)", {
      uid,
      message: err?.message ?? String(err),
    });
    return { ok: false, reason: "fan-out-error" };
  }
}
