import { afterEach, describe, expect, it, vi } from 'vitest';
import { FULL_SYNC_COOLDOWN_MS, FULL_SYNC_MAX_PER_DAY } from '../../logic/core/ladderUploadPolicy';
import {
  checkFullSyncAllowed,
  clearFullSyncRateLimitForTests,
  recordFullSyncAllowed,
} from '../fullSyncRateLimitService';

describe('fullSyncRateLimitService', () => {
  const uid = 'full-sync-storage-test';

  afterEach(() => {
    clearFullSyncRateLimitForTests(uid);
    vi.useRealTimers();
  });

  it('persists cooldown across reload simulation', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00.000Z'));

    recordFullSyncAllowed(uid);

    const blocked = checkFullSyncAllowed(uid);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('full-sync-cooldown');

    vi.setSystemTime(new Date('2026-05-27T10:00:00.000Z').getTime() + FULL_SYNC_COOLDOWN_MS + 1);
    const allowed = checkFullSyncAllowed(uid);
    expect(allowed.allowed).toBe(true);
  });

  it('blocks after max successful full syncs in one local day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T10:00:00.000Z'));

    for (let i = 0; i < FULL_SYNC_MAX_PER_DAY; i++) {
      recordFullSyncAllowed(uid);
      vi.advanceTimersByTime(FULL_SYNC_COOLDOWN_MS + 1);
    }

    const blocked = checkFullSyncAllowed(uid);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('full-sync-daily-cap');
  });
});
