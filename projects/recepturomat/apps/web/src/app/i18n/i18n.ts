import i18n, { use as installI18nextPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

void installI18nextPlugin(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources,
});

export default i18n;
