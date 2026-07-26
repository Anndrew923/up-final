/**
 * v5.0 — Hall of Fame matrix resolver (sparse JSON from xlsx/csv wash).
 * WHY: Decouple celebrity anchors from praise copy; zh-only UI display names.
 * Matrix cells store FULL rosters; maxDisplayNames is per-reply sample size only.
 *
 * v5.11 — Matrix source is Firestore-first via hallOfFameMatrixLoader (bundled JSON fail-safe).
 * Call loadHallOfFameMatrix() at Callable entry before resolving names.
 */
import {
  getHallOfFameIndex,
  getHallOfFameMaxDisplayNames,
} from "./hallOfFameMatrixLoader.js";

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
 * @param {{ shuffle?: boolean, preferLatin?: boolean }} [options]
 * @returns {string[]}
 */
export function resolveHallOfFameDisplayNames(
  axisId,
  decadeKey,
  limit = getHallOfFameMaxDisplayNames(),
  options = {}
) {
  const decade = Number(decadeKey);
  if (!Number.isFinite(decade) || decade < 60) return [];

  const anchors = getHallOfFameIndex().get(`${decadeKey}:${axisId}`);
  if (!Array.isArray(anchors) || anchors.length === 0) return [];

  let pool = anchors
    .map((anchor) => String(anchor?.displayZh ?? "").trim())
    .filter(Boolean);

  // WHY: Matrix cells may mix Latin + CJK labels; EN replies must not leak CJK into segment1.
  if (options?.preferLatin) {
    const latin = pool.filter((name) => !/[\u4e00-\u9fff]/.test(name));
    if (latin.length > 0) pool = latin;
  }

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
 * @param {{ limit?: number, nameGlue?: string, shuffle?: boolean, preferLatin?: boolean } | number} [options]
 * @returns {string | null}
 */
export function resolveHallOfFameSentence(axisId, decadeKey, sentenceTemplate, options = {}) {
  const resolved = typeof options === "number" ? { limit: options } : options;
  const limit = resolved.limit ?? getHallOfFameMaxDisplayNames();
  const nameGlue = resolved.nameGlue ?? "、";
  const shuffle = resolved.shuffle !== false;
  const preferLatin = resolved.preferLatin === true;
  // WHY: Status segment1 hall tail rotates like consult — fixed order felt stale on repeat asks.
  const names = resolveHallOfFameDisplayNames(axisId, decadeKey, limit, { shuffle, preferLatin });
  if (!names.length) return null;
  return String(sentenceTemplate ?? "").replace("{{names}}", names.join(nameGlue));
}
