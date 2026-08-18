/**
 * Device-local unread spec-badge chrome.
 * WHY: Returning users already have unlocked plates — missing seen storage must not look like "new unlocks".
 */

function uniquePreserveOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function getUnseenBadgeIds(
  unlockedIds: readonly string[],
  seenIds: readonly string[]
): string[] {
  const seen = new Set(seenIds);
  return uniquePreserveOrder(unlockedIds.filter((id) => !seen.has(id)));
}

export function hasUnseenBadges(
  unlockedIds: readonly string[],
  seenIds: readonly string[]
): boolean {
  return getUnseenBadgeIds(unlockedIds, seenIds).length > 0;
}

/**
 * First launch (`storedSeenIds === null`) aligns seen with current unlocks so existing plates stay quiet.
 */
export function resolveSeenIdsForFirstLaunch(
  storedSeenIds: readonly string[] | null,
  unlockedIds: readonly string[]
): string[] {
  if (storedSeenIds === null) return uniquePreserveOrder(unlockedIds);
  return uniquePreserveOrder(storedSeenIds);
}
