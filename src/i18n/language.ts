export type SupportedLng = 'en' | 'zh-Hant';

/** Persist manual / detected choice — must match `detection.lookupLocalStorage` in `i18n.ts`. */
export const I18N_STORAGE_KEY = 'up-final.i18n.lang';

/** Set when user toggles language in Settings — skips system / Device re-alignment. */
export const I18N_USER_OVERRIDE_KEY = 'up-final.i18n.userOverride';

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

export function hasUserLocaleOverride(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(I18N_USER_OVERRIDE_KEY) === '1';
  } catch {
    return false;
  }
}

/** WHY: Manual Settings toggle must win over navigator / Device on next cold start. */
export function markUserLocaleOverride(lng: SupportedLng): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(I18N_USER_OVERRIDE_KEY, '1');
    window.localStorage.setItem(I18N_STORAGE_KEY, lng);
  } catch {
    /* private / quota */
  }
}

/**
 * Sync pre-init document surfaces (title / manifest href) — mirrors i18n detection.order
 * before async init + native Device alignment complete.
 */
export function resolvePreInitLocale(): SupportedLng {
  if (typeof window === 'undefined') return 'en';
  try {
    if (hasUserLocaleOverride()) {
      const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
      if (stored) return toSupportedLng(stored);
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return toSupportedLng(navigator.language);
    }
    const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
    if (stored) return toSupportedLng(stored);
    const htmlLang = document.documentElement.lang;
    if (htmlLang) return toSupportedLng(htmlLang);
    return 'en';
  } catch {
    return 'en';
  }
}

export function migrateLegacyI18nStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(I18N_STORAGE_KEY)) return;
    const legacy = window.localStorage.getItem(LEGACY_I18N_STORAGE_KEY);
    if (legacy == null || legacy === '') return;
    // WHY: Legacy key was auto-cached by i18next — not a manual Settings pick.
    window.localStorage.setItem(I18N_STORAGE_KEY, toSupportedLng(legacy));
  } catch {
    /* private / quota */
  }
}