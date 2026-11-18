export type SupportedLng = 'en' | 'zh-Hant';

/**
 * Dual-hero plate UI locale (Carbon titles + verdict catalog).
 * WHY: Distinct from bundle code `zh-Hant` — painters/builders only need zh|en.
 */
export type TelemetryUiLocale = 'zh' | 'en';

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

/**
 * Resolve Carbon/Selfie plate locale from i18n tags.
 * WHY: `en` / `en-US` / `en-GB` must never silently fall back to zh for verdict + title swap.
 */
export function resolveUiLocale(
  language: string | undefined | null,
  override?: TelemetryUiLocale
): TelemetryUiLocale {
  if (override) return override;
  return String(language ?? '')
    .toLowerCase()
    .startsWith('en')
    ? 'en'
    : 'zh';
}

/** Prefer `resolvedLanguage` so mid-switch tags (en-US) still map to English plates. */
export function resolveUiLocaleFromI18n(i18n: {
  language?: string;
  resolvedLanguage?: string;
}): TelemetryUiLocale {
  return resolveUiLocale(i18n.resolvedLanguage ?? i18n.language);
}

/** Extract language tag from i18next `t` binding (resolvedLanguage first). */
export function resolveLanguageFromT(t: unknown): string | undefined {
  if (!t || typeof t !== 'object') return undefined;
  const rec = t as { language?: unknown; resolvedLanguage?: unknown };
  if (typeof rec.resolvedLanguage === 'string') return rec.resolvedLanguage;
  if (typeof rec.language === 'string') return rec.language;
  return undefined;
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