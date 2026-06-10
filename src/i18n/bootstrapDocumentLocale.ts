import { resolvePreInitLocale } from './language';
import { syncDocumentLocale } from './webInstallBranding';
import manifestCopy from './webInstallManifest.copy.json';

/**
 * WHY: i18n.init is async; align title/manifest with detection.order before first paint.
 * Full copy still reconciled on `languageChanged` via `applyLocaleToDocument` in `i18n.ts`.
 */
export function bootstrapDocumentLocaleFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const lng = resolvePreInitLocale();
    syncDocumentLocale(lng);
    document.title = manifestCopy[lng].name;
  } catch {
    /* private mode / quota */
  }
}
