import { describe, expect, it } from 'vitest';
import { toSupportedLng } from './language';

describe('toSupportedLng', () => {
  it('maps Chinese variants to zh-Hant', () => {
    expect(toSupportedLng('zh-TW')).toBe('zh-Hant');
    expect(toSupportedLng('zh-HK')).toBe('zh-Hant');
    expect(toSupportedLng('zh')).toBe('zh-Hant');
  });

  it('maps English and other locales to en', () => {
    expect(toSupportedLng('en')).toBe('en');
    expect(toSupportedLng('en-US')).toBe('en');
    expect(toSupportedLng('fr')).toBe('en');
  });

  it('handles empty input', () => {
    expect(toSupportedLng('')).toBe('en');
    expect(toSupportedLng(undefined)).toBe('en');
  });
});
