import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bindStructuredSyncSession,
  captureStructuredSyncSession,
  isStructuredSyncSessionCurrent,
  registerStructuredSyncTimer,
} from '../structuredSyncSession';

describe('structured sync session boundary', () => {
  afterEach(() => {
    bindStructuredSyncSession(null);
    vi.useRealTimers();
  });

  it('invalidates captured work when uid changes', () => {
    bindStructuredSyncSession('user-a');
    const captured = captureStructuredSyncSession();
    expect(captured).not.toBeNull();

    bindStructuredSyncSession('user-b');
    expect(isStructuredSyncSessionCurrent(captured!)).toBe(false);
  });

  it('cancels registered deferred writes on account switch', () => {
    vi.useFakeTimers();
    bindStructuredSyncSession('user-a');
    const callback = vi.fn();
    const timer = setTimeout(callback, 100);
    registerStructuredSyncTimer(timer as unknown as ReturnType<typeof setTimeout>);

    bindStructuredSyncSession('user-b');
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });
});
