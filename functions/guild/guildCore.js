/**
 * Pure guild TX predicates + member-array helpers.
 * WHY: Keep capacity / single-guild / kick / leave rules unit-testable without Firestore.
 */
import {
  GUILD_JOIN_MAX_ATTEMPTS_PER_HOUR,
  GUILD_MAX_MEMBERS,
  GUILD_NAME_MAX_LEN,
  GUILD_NAME_MIN_LEN,
  GUILD_TAG_MAX_LEN,
  GUILD_TAG_MIN_LEN,
  ONE_HOUR_MS,
} from "../shared/constants.js";
import { GUILD_INVITE_CODE_ALPHABET } from "./guildInviteCode.js";
import { sanitizeGuildRadarScores } from "./guildRadarScores.js";

const TAG_ALPHABET_SET = new Set(GUILD_INVITE_CODE_ALPHABET.split(""));

/**
 * @param {unknown} data
 * @returns {string | null}
 */
export function readUserGuildId(data) {
  if (!data || typeof data !== "object") return null;
  const raw = data.guildId ?? data.guild_id;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

/**
 * @param {unknown} data
 * @returns {'coach' | 'member' | null}
 */
export function readUserGuildRole(data) {
  if (!data || typeof data !== "object") return null;
  const raw = data.guildRole ?? data.guild_role;
  if (raw === "coach" || raw === "member") return raw;
  return null;
}

/**
 * Create requires Pro + empty guild binding (1 user = 1 crew).
 * @param {unknown} userData
 * @param {boolean} isPro
 */
export function assertCanCreateGuild(userData, isPro) {
  if (!isPro) {
    return { ok: false, reason: "pro-required" };
  }
  if (readUserGuildId(userData)) {
    return { ok: false, reason: "already-in-guild" };
  }
  return { ok: true };
}

/**
 * Join requires empty guild binding (Single Guild Guard).
 * @param {unknown} userData
 */
export function assertCanJoinGuild(userData) {
  if (readUserGuildId(userData)) {
    return { ok: false, reason: "already-in-guild" };
  }
  return { ok: true };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true; name: string } | { ok: false; reason: string }}
 */
export function normalizeGuildName(raw) {
  if (typeof raw !== "string") {
    return { ok: false, reason: "invalid-name" };
  }
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < GUILD_NAME_MIN_LEN || name.length > GUILD_NAME_MAX_LEN) {
    return { ok: false, reason: "invalid-name" };
  }
  // Block control chars / angle brackets (XSS / injection in shared boards).
  if (/[<>\u0000-\u001F\u007F]/.test(name)) {
    return { ok: false, reason: "invalid-name" };
  }
  return { ok: true, name };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true; tag: string } | { ok: false; reason: string }}
 */
export function normalizeGuildTag(raw) {
  if (typeof raw !== "string") {
    return { ok: false, reason: "invalid-tag" };
  }
  const tag = raw.trim().toUpperCase().replace(/[\s\-_.]/g, "");
  if (tag.length < GUILD_TAG_MIN_LEN || tag.length > GUILD_TAG_MAX_LEN) {
    return { ok: false, reason: "invalid-tag" };
  }
  for (const ch of tag) {
    if (!TAG_ALPHABET_SET.has(ch)) {
      return { ok: false, reason: "invalid-tag" };
    }
  }
  return { ok: true, tag };
}

/**
 * @param {unknown} rawName
 * @param {number} [fallback]
 */
export function sanitizeDisplayName(rawName, fallbackUid) {
  if (typeof rawName === "string") {
    const trimmed = rawName.trim().replace(/\s+/g, " ");
    if (trimmed.length >= 1 && trimmed.length <= 32) return trimmed;
  }
  if (typeof fallbackUid === "string" && fallbackUid.length > 0) {
    return fallbackUid.slice(0, 8);
  }
  return "Athlete";
}

/**
 * @param {unknown} raw
 * @returns {string | undefined}
 */
export function sanitizeAvatarUrl(raw) {
  if (typeof raw !== "string") return undefined;
  const url = raw.trim();
  if (!url) return undefined;
  if (url.startsWith("https://") && url.length <= 2048) return url;
  return undefined;
}

/**
 * @param {{
 *   uid: string;
 *   displayName: string;
 *   avatarUrl?: string;
 *   ladderScore?: number;
 *   radarScores?: unknown;
 *   updatedAt: string;
 * }} input
 */
export function buildMemberSnapshot(input) {
  const score = Number(input.ladderScore);
  const snapshot = {
    uid: input.uid,
    displayName: sanitizeDisplayName(input.displayName, input.uid),
    ladderScore: Number.isFinite(score) ? Math.max(0, score) : 0,
    updatedAt: input.updatedAt,
  };
  const avatarUrl = sanitizeAvatarUrl(input.avatarUrl);
  if (avatarUrl) snapshot.avatarUrl = avatarUrl;
  const radarScores = sanitizeGuildRadarScores(input.radarScores);
  if (radarScores) snapshot.radarScores = radarScores;
  return snapshot;
}

/**
 * @param {unknown} guildData
 * @param {number} [maxMembers]
 */
