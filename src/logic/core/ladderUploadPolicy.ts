/**
 * Ladder upload quotas (product + cost guardrails).
 * P1: enforced client-side (UX pacing, not a security boundary).
 * P2: mirror these limits in Callable + Firestore `ladder_rate_limits/{uid}`.
 */
export const LEADERBOARD_UPLOADS_PER_HOUR = 3;

/** Minimum gap between successful full sync-all runs. */
export const FULL_SYNC_COOLDOWN_MS = 90 * 60 * 1000;

/** Max successful full sync-all runs per local calendar day. */
export const FULL_SYNC_MAX_PER_DAY = 3;

/**
 * WHY: Display name is the hard gate before any ladder write.
 * Empty names previously fell through to a silent `'Pilot'` ghost nickname on the public board.
 * Avatar stays optional — UI degrades to initials so conversion is not blocked.
 */
export function hasLadderIdentityReady(displayName: string | null | undefined): boolean {
  return Boolean(displayName?.trim());
}

/** First grapheme for initials avatar when the user has not uploaded a portrait. */
export function ladderIdentityInitial(displayName: string | null | undefined): string {
  const trimmed = displayName?.trim() ?? '';
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}
