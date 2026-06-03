import i18n from 'i18next';
import { toSupportedLng } from './language';
import { syncDocumentLocale } from './webInstallBranding';

/** Single hook after i18n is ready: DOM lang, PWA surfaces, tab title from `shellTitle`. */
export function applyLocaleToDocument(lng: string): void {
  syncDocumentLocale(lng);
  const supported = toSupportedLng(lng);
  document.title = i18n.t('shellTitle', { lng: supported, ns: 'common' });
}
