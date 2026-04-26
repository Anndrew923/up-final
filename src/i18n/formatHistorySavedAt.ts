import { toSupportedLng } from './language';

/** BCP 47 tag for `Intl` / `toLocaleString` — aligned with app bundles, not OS default. */
export function historySavedAtLocaleTag(i18nLanguage: string | undefined): string {
  return toSupportedLng(i18nLanguage) === 'zh-Hant' ? 'zh-TW' : 'en-US';
}

/**
 * Formats an ISO timestamp for the history table; falls back to raw string if unparsable.
 * Uses explicit options so EN/zh-TW stay readable and consistent across engines.
 */
export function formatHistorySavedAt(iso: string, i18nLanguage: string | undefined): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const locale = historySavedAtLocaleTag(i18nLanguage);
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
