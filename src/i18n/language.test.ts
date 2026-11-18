import { describe, expect, it } from 'vitest';
import {
  resolveLanguageFromT,
  resolveUiLocale,
  resolveUiLocaleFromI18n,
  toSupportedLng,
} from './language';

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

describe('resolveUiLocale', () => {
  it('maps en / en-US / en-GB to en and zh variants to zh', () => {
    expect(resolveUiLocale('en')).toBe('en');
    expect(resolveUiLocale('en-US')).toBe('en');
    expect(resolveUiLocale('en-GB')).toBe('en');
    expect(resolveUiLocale('zh-Hant')).toBe('zh');
    expect(resolveUiLocale('zh-TW')).toBe('zh');
    expect(resolveUiLocale(undefined)).toBe('zh');
  });

  it('honors explicit override and prefers resolvedLanguage on i18n', () => {
    expect(resolveUiLocale('zh-Hant', 'en')).toBe('en');
    expect(
      resolveUiLocaleFromI18n({ language: 'zh-Hant', resolvedLanguage: 'en-US' })
    ).toBe('en');
    expect(
      resolveUiLocaleFromI18n({ language: 'en', resolvedLanguage: undefined })
    ).toBe('en');
    expect(
      resolveLanguageFromT({ language: 'zh-Hant', resolvedLanguage: 'en-GB' })
    ).toBe('en-GB');
    expect(resolveLanguageFromT({ language: 'en' })).toBe('en');
    const tFn = Object.assign(() => '', { language: 'en-US' });
    expect(resolveLanguageFromT(tFn)).toBe('en-US');
  });
});
