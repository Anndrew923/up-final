import { KNOWN_LEADERBOARD_SHARD_IDS } from "../shared/constants.js";

const DISPLAY_NAME_MAX = 64;
const AVATAR_URL_MAX = 250_000;

export function isValidShardId(metric) {
  return typeof metric === "string" && KNOWN_LEADERBOARD_SHARD_IDS.has(metric);
}

export function normalizeDisplayName(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const base = trimmed || "Pilot";
  return base.slice(0, DISPLAY_NAME_MAX);
}

export function sanitizeAvatarUrl(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > AVATAR_URL_MAX) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function validateScore(score) {
  return Number.isFinite(score) && score >= 0;
}

export function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {};
  }
  const out = { ...profile };
  delete out.uid;
  return out;
}
