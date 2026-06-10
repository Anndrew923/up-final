import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasUserLocaleOverride,
  I18N_STORAGE_KEY,
  I18N_USER_OVERRIDE_KEY,
  markUserLocaleOverride,
} from '../language';

describe('locale user override', () => {
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

  it('markUserLocaleOverride persists flag and language', () => {
    markUserLocaleOverride('zh-Hant');
    expect(hasUserLocaleOverride()).toBe(true);
    expect(store.get(I18N_STORAGE_KEY)).toBe('zh-Hant');
    expect(store.get(I18N_USER_OVERRIDE_KEY)).toBe('1');
  });
});
