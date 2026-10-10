export type LadderRowWithUid = { uid: string };

/** Local block-list entry — `displayName` may be empty for legacy string-only storage. */
export type LadderBlockedEntry = {
  uid: string;
  displayName: string;
};

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

/**
 * Compact UID for human scanning when no display name was persisted.
 * WHY: Full Firebase UIDs are unreadable in the settings sheet; 6+4 keeps uniqueness cues.
 */
export function formatLadderBlockedMicroUid(uid: string): string {
  const trimmed = uid.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

/** Title label: preferred display name, else micro UID. */
export function resolveLadderBlockedTitle(entry: LadderBlockedEntry): string {
  const name = entry.displayName.trim();
  if (name) return name;
  return formatLadderBlockedMicroUid(entry.uid);
}

/**
 * Normalize one storage item (legacy string uid or `{ uid, displayName }`).
 * WHY: v1 wrote string[]; v1.1 writes objects — both must load without wiping the list.
 */
export function normalizeLadderBlockedEntry(raw: unknown): LadderBlockedEntry | null {
  if (typeof raw === 'string') {
    const uid = raw.trim();
    if (!uid) return null;
    return { uid, displayName: '' };
  }
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as { uid?: unknown; displayName?: unknown };
  if (typeof record.uid !== 'string') return null;
  const uid = record.uid.trim();
  if (!uid) return null;
  const displayName =
    typeof record.displayName === 'string' ? record.displayName.trim() : '';
  return { uid, displayName };
}

/**
 * Dedupes by uid after normalizing mixed legacy/object payloads.
 * WHY: Prefer a named object over an earlier bare-string twin so migration does not
 * discard displayName when both shapes coexist in the same array.
 */
export function normalizeLadderBlockedEntries(raw: unknown): LadderBlockedEntry[] {
  if (!Array.isArray(raw)) return [];
  const byUid = new Map<string, LadderBlockedEntry>();
  for (const item of raw) {
    const entry = normalizeLadderBlockedEntry(item);
    if (!entry) continue;
    const existing = byUid.get(entry.uid);
    if (!existing) {
      byUid.set(entry.uid, entry);
      continue;
    }
    if (!existing.displayName && entry.displayName) {
      byUid.set(entry.uid, entry);
    }
  }
  return [...byUid.values()];
}

export function blockedEntriesToUidSet(entries: readonly LadderBlockedEntry[]): ReadonlySet<string> {
  return new Set(entries.map((e) => e.uid));
}
