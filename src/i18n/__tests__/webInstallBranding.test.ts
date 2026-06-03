import { afterEach, describe, expect, it } from 'vitest';
import { enCommon, zhHantCommon } from '../locales/common';
import manifestCopy from '../webInstallManifest.copy.json';
import {
  manifestHrefForLng,
  syncDocumentLocale,
  syncWebInstallBranding,
  WEB_INSTALL_MANIFEST_COPY,
} from '../webInstallBranding';

describe('syncWebInstallBranding', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.lang = 'en';
  });

  it('applies zh-Hant manifest href and iOS home label', () => {
    syncWebInstallBranding('zh-Hant');

    expect(document.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe(
      manifestHrefForLng('zh-Hant'),
    );
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content'),
    ).toBe('最強肉體');
  });

  it('applies en manifest href and short iOS home label UP', () => {
    syncWebInstallBranding('en');

    expect(document.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe(
      '/manifest.en.webmanifest',
    );
    expect(
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content'),
    ).toBe('UP');
  });

  it('syncDocumentLocale sets html lang without touching tab title', () => {
    document.title = 'unchanged';
    syncDocumentLocale('zh-TW');

    expect(document.documentElement.lang).toBe('zh-Hant');
    expect(document.title).toBe('unchanged');
  });
});

describe('WEB_INSTALL_MANIFEST_COPY', () => {
  it('matches i18n shellTitle for tab/install full name', () => {
    expect(WEB_INSTALL_MANIFEST_COPY.en.name).toBe(enCommon.shellTitle);
    expect(WEB_INSTALL_MANIFEST_COPY['zh-Hant'].name).toBe(zhHantCommon.shellTitle);
  });

  it('uses short UP label on en home screen only', () => {
    expect(manifestCopy.en.short_name).toBe('UP');
    expect(manifestCopy.en.name).toBe('Ultimate Physique');
    expect(manifestCopy['zh-Hant'].short_name).toBe(manifestCopy['zh-Hant'].name);
  });
});
