import { describe, expect, it } from 'vitest';
import { scoreMapHasPositiveAxis } from '../scoreMapGuards';

describe('scoreMapHasPositiveAxis', () => {
  it('rejects empty or all-zero maps', () => {
    expect(scoreMapHasPositiveAxis(null)).toBe(false);
    expect(scoreMapHasPositiveAxis({})).toBe(false);
    expect(scoreMapHasPositiveAxis({ strength: 0, cardio: 0 })).toBe(false);
  });

  it('accepts any positive finite axis', () => {
    expect(scoreMapHasPositiveAxis({ strength: 12 })).toBe(true);
  });
});
