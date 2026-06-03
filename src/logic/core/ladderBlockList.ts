export type LadderRowWithUid = { uid: string };

/** Returns true when `uid` is in the local block set (non-empty string required). */
export function isUidBlocked(blockedUids: ReadonlySet<string>, uid: string | undefined | null): boolean {
  if (!uid || typeof uid !== 'string') return false;
  return blockedUids.has(uid);
}

/**
 * Removes rows whose `uid` appears in `blockedUids`.
 * WHY: Personal comfort filter only — does not affect `myEntry` / `myRank` fetches.
 */
export function filterBlockedLeaderboardRows<T extends LadderRowWithUid>(
  rows: T[],
  blockedUids: ReadonlySet<string>
): T[] {
  if (blockedUids.size === 0) return rows;
  return rows.filter((row) => !isUidBlocked(blockedUids, row.uid));
}
