import { type SupportedLng, toSupportedLng } from './language';
import manifestCopy from './webInstallManifest.copy.json';

/**
 * PWA install copy — single source for static manifests (`npm run icons`) and runtime DOM sync.
 * Tab title uses i18n `shellTitle` after init; `name` here matches shellTitle for pre-i18n bootstrap.
 */
export type WebInstallManifestCopy = typeof manifestCopy;

export const WEB_INSTALL_MANIFEST_COPY: WebInstallManifestCopy = manifestCopy;

const MANIFEST_LINK_SELECTOR = 'link[rel="manifest"]';
const APPLE_TITLE_META_SELECTOR = 'meta[name="apple-mobile-web-app-title"]';

export function manifestHrefForLng(lng: SupportedLng): string {
  return `/${manifestCopy[lng].manifestFile}`;
}

/** Sync PWA manifest link and iOS add-to-home label (not tab title — see `applyLocaleToDocument`). */
export function syncWebInstallBranding(lng: string): void {
  if (typeof document === 'undefined') return;

  const supported = toSupportedLng(lng);
  const copy = manifestCopy[supported];

  let manifestLink = document.querySelector<HTMLLinkElement>(MANIFEST_LINK_SELECTOR);
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = manifestHrefForLng(supported);

  let appleTitleMeta = document.querySelector<HTMLMetaElement>(APPLE_TITLE_META_SELECTOR);
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    appleTitleMeta.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitleMeta);
  }
  appleTitleMeta.content = copy.appleWebAppTitle;
}

/** BCP 47 + PWA surfaces; pair with `document.title = i18n.t('shellTitle')` when i18n is ready. */
export function syncDocumentLocale(lng: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = toSupportedLng(lng);
  syncWebInstallBranding(lng);
}
