import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEn from '../../../public/locales/en-CA/translation.json';
import translationFr from '../../../public/locales/fr-CA/translation.json';

i18n
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: false,
    lng: 'en-CA',
    fallbackLng: ['en-CA', 'fr-CA'],
    whitelist: ['en-CA', 'fr-CA'],
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      'en-CA': {
        translation: translationEn,
      },
      'fr-CA': {
        translation: translationFr,
      },
    },
    // special options for react-i18next
    // learn more: https://react.i18next.com/components/i18next-instance
    react: {
      useSuspense: true,
    },
  });

export default i18n;
