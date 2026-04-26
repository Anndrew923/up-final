import { describe, expect, it } from 'vitest';
import { formatHistorySavedAt, historySavedAtLocaleTag } from './formatHistorySavedAt';

describe('historySavedAtLocaleTag', () => {
  it('uses zh-TW for Traditional Chinese bundle', () => {
    expect(historySavedAtLocaleTag('zh-Hant')).toBe('zh-TW');
    expect(historySavedAtLocaleTag('zh-TW')).toBe('zh-TW');
  });

  it('uses en-US for English and unknown tags', () => {
    expect(historySavedAtLocaleTag('en')).toBe('en-US');
    expect(historySavedAtLocaleTag('en-US')).toBe('en-US');
    expect(historySavedAtLocaleTag('fr')).toBe('en-US');
    expect(historySavedAtLocaleTag(undefined)).toBe('en-US');
  });
});

describe('formatHistorySavedAt', () => {
  it('returns ISO string unchanged when date is invalid', () => {
    expect(formatHistorySavedAt('not-a-date', 'en')).toBe('not-a-date');
  });

  it('returns a non-empty localized string for valid ISO input', () => {
    const out = formatHistorySavedAt('2026-04-26T12:34:56.000Z', 'zh-Hant');
    expect(out.length).toBeGreaterThan(4);
    expect(out).toMatch(/2026/);
  });
});
