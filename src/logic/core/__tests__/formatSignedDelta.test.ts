import { describe, expect, it } from 'vitest';
import { formatSignedDelta } from '../formatSignedDelta';

describe('formatSignedDelta', () => {
  it('prefixes positives and keeps negatives / zero at 2dp', () => {
    expect(formatSignedDelta(12.5)).toBe('+12.50');
    expect(formatSignedDelta(-3)).toBe('-3.00');
    expect(formatSignedDelta(0)).toBe('0.00');
  });

  it('returns empty placeholder for nullish / non-finite', () => {
    expect(formatSignedDelta(null, '—')).toBe('—');
    expect(formatSignedDelta(undefined, 'N/A')).toBe('N/A');
    expect(formatSignedDelta(Number.NaN)).toBe('—');
  });
});
