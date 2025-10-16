import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEn from '@public/locales/en/translation.json';
import translationFr from '@public/locales/fr/translation.json';
import { logger } from '@/core/utils/logger';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';

/**
 * Common configuration object for i18n instances
 * @constant
 * @type {object}
 */
const i18nConfig = {
  debug: false,
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
  react: {
    // special options for react-i18next
    // learn more: https://react.i18next.com/components/i18next-instance
    useSuspense: true,
  },
};

/**
 * Initialize the default i18n instance
 * @description This is the main i18n instance used by default throughout the application
 */
await i18n
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .use(initReactI18next)
  .init({
    ...i18nConfig,
    lng: 'en',
  })
  .catch((error: unknown) => {
    // Log
    logger.logPromiseFailed('in init in translation/i18n', error);
  });

export default i18n;

/**
 * Creates a new i18n instance with specified language
 * @function
 * @param {TypeDisplayLanguage} language - The language to initialize the instance with
 * @returns {Promise<i18n>} A promise that resolves to the new i18n instance
 * @throws {Error} If initialization fails
 */
export const createI18nInstance = async (language: TypeDisplayLanguage): Promise<typeof i18n> => {
  const i18nInstance = i18n.createInstance();

  await i18nInstance
    .use(initReactI18next)
    .init({
      ...i18nConfig,
      lng: language,
    })
    .catch((error) => {
      logger.logPromiseFailed(`in createI18nInstance for ${language}`, error);
    });

  return i18nInstance;
};
