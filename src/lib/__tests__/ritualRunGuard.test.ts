import { describe, expect, it, vi } from 'vitest';
import { exitIfRunCancelled } from '../ritualRunGuard';

describe('exitIfRunCancelled', () => {
  it('returns false while the run still owns the timeline', () => {
    const runIdRef = { current: 3 };
    const close = vi.fn();
    expect(exitIfRunCancelled(3, runIdRef, close)).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('returns true without closing when a newer run superseded this run', () => {
    const runIdRef = { current: 4 };
    const close = vi.fn();
    expect(exitIfRunCancelled(3, runIdRef, close)).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });

  it('closes when this run was cancelled without a superseding run', () => {
    const runIdRef = { current: 2 };
    const close = vi.fn();
    expect(exitIfRunCancelled(3, runIdRef, close)).toBe(true);
    expect(close).toHaveBeenCalledOnce();
  });
});
