/**
 * v5.0 — Hall of Fame matrix resolver (sparse JSON from xlsx wash).
 * WHY: Decouple celebrity anchors from praise copy; zh-only UI display names.
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
 * @param {string} axisId
 * @param {string} decadeKey
 * @param {number} [limit]
 * @returns {string[]}
 */
export function resolveHallOfFameDisplayNames(axisId, decadeKey, limit = MAX_DISPLAY_NAMES) {
  const decade = Number(decadeKey);
  if (!Number.isFinite(decade) || decade < 60) return [];

  const anchors = INDEX.get(`${decadeKey}:${axisId}`);
  if (!Array.isArray(anchors) || anchors.length === 0) return [];

  return anchors
    .map((anchor) => String(anchor.displayZh ?? "").trim())
    .filter(Boolean)
    .slice(0, Math.max(1, limit));
}

/**
 * @param {string} axisId
 * @param {string} decadeKey
 * @param {string} sentenceTemplate — must include {{names}}
 * @param {number} [limit]
 * @returns {string | null}
 */
export function resolveHallOfFameSentence(axisId, decadeKey, sentenceTemplate, limit = MAX_DISPLAY_NAMES) {
  const names = resolveHallOfFameDisplayNames(axisId, decadeKey, limit);
  if (!names.length) return null;
  return String(sentenceTemplate ?? "").replace("{{names}}", names.join("、"));
}

export { MAX_DISPLAY_NAMES as HALL_OF_FAME_MAX_DISPLAY_NAMES };
