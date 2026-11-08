/**
 * Crew deep-link focusUid helpers.
 * WHY: Push `/crew?focusUid=` must resolve a roster member without throwing on stale/invalid ids.
 */
import type { GuildMemberSnapshot } from '../../types/guild';

/** Locked query key — keep in sync with push `data.route` and CLUB_PROGRESS_DISPATCH_SPEC §7. */
export const CREW_FOCUS_UID_QUERY_KEY = 'focusUid';

/**
 * Normalize raw search param → uid or null (empty / whitespace → null).
 */
export function parseCrewFocusUid(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Find roster member by focusUid. Missing / left-club → null (caller ignores silently).
 */
export function findGuildMemberByFocusUid(
  members: readonly GuildMemberSnapshot[] | null | undefined,
  focusUid: string | null | undefined
): GuildMemberSnapshot | null {
  const uid = parseCrewFocusUid(focusUid ?? null);
  if (!uid || !Array.isArray(members) || members.length === 0) return null;
  const found = members.find(
    (m) => m && typeof m.uid === 'string' && m.uid === uid
  );
  return found ?? null;
}
