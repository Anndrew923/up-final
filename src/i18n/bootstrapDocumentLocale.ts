import { I18N_STORAGE_KEY, toSupportedLng } from './language';
import { syncDocumentLocale } from './webInstallBranding';
import manifestCopy from './webInstallManifest.copy.json';

/**
 * WHY: i18n.init is async; read persisted locale before React paint to reduce wrong manifest/title flash.
 * Full copy still reconciled on `languageChanged` via `applyLocaleToDocument` in `i18n.ts`.
 */
export function bootstrapDocumentLocaleFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(I18N_STORAGE_KEY);
    if (raw == null || raw === '') return;
    const lng = toSupportedLng(raw);
    syncDocumentLocale(lng);
    document.title = manifestCopy[lng].name;
  } catch {
    /* private mode / quota */
  }
}
