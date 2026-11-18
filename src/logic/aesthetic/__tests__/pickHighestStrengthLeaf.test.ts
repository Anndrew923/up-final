import { describe, expect, it } from 'vitest';
import { STRENGTH_LIFT_TO_LEAF } from '../pickHighestStrengthLeaf';
import { STRENGTH_LIFT_KEYS } from '../../../types/strengthInputs';

describe('STRENGTH_LIFT_TO_LEAF', () => {
  it('maps every strength lift key to a strength.* single-leaf id', () => {
    for (const lift of STRENGTH_LIFT_KEYS) {
      expect(STRENGTH_LIFT_TO_LEAF[lift]).toBe(`strength.${lift}`);
    }
    expect(Object.keys(STRENGTH_LIFT_TO_LEAF).sort()).toEqual(
      [...STRENGTH_LIFT_KEYS].sort()
    );
  });
});
