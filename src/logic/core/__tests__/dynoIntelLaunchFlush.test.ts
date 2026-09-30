import { describe, expect, it } from 'vitest';
import {
  buildDynoIntelLaunchRequestId,
  claimDynoIntelLaunchFlush,
  markDynoIntelLaunchFlushAccepted,
  releaseDynoIntelLaunchFlushInFlight,
  resetDynoIntelLaunchFlushInFlight,
  shouldClearChatForSpectrumOpen,
  shouldRetryLaunchFlushAfterRelease,
  type DynoIntelLaunchFlushLock,
} from '../dynoIntelLaunchFlush';

function freshLock(): DynoIntelLaunchFlushLock {
  return { flushedLaunchRequestId: 0, inFlightLaunchRequestId: 0 };
}

describe('dynoIntelLaunchFlush', () => {
  it('builds server-safe spectrum request ids', () => {
    const id = buildDynoIntelLaunchRequestId(42);
    expect(id).toBe('spectrum-launch-42');
    expect(id.length).toBeGreaterThanOrEqual(8);
    expect(id.length).toBeLessThanOrEqual(64);
    expect(/^[A-Za-z0-9_-]{8,64}$/.test(id)).toBe(true);
  });

  it('claims at most one launch at a time until released or accepted', () => {
    const lock = freshLock();
    expect(claimDynoIntelLaunchFlush(lock, 7)).toBe(true);
    expect(lock.inFlightLaunchRequestId).toBe(7);
    // WHY: Rapid re-render / StrictMode must not start a second sendQuestion.
    expect(claimDynoIntelLaunchFlush(lock, 7)).toBe(false);
    // WHY: A newer launchRequestId must also wait — parallel seats double-bill.
    expect(claimDynoIntelLaunchFlush(lock, 8)).toBe(false);

    releaseDynoIntelLaunchFlushInFlight(lock, 7);
    expect(lock.inFlightLaunchRequestId).toBe(0);
    expect(claimDynoIntelLaunchFlush(lock, 8)).toBe(true);

    markDynoIntelLaunchFlushAccepted(lock, 8);
    expect(lock.flushedLaunchRequestId).toBe(8);
    expect(lock.inFlightLaunchRequestId).toBe(0);
    expect(claimDynoIntelLaunchFlush(lock, 8)).toBe(false);
  });

  it('resets zombie in-flight claims on dismiss', () => {
    const lock = freshLock();
    expect(claimDynoIntelLaunchFlush(lock, 3)).toBe(true);
    resetDynoIntelLaunchFlushInFlight(lock);
    expect(lock.inFlightLaunchRequestId).toBe(0);
    expect(claimDynoIntelLaunchFlush(lock, 4)).toBe(true);
  });

  it('skips clearChat while the same launch flush is in flight', () => {
    expect(shouldClearChatForSpectrumOpen(3, 3, true)).toBe(false);
    expect(shouldClearChatForSpectrumOpen(0, 3, true)).toBe(true);
    expect(shouldClearChatForSpectrumOpen(3, 4, true)).toBe(true);
    expect(shouldClearChatForSpectrumOpen(0, 0, false)).toBe(false);
  });

  it('retries flush when a newer pending launch superseded the completed one', () => {
    expect(
      shouldRetryLaunchFlushAfterRelease({
        completedLaunchRequestId: 1,
        currentLaunchRequestId: 2,
        hasPendingPrompt: true,
      })
    ).toBe(true);
    expect(
      shouldRetryLaunchFlushAfterRelease({
        completedLaunchRequestId: 2,
        currentLaunchRequestId: 2,
        hasPendingPrompt: true,
      })
    ).toBe(false);
    expect(
      shouldRetryLaunchFlushAfterRelease({
        completedLaunchRequestId: 1,
        currentLaunchRequestId: 2,
        hasPendingPrompt: false,
      })
    ).toBe(false);
  });
});
