import {
  normalizeLadderBlockedEntries,
  type LadderBlockedEntry,
} from '../logic/core/ladderBlockList';
import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

/** Storage key kept at v1 so existing local lists migrate in place. */
export const LADDER_BLOCKED_UIDS_STORAGE_KEY = 'up.ladder.blocked_uids.v1';

function payloadNeedsObjectRewrite(parsed: unknown): boolean {
  return Array.isArray(parsed) && parsed.some((item) => typeof item === 'string');
}

export function loadBlockedEntries(): LadderBlockedEntry[] {
  const raw = safeGetItem(LADDER_BLOCKED_UIDS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const entries = normalizeLadderBlockedEntries(parsed);
    // WHY: One-shot rewrite of legacy string[] → objects so Settings shows a stable shape
    // without waiting for the next unblock/block. Skip when already object-only.
    if (entries.length > 0 && payloadNeedsObjectRewrite(parsed)) {
      saveBlockedEntries(entries);
    }
    return entries;
  } catch {
    return [];
  }
}

export function saveBlockedEntries(entries: LadderBlockedEntry[]): void {
  const unique = normalizeLadderBlockedEntries(entries);
  safeSetItem(LADDER_BLOCKED_UIDS_STORAGE_KEY, JSON.stringify(unique));
}

export function addBlockedEntry(
  entry: LadderBlockedEntry,
  current: LadderBlockedEntry[]
): LadderBlockedEntry[] {
  const uid = entry.uid.trim();
  if (!uid) return current;
  const displayName = entry.displayName.trim();
  const idx = current.findIndex((e) => e.uid === uid);
  if (idx >= 0) {
    const existing = current[idx]!;
    // WHY: If a legacy empty-name row is blocked again with a name, upgrade in place.
    if (!displayName || existing.displayName) return current;
    const next = current.slice();
    next[idx] = { uid, displayName };
    saveBlockedEntries(next);
    return next;
  }
  const next = [...current, { uid, displayName }];
  saveBlockedEntries(next);
  return next;
}

export function removeBlockedEntry(
  uid: string,
  current: LadderBlockedEntry[]
): LadderBlockedEntry[] {
  const next = current.filter((e) => e.uid !== uid);
  saveBlockedEntries(next);
  return next;
}
