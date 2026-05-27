import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkFullSyncRateLimit,
  createEmptyFullSyncRateLimitState,
  dayKeyLocal,
  recordFullSyncRateLimitSuccess,
} from '../fullSyncRateLimit';
import { FULL_SYNC_COOLDOWN_MS, FULL_SYNC_MAX_PER_DAY } from '../ladderUploadPolicy';

describe('fullSyncRateLimit', () => {
  const base = new Date('2026-05-27T12:00:00.000Z');

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first sync of the day', () => {
    const state = createEmptyFullSyncRateLimitState('2026-05-27');
    const check = checkFullSyncRateLimit(state, base);
    expect(check.allowed).toBe(true);
    expect(check.remainingToday).toBe(FULL_SYNC_MAX_PER_DAY);
  });

  it('blocks within 90-minute cooldown', () => {
    const state = recordFullSyncRateLimitSuccess(
      createEmptyFullSyncRateLimitState('2026-05-27'),
      base
    );
    const check = checkFullSyncRateLimit(
      state,
      new Date(base.getTime() + FULL_SYNC_COOLDOWN_MS - 60_000)
    );
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('full-sync-cooldown');
    expect(check.nextAllowedAt).toBeDefined();
  });

  it('allows after cooldown elapses', () => {
    const state = recordFullSyncRateLimitSuccess(
      createEmptyFullSyncRateLimitState('2026-05-27'),
      base
    );
    const check = checkFullSyncRateLimit(
      state,
      new Date(base.getTime() + FULL_SYNC_COOLDOWN_MS + 1)
    );
    expect(check.allowed).toBe(true);
  });

  it('blocks after daily cap', () => {
    const day = dayKeyLocal(base);
    const state = {
      ...createEmptyFullSyncRateLimitState(day),
      countToday: FULL_SYNC_MAX_PER_DAY,
      lastCompletedAt: null,
    };
    const check = checkFullSyncRateLimit(state, base);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('full-sync-daily-cap');
    expect(check.remainingToday).toBe(0);
  });

  it('prefers daily-cap over cooldown when both apply', () => {
    const day = dayKeyLocal(base);
    const state = recordFullSyncRateLimitSuccess(
      {
        ...createEmptyFullSyncRateLimitState(day),
        countToday: FULL_SYNC_MAX_PER_DAY - 1,
      },
      base
    );
    const capped = recordFullSyncRateLimitSuccess(state, base);
    const check = checkFullSyncRateLimit(
      capped,
      new Date(base.getTime() + FULL_SYNC_COOLDOWN_MS - 60_000)
    );
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('full-sync-daily-cap');
  });

  it('records up to daily cap on same local day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(base);
    let state = createEmptyFullSyncRateLimitState(dayKeyLocal(base));
    for (let i = 0; i < FULL_SYNC_MAX_PER_DAY; i++) {
      state = recordFullSyncRateLimitSuccess(state);
    }
    expect(state.countToday).toBe(FULL_SYNC_MAX_PER_DAY);
    const check = checkFullSyncRateLimit(state, base);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('full-sync-daily-cap');
  });
});
