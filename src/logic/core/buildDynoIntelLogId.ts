/**
 * Deterministic log id from uid + uplink timestamp.
 * WHY: Stable local primary key without pulling in crypto / external deps.
 */
export function buildDynoIntelLogId(uid: string, timestamp: number): string {
  const seed = `${uid}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
