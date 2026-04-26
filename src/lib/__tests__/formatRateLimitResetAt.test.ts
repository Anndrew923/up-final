import { describe, expect, it } from 'vitest';
import { formatRateLimitResetAt } from '../formatRateLimitResetAt';

describe('formatRateLimitResetAt', () => {
  it('returns empty string for undefined', () => {
    expect(formatRateLimitResetAt(undefined, 'en-US')).toBe('');
  });

  it('formats a valid ISO string for en-US', () => {
    const s = formatRateLimitResetAt('2026-06-15T14:00:00.000Z', 'en-US');
    expect(s.length).toBeGreaterThan(4);
    expect(s).not.toBe('2026-06-15T14:00:00.000Z');
  });

  it('returns raw string for invalid date', () => {
    expect(formatRateLimitResetAt('not-a-date', 'en-US')).toBe('not-a-date');
  });
});
