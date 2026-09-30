import { describe, expect, it } from 'vitest';
import { resolveStrengthLiftLockPhase } from '../useStrengthAssessmentPage';

describe('resolveStrengthLiftLockPhase', () => {
  it('stays clean on hydrate (no dirty, no result) so five cards do not arm', () => {
    expect(resolveStrengthLiftLockPhase(false, false)).toBe('clean');
  });

  it('arms only after an explicit edit clears the prior result', () => {
    expect(resolveStrengthLiftLockPhase(true, false)).toBe('armed');
  });

  it('locks when a result is present and the form is not dirty', () => {
    expect(resolveStrengthLiftLockPhase(false, true)).toBe('locked');
  });

  it('treats result presence as locked even if dirty flag is stale', () => {
    // WHY: Edit path clears result before dirty; prefer locked if both somehow coexist.
    expect(resolveStrengthLiftLockPhase(true, true)).toBe('locked');
  });
});
