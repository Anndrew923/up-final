import { KNOWN_LEADERBOARD_SHARD_IDS } from "../shared/constants.js";
import { containsProfanity } from "./profanity.js";

const DISPLAY_NAME_MAX = 64;
const AVATAR_URL_MAX = 250_000;
const NORMALIZED_SCORE_MAX = 200;

/**
 * Server-owned physical ceilings. Most shards store normalized 0–200 scores;
 * `strength` is the only raw SBD total (kg), while login days is a lifetime count.
 * These are abuse bounds, not performance standards.
 */
const SHARD_SCORE_MAX = new Map([
  ["strength", 2_000],
  ["totalLoginDays", 36_500],
]);

export function isValidShardId(metric) {
  return typeof metric === "string" && KNOWN_LEADERBOARD_SHARD_IDS.has(metric);
}

export function normalizeDisplayName(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const base = trimmed || "Pilot";
  const normalized = base.slice(0, DISPLAY_NAME_MAX);
  if (containsProfanity(normalized)) {
    const err = new Error("profanity");
    err.code = "profanity";
    throw err;
  }
  return normalized;
}

/** Maps profanity throws to `{ ok: false, reason: 'profanity' }` for ladder callables. */
export function tryNormalizeDisplayName(raw) {
  try {
    return { ok: true, displayName: normalizeDisplayName(raw) };
  } catch (err) {
    if (err?.code === "profanity") {
      return { ok: false, reason: "profanity" };
    }
    throw err;
  }
}

export function sanitizeAvatarUrl(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > AVATAR_URL_MAX) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function getShardScoreMax(metric) {
  return SHARD_SCORE_MAX.get(metric) ?? NORMALIZED_SCORE_MAX;
}

export function validateScore(metric, score) {
  if (!isValidShardId(metric) || !Number.isFinite(score) || score < 0) return false;
  if (metric === "totalLoginDays" && !Number.isInteger(score)) return false;
  return score <= getShardScoreMax(metric);
}

export function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {};
  }
  const out = { ...profile };
  delete out.uid;
  return out;
}
