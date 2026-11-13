/**
 * Single-slot in-memory cache for a club-dispatch push tap.
 * WHY: Cold-start taps fire before Crew roster hydrates — stash until focusUid opens the sheet.
 * Consume-once so reopening the same member from the list never resurrects the bubble.
 */

import type { ClubDispatchPushData } from './parseClubDispatchPushData';

export type ClubDispatchTapCacheEntry = {
  focusUid: string;
  dispatchId: string | null;
  comment: string;
};

let pending: ClubDispatchTapCacheEntry | null = null;

export function setClubDispatchTapCache(entry: ClubDispatchTapCacheEntry): void {
  const comment = typeof entry.comment === 'string' ? entry.comment.trim() : '';
  const focusUid = typeof entry.focusUid === 'string' ? entry.focusUid.trim() : '';
  if (!comment || !focusUid) {
    pending = null;
    return;
  }
  pending = {
    focusUid,
    dispatchId:
      typeof entry.dispatchId === 'string' && entry.dispatchId.trim()
        ? entry.dispatchId.trim()
        : null,
    comment,
  };
}

/**
 * Stash comment when present; clear when this tap is a club dispatch without a comment.
 * WHY: Prevent a prior pending comment from resurfacing on a later no-comment push for the same uid.
 */
export function stashClubDispatchPushTap(parsed: ClubDispatchPushData): void {
  if (!parsed.comment) {
    pending = null;
    return;
  }
  setClubDispatchTapCache({
    focusUid: parsed.focusUid,
    dispatchId: parsed.dispatchId,
    comment: parsed.comment,
  });
}

/**
 * Consume the pending entry when focusUid and/or dispatchId match.
 * Returns null when empty or mismatched; successful match clears the slot.
 */
export function consumeClubDispatchTapCache(match: {
  focusUid?: string | null;
  dispatchId?: string | null;
}): ClubDispatchTapCacheEntry | null {
  if (!pending) return null;
  const focusUid =
    typeof match.focusUid === 'string' && match.focusUid.trim()
      ? match.focusUid.trim()
      : null;
  const dispatchId =
    typeof match.dispatchId === 'string' && match.dispatchId.trim()
      ? match.dispatchId.trim()
      : null;

  const focusOk = focusUid != null && pending.focusUid === focusUid;
  const dispatchOk =
    dispatchId != null &&
    pending.dispatchId != null &&
    pending.dispatchId === dispatchId;

  if (!focusOk && !dispatchOk) return null;

  const hit = pending;
  pending = null;
  return hit;
}

export function clearClubDispatchTapCache(): void {
  pending = null;
}

export function peekClubDispatchTapCache(): ClubDispatchTapCacheEntry | null {
  return pending;
}

/** Test seam. */
export function __resetClubDispatchTapCacheForTests(): void {
  pending = null;
}
