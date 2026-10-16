/**
 * Club-only sync tap debounce — independent of global full-sync quota/cooldown.
 * WHY: Guild roster writes are cheap O(1); must not burn the 3×/day × 90m global budget.
 */
export const GUILD_SYNC_TAP_DEBOUNCE_MS = 3000;

/** True while within the anti-double-tap window after a prior guild sync attempt. */
export function isGuildSyncTapBlocked(
  lastAttemptAtMs: number | null,
  nowMs: number,
  debounceMs: number = GUILD_SYNC_TAP_DEBOUNCE_MS
): boolean {
  if (lastAttemptAtMs == null) return false;
  return nowMs - lastAttemptAtMs < debounceMs;
}
