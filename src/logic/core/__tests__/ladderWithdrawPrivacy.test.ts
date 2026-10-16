import { describe, expect, it } from 'vitest';
import { resolveMembershipSyncSurface } from '../membershipSyncSurface';

/**
 * Withdraw is independent of sync CTAs — club surface still resolves without sticky preference.
 */
describe('ladder withdraw privacy contract', () => {
  it('still resolves dual vs global-only from membership alone', () => {
    expect(resolveMembershipSyncSurface(true)).toBe('dual');
    expect(resolveMembershipSyncSurface(false)).toBe('global-only');
  });
});
