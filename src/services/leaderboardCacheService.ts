import type { LadderProfileProjection } from '../types/ladderProfile';

export interface LeaderboardEntry extends Partial<LadderProfileProjection> {
  uid: string;
  displayName: string;
  scoreBest: number;
  updatedAt: string;
  isPro?: boolean;
}

export interface LeaderboardCacheData {
  metric: string;
  page: number;
  items: LeaderboardEntry[];
  cachedAt: string;
}

const DEFAULT_TTL_MS = 120000;
const cache = new Map<string, LeaderboardCacheData>();

function makeKey(metric: string, page: number): string {
  return `${metric}:${page}`;
}

export function getCachedLeaderboard(params: {
  metric: string;
  page: number;
  ttlMs?: number;
  now?: Date;
}): LeaderboardCacheData | null {
  const key = makeKey(params.metric, params.page);
  const data = cache.get(key);
  if (!data) return null;

  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;
  const nowMs = (params.now ?? new Date()).getTime();
  const cachedMs = new Date(data.cachedAt).getTime();

  if (Number.isNaN(cachedMs)) {
    cache.delete(key);
    return null;
  }

  if (nowMs - cachedMs > ttlMs) {
    cache.delete(key);
    return null;
  }

  return data;
}

export function setCachedLeaderboard(data: LeaderboardCacheData): void {
  cache.set(makeKey(data.metric, data.page), data);
}

export function clearLeaderboardCache(metric?: string): void {
  if (!metric) {
    cache.clear();
    return;
  }

  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(`${metric}:`)) {
      cache.delete(key);
    }
  });
}
