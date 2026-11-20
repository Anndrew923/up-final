import { describe, expect, it } from 'vitest';
import { formatEvolutionCardDate } from '../formatEvolutionCardDate';

describe('formatEvolutionCardDate', () => {
  it('formats ISO timestamps as YYYY.MM.DD in local wall clock', () => {
    expect(formatEvolutionCardDate('2026-01-15T12:00:00.000Z')).toMatch(
      /^\d{4}\.\d{2}\.\d{2}$/
    );
  });

  it('returns empty placeholder for missing / invalid input', () => {
    expect(formatEvolutionCardDate(undefined, '—')).toBe('—');
    expect(formatEvolutionCardDate('not-a-date', '—')).toBe('—');
  });
});
