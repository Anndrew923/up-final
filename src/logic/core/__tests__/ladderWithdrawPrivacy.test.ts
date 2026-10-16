import { describe, expect, it } from 'vitest';
import { resolvePublishMode } from '../ladderPublishPreference';

/**
 * Phase 2 privacy contract smoke — withdraw is independent of publish-mode resolution.
 * WHY: Opting out must still resolve to guild-only / local-only without requiring public write.
 */
describe('ladder withdraw privacy contract', () => {
  it('keeps crew-only path when global publish preference is off', () => {
    expect(resolvePublishMode(false, true)).toBe('guild-only');
    expect(resolvePublishMode(false, false)).toBe('local-only');
  });
});
