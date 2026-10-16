/**
 * Sanitize radarScores for guilds.members[] (Admin / Callable).
 * WHY: Keep club radar private — never read leaderboard_previews here.
 * Absent keys stay absent (not coerced to 0) so axis funnel can sort missing last.
 */
export const GUILD_RADAR_AXIS_KEYS = [
  "strength",
  "explosivePower",
  "cardio",
  "muscleMass",
  "bodyFat",
  "gripStrength",
];

function clampScore(n) {
  if (!Number.isFinite(n)) return null;
  // Align with client SCORE_AXIS_MAX (200) — body-fat / FFMI may exceed 100.
  return Math.max(0, Math.min(200, Math.round(n * 100) / 100));
}

/**
 * @param {unknown} raw
 * @returns {Record<string, number> | undefined}
 */
export function sanitizeGuildRadarScores(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const src = /** @type {Record<string, unknown>} */ (raw);
  /** @type {Record<string, number>} */
  const out = {};
  let anyFinite = false;
  for (const key of GUILD_RADAR_AXIS_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
    const clamped = clampScore(Number(src[key]));
    if (clamped == null) continue;
    out[key] = clamped;
    anyFinite = true;
  }
  return anyFinite ? out : undefined;
}
