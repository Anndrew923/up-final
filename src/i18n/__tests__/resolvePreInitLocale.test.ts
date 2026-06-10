import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  I18N_STORAGE_KEY,
  I18N_USER_OVERRIDE_KEY,
  resolvePreInitLocale,
} from '../language';

describe('resolvePreInitLocale', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    vi.stubGlobal('navigator', { language: 'en-US' });
    document.documentElement.lang = 'en';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers user override storage over navigator', () => {
    store.set(I18N_USER_OVERRIDE_KEY, '1');
    store.set(I18N_STORAGE_KEY, 'en');
    vi.stubGlobal('navigator', { language: 'zh-TW' });
    expect(resolvePreInitLocale()).toBe('en');
  });

  it('uses navigator when no user override even if stale localStorage exists', () => {
    store.set(I18N_STORAGE_KEY, 'en');
    vi.stubGlobal('navigator', { language: 'zh-TW' });
    expect(resolvePreInitLocale()).toBe('zh-Hant');
  });

  it('falls back to localStorage when navigator is empty', () => {
    store.set(I18N_STORAGE_KEY, 'zh-Hant');
    vi.stubGlobal('navigator', { language: '' });
    expect(resolvePreInitLocale()).toBe('zh-Hant');
  });
});