export function resolveMemberCount(guildData, maxMembers = GUILD_MAX_MEMBERS) {
  if (!guildData || typeof guildData !== "object") {
    return { memberCount: 0, maxMembers, memberUids: [], members: [] };
  }
  const memberUids = Array.isArray(guildData.memberUids)
    ? guildData.memberUids.filter((x) => typeof x === "string")
    : [];
  const members = Array.isArray(guildData.members) ? guildData.members : [];
  const rawCount = Number(guildData.memberCount);
  const memberCount = Number.isFinite(rawCount)
    ? Math.max(0, Math.floor(rawCount))
    : memberUids.length;
  const cap = Number(guildData.maxMembers);
  const resolvedMax =
    Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : maxMembers;
  return { memberCount, maxMembers: resolvedMax, memberUids, members };
}

/**
 * @param {unknown} guildData
 * @param {ReturnType<typeof buildMemberSnapshot>} snapshot
 * @param {number} [maxMembers]
 */
export function appendGuildMember(guildData, snapshot, maxMembers = GUILD_MAX_MEMBERS) {
  const state = resolveMemberCount(guildData, maxMembers);
  if (state.memberUids.includes(snapshot.uid)) {
    return { ok: false, reason: "already-in-guild" };
  }
  if (state.memberCount >= state.maxMembers || state.memberUids.length >= state.maxMembers) {
    return { ok: false, reason: "guild-full" };
  }
  return {
    ok: true,
    next: {
      memberUids: [...state.memberUids, snapshot.uid],
      members: [...state.members, snapshot],
      memberCount: state.memberCount + 1,
      maxMembers: state.maxMembers,
    },
  };
}

/**
 * @param {unknown} guildData
 * @param {string} uid
 */
export function removeGuildMember(guildData, uid) {
  const state = resolveMemberCount(guildData);
  if (!state.memberUids.includes(uid)) {
    return { ok: false, reason: "not-in-guild" };
  }
  const memberUids = state.memberUids.filter((id) => id !== uid);
  const members = state.members.filter(
    (m) => m && typeof m === "object" && m.uid !== uid
  );
  return {
    ok: true,
    next: {
      memberUids,
      members,
      memberCount: Math.max(0, memberUids.length),
      maxMembers: state.maxMembers,
    },
  };
}

/**
 * @param {unknown} guildData
 * @param {string} actorUid
 */
export function assertIsGuildCoach(guildData, actorUid) {
  if (!guildData || typeof guildData !== "object") {
    return { ok: false, reason: "not-found" };
  }
  const docCoach =
    typeof guildData.coachUid === "string" ? guildData.coachUid : "";
  if (!docCoach || docCoach !== actorUid) {
    return { ok: false, reason: "not-coach" };
  }
  return { ok: true };
}

/**
 * @param {string} coachUid
 * @param {string} targetUid
 */
export function assertCanKickMember(coachUid, targetUid) {
  if (!targetUid || typeof targetUid !== "string") {
    return { ok: false, reason: "not-found" };
  }
  if (targetUid === coachUid) {
    return { ok: false, reason: "cannot-kick-self" };
  }
  return { ok: true };
}

/**
 * Coach must disband — members may leave.
 * @param {unknown} userData
 */
export function assertCanLeaveGuild(userData) {
  const guildId = readUserGuildId(userData);
  if (!guildId) return { ok: false, reason: "not-in-guild" };
  const role = readUserGuildRole(userData);
  if (role === "coach") {
    return { ok: false, reason: "coach-cannot-leave" };
  }
  return { ok: true, guildId };
}

/**
 * @param {unknown} raw
 * @param {number} [nowMs]
 * @param {number} [windowMs]
 */
export function normalizeGuildJoinRateDoc(
  raw,
  nowMs = Date.now(),
  windowMs = ONE_HOUR_MS
) {
  if (!raw || typeof raw !== "object") {
    return { windowStartMs: nowMs, count: 0 };
  }
  const windowStartMs = Number(raw.windowStartMs) || nowMs;
  if (nowMs - windowStartMs >= windowMs) {
    return { windowStartMs: nowMs, count: 0 };
  }
  return {
    windowStartMs,
    count: Math.max(0, Math.floor(Number(raw.count) || 0)),
  };
}

/**
 * Failed guesses burn the same quota as successes (anti-enumeration).
 * @param {unknown} raw
 * @param {number} [nowMs]
 * @param {{ windowMs?: number; maxAttempts?: number }} [opts]
 */
export function consumeGuildJoinAttempt(raw, nowMs = Date.now(), opts = {}) {
  const windowMs = opts.windowMs ?? ONE_HOUR_MS;
  const maxAttempts = opts.maxAttempts ?? GUILD_JOIN_MAX_ATTEMPTS_PER_HOUR;
  const bucket = normalizeGuildJoinRateDoc(raw, nowMs, windowMs);
  const resetAt = new Date(bucket.windowStartMs + windowMs).toISOString();

  if (bucket.count >= maxAttempts) {
    return {
      allowed: false,
      reason: "guild-join-rate-limited",
      remaining: 0,
      resetAt,
      next: bucket,
    };
  }

  const next = {
    windowStartMs: bucket.windowStartMs,
    count: bucket.count + 1,
  };
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - next.count),
    resetAt,
    next,
  };
}

/**
 * Build initial guild document payload (coach already in members).
 */
export function buildNewGuildDoc({
  guildId,
  name,
  tag,
  coachUid,
  inviteCode,
  coachSnapshot,
  nowIso,
  maxMembers = GUILD_MAX_MEMBERS,
}) {
  return {
    id: guildId,
    name,
    tag,
    coachUid,
    inviteCode,
    memberCount: 1,
    maxMembers,
    memberUids: [coachUid],
    members: [coachSnapshot],
    status: "active",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
