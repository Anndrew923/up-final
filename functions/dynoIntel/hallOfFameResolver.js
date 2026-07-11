/**
 * v5.0 — Hall of Fame matrix resolver (sparse JSON from xlsx/csv wash).
 * WHY: Decouple celebrity anchors from praise copy; zh-only UI display names.
 * Matrix cells store FULL rosters; maxDisplayNames is per-reply sample size only.
 */
import matrixDoc from "./data/hallOfFameMatrix.v1.json" with { type: "json" };

const INDEX = new Map(
  (matrixDoc.entries ?? []).map((entry) => [
    `${entry.decadeKey}:${entry.axisId}`,
    entry.anchors ?? [],
  ])
);

const MAX_DISPLAY_NAMES = matrixDoc.maxDisplayNames ?? 3;

/**
 * Fisher–Yates sample without mutating the source pool.
 * WHY: Both consult roster and status hall-of-fame tail should rotate names across replies.
 * @param {string[]} pool
 * @param {number} limit
 * @returns {string[]}
 */
export function sampleHallOfFameNames(pool, limit) {
  const cap = Math.max(0, Math.floor(Number(limit) || 0));
  if (!Array.isArray(pool) || pool.length === 0 || cap <= 0) return [];
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, Math.min(cap, copy.length));
}

/**
 * @param {string} axisId
 * @param {string} decadeKey
 * @param {number} [limit]
 * @param {{ shuffle?: boolean }} [options]
 * @returns {string[]}
 */
export function resolveHallOfFameDisplayNames(axisId, decadeKey, limit = MAX_DISPLAY_NAMES, options = {}) {
  const decade = Number(decadeKey);
  if (!Number.isFinite(decade) || decade < 60) return [];

  const anchors = INDEX.get(`${decadeKey}:${axisId}`);
  if (!Array.isArray(anchors) || anchors.length === 0) return [];

  const pool = anchors
    .map((anchor) => String(anchor.displayZh ?? "").trim())
    .filter(Boolean);

  const cap = Math.max(1, limit);
  if (options?.shuffle) {
    return sampleHallOfFameNames(pool, cap);
  }
  return pool.slice(0, cap);
}

/**
 * @param {string} axisId
 * @param {string} decadeKey
 * @param {string} sentenceTemplate — must include {{names}}
 * @param {{ limit?: number, nameGlue?: string } | number} [options]
 * @returns {string | null}
 */
export function resolveHallOfFameSentence(axisId, decadeKey, sentenceTemplate, options = {}) {
  const resolved = typeof options === "number" ? { limit: options } : options;
  const limit = resolved.limit ?? MAX_DISPLAY_NAMES;
  const nameGlue = resolved.nameGlue ?? "、";
  const shuffle = resolved.shuffle !== false;
  // WHY: Status segment1 hall tail rotates like consult — fixed order felt stale on repeat asks.
  const names = resolveHallOfFameDisplayNames(axisId, decadeKey, limit, { shuffle });
  if (!names.length) return null;
  return String(sentenceTemplate ?? "").replace("{{names}}", names.join(nameGlue));
}

export { MAX_DISPLAY_NAMES as HALL_OF_FAME_MAX_DISPLAY_NAMES };
