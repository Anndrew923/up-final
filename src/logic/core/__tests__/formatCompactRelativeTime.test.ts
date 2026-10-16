import { describe, expect, it } from 'vitest';
import { formatCompactRelativeTime } from '../formatCompactRelativeTime';

describe('formatCompactRelativeTime', () => {
  const now = Date.parse('2026-10-16T12:00:00.000Z');

  it('formats short buckets', () => {
    expect(formatCompactRelativeTime(new Date(now - 15_000).toISOString(), now)).toBe('15s');
    expect(formatCompactRelativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5m');
    expect(formatCompactRelativeTime(new Date(now - 3 * 3600_000).toISOString(), now)).toBe('3h');
    expect(formatCompactRelativeTime(new Date(now - 2 * 86400_000).toISOString(), now)).toBe('2d');
  });

  it('falls back to MM/DD beyond a week', () => {
    expect(formatCompactRelativeTime('2026-03-14T00:00:00.000Z', now)).toBe('03/14');
  });

  it('returns -- for invalid input', () => {
    expect(formatCompactRelativeTime('not-a-date', now)).toBe('--');
  });
});
