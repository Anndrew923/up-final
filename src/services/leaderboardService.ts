import { shouldBlockFirebase } from '../logic/core/entitlement';
import type { EntitlementState } from '../types/entitlement';
import { checkUploadRateLimit, consumeUploadQuota } from './rateLimitService';
import {
  clearLeaderboardCache,
  getCachedLeaderboard,
  setCachedLeaderboard,
  type LeaderboardEntry,
} from './leaderboardCacheService';

export interface SubmitLeaderboardInput {
  uid: string;
  metric:
    | 'strength'
    | 'explosivePower'
    | 'cardio'
    | 'muscleMass'
    | 'bodyFat'
    | 'armSize'
    | 'gripStrength';
  score: number;
  displayName: string;
  avatarUrl?: string;
}

export interface SubmitLeaderboardResult {
  ok: boolean;
  reason?: 'pro-required' | 'rate-limited' | 'not-best-score' | 'invalid-input' | 'unknown';
  updated?: boolean;
}

export interface ListLeaderboardResult {
  ok: boolean;
  reason?: 'pro-required' | 'unknown';
  items?: Array<{
    uid: string;
    displayName: string;
    scoreBest: number;
    updatedAt: string;
    isPro?: boolean;
  }>;
  fromCache?: boolean;
}

const memoryDb = new Map<string, Map<string, LeaderboardEntry>>();

function getMetricStore(metric: SubmitLeaderboardInput['metric']): Map<string, LeaderboardEntry> {
  const existing = memoryDb.get(metric);
  if (existing) return existing;
  const created = new Map<string, LeaderboardEntry>();
  memoryDb.set(metric, created);
  return created;
}

function validateInput(input: SubmitLeaderboardInput): boolean {
  return (
    Boolean(input.uid && input.displayName) && Number.isFinite(input.score) && input.score >= 0
  );
}

export async function listLeaderboard(params: {
  entitlement: EntitlementState;
  metric: SubmitLeaderboardInput['metric'];
  page: number;
  pageSize?: number;
}): Promise<ListLeaderboardResult> {
  if (shouldBlockFirebase(params.entitlement, 'leaderboard-read')) {
    return { ok: false, reason: 'pro-required' };
  }

  const cached = getCachedLeaderboard({ metric: params.metric, page: params.page });
  if (cached) {
    return { ok: true, items: cached.items, fromCache: true };
  }

  const pageSize = params.pageSize ?? 20;
  const store = getMetricStore(params.metric);
  const sorted = Array.from(store.values()).sort((a, b) => b.scoreBest - a.scoreBest);
  const start = Math.max(0, params.page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  setCachedLeaderboard({
    metric: params.metric,
    page: params.page,
    items,
    cachedAt: new Date().toISOString(),
  });

  return { ok: true, items, fromCache: false };
}

export async function submitLeaderboardScore(params: {
  entitlement: EntitlementState;
  input: SubmitLeaderboardInput;
}): Promise<SubmitLeaderboardResult> {
  const { entitlement, input } = params;
  if (shouldBlockFirebase(entitlement, 'leaderboard-write')) {
    return { ok: false, reason: 'pro-required', updated: false };
  }

  if (!validateInput(input)) {
    return { ok: false, reason: 'invalid-input', updated: false };
  }

  const rateLimitStatus = checkUploadRateLimit({
    uid: input.uid,
    key: `leaderboard:${input.metric}`,
  });
  if (!rateLimitStatus.allowed) {
    return { ok: false, reason: 'rate-limited', updated: false };
  }

  const metricStore = getMetricStore(input.metric);
  const existing = metricStore.get(input.uid);

  if (existing && input.score <= existing.scoreBest) {
    return { ok: true, reason: 'not-best-score', updated: false };
  }

  consumeUploadQuota({ uid: input.uid, key: `leaderboard:${input.metric}` });
  metricStore.set(input.uid, {
    uid: input.uid,
    displayName: input.displayName,
    scoreBest: input.score,
    updatedAt: new Date().toISOString(),
    isPro: true,
  });
  clearLeaderboardCache(input.metric);

  return { ok: true, updated: true };
}
