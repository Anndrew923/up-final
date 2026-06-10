import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasUserLocaleOverride,
  I18N_STORAGE_KEY,
  I18N_USER_OVERRIDE_KEY,
  migrateLegacyI18nStorage,
} from '../language';

describe('migrateLegacyI18nStorage', () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('migrates i18nextLng without marking manual override', () => {
    store.set('i18nextLng', 'zh-TW');
    migrateLegacyI18nStorage();
    expect(store.get(I18N_STORAGE_KEY)).toBe('zh-Hant');
    expect(hasUserLocaleOverride()).toBe(false);
    expect(store.get(I18N_USER_OVERRIDE_KEY)).toBeUndefined();
  });
});
