import { describe, expect, it } from 'vitest';
import { formatHistoryCardSavedAt } from './formatHistorySavedAt';

describe('formatHistoryCardSavedAt', () => {
  it('returns compact YYYY.MM.DD HH:mm for valid ISO input', () => {
    const out = formatHistoryCardSavedAt('2026-10-15T03:24:00.000Z');
    expect(out).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
  });

  it('returns the raw string when unparsable', () => {
    expect(formatHistoryCardSavedAt('not-a-date')).toBe('not-a-date');
  });
});
