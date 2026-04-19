import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from './i18n/locales/en/common.json';
import enArena from './i18n/locales/en/arena.json';
import zhCommon from './i18n/locales/zh-Hant/common.json';
import zhArena from './i18n/locales/zh-Hant/arena.json';
import {
  I18N_STORAGE_KEY,
  migrateLegacyI18nStorage,
  syncDocumentLang,
  toSupportedLng,
} from './i18n/language';

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
        common: zhCommon,
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
  syncDocumentLang(i18n.resolvedLanguage ?? i18n.language);
});

i18n.on('languageChanged', (lng) => {
  syncDocumentLang(lng);
});

export default i18n;
