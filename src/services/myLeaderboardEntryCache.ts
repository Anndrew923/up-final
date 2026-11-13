/**
 * TTL cache for `getMyLeaderboardEntry` (uid + metric).
 * WHY: Ladder tab remounts must not re-getDoc the same entry within the list fresh window.
 */
import type { LeaderboardShardId } from '../logic/core/ladderShards';
import type { LeaderboardEntry } from './leaderboardCacheService';
import { LEADERBOARD_LIST_TTL_MS } from './leaderboardCacheService';

/** Align with list-page fresh TTL so tab switches share the same cost window. */
export const LEADERBOARD_MY_ENTRY_TTL_MS = LEADERBOARD_LIST_TTL_MS;

export type MyLeaderboardEntryCacheRecord = {
  uid: string;
  metric: string;
  /** Null = negative cache (not on the board). */
  item: LeaderboardEntry | null;
  cachedAt: string;
};

const DISK_PREFIX = 'up:my-ladder-entry:v1:';

const memory = new Map<string, MyLeaderboardEntryCacheRecord>();

export function makeMyLeaderboardEntryCacheKey(uid: string, metric: string): string {
  return `${uid.trim()}::${metric.trim()}`;
}

function parseCachedAtMs(cachedAt: string): number {
  return new Date(cachedAt).getTime();
}

function isFresh(record: MyLeaderboardEntryCacheRecord, nowMs: number, ttlMs: number): boolean {
  const cachedMs = parseCachedAtMs(record.cachedAt);
  if (!Number.isFinite(cachedMs)) return false;
  return nowMs - cachedMs <= Math.max(0, ttlMs);
}

function isValidRecord(raw: unknown): raw is MyLeaderboardEntryCacheRecord {
  if (!raw || typeof raw !== 'object') return false;
  const row = raw as MyLeaderboardEntryCacheRecord;
  if (typeof row.uid !== 'string' || typeof row.metric !== 'string') return false;
  if (typeof row.cachedAt !== 'string' || !Number.isFinite(parseCachedAtMs(row.cachedAt))) {
    return false;
  }
  if (row.item === null) return true;
  if (!row.item || typeof row.item !== 'object') return false;
  return (
    typeof row.item.uid === 'string' &&
    typeof row.item.displayName === 'string' &&
    typeof row.item.scoreBest === 'number' &&
    typeof row.item.updatedAt === 'string'
  );
}

function diskKey(uid: string, metric: string): string {
  return `${DISK_PREFIX}${makeMyLeaderboardEntryCacheKey(uid, metric)}`;
}

/** Split `${uid}::${metric}` cache keys; malformed → null. */
function parseMyLeaderboardEntryCacheKey(
  key: string
): { uid: string; metric: string } | null {
  const sep = key.indexOf('::');
  if (sep <= 0 || sep === key.length - 2) return null;
  const uid = key.slice(0, sep);
  const metric = key.slice(sep + 2);
  if (!uid || !metric) return null;
  return { uid, metric };
}

function readDisk(uid: string, metric: string): MyLeaderboardEntryCacheRecord | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(diskKey(uid, metric));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidRecord(parsed)) {
      window.localStorage.removeItem(diskKey(uid, metric));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDisk(record: MyLeaderboardEntryCacheRecord): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(diskKey(record.uid, record.metric), JSON.stringify(record));
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function removeDiskMatching(match: { uid?: string; metric?: string }): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const uid = match.uid?.trim() || '';
    const metric = match.metric?.trim() || '';
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(DISK_PREFIX)) continue;
      const parsed = parseMyLeaderboardEntryCacheKey(key.slice(DISK_PREFIX.length));
      if (!parsed) continue;
      if (uid && parsed.uid !== uid) continue;
      if (metric && parsed.metric !== metric) continue;
      keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function lookupMyLeaderboardEntryCache(params: {
  uid: string;
  metric: string;
  ttlMs?: number;
  now?: Date;
}): { item: LeaderboardEntry | null; cachedAt: string } | null {
  const uid = params.uid.trim();
  const metric = params.metric.trim();
  if (!uid || !metric) return null;

  const ttlMs = params.ttlMs ?? LEADERBOARD_MY_ENTRY_TTL_MS;
  const nowMs = (params.now ?? new Date()).getTime();
  const key = makeMyLeaderboardEntryCacheKey(uid, metric);

  const mem = memory.get(key);
  if (mem) {
    if (isFresh(mem, nowMs, ttlMs)) {
      return { item: mem.item, cachedAt: mem.cachedAt };
    }
    memory.delete(key);
  }

  const disk = readDisk(uid, metric);
  if (disk) {
    if (isFresh(disk, nowMs, ttlMs)) {
      memory.set(key, disk);
      return { item: disk.item, cachedAt: disk.cachedAt };
    }
    removeDiskMatching({ uid, metric });
  }

  return null;
}

export function setMyLeaderboardEntryCache(params: {
  uid: string;
  metric: string;
  item: LeaderboardEntry | null;
  cachedAt?: string;
}): void {
  const uid = params.uid.trim();
  const metric = params.metric.trim();
  if (!uid || !metric) return;

  const record: MyLeaderboardEntryCacheRecord = {
    uid,
    metric,
    item: params.item,
    cachedAt: params.cachedAt ?? new Date().toISOString(),
  };
  memory.set(makeMyLeaderboardEntryCacheKey(uid, metric), record);
  writeDisk(record);
}

/**
 * Invalidate my-entry cache.
 * - `{ uid, metric }` → one slot
 * - `{ uid }` → all metrics for uid
 * - `{ metric }` → all uids for metric
 * - `{}` / no args → clear all
 */
export function invalidateMyLeaderboardEntryCache(params?: {
  uid?: string;
  metric?: string | LeaderboardShardId;
}): void {
  const uid = typeof params?.uid === 'string' ? params.uid.trim() : '';
  const metric = typeof params?.metric === 'string' ? params.metric.trim() : '';

  if (!uid && !metric) {
    memory.clear();
    removeDiskMatching({});
    return;
  }

  Array.from(memory.keys()).forEach((key) => {
    const parsed = parseMyLeaderboardEntryCacheKey(key);
    if (!parsed) {
      memory.delete(key);
      return;
    }
    if (uid && parsed.uid !== uid) return;
    if (metric && parsed.metric !== metric) return;
    memory.delete(key);
  });
  removeDiskMatching({ uid: uid || undefined, metric: metric || undefined });
}

/**
 * Warm my-entry TTL from a list/catalog page when the signed-in uid is present.
 * WHY: Tab remounts often already paid for the list read — avoid a second getDoc for self.
 * Never seeds negative cache from a page miss (user may rank beyond the page).
 */
export function seedMyLeaderboardEntryFromRows(params: {
  metric: string;
  uid: string | null | undefined;
  items: readonly LeaderboardEntry[];
}): void {
  const uid = typeof params.uid === 'string' ? params.uid.trim() : '';
  const metric = params.metric.trim();
  if (!uid || !metric || !Array.isArray(params.items)) return;
  const mine = params.items.find((row) => row?.uid === uid);
  if (!mine) return;
  setMyLeaderboardEntryCache({ uid, metric, item: mine });
}

/** Test seam. */
export function __resetMyLeaderboardEntryCacheForTests(): void {
  memory.clear();
  removeDiskMatching({});
}
