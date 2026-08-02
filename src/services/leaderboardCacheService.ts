import type { LadderProfileProjection } from '../types/ladderProfile';

export interface LeaderboardEntry extends Partial<LadderProfileProjection> {
  uid: string;
  displayName: string;
  /** Legacy Firestore fields from older clients; ignored by ladder UI (rank uses `scoreBest` only). */
  displayRaw?: number;
  displayRawUnit?: string;
  /** Public image URL or compressed data URL from ladder identity upload. */
  avatarUrl?: string;
  scoreBest: number;
  updatedAt: string;
  rank?: number;
  isPro?: boolean;
}

export interface LeaderboardCacheData {
  metric: string;
  page: number;
  items: LeaderboardEntry[];
  cachedAt: string;
  /**
   * Last entry uid on this page — used to rebuild Firestore `startAfter` when the
   * in-memory DocumentSnapshot cursor was lost (app background / reload).
   */
  endCursorUid?: string;
  /** Page size used when this page was fetched; cursor chain is keyed by pageSize. */
  pageSize?: number;
}

export type LeaderboardCacheFreshness = 'fresh' | 'stale';

export interface LeaderboardCacheLookup {
  data: LeaderboardCacheData;
  freshness: LeaderboardCacheFreshness;
}

/** Default list-page fresh window (session + disk). */
export const LEADERBOARD_LIST_TTL_MS = 120_000;
/**
 * WHY: Filter-mode catalog is a 500-doc spike; longer fresh TTL cuts repeat reads while
 * filters stay interactive via client-side pagination over the cached slice.
 */
export const LEADERBOARD_CATALOG_TTL_MS = 12 * 60 * 1000;
/** Serve catalog after TTL while a background revalidate runs (SWR). */
export const LEADERBOARD_CATALOG_SWR_MAX_AGE_MS = 60 * 60 * 1000;
/** List pages: shorter fresh window, still SWR after brief expiry. */
export const LEADERBOARD_LIST_SWR_MAX_AGE_MS = 15 * 60 * 1000;

const DEFAULT_TTL_MS = LEADERBOARD_LIST_TTL_MS;
const DEFAULT_SWR_MAX_AGE_MS = LEADERBOARD_LIST_SWR_MAX_AGE_MS;
/** v2 keys include pageSize so a 25-row page never collides with a 20-row page. */
const DISK_STORAGE_PREFIX = 'up:leaderboard-cache:v2:';
const LEGACY_DISK_STORAGE_PREFIX = 'up:leaderboard-cache:v1:';

const cache = new Map<string, LeaderboardCacheData>();

/** Session cache page key for full-shard catalog reads (filter-mode client pagination). */
export const LEADERBOARD_CATALOG_CACHE_PAGE = 0;

function makeKey(metric: string, page: number, pageSize?: number): string {
  if (page === LEADERBOARD_CATALOG_CACHE_PAGE || pageSize == null) {
    return `${metric}:${page}`;
  }
  return `${metric}:${page}:${pageSize}`;
}

function diskKey(metric: string, page: number, pageSize?: number): string {
  return `${DISK_STORAGE_PREFIX}${makeKey(metric, page, pageSize)}`;
}

function parseCachedAtMs(cachedAt: string): number {
  return new Date(cachedAt).getTime();
}

function isValidCachePayload(raw: unknown): raw is LeaderboardCacheData {
  if (!raw || typeof raw !== 'object') return false;
  const data = raw as LeaderboardCacheData;
  return (
    typeof data.metric === 'string' &&
    typeof data.page === 'number' &&
    Array.isArray(data.items) &&
    typeof data.cachedAt === 'string' &&
    Number.isFinite(parseCachedAtMs(data.cachedAt))
  );
}

function pageSizeMatches(data: LeaderboardCacheData, pageSize?: number): boolean {
  if (data.page === LEADERBOARD_CATALOG_CACHE_PAGE) return true;
  if (pageSize == null) return true;
  // Legacy memory rows without pageSize are only safe for exact caller match after rewrite.
  if (data.pageSize == null) return false;
  return data.pageSize === pageSize;
}

