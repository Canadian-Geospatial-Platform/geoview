import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEn from '@public/locales/en/translation.json';
import translationFr from '@public/locales/fr/translation.json';
import { logger } from '@/core/utils/logger';

i18n
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: false,
    lng: 'en',
    fallbackLng: ['en', 'fr'],
    supportedLngs: ['en', 'fr'],
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: translationEn,
      },
      fr: {
        translation: translationFr,
      },
    },
    // special options for react-i18next
    // learn more: https://react.i18next.com/components/i18next-instance
    react: {
      useSuspense: true,
    },
  })
  .catch((error: unknown) => {
    // Log
    logger.logPromiseFailed('in init in translation/i18n', error);
  });

export default i18n;
