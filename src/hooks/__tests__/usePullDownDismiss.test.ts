import { describe, expect, it } from 'vitest';
import { PULL_DOWN_DISMISS_PX, resolvePullDownRelease } from '../usePullDownDismiss';

describe('resolvePullDownRelease', () => {
  it('snaps back below the dismiss threshold', () => {
    expect(resolvePullDownRelease(PULL_DOWN_DISMISS_PX - 1)).toBe('snap');
    expect(resolvePullDownRelease(0)).toBe('snap');
  });

  it('dismisses once the finger travels at least the threshold', () => {
    expect(resolvePullDownRelease(PULL_DOWN_DISMISS_PX)).toBe('dismiss');
    expect(resolvePullDownRelease(140)).toBe('dismiss');
  });
});
