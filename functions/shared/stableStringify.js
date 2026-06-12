/**
 * Deterministic JSON stringify for cache hash keys.
 * WHY: Object key order must be stable across client/server hash generation.
 */
function sortValue(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortValue(value[key]);
  }
  return sorted;
}

export function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}
