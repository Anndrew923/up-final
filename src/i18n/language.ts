export type SupportedLng = 'en' | 'zh-Hant';

/** Persist manual / detected choice — must match `detection.lookupLocalStorage` in `i18n.ts`. */
export const I18N_STORAGE_KEY = 'up-final.i18n.lang';

const LEGACY_I18N_STORAGE_KEY = 'i18nextLng';

/**
 * Map browser / stored tags to supported bundle codes.
 * Unsupported regions (e.g. ja) resolve to English.
 */
export function toSupportedLng(lng: string | undefined | null): SupportedLng {
  if (lng == null || String(lng).trim() === '') return 'en';
  const lower = String(lng).toLowerCase();
  if (lower.startsWith('zh')) return 'zh-Hant';
  return 'en';
}

export function migrateLegacyI18nStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(I18N_STORAGE_KEY)) return;
    const legacy = window.localStorage.getItem(LEGACY_I18N_STORAGE_KEY);
    if (legacy == null || legacy === '') return;
    window.localStorage.setItem(I18N_STORAGE_KEY, toSupportedLng(legacy));
  } catch {
    /* private / quota */
  }
}