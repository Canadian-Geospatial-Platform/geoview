import i18n from 'i18next';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
export default i18n;
/**
 * Creates a new i18n instance with specified language
 * @function
 * @param {TypeDisplayLanguage} language - The language to initialize the instance with
 * @returns {Promise<i18n>} A promise that resolves to the new i18n instance
 * @throws {Error} If initialization fails
 */
export declare const createI18nInstance: (language: TypeDisplayLanguage) => Promise<typeof i18n>;