function readDiskCache(
  metric: string,
  page: number,
  pageSize?: number
): LeaderboardCacheData | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  // WHY: Catalog (~500 rows) can blow localStorage quota; keep it memory-only + long TTL/SWR.
  if (page === LEADERBOARD_CATALOG_CACHE_PAGE) return null;
  try {
    const raw = window.localStorage.getItem(diskKey(metric, page, pageSize));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidCachePayload(parsed) || !pageSizeMatches(parsed, pageSize)) {
      window.localStorage.removeItem(diskKey(metric, page, pageSize));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeDiskCache(data: LeaderboardCacheData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (data.page === LEADERBOARD_CATALOG_CACHE_PAGE) return;
  try {
    window.localStorage.setItem(
      diskKey(data.metric, data.page, data.pageSize),
      JSON.stringify(data)
    );
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function removeDiskKeysWithPrefix(prefix: string, metric?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const matchPrefix = metric ? `${prefix}${metric}:` : prefix;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(matchPrefix)) keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

function removeDiskCache(metric?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    removeDiskKeysWithPrefix(DISK_STORAGE_PREFIX, metric);
    // Drop legacy v1 keys so stale unscoped page caches cannot resurface.
    removeDiskKeysWithPrefix(LEGACY_DISK_STORAGE_PREFIX, metric);
  } catch {
    // ignore
  }
}

function resolveFromStore(
  data: LeaderboardCacheData,
  ttlMs: number,
  swrMaxAgeMs: number,
  nowMs: number
): LeaderboardCacheLookup | null {
  const cachedMs = parseCachedAtMs(data.cachedAt);
  if (Number.isNaN(cachedMs)) return null;
  const age = nowMs - cachedMs;
  const freshTtl = Math.max(0, ttlMs);
  const maxAge = Math.max(freshTtl, swrMaxAgeMs);
  if (age <= freshTtl) {
    return { data, freshness: 'fresh' };
  }
  // WHY: Stale-While-Revalidate — serve slightly-expired catalog/list instantly, refresh in background.
  if (age <= maxAge) {
    return { data, freshness: 'stale' };
  }
  return null;
}

/**
 * Peek memory then disk. Does not delete stale entries (SWR may still serve them).
 */
export function lookupLeaderboardCache(params: {
  metric: string;
  page: number;
  pageSize?: number;
  ttlMs?: number;
  swrMaxAgeMs?: number;
  now?: Date;
}): LeaderboardCacheLookup | null {
  const key = makeKey(params.metric, params.page, params.pageSize);
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;
  const swrMaxAgeMs = params.swrMaxAgeMs ?? DEFAULT_SWR_MAX_AGE_MS;
  const nowMs = (params.now ?? new Date()).getTime();

  const memory = cache.get(key);
  if (memory && pageSizeMatches(memory, params.pageSize)) {
    const hit = resolveFromStore(memory, ttlMs, swrMaxAgeMs, nowMs);
    if (hit) return hit;
    cache.delete(key);
  } else if (memory) {
    cache.delete(key);
  }

  const disk = readDiskCache(params.metric, params.page, params.pageSize);
  if (disk) {
    const hit = resolveFromStore(disk, ttlMs, swrMaxAgeMs, nowMs);
    if (hit) {
      cache.set(key, hit.data);
      return hit;
    }
    removeDiskCacheForPage(params.metric, params.page, params.pageSize);
  }

  return null;
}

function removeDiskCacheForPage(metric: string, page: number, pageSize?: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(diskKey(metric, page, pageSize));
  } catch {
    // ignore
  }
}

/** Fresh-only lookup — legacy helpers / debug probes. */
export function getCachedLeaderboard(params: {
  metric: string;
  page: number;
  pageSize?: number;
  ttlMs?: number;
  now?: Date;
}): LeaderboardCacheData | null {
  const hit = lookupLeaderboardCache({
    ...params,
    // Preserve legacy hard-expiry semantics for existing tests/callers.
    swrMaxAgeMs: params.ttlMs ?? DEFAULT_TTL_MS,
  });
  if (!hit || hit.freshness !== 'fresh') return null;
  return hit.data;
}

export function setCachedLeaderboard(data: LeaderboardCacheData): void {
  const payload: LeaderboardCacheData = {
    ...data,
    cachedAt: data.cachedAt || new Date().toISOString(),
  };
  cache.set(makeKey(payload.metric, payload.page, payload.pageSize), payload);
  // WHY: Persist list pages so returning from background does not re-read Firestore.
  writeDiskCache(payload);
}

export function clearLeaderboardCache(metric?: string): void {
  if (!metric) {
    cache.clear();
    removeDiskCache();
    return;
  }

  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(`${metric}:`)) {
      cache.delete(key);
    }
  });
  removeDiskCache(metric);
}
