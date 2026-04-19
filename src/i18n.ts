import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './i18n/locales/en/common.json';
import enArena from './i18n/locales/en/arena.json';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      common: enCommon,
      arena: enArena,
    },
  },
  ns: ['common', 'arena'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
