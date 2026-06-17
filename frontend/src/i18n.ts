import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './language/fr/common.json';
import en from './language/en/common.json';
import nl from './language/nl/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: fr },
      en: { common: en },
      nl: { common: nl },
    },
    fallbackLng: 'fr',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
