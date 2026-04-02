import i18n from 'i18next';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
export default i18n;
/**
 * Creates a new i18n instance with specified language.
 *
 * @param language - The language to initialize the instance with
 * @returns A promise that resolves with the new i18n instance
 * @throws {Error} When initialization fails
 */
export declare const createI18nInstance: (language: TypeDisplayLanguage) => Promise<typeof i18n>;
//# sourceMappingURL=i18n.d.ts.map