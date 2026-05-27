import {
  FULL_SYNC_COOLDOWN_MS,
  FULL_SYNC_MAX_PER_DAY,
} from './ladderUploadPolicy';

export type FullSyncRateLimitReason = 'full-sync-cooldown' | 'full-sync-daily-cap';

export interface FullSyncRateLimitState {
  /** Local calendar day key `yyyy-MM-dd` for `countToday`. */
  dayKey: string;
  countToday: number;
  /** ISO timestamp of last successful full sync (at least one shard written). */
  lastCompletedAt: string | null;
}

export interface FullSyncRateLimitCheck {
  allowed: boolean;
  reason?: FullSyncRateLimitReason;
  nextAllowedAt?: string;
  remainingToday: number;
}

export function createEmptyFullSyncRateLimitState(dayKey: string): FullSyncRateLimitState {
  return { dayKey, countToday: 0, lastCompletedAt: null };
}

export function dayKeyLocal(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nextLocalDayStartIso(now: Date): string {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

/** Normalize persisted state for the current local day (reset daily counter when day rolls). */
export function normalizeFullSyncRateLimitState(
  state: FullSyncRateLimitState | null | undefined,
  now: Date
): FullSyncRateLimitState {
  const today = dayKeyLocal(now);
  if (!state) return createEmptyFullSyncRateLimitState(today);
  if (state.dayKey !== today) {
    return {
      dayKey: today,
      countToday: 0,
      lastCompletedAt: state.lastCompletedAt,
    };
  }
  return state;
}

/**
 * Gate before `runLeaderboardBatchUpload`. Only blocks the full-sync button path.
 */
export function checkFullSyncRateLimit(
  state: FullSyncRateLimitState,
  now: Date = new Date()
): FullSyncRateLimitCheck {
  const normalized = normalizeFullSyncRateLimitState(state, now);
  const remainingToday = Math.max(0, FULL_SYNC_MAX_PER_DAY - normalized.countToday);

  if (normalized.countToday >= FULL_SYNC_MAX_PER_DAY) {
    return {
      allowed: false,
      reason: 'full-sync-daily-cap',
      nextAllowedAt: nextLocalDayStartIso(now),
      remainingToday: 0,
    };
  }

  if (normalized.lastCompletedAt) {
    const lastMs = new Date(normalized.lastCompletedAt).getTime();
    const elapsed = now.getTime() - lastMs;
    if (Number.isFinite(lastMs) && elapsed < FULL_SYNC_COOLDOWN_MS) {
      return {
        allowed: false,
        reason: 'full-sync-cooldown',
        nextAllowedAt: new Date(lastMs + FULL_SYNC_COOLDOWN_MS).toISOString(),
        remainingToday,
      };
    }
  }

  return { allowed: true, remainingToday };
}

/**
 * Call only after a batch where `updated > 0` (meaningful cloud writes occurred).
 */
export function recordFullSyncRateLimitSuccess(
  state: FullSyncRateLimitState,
  now: Date = new Date()
): FullSyncRateLimitState {
  const normalized = normalizeFullSyncRateLimitState(state, now);
  const today = dayKeyLocal(now);
  const countToday = Math.min(
    FULL_SYNC_MAX_PER_DAY,
    normalized.countToday + 1
  );
  return {
    dayKey: today,
    countToday,
    lastCompletedAt: now.toISOString(),
  };
}
