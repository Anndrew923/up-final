import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enArena from './i18n/locales/en/arena.json';
import zhArena from './i18n/locales/zh-Hant/arena.json';
import { enCommon, zhHantCommon } from './i18n/locales/common';
import {
  I18N_STORAGE_KEY,
  migrateLegacyI18nStorage,
  toSupportedLng,
} from './i18n/language';
import { applyLocaleToDocument } from './i18n/applyLocaleToDocument';

export type { SupportedLng } from './i18n/language';
export { I18N_STORAGE_KEY, toSupportedLng } from './i18n/language';

migrateLegacyI18nStorage();

const i18nPromise = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-Hant'],
    resources: {
      en: {
        common: enCommon,
        arena: enArena,
      },
      'zh-Hant': {
        common: zhHantCommon,
        arena: zhArena,
      },
    },
    ns: ['common', 'arena'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: I18N_STORAGE_KEY,
      convertDetectedLanguage: (lng) => toSupportedLng(lng),
    },
  });

void i18nPromise.then(() => {
  applyLocaleToDocument(i18n.resolvedLanguage ?? i18n.language);
});

i18n.on('languageChanged', (lng) => {
  applyLocaleToDocument(lng);
});

/** Dev-only: re-merge locale JSON without Vite full-page reload (see `vite/i18nLocaleHmr.ts`). */
async function reloadLocaleResourceBundles(): Promise<void> {
  const [commonMod, enArenaMod, zhArenaMod] = await Promise.all([
    import('./i18n/locales/common'),
    import('./i18n/locales/en/arena.json'),
    import('./i18n/locales/zh-Hant/arena.json'),
  ]);

  i18n.addResourceBundle('en', 'common', commonMod.enCommon, true, true);
  i18n.addResourceBundle('zh-Hant', 'common', commonMod.zhHantCommon, true, true);
  i18n.addResourceBundle('en', 'arena', enArenaMod.default, true, true);
  i18n.addResourceBundle('zh-Hant', 'arena', zhArenaMod.default, true, true);

  const lng = i18n.resolvedLanguage ?? i18n.language;
  if (lng) {
    // WHY: Re-bind react-i18next subscribers without re-running language detection.
    i18n.emit('languageChanged', lng);
  }
}

if (import.meta.hot) {
  let localeReloadTimer: ReturnType<typeof setTimeout> | null = null;
  import.meta.hot.on('locales-update', () => {
    if (localeReloadTimer) clearTimeout(localeReloadTimer);
    localeReloadTimer = setTimeout(() => {
      localeReloadTimer = null;
      void reloadLocaleResourceBundles();
    }, 120);
  });
}

export default i18n;
