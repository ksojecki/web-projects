import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import pl, { type TranslationResources } from './pl';

type Namespaces = keyof TranslationResources;
const ns = [
  'layout',
  'content',
  'home',
  'account',
  'auth',
] as const satisfies readonly Namespaces[];

export const defaultNS = 'layout' as const;

export const resources = {
  en,
  pl,
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS,
    ns,
    interpolation: {
      escapeValue: false,
    },
  });
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: TranslationResources;
  }
}

export default i18n;
